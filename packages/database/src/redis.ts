import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required but not set.");
}

export const redisConfig = process.env.REDIS_URL;
export const sharedRedisConnection = new IORedis(redisConfig);
