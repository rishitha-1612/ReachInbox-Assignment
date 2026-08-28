import { Worker } from "bullmq";
import redis from "../config/redis.js";
import {
  EMAIL_QUEUE_NAME,
  type EmailJobPayload,
} from "../queue/email.queue.js";
import emailRepository from "../repositories/email.repository.js";
import { smtpService } from "../services/smtp.service.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

const worker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const { emailJobId } = job.data;

    const emailJob = await emailRepository.findById(emailJobId);

    if (!emailJob) {
      throw new Error(`EmailJob ${emailJobId} not found`);
    }

    // Idempotency guard
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
      throw new Error(
        `EmailJob ${emailJobId} is in unexpected state ${emailJob.status}`
      );
    }

    const processing =
      await emailRepository.markProcessing(emailJobId);

    if (processing.count !== 1) {
      return {
        skipped: true,
        reason: "state-transition-failed",
        emailJobId,
      };
    }

    await emailRepository.incrementAttempts(emailJobId);

    const messageId = `<${emailJobId}@reachinbox.local>`;

    try {
      const sender = emailJob.sender;

      const info = await smtpService.send({
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        html: emailJob.body,
        from: sender.email,
        messageId,
      });

      await emailRepository.markSent(
        emailJobId,
        new Date(),
        info.messageId ?? messageId
      );

      return {
        emailJobId,
        messageId: info.messageId ?? messageId,
        sent: true,
      };
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Unknown SMTP error";

      await emailRepository.markFailed(emailJobId, reason);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency,
  }
);

worker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(
    `Email job ${job?.id ?? "unknown"} failed:`,
    error
  );
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

export default worker;