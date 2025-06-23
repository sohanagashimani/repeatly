import { PrismaClient } from "@prisma/client";
import { SchedulerQueries, getPartitionHour } from "@repeatly/database";

export interface QueueableJob {
  scheduledJobId: string;
  scheduledJobHour: number;
  jobId: string;
  jobData: {
    name: string;
    url: string;
    method: string;
    headers?: any;
    body?: any;
    retries: number;
    userId: string;
    timezone: string;
    cron: string;
  };
  scheduledAt: Date;
  attempt: number;
}

export interface SchedulerMetrics {
  currentHour: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalJobsInHour: number;
}

export class JobQueueService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get jobs ready for execution in the current hour
   */
  async getReadyJobs(
    limit: number = 100,
    currentTime: Date = new Date()
  ): Promise<QueueableJob[]> {
    const query = SchedulerQueries.getJobsForCurrentHour(currentTime);

    const scheduledJobs = await this.prisma.scheduledJob.findMany({
      ...query,
      take: limit,
      include: {
        job: true,
      },
    });

    return scheduledJobs.map(scheduledJob => ({
      scheduledJobId: scheduledJob.id,
      scheduledJobHour: scheduledJob.scheduledHour,
      jobId: scheduledJob.jobId,
      jobData: {
        name: scheduledJob.job.name,
        url: scheduledJob.job.url,
        method: scheduledJob.job.method,
        headers: scheduledJob.job.headers,
        body: scheduledJob.job.body,
        retries: scheduledJob.job.retries,
        userId: scheduledJob.job.userId,
        timezone: scheduledJob.job.timezone,
        cron: scheduledJob.job.cron,
      },
      scheduledAt: scheduledJob.scheduledAt,
      attempt: 1, // Initial attempt
    }));
  }

  /**
   * Get jobs ready for execution in a specific hour
   */
  async getReadyJobsForHour(
    hour: number,
    limit: number = 100,
    beforeTime: Date = new Date()
  ): Promise<QueueableJob[]> {
    const query = SchedulerQueries.getJobsForHour(hour, beforeTime);

    const scheduledJobs = await this.prisma.scheduledJob.findMany({
      ...query,
      take: limit,
      include: {
        job: true,
      },
    });

    return scheduledJobs.map(scheduledJob => ({
      scheduledJobId: scheduledJob.id,
      scheduledJobHour: scheduledJob.scheduledHour,
      jobId: scheduledJob.jobId,
      jobData: {
        name: scheduledJob.job.name,
        url: scheduledJob.job.url,
        method: scheduledJob.job.method,
        headers: scheduledJob.job.headers,
        body: scheduledJob.job.body,
        retries: scheduledJob.job.retries,
        userId: scheduledJob.job.userId,
        timezone: scheduledJob.job.timezone,
        cron: scheduledJob.job.cron,
      },
      scheduledAt: scheduledJob.scheduledAt,
      attempt: 1,
    }));
  }

  /**
   * Atomically claim a batch of jobs for processing
   */
  async claimJobsForProcessing(
    jobIds: Array<{ scheduledJobId: string; scheduledJobHour: number }>,
    maxJobs: number = 50
  ): Promise<
    Array<{
      scheduledJobId: string;
      scheduledJobHour: number;
      claimed: boolean;
    }>
  > {
    const results: Array<{
      scheduledJobId: string;
      scheduledJobHour: number;
      claimed: boolean;
    }> = [];

    // Process in smaller batches to avoid long-running transactions
    const batchSize = Math.min(maxJobs, 10);

    for (
      let i = 0;
      i < jobIds.length && results.length < maxJobs;
      i += batchSize
    ) {
      const batch = jobIds.slice(i, i + batchSize);

      try {
        const batchResults = await this.prisma.$transaction(async tx => {
          const batchResults: Array<{
            scheduledJobId: string;
            scheduledJobHour: number;
            claimed: boolean;
          }> = [];

          for (const { scheduledJobId, scheduledJobHour } of batch) {
            try {
              const updateResult = await tx.scheduledJob.updateMany({
                where: {
                  id: scheduledJobId,
                  scheduledHour: scheduledJobHour,
                  status: "pending",
                  scheduledAt: { lte: new Date() },
                },
                data: {
                  status: "processing",
                },
              });

              batchResults.push({
                scheduledJobId,
                scheduledJobHour,
                claimed: updateResult.count > 0,
              });
            } catch (error) {
              console.error(`Failed to claim job ${scheduledJobId}:`, error);
              batchResults.push({
                scheduledJobId,
                scheduledJobHour,
                claimed: false,
              });
            }
          }

          return batchResults;
        });

        results.push(...batchResults);
      } catch (error) {
        console.error("Batch claim failed:", error);
        // Mark entire batch as failed
        batch.forEach(({ scheduledJobId, scheduledJobHour }) => {
          results.push({
            scheduledJobId,
            scheduledJobHour,
            claimed: false,
          });
        });
      }
    }

    return results;
  }

  /**
   * Get metrics for the scheduler (useful for monitoring)
   */
  async getSchedulerMetrics(
    currentTime: Date = new Date()
  ): Promise<SchedulerMetrics> {
    const currentHour = getPartitionHour(currentTime);

    const statusCounts = await this.prisma.scheduledJob.groupBy({
      by: ["status"],
      where: {
        scheduledHour: currentHour,
      },
      _count: {
        status: true,
      },
    });

    const metrics: SchedulerMetrics = {
      currentHour,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalJobsInHour: 0,
    };

    statusCounts.forEach(({ status, _count }) => {
      const count = _count.status;
      metrics.totalJobsInHour += count;

      switch (status) {
        case "pending":
          metrics.pendingJobs = count;
          break;
        case "processing":
          metrics.processingJobs = count;
          break;
        case "completed":
          metrics.completedJobs = count;
          break;
        case "failed":
          metrics.failedJobs = count;
          break;
      }
    });

    return metrics;
  }

  /**
   * Get overdue jobs (jobs that should have been processed but are still pending)
   */
  async getOverdueJobs(
    olderThanMinutes: number = 5,
    limit: number = 100
  ): Promise<QueueableJob[]> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

    const scheduledJobs = await this.prisma.scheduledJob.findMany({
      where: {
        status: "pending",
        scheduledAt: { lt: cutoffTime },
      },
      take: limit,
      orderBy: { scheduledAt: "asc" },
      include: {
        job: true,
      },
    });

    return scheduledJobs.map(scheduledJob => ({
      scheduledJobId: scheduledJob.id,
      scheduledJobHour: scheduledJob.scheduledHour,
      jobId: scheduledJob.jobId,
      jobData: {
        name: scheduledJob.job.name,
        url: scheduledJob.job.url,
        method: scheduledJob.job.method,
        headers: scheduledJob.job.headers,
        body: scheduledJob.job.body,
        retries: scheduledJob.job.retries,
        userId: scheduledJob.job.userId,
        timezone: scheduledJob.job.timezone,
        cron: scheduledJob.job.cron,
      },
      scheduledAt: scheduledJob.scheduledAt,
      attempt: 1,
    }));
  }

  /**
   * Reset stuck processing jobs back to pending
   */
  async resetStuckJobs(stuckForMinutes: number = 30): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - stuckForMinutes);

    const result = await this.prisma.scheduledJob.updateMany({
      where: {
        status: "processing",
        createdAt: { lt: cutoffTime },
      },
      data: {
        status: "pending",
      },
    });

    return result.count;
  }

  /**
   * Clean up old completed/failed scheduled jobs
   */
  async cleanupOldScheduledJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.scheduledJob.deleteMany({
      where: {
        status: { in: ["completed", "failed"] },
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Clean up old execution records
   */
  async cleanupOldExecutions(
    olderThanDays: number = 30,
    batchSize: number = 1000
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.prisma.jobExecution.deleteMany({
        where: {
          startedAt: { lt: cutoffDate },
        },
      });

      totalDeleted += result.count;
      hasMore = result.count === batchSize;

      // Small delay to avoid overwhelming the database
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return totalDeleted;
  }
}
