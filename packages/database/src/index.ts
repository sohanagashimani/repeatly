import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client instance for all Repeatly services
 * This ensures consistent database configuration across the application
 */
export const prisma = new PrismaClient();

/**
 * Graceful shutdown helper
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check helper
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Re-export Prisma types for convenience
export type {
  User,
  Job,
  ApiKey,
  ScheduledJob,
  JobExecution,
} from "@prisma/client";

// Re-export utility functions for scheduled jobs
export {
  getPartitionHour,
  createScheduledJobData,
  createJobExecutionData,
  SchedulerQueries,
} from "./utils/scheduledJobHelpers";

// Re-export Prisma client type
export { PrismaClient } from "@prisma/client";
