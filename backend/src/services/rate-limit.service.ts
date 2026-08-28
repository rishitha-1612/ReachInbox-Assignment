import redis from "../config/redis.js";

export interface RateLimitDecision {
  allowed: boolean;
  retryAt?: number;
  reason?: "hourly_limit" | "send_spacing";
}

/**
 * Atomically checks and reserves a sender's hourly quota.
 *
 * Redis key:
 * email:hourly:{senderId}:{YYYYMMDDHH}
 */
const HOURLY_LIMIT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = tonumber(redis.call("GET", key) or "0")

if current >= limit then
    return {0, current}
end

local next = redis.call("INCR", key)

if next == 1 then
    redis.call("EXPIRE", key, ttl)
end

return {1, next}
`;

/**
 * Atomically checks and reserves the next send slot for a sender.
 *
 * Redis key:
 * email:last-send:{senderId}
 *
 * The operation is atomic, so multiple workers cannot
 * simultaneously reserve the same send slot.
 */
const SEND_SPACING_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local minimumDelay = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

local lastSend = redis.call("GET", key)

if not lastSend then
    redis.call("SET", key, now, "PX", ttl)
    return {1, now}
end

lastSend = tonumber(lastSend)

local nextAllowedAt = lastSend + minimumDelay

if now >= nextAllowedAt then
    redis.call("SET", key, now, "PX", ttl)
    return {1, now}
end

return {0, nextAllowedAt}
`;

export class RateLimitService {
  /**
   * Reserves one email slot in the current UTC hour.
   *
   * This operation is atomic inside Redis and is therefore
   * safe when multiple worker processes are running.
   */
  async acquireHourlySlot(
    senderId: string,
    hourlyLimit: number,
    now = new Date(),
  ): Promise<RateLimitDecision> {
    if (hourlyLimit <= 0) {
      throw new Error("Hourly limit must be greater than zero");
    }

    const hourKey = this.getHourlyKey(senderId, now);

    // Keep the key for two hours so it is available for
    // debugging and cannot linger indefinitely.
    const ttlSeconds = 7_200;

    const result = (await redis.eval(
      HOURLY_LIMIT_SCRIPT,
      1,
      hourKey,
      String(hourlyLimit),
      String(ttlSeconds),
    )) as [number, number];

    const [allowed, currentCount] = result;

    if (allowed === 1) {
      return {
        allowed: true,
      };
    }

    const nextHour = new Date(now);
    nextHour.setUTCMinutes(0, 0, 0);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1);

    return {
      allowed: false,
      reason: "hourly_limit",
      retryAt: nextHour.getTime(),
    };
  }

  /**
   * Reserves the next available send slot for a sender.
   *
   * Example:
   * minimumDelayMs = 2000
   *
   * If one worker reserves 12:00:00.000,
   * another worker cannot reserve until 12:00:02.000.
   */
  async acquireSendSpacing(
    senderId: string,
    minimumDelayMs: number,
    now = Date.now(),
  ): Promise<RateLimitDecision> {
    if (minimumDelayMs < 0) {
      throw new Error(
        "Minimum delay cannot be negative",
      );
    }

    const key = `email:last-send:${senderId}`;

    // Keep the key alive long enough for the next
    // possible send attempt.
    const ttlMs = Math.max(
      minimumDelayMs * 2,
      60_000,
    );

    const result = (await redis.eval(
      SEND_SPACING_SCRIPT,
      1,
      key,
      String(now),
      String(minimumDelayMs),
      String(ttlMs),
    )) as [number, number];

    const [allowed, nextAllowedAt] = result;

    if (allowed === 1) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      reason: "send_spacing",
      retryAt: nextAllowedAt,
    };
  }

  /**
   * Generates the Redis key for the sender's UTC
   * hourly quota window.
   */
  private getHourlyKey(
    senderId: string,
    date: Date,
  ): string {
    const year = date.getUTCFullYear();

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
}

export const rateLimitService =
  new RateLimitService();