import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required but not set.");
}

export const redisConfig = process.env.REDIS_URL;
export const sharedRedisConnection = new IORedis(redisConfig, {});

// Add error handling
sharedRedisConnection.on("error", err => {
  // eslint-disable-next-line no-console
  console.error("Redis connection error:", err.message);
});

sharedRedisConnection.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("Redis connected successfully");
});

sharedRedisConnection.on("ready", () => {
  // eslint-disable-next-line no-console
  console.log("Redis ready for operations");
});
