import { PrismaClient } from "@repeatly/database";

export interface ExecutionHistoryItem {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  attempt: number;
  response: any;
  error: string | null;
  scheduledJobId: string;
  scheduledJobHour: number;
  type: string;
}

export interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  averageDuration: number | null;
  lastExecution: Date | null;
}

export interface DashboardStats {
  activeJobs: number;
  totalExecutions: number;
  successRate: number;
  recentActivity: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}

export interface PaginatedExecutions {
  executions: ExecutionHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ExecutionFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  attempt?: number;
  type?: string;
}

export class JobExecutionService {
  constructor(private prisma: PrismaClient) {}

  async getJobExecutionHistory(
    jobId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: ExecutionFilters = {}
  ): Promise<PaginatedExecutions> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const whereClause: any = { jobId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.startedAt = {};
      if (filters.startDate) {
        whereClause.startedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.startedAt.lte = filters.endDate;
      }
    }

    if (filters.attempt) {
      whereClause.attempt = filters.attempt;
    }

    const total = await this.prisma.jobExecution.count({
      where: whereClause,
    });

    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    const executions = await this.prisma.jobExecution.findMany({
      where: whereClause,
      include: {
        scheduledJob: {
          select: {
            type: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
    });

    const transformedExecutions: ExecutionHistoryItem[] = executions
      .filter(execution => {
        if (filters.type && execution.scheduledJob?.type !== filters.type) {
          return false;
        }
        return true;
      })
      .map(execution => {
        let duration: number | null = null;
        if (execution.completedAt) {
          duration = Math.round(
            (execution.completedAt.getTime() - execution.startedAt.getTime()) /
              1000
          );
        }

        if (
          execution.response &&
          typeof execution.response === "object" &&
          execution.response !== null &&
          "duration" in execution.response &&
          typeof (execution.response as any).duration === "number"
        ) {
          duration = Math.round((execution.response as any).duration / 1000);
        }

        return {
          id: execution.id,
          status: execution.status,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          duration,
          attempt: execution.attempt,
          response: null,
          error: execution.error,
          scheduledJobId: execution.scheduledJobId,
          scheduledJobHour: execution.scheduledJobHour,
          type: execution.scheduledJob?.type || "scheduled",
        };
      });

    return {
      executions: transformedExecutions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getExecutionDetails(
    executionId: string,
    jobId: string,
    userId: string
  ): Promise<ExecutionHistoryItem | null> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const execution = await this.prisma.jobExecution.findFirst({
      where: {
        id: executionId,
        jobId,
      },
      include: {
        scheduledJob: {
          select: {
            type: true,
            scheduledAt: true,
            jobData: true,
          },
        },
        job: {
          select: {
            name: true,
            url: true,
            method: true,
            timezone: true,
          },
        },
      },
    });

    if (!execution) {
      return null;
    }

    let duration: number | null = null;
    if (execution.completedAt) {
      duration = Math.round(
        (execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000
      );
    }

    if (
      execution.response &&
      typeof execution.response === "object" &&
      execution.response !== null &&
      "duration" in execution.response
    ) {
      const responseDuration = (execution.response as any).duration;
      if (typeof responseDuration === "number") {
        duration = Math.round(responseDuration / 1000);
      }
    }

    return {
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration,
      attempt: execution.attempt,
      response: execution.response,
      error: execution.error,
      scheduledJobId: execution.scheduledJobId,
      scheduledJobHour: execution.scheduledJobHour,
      type: execution.scheduledJob?.type || "scheduled",
    };
  }

  async getDashboardStats(
    userId: string,
    days: number = 30
  ): Promise<DashboardStats> {
    const activeJobs = await this.prisma.job.count({
      where: {
        userId,
        enabled: true,
      },
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalExecutions = await this.prisma.jobExecution.count({
      where: {
        job: {
          userId,
        },
      },
    });

    const recentExecutions = await this.prisma.jobExecution.groupBy({
      by: ["status"],
      where: {
        job: {
          userId,
        },
        startedAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    let recentTotal = 0;
    let recentCompleted = 0;
    let recentFailed = 0;
    let recentRunning = 0;

    recentExecutions.forEach(statusCount => {
      const count = statusCount._count.id;
      recentTotal += count;

      switch (statusCount.status) {
        case "completed":
          recentCompleted = count;
          break;
        case "failed":
          recentFailed = count;
          break;
        case "running":
          recentRunning = count;
          break;
      }
    });

    const overallSuccessStats = await this.prisma.jobExecution.groupBy({
      by: ["status"],
      where: {
        job: {
          userId,
        },
        status: { in: ["completed", "failed"] },
      },
      _count: {
        id: true,
      },
    });

    let overallCompleted = 0;
    let overallTotal = 0;

    overallSuccessStats.forEach(statusCount => {
      const count = statusCount._count.id;
      overallTotal += count;

      if (statusCount.status === "completed") {
        overallCompleted = count;
      }
    });

    const successRate =
      overallTotal > 0
        ? Math.round((overallCompleted / overallTotal) * 100)
        : 0;

    return {
      activeJobs,
      totalExecutions,
      successRate,
      recentActivity: {
        total: recentTotal,
        completed: recentCompleted,
        failed: recentFailed,
        running: recentRunning,
      },
    };
  }

  async getJobExecutionStats(
    jobId: string,
    userId: string,
    days: number = 30
  ): Promise<ExecutionStats> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const statusCounts = await this.prisma.jobExecution.groupBy({
      by: ["status"],
      where: {
        jobId,
        startedAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    let total = 0;
    let completed = 0;
    let failed = 0;
    let running = 0;

    statusCounts.forEach(statusCount => {
      const count = statusCount._count.id;

      switch (statusCount.status) {
        case "completed":
          completed = count;
          total += count;
          break;
        case "failed":
          failed = count;
          total += count;
          break;
        case "running":
          running = count;

          break;
        case "pending":
          break;
        default:
          total += count;
          break;
      }
    });

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    console.log(`📊 Job ${jobId} execution stats:`, {
      total,
      completed,
      failed,
      running,
      successRate,
      days,
      startDate: startDate.toISOString(),
      statusCounts: statusCounts.map(sc => ({
        status: sc.status,
        count: sc._count.id,
      })),
    });

    const completedExecutions = await this.prisma.jobExecution.findMany({
      where: {
        jobId,
        status: "completed",
        startedAt: { gte: startDate },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
        response: true,
      },
    });

    let averageDuration: number | null = null;
    if (completedExecutions.length > 0) {
      const durations = completedExecutions
        .map(execution => {
          if (
            execution.response &&
            typeof execution.response === "object" &&
            execution.response !== null &&
            "duration" in execution.response
          ) {
            const responseDuration = (execution.response as any).duration;
            if (typeof responseDuration === "number") {
              return Math.round(responseDuration / 1000);
            }
          }

          if (execution.completedAt) {
            return Math.round(
              (execution.completedAt.getTime() -
                execution.startedAt.getTime()) /
                1000
            );
          }
          return null;
        })
        .filter(duration => duration !== null) as number[];

      if (durations.length > 0) {
        averageDuration = Math.round(
          durations.reduce((sum, duration) => sum + duration, 0) /
            durations.length
        );
      }
    }

    const lastExecution = await this.prisma.jobExecution.findFirst({
      where: { jobId },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    return {
      total,
      completed,
      failed,
      running,
      successRate,
      averageDuration,
      lastExecution: lastExecution?.startedAt || null,
    };
  }

  async getRunningExecutions(
    jobId: string,
    userId: string
  ): Promise<ExecutionHistoryItem[]> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const runningExecutions = await this.prisma.jobExecution.findMany({
      where: {
        jobId,
        status: "running",
      },
      include: {
        scheduledJob: {
          select: {
            type: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return runningExecutions.map(execution => ({
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: null,
      attempt: execution.attempt,
      response: null,
      error: execution.error,
      scheduledJobId: execution.scheduledJobId,
      scheduledJobHour: execution.scheduledJobHour,
      type: execution.scheduledJob?.type || "scheduled",
    }));
  }
}
