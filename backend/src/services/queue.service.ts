import type { Job } from "bullmq";

import {
  emailQueue,
  type EmailJobPayload,
} from "../queue/email.queue.js";

import emailRepository from "../repositories/email.repository.js";

export class QueueService {
  async enqueueEmail(
    emailJobId: string,
    delayMs: number,
  ) {
    const job = await emailQueue.add(
      "send-email",
      {
        emailJobId,
      },
      {
        jobId: emailJobId,
        delay: Math.max(0, delayMs),
      },
    );

    await emailRepository.markQueued(
      emailJobId,
      job.id!,
    );

    return job;
  }

  /**
   * Move the currently-processing BullMQ job
   * back into the delayed state.
   */
  async rescheduleActiveJob(
    job: Job<EmailJobPayload>,
    retryAt: number,
  ) {
    await emailRepository.markQueuedFromProcessing(
      job.data.emailJobId,
    );

    await job.moveToDelayed(
      retryAt,
      job.token,
    );
  }
}

export const queueService =
  new QueueService();