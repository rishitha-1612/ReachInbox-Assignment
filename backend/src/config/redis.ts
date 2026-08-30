import { Redis, type RedisOptions } from "ioredis";

const options: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl, options)
  : new Redis({
      ...options,
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
    });

redis.on("ready", () => {
  console.log("Redis connected");
});

redis.on("error", (error: Error) => {
  console.error("Redis error:", error);
});

export default redis;
