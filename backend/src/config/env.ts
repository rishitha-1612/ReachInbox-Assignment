import { cleanEnv, port, str, num } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),

  DATABASE_URL: str(),

  REDIS_URL: str({ default: "" }),
  REDIS_HOST: str({ default: "127.0.0.1" }),
  REDIS_PORT: num({ default: 6379 }),

  JWT_SECRET: str(),

  WORKER_CONCURRENCY: num({ default: 5 }),
  DEFAULT_DELAY_MS: num({ default: 2000 }),
  MAX_EMAILS_PER_HOUR: num({ default: 200 }),
});
