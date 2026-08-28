import "dotenv/config";

import { rateLimitService } from "./rate-limit.service.js";
import redis from "../config/redis.js";

const senderId = "test-sender";

async function main() {
  console.log("\n--- Hourly limit test ---");

  const hourlyLimit = 2;

  for (let i = 1; i <= 3; i++) {
    const result =
      await rateLimitService.acquireHourlySlot(
        senderId,
        hourlyLimit,
      );

    console.log(`Attempt ${i}:`, result);
  }

  console.log("\n--- Send spacing test ---");

  const delayMs = 2_000;

  const first =
    await rateLimitService.acquireSendSpacing(
      senderId,
      delayMs,
    );

  console.log("First send:", first);

  const immediate =
    await rateLimitService.acquireSendSpacing(
      senderId,
      delayMs,
    );

  console.log("Immediate second send:", immediate);

  console.log("\nWaiting 2.1 seconds...\n");

  await new Promise((resolve) =>
    setTimeout(resolve, 2_100),
  );

  const afterDelay =
    await rateLimitService.acquireSendSpacing(
      senderId,
      delayMs,
    );

  console.log("Send after delay:", afterDelay);
}

try {
  await main();
} finally {
  await redis.quit();
}