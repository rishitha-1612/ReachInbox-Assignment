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

local nextAllowed = lastSend + minimumDelay

if now >= nextAllowed then
    redis.call("SET", key, now, "PX", ttl)
    return {1, now}
end

return {0, nextAllowed}