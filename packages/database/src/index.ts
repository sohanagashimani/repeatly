import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    throw error;
  }
}

export type {
  User,
  Job,
  ApiKey,
  ScheduledJob,
  JobExecution,
} from "@prisma/client";

export {
  getPartitionHour,
  createScheduledJobData,
  createJobExecutionData,
  SchedulerQueries,
} from "./utils/scheduledJobHelpers";

export { PrismaClient } from "@prisma/client";

export * from "./redis";
export * from "./queue";
