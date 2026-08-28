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

const concurrency = Number(
  process.env.WORKER_CONCURRENCY ?? 5,
);

const defaultDelayMs = Number(
  process.env.DEFAULT_DELAY_MS ?? 2000,
);

const worker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE_NAME,

  async (job, token) => {
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

    /*
     * Idempotency:
     *
     * If BullMQ delivers the same job again after
     * it was already sent, never send the email again.
     */
    if (emailJob.status === "SENT") {
      return {
        skipped: true,
        reason: "already-sent",
        emailJobId,
      };
    }

    /*
     * Only jobs waiting to be processed can proceed.
     */
    if (
      emailJob.status !== "PENDING" &&
      emailJob.status !== "QUEUED"
    ) {
      return {
        skipped: true,
        reason: `invalid-state:${emailJob.status}`,
        emailJobId,
      };
    }

    /*
     * Claim the database record BEFORE sending.
     *
     * Only one worker can successfully perform
     * this state transition.
     */
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

    /*
     * Atomically reserve:
     *
     * - hourly sender quota
     * - minimum sender spacing
     */
    const minimumDelayMs = Math.max(
      emailJob.delayBetweenEmails,
      defaultDelayMs,
    );

    const permit =
      await rateLimitService.acquireSendPermit(
        emailJob.senderId,
        emailJob.hourlyLimit,
        minimumDelayMs,
      );

    /*
     * Throttling is NOT a failure.
     *
     * Put the DB state back into QUEUED,
     * move the active BullMQ job into delayed,
     * and throw DelayedError so BullMQ knows
     * this was intentionally delayed.
     */
    if (!permit.allowed) {
      await queueService.rescheduleActiveJob(
        job,
        permit.retryAt!,
      );

      console.log(
        `Email ${emailJob.id} throttled by ${permit.reason}; rescheduled for ${new Date(
          permit.retryAt!,
        ).toISOString()}`,
      );

      throw new DelayedError();
    }

    /*
     * We are now genuinely attempting the send.
     */
    await emailRepository.incrementAttempts(
      emailJobId,
    );

    const messageId =
      `<${emailJob.id}@reachinbox.local>`;

    try {
      const info = await smtpService.send({
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        html: emailJob.body,
        from: emailJob.sender.email,
        messageId,
      });

      const actualMessageId =
        info.messageId ?? messageId;

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

      return {
        emailJobId: emailJob.id,
        sent: true,
        messageId: actualMessageId,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Unknown SMTP error";

      /*
       * Only mark FAILED here for an actual send error.
       * Throttling never reaches this block.
       */
      await emailRepository.markFailed(
        emailJob.id,
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

worker.on("completed", (job) => {
  console.log(
    `Email job ${job.id} completed successfully`,
  );
});

worker.on(
  "failed",
  (job, error) => {
    console.error(
      `Email job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  },
);

worker.on("error", (error) => {
  console.error(
    "Worker error:",
    error,
  );
});

export default worker;