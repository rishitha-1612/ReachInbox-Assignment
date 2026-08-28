import { randomUUID } from "node:crypto";

import emailRepository from "../repositories/email.repository.js";
import senderRepository from "../repositories/sender.repository.js";
import { queueService } from "./queue.service.js";
import type { ScheduleEmailsInput } from "../validators/email.validator.js";

export class SchedulerService {
  async scheduleEmails(
    userId: string,
    input: ScheduleEmailsInput,
  ) {
    const sender = await senderRepository.findByIdForUser(
      input.senderId,
      userId,
    );

    if (!sender) {
      throw new Error("Sender not found");
    }

    const batchId = randomUUID();

    const jobs = input.recipients.map((recipientEmail) => ({
      userId,
      senderId: input.senderId,
      batchId,
      recipientEmail,
      subject: input.subject,
      body: input.body,
      scheduledFor: input.scheduledFor,
      delayBetweenEmails: input.delayBetweenEmailsMs,
      hourlyLimit: input.hourlyLimit,
      status: "PENDING" as const,
    }));

    await emailRepository.createMany(jobs);

    /*
     * Fetch the newly-created rows so BullMQ uses the
     * authoritative PostgreSQL IDs as its idempotency keys.
     */
    const createdJobs = await emailRepository.findByBatchId(
      batchId,
    );

    for (const emailJob of createdJobs) {
      const delay = Math.max(
        emailJob.scheduledFor.getTime() - Date.now(),
        0,
      );

      await queueService.enqueueEmail(
        emailJob.id,
        delay,
      );
    }

    return {
      batchId,
      total: createdJobs.length,
      scheduledFor: input.scheduledFor,
    };
  }
}

export const schedulerService =
  new SchedulerService();