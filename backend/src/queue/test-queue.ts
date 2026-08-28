import "dotenv/config";

import { emailQueue } from "./email.queue.js";

const jobId = `test-${Date.now()}`;
const scheduledAt = new Date(Date.now() + 10_000);

const job = await emailQueue.add(
  "test-email",
  {
    emailJobId: jobId,
  },
  {
    delay: 10_000,
    jobId,
  },
);

console.log("Job created:", {
  id: job.id,
  scheduledAt: scheduledAt.toISOString(),
});

await emailQueue.close();