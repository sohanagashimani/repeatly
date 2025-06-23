import { PrismaClient } from "@prisma/client";
import { createJobExecutionData } from "../../../database/src/utils/scheduledJobHelpers";

export interface JobExecutionResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  duration?: number;
  responseSize?: number;
  contentType?: string;
  responseHeaders?: Record<string, string>;
}

export class JobExecutionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Start a job execution and return the execution ID
   */
  async startExecution(
    jobId: string,
    scheduledJobId: string,
    scheduledJobHour: number,
    attempt: number = 1
  ): Promise<string> {
    // Both manual and scheduled executions now have real scheduled job records
    const executionData = createJobExecutionData({
      jobId,
      scheduledJobId: scheduledJobId!,
      scheduledJobHour: scheduledJobHour!,
      status: "running",
      startedAt: new Date(),
      attempt,
    });

    const execution = await this.prisma.jobExecution.create({
      data: executionData,
    });

    return execution.id;
  }

  /**
   * Complete a job execution with success result
   */
  async completeExecution(
    executionId: string,
    result: JobExecutionResult
  ): Promise<void> {
    const responseMetadata = {
      statusCode: result.statusCode,
      success: result.success,
      duration: result.duration,
      responseSize: result.responseSize,
      contentType: result.contentType,
      data: result.response,
      timestamp: new Date().toISOString(),
    };

    await this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: "completed",
        completedAt: new Date(),
        response: responseMetadata,
      },
    });
  }

  /**
   * Mark a job execution as failed
   */
  async failExecution(
    executionId: string,
    error: string,
    result?: JobExecutionResult
  ): Promise<void> {
    const failureMetadata = {
      statusCode: result?.statusCode,
      success: false,
      duration: result?.duration,
      responseSize: result?.responseSize,
      contentType: result?.contentType,
      error: error,
      data: result?.response,
      timestamp: new Date().toISOString(),
    };

    await this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        completedAt: new Date(),
        error,
        response: failureMetadata,
      },
    });
  }

  /**
   * Get execution history for a job
   */
  async getJobExecutionHistory(
    jobId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return await this.prisma.jobExecution.findMany({
      where: { jobId },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        scheduledJob: {
          select: {
            scheduledAt: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get execution statistics for a job
   */
  async getJobExecutionStats(
    jobId: string,
    days: number = 30
  ): Promise<{
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    averageDuration: number | null;
    successRate: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const executions = await this.prisma.jobExecution.findMany({
      where: {
        jobId,
        startedAt: { gte: since },
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    const totalExecutions = executions.length;
    const successCount = executions.filter(
      e => e.status === "completed"
    ).length;
    const failureCount = executions.filter(e => e.status === "failed").length;

    // Calculate average duration for completed executions
    const completedExecutions = executions.filter(
      e => e.status === "completed" && e.completedAt
    );

    let averageDuration: number | null = null;
    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce((sum, execution) => {
        const duration =
          execution.completedAt!.getTime() - execution.startedAt.getTime();
        return sum + duration;
      }, 0);
      averageDuration = totalDuration / completedExecutions.length;
    }

    const successRate =
      totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      successCount,
      failureCount,
      averageDuration,
      successRate,
    };
  }

  /**
   * Get recent failed executions
   */
  async getRecentFailures(
    jobId?: string,
    limit: number = 20,
    hours: number = 24
  ): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const whereClause: any = {
      status: "failed",
      startedAt: { gte: since },
    };

    if (jobId) {
      whereClause.jobId = jobId;
    }

    return await this.prisma.jobExecution.findMany({
      where: whereClause,
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        scheduledJob: {
          select: {
            scheduledAt: true,
          },
        },
      },
    });
  }

  /**
   * Clean up old execution records
   */
  async cleanupOldExecutions(
    olderThanDays: number = 90,
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
