import {
  DelayedError,
  Worker,
} from "bullmq";

import redis from "../config/redis.js";

import {
  EMAIL_QUEUE_NAME,
  type EmailJobPayload,
} from "../queue/email.queue.js";

import emailRepository from "../repositories/email.repository.js";

import {
  rateLimitService,
} from "../services/rate-limit.service.js";

import {
  smtpService,
} from "../services/smtp.service.js";

import {
  queueService,
} from "../services/queue.service.js";

import {
  isRetryableEmailError,
} from "../utils/retryable-error.js";

const concurrency = Number(
  process.env.WORKER_CONCURRENCY ?? 5,
);

const defaultDelayMs = Number(
  process.env.DEFAULT_DELAY_MS ?? 2000,
);

const worker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE_NAME,

  async (job) => {
    const { emailJobId } = job.data;

    const emailJob =
      await emailRepository.findById(
        emailJobId,
      );

    if (!emailJob) {
      throw new Error(
        `EmailJob ${emailJobId} not found`,
      );
    }
    if (emailJob.status === "SENT") {
      return {
        skipped: true,
        reason: "already-sent",
        emailJobId,
      };
    }

 
    if (
      emailJob.status !== "PENDING" &&
      emailJob.status !== "QUEUED"
    ) {
      return {
        skipped: true,
        reason:
          `invalid-state:${emailJob.status}`,
        emailJobId,
      };
    }

    const processing =
      await emailRepository.markProcessing(
        emailJobId,
      );

    if (processing.count !== 1) {
      return {
        skipped: true,
        reason: "already-claimed",
        emailJobId,
      };
    }

    const minimumDelayMs = Math.max(
      emailJob.delayBetweenEmailsMs,
      defaultDelayMs,
    );

    const permit =
      await rateLimitService.acquireSendPermit(
        emailJob.senderId,
        emailJob.hourlyLimit,
        minimumDelayMs,
      );

    if (!permit.allowed) {
      if (permit.retryAt === undefined) {
        await emailRepository.markQueuedFromProcessing(
          emailJob.id,
        );

        throw new Error(
          "Rate limiter denied the send without a retryAt value",
        );
      }

      await queueService.rescheduleActiveJob(
        job,
        permit.retryAt,
      );

      console.log(
        `Email ${emailJob.id} throttled by ${permit.reason}; ` +
          `rescheduled for ${new Date(
            permit.retryAt,
          ).toISOString()}`,
      );

      throw new DelayedError();
    }
    await emailRepository.incrementAttempts(
      emailJobId,
    );

    const messageId =
      `<${emailJob.id}@reachinbox.local>`;

    try {
      const info =
        await smtpService.send(
          {
            host:
              emailJob.sender.smtpHost,

            port:
              emailJob.sender.smtpPort,

            user:
              emailJob.sender.smtpUser,

            encryptedPassword:
              emailJob.sender
                .smtpPassEncrypted,
          },
          {
            to:
              emailJob.recipientEmail,

            subject:
              emailJob.subject,

            html:
              emailJob.body,

            from:
              emailJob.sender.email,

            messageId,
          },
        );

      const actualMessageId =
        info.messageId ??
        messageId;
      const sent =
        await emailRepository.markSent(
          emailJob.id,
          new Date(),
          actualMessageId,
        );

      if (sent.count !== 1) {
        throw new Error(
          `Unable to persist SENT state for ${emailJob.id}`,
        );
      }

      console.log(
        `Email ${emailJob.id} sent successfully`,
      );

      return {
        emailJobId:
          emailJob.id,

        sent: true,

        messageId:
          actualMessageId,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Unknown SMTP error";
      const retryable =
        isRetryableEmailError(error);

      const hasAttemptsLeft =
        emailJob.attempts + 1 <
        emailJob.maxAttempts;

      if (
        retryable &&
        hasAttemptsLeft
      ) {
        await emailRepository.markQueuedFromProcessing(
          emailJob.id,
        );

        console.warn(
          `Retryable SMTP error for ${emailJob.id}. ` +
            `BullMQ will retry: ${reason}`,
        );

        throw error;
      }

      /*
       * Permanent failure or exhausted retries.
       */
      await emailRepository.markFailed(
        emailJob.id,
        reason,
      );

      console.error(
        `Email ${emailJob.id} failed permanently:`,
        reason,
      );

      throw error;
    }
  },

  {
    connection: redis,
    concurrency,
  },
);

/*
 * Worker lifecycle logging.
 */
worker.on(
  "completed",
  (job) => {
    console.log(
      `Email job ${job.id} completed successfully`,
    );
  },
);

worker.on(
  "failed",
  (job, error) => {
    console.error(
      `Email job ${
        job?.id ?? "unknown"
      } failed:`,
      error,
    );
  },
);

worker.on(
  "error",
  (error) => {
    console.error(
      "Worker error:",
      error,
    );
  },
);

export default worker;