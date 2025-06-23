import { PrismaClient } from "@prisma/client";
import { createScheduledJobData } from "../../../database/src/utils/scheduledJobHelpers";
import { getNextRunTime } from "../cron";

export class JobSchedulingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Schedule the next run for a job based on its cron expression
   */
  async scheduleNextRun(
    jobId: string,
    cron: string,
    timezone: string = "UTC",
    fromTime?: Date,
    type: string = "scheduled"
  ): Promise<{ scheduledAt: Date; scheduledJobId: string }> {
    const nextRun = getNextRunTime(cron, timezone, fromTime);

    // Get current job data to snapshot
    const job = await this.prisma.job.findUniqueOrThrow({
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

    const scheduledJobData = createScheduledJobData({
      jobId,
      scheduledAt: nextRun,
      status: "pending",
      type,
      jobData: jobDataSnapshot,
    });

    const scheduledJob = await this.prisma.scheduledJob.create({
      data: scheduledJobData,
    });

    return {
      scheduledAt: nextRun,
      scheduledJobId: scheduledJob.id,
    };
  }

  /**
   * Schedule multiple future runs for a job (useful for recurring jobs)
   */
  async scheduleMultipleRuns(
    jobId: string,
    cron: string,
    timezone: string = "UTC",
    count: number = 5,
    fromTime?: Date
  ): Promise<Array<{ scheduledAt: Date; scheduledJobId: string }>> {
    // Get current job data to snapshot once
    const job = await this.prisma.job.findUniqueOrThrow({
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
      const nextRun = getNextRunTime(cron, timezone, currentTime);

      const scheduledJobData = createScheduledJobData({
        jobId,
        scheduledAt: nextRun,
        status: "pending",
        jobData: jobDataSnapshot,
      });

      const scheduledJob = await this.prisma.scheduledJob.create({
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

  /**
   * Cancel future scheduled runs for a job
   */
  async cancelScheduledRuns(jobId: string, afterDate?: Date): Promise<number> {
    const whereClause: any = {
      jobId,
      status: "pending",
    };

    if (afterDate) {
      whereClause.scheduledAt = { gt: afterDate };
    }

    const result = await this.prisma.scheduledJob.updateMany({
      where: whereClause,
      data: { status: "cancelled" },
    });

    return result.count;
  }

  /**
   * Reschedule all future runs for a job (useful when cron changes)
   */
  async rescheduleJob(
    jobId: string,
    newCron: string,
    timezone: string = "UTC"
  ): Promise<void> {
    // Cancel existing future runs
    await this.cancelScheduledRuns(jobId, new Date());

    // Schedule new runs with current job data
    await this.scheduleMultipleRuns(jobId, newCron, timezone);
  }

  /**
   * Get next scheduled run for a job
   */
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

  /**
   * Get last execution information for a job
   */
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

  /**
   * Mark a scheduled job as processing
   */
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

  /**
   * Mark a scheduled job as completed
   */
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

  /**
   * Mark a scheduled job as failed
   */
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
