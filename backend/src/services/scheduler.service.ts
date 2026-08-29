import { randomUUID } from "node:crypto";

import emailRepository from "../repositories/email.repository.js";
import senderRepository from "../repositories/sender.repository.js";
import { queueService } from "./queue.service.js";

import type {
  ScheduleEmailsInput,
} from "../validators/email.validator.js";

export interface ScheduleEmailsResult {
  batchId: string;
  total: number;
  scheduledFor: Date;
}

export class SchedulerService {
  async scheduleEmails(
    userId: string,
    input: ScheduleEmailsInput,
  ): Promise<ScheduleEmailsResult> {
    // Verify that the sender belongs to the
    // authenticated user.
    const sender =
      await senderRepository.findByIdForUser(
        input.senderId,
        userId,
      );

    if (!sender) {
      throw new Error(
        "Sender not found or does not belong to authenticated user",
      );
    }

    // One batch ID groups all emails from this
    // scheduling request.
    const batchId = randomUUID();

    const jobs = input.recipients.map(
      (recipientEmail) => ({
        userId,
        senderId: input.senderId,
        batchId,
        recipientEmail,
        subject: input.subject,
        body: input.body,
        scheduledFor:
          input.scheduledFor,
        delayBetweenEmailsMs:
          input.delayBetweenEmailsMs,
        hourlyLimit:
          input.hourlyLimit,
        status: "PENDING" as const,
      }),
    );

    // Persist all email jobs first.
    await emailRepository.createMany(jobs);

    // Retrieve the persisted rows so PostgreSQL-generated
    // IDs become the BullMQ job IDs.
    const createdJobs =
      await emailRepository.findByBatchId(
        batchId,
      );

    for (
      const emailJob of createdJobs
    ) {
      const delay = Math.max(
        emailJob.scheduledFor.getTime() -
          Date.now(),
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
      scheduledFor:
        input.scheduledFor,
    };
  }
}

export const schedulerService =
  new SchedulerService();