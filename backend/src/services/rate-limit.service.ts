import redis from "../config/redis.js";

export type RateLimitReason =
  | "hourly_limit"
  | "send_spacing";

export interface RateLimitDecision {
  allowed: boolean;
  retryAt?: number;
  reason?: RateLimitReason;
}

/**
 * Atomically checks BOTH:
 *
 * 1. Hourly sender quota
 * 2. Minimum delay between sends
 *
 * Nothing is reserved unless both constraints pass.
 *
 * KEYS[1] = hourly counter
 * KEYS[2] = last-send timestamp
 *
 * ARGV[1] = hourly limit
 * ARGV[2] = current timestamp (ms)
 * ARGV[3] = minimum delay (ms)
 * ARGV[4] = hourly key TTL (seconds)
 * ARGV[5] = spacing key TTL (ms)
 *
 * Returns:
 *
 * {1, 0, timestamp}       -> allowed
 * {0, 1, nextHour, 0}      -> hourly limit reached
 * {0, 2, 0, nextAllowed}   -> spacing limit reached
 */
const ACQUIRE_SEND_PERMIT_SCRIPT = `
local hourlyKey = KEYS[1]
local spacingKey = KEYS[2]

local hourlyLimit = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local minimumDelay = tonumber(ARGV[3])
local hourlyTtl = tonumber(ARGV[4])
local spacingTtl = tonumber(ARGV[5])

local currentCount = tonumber(redis.call("GET", hourlyKey) or "0")

if currentCount >= hourlyLimit then
    return {0, 1}
end

local lastSend = redis.call("GET", spacingKey)

if lastSend then
    lastSend = tonumber(lastSend)

    local nextAllowedAt = lastSend + minimumDelay

    if now < nextAllowedAt then
        return {0, 2, nextAllowedAt}
    end
end

local newCount = redis.call("INCR", hourlyKey)

if newCount == 1 then
    redis.call("EXPIRE", hourlyKey, hourlyTtl)
end

redis.call("SET", spacingKey, now, "PX", spacingTtl)

return {1, 0, now}
`;

export class RateLimitService {
  /**
   * Atomically reserves the right to send one email.
   *
   * Both hourly quota and sender spacing must pass.
   */
  async acquireSendPermit(
    senderId: string,
    hourlyLimit: number,
    minimumDelayMs: number,
    now = new Date(),
  ): Promise<RateLimitDecision> {
    if (hourlyLimit <= 0) {
      throw new Error(
        "Hourly limit must be greater than zero",
      );
    }

    if (minimumDelayMs < 0) {
      throw new Error(
        "Minimum delay cannot be negative",
      );
    }

    const hourlyKey = this.getHourlyKey(
      senderId,
      now,
    );

    const spacingKey =
      `email:last-send:${senderId}`;

    const hourlyTtlSeconds = 7_200;

    const spacingTtlMs = Math.max(
      minimumDelayMs * 2,
      60_000,
    );

    const result = (await redis.eval(
      ACQUIRE_SEND_PERMIT_SCRIPT,
      2,
      hourlyKey,
      spacingKey,
      String(hourlyLimit),
      String(now.getTime()),
      String(minimumDelayMs),
      String(hourlyTtlSeconds),
      String(spacingTtlMs),
    )) as number[];

    const resultCode = result[0];

    if (resultCode === 1) {
      return {
        allowed: true,
      };
    }

    const reasonCode = result[1];

    if (reasonCode === 1) {
      return {
        allowed: false,
        reason: "hourly_limit",
        retryAt: this.getNextHour(
          now,
        ).getTime(),
      };
    }

const retryAt = result[2];

if (typeof retryAt !== "number") {
  throw new Error(
    "Rate limiter returned an invalid retry timestamp",
  );
}

return {
  allowed: false,
  reason: "send_spacing",
  retryAt,
};
  }

  private getHourlyKey(
    senderId: string,
    date: Date,
  ): string {
    const year =
      date.getUTCFullYear();

    const month = String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      date.getUTCDate(),
    ).padStart(2, "0");

    const hour = String(
      date.getUTCHours(),
    ).padStart(2, "0");

    return `email:hourly:${senderId}:${year}${month}${day}${hour}`;
  }

  private getNextHour(
    date: Date,
  ): Date {
    const nextHour = new Date(date);

    nextHour.setUTCMinutes(0, 0, 0);
    nextHour.setUTCHours(
      nextHour.getUTCHours() + 1,
    );

    return nextHour;
  }
}

export const rateLimitService =
  new RateLimitService();