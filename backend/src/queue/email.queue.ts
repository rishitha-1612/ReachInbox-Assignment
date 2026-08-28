import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const EMAIL_QUEUE_NAME = "email-send";

export interface EmailJobPayload {
  emailJobId: string;
}

export const emailQueue = new Queue<EmailJobPayload>(
  EMAIL_QUEUE_NAME,
  {
    connection: redis,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 5_000,
      },

      removeOnComplete: {
        count: 1_000,
      },

      removeOnFail: {
        count: 5_000,
      },
    },
  },
);