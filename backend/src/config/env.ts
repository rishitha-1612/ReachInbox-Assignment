import { cleanEnv, port, str, num } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),

  DATABASE_URL: str(),

  REDIS_HOST: str(),
  REDIS_PORT: num(),

  JWT_SECRET: str(),

  WORKER_CONCURRENCY: num({ default: 5 }),
  DEFAULT_DELAY_MS: num({ default: 2000 }),
  MAX_EMAILS_PER_HOUR: num({ default: 200 }),
});