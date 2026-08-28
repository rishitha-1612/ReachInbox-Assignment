import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on("ready", () => {
  console.log("Redis connected");
});

redis.on("error", (error: Error) => {
  console.error("Redis error:", error);
});

export default redis;