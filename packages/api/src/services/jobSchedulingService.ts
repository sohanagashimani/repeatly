import { createScheduledJobData, PrismaClient } from "@repeatly/database";
import { getNextRunTime, addRandomMsOffset } from "../cron";

export class JobSchedulingService {
  constructor(private prisma: PrismaClient) {}

  async scheduleMultipleRuns(
    jobId: string,
    cron: string,
    timezone: string = "UTC",
    count: number = 5,
    fromTime?: Date,
    tx?: import("@prisma/client").Prisma.TransactionClient
  ): Promise<Array<{ scheduledAt: Date; scheduledJobId: string }>> {
    const prisma = tx || this.prisma;

    const job = await prisma.job.findUniqueOrThrow({
      where: { id: jobId },
    });

    const jobDataSnapshot = {
      name: job.name,
      url: job.url,
      method: job.method,
      headers: job.headers,
      body: job.body,
      retries: job.retries,
      timezone: job.timezone,
      cron: job.cron,
      userId: job.userId,
    };

    const scheduledRuns: Array<{ scheduledAt: Date; scheduledJobId: string }> =
      [];
    let currentTime = fromTime || new Date();

    for (let i = 0; i < count; i++) {
      let nextRun = getNextRunTime(cron, timezone, currentTime);
      nextRun = addRandomMsOffset(nextRun);

      const scheduledJobData = createScheduledJobData({
        jobId,
        scheduledAt: nextRun,
        status: "pending",
        jobData: jobDataSnapshot,
      });

      const scheduledJob = await prisma.scheduledJob.create({
        data: scheduledJobData,
      });

      scheduledRuns.push({
        scheduledAt: nextRun,
        scheduledJobId: scheduledJob.id,
      });

      currentTime = nextRun;
    }

    return scheduledRuns;
  }

  async cancelScheduledRuns(
    jobId: string,
    afterDate?: Date,
    tx?: import("@prisma/client").Prisma.TransactionClient
  ): Promise<number> {
    const prisma = tx || this.prisma;
    const whereClause: any = {
      jobId,
      status: "pending",
    };

    if (afterDate) {
      whereClause.scheduledAt = { gt: afterDate };
    }

    const result = await prisma.scheduledJob.updateMany({
      where: whereClause,
      data: { status: "cancelled" },
    });

    return result.count;
  }

  async rescheduleJob(
    jobId: string,
    newCron: string,
    timezone: string = "UTC"
  ): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await this.cancelScheduledRuns(jobId, new Date(), tx);
      await this.scheduleMultipleRuns(
        jobId,
        newCron,
        timezone,
        5,
        undefined,
        tx
      );
    });
  }

  async getNextScheduledRun(jobId: string): Promise<{
    scheduledAt: Date;
    scheduledJobId: string;
  } | null> {
    const scheduledJob = await this.prisma.scheduledJob.findFirst({
      where: {
        jobId,
        status: "pending",
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
    });

    if (!scheduledJob) return null;

    return {
      scheduledAt: scheduledJob.scheduledAt,
      scheduledJobId: scheduledJob.id,
    };
  }

  async getLastExecution(jobId: string): Promise<{
    startedAt: Date;
    completedAt: Date | null;
    status: string;
    executionId: string;
  } | null> {
    const lastExecution = await this.prisma.jobExecution.findFirst({
      where: {
        jobId,
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
      },
    });

    if (!lastExecution) return null;

    return {
      startedAt: lastExecution.startedAt,
      completedAt: lastExecution.completedAt,
      status: lastExecution.status,
      executionId: lastExecution.id,
    };
  }

  async markJobAsProcessing(
    scheduledJobId: string,
    scheduledHour: number
  ): Promise<boolean> {
    try {
      const result = await this.prisma.scheduledJob.updateMany({
        where: {
          id: scheduledJobId,
          scheduledHour,
          status: "pending",
        },
        data: {
          status: "processing",
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Failed to mark job as processing:", error);
      return false;
    }
  }

  async markJobAsCompleted(
    scheduledJobId: string,
    scheduledHour: number
  ): Promise<void> {
    await this.prisma.scheduledJob.updateMany({
      where: {
        id: scheduledJobId,
        scheduledHour,
      },
      data: {
        status: "completed",
      },
    });
  }

  async markJobAsFailed(
    scheduledJobId: string,
    scheduledHour: number,
    error?: string
  ): Promise<void> {
    await this.prisma.scheduledJob.updateMany({
      where: {
        id: scheduledJobId,
        scheduledHour,
      },
      data: {
        status: "failed",
        jobData: error ? { error } : undefined,
      },
    });
  }
}
