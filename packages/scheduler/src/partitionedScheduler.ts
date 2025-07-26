import {
  JobQueueService,
  QueueableJob,
  SchedulerMetrics,
} from "./services/jobQueueService";
import { getPartitionHour, getJobsQueue, prisma } from "@repeatly/database";

interface PartitionedSchedulerConfig {
  pollingIntervalMs: number;
  batchSize: number;
  maxJobsPerCycle: number;
  stuckJobTimeoutMinutes: number;
  overdueJobTimeoutMinutes: number;
}

export class PartitionedScheduler {
  private jobQueueService: JobQueueService;
  private pollingInterval?: NodeJS.Timeout;
  private isShuttingDown = false;
  private isRunning = false;
  private isProcessing = false;

  private config: PartitionedSchedulerConfig = {
    pollingIntervalMs: 2 * 60 * 1000, // 2 minutes
    batchSize: 50,
    maxJobsPerCycle: 200,
    stuckJobTimeoutMinutes: 30,
    overdueJobTimeoutMinutes: 5,
  };

  constructor() {
    this.jobQueueService = new JobQueueService(prisma);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Scheduler is already running");
      return;
    }

    try {
      console.log("🚀 Starting Partitioned Scheduler...");
      this.isRunning = true;

      await this.resetStuckJobs();

      this.startPolling();

      console.log("✅ Partitioned Scheduler started successfully");
    } catch (error) {
      console.error("❌ Failed to start scheduler:", error);
      this.isRunning = false;
      throw error;
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      if (this.isProcessing) {
        console.log(
          "Previous processing cycle still running, skipping this tick."
        );
        return;
      }
      this.isProcessing = true;
      try {
        await this.processingCycle();
      } catch (error) {
        console.error("❌ Error during processing cycle:", error);
      } finally {
        this.isProcessing = false;
      }
    }, this.config.pollingIntervalMs);

    setImmediate(() => this.processingCycle());
  }

  private async processingCycle(): Promise<void> {
    const startTime = Date.now();
    const currentTime = new Date();
    const currentHour = getPartitionHour(currentTime);

    console.log(`🔄 Processing cycle started for hour ${currentHour}`);

    try {
      const metrics = await this.getMetrics();
      console.log(`📊 Current metrics:`, metrics);

      const processedJobs = await this.processReadyJobs(currentTime);

      const overdueJobs = await this.processOverdueJobs();

      if (Math.random() < 0.1) {
        await this.resetStuckJobs();
      }

      if (Math.random() < 0.003) {
        await this.cleanupOldRecords();
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Processing cycle completed in ${duration}ms. ` +
          `Processed: ${processedJobs} current, ${overdueJobs} overdue`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Processing cycle failed after ${duration}ms:`, error);
    }
  }

  private async processReadyJobs(currentTime: Date): Promise<number> {
    let totalProcessed = 0;
    let hasMoreJobs = true;

    while (hasMoreJobs && totalProcessed < this.config.maxJobsPerCycle) {
      try {
        const readyJobs = await this.jobQueueService.getReadyJobs(
          this.config.batchSize,
          currentTime
        );

        if (readyJobs.length === 0) {
          hasMoreJobs = false;
          break;
        }

        const claimResults = await this.jobQueueService.claimJobsForProcessing(
          readyJobs.map(job => ({
            scheduledJobId: job.scheduledJobId,
            scheduledJobHour: job.scheduledJobHour,
          })),
          this.config.batchSize
        );

        let claimedCount = 0;
        for (const result of claimResults) {
          if (result.claimed) {
            const job = readyJobs.find(
              j => j.scheduledJobId === result.scheduledJobId
            );
            if (job) {
              await this.enqueueJob(job);
              claimedCount++;
            }
          }
        }

        totalProcessed += claimedCount;

        console.log(
          `🎯 Claimed and queued ${claimedCount}/${readyJobs.length} jobs`
        );

        if (readyJobs.length < this.config.batchSize) {
          hasMoreJobs = false;
        }
      } catch (error) {
        console.error("❌ Error processing ready jobs batch:", error);
        hasMoreJobs = false;
      }
    }

    return totalProcessed;
  }

  private async processOverdueJobs(): Promise<number> {
    try {
      const overdueJobs = await this.jobQueueService.getOverdueJobs(
        this.config.overdueJobTimeoutMinutes,
        this.config.batchSize
      );

      if (overdueJobs.length === 0) {
        return 0;
      }

      console.log(`⏰ Found ${overdueJobs.length} overdue jobs`);

      const claimResults = await this.jobQueueService.claimJobsForProcessing(
        overdueJobs.map(job => ({
          scheduledJobId: job.scheduledJobId,
          scheduledJobHour: job.scheduledJobHour,
        })),
        this.config.batchSize
      );

      let processedCount = 0;
      for (const result of claimResults) {
        if (result.claimed) {
          const job = overdueJobs.find(
            j => j.scheduledJobId === result.scheduledJobId
          );
          if (job) {
            await this.enqueueJob(job);
            processedCount++;
          }
        }
      }

      return processedCount;
    } catch (error) {
      console.error("❌ Error processing overdue jobs:", error);
      return 0;
    }
  }

  private async enqueueJob(job: QueueableJob): Promise<void> {
    try {
      const queue = getJobsQueue();

      await queue.add(
        "execute-job",
        {
          scheduledJobId: job.scheduledJobId,
          scheduledJobHour: job.scheduledJobHour,
          jobId: job.jobId,
          jobData: job.jobData,
          scheduledAt: job.scheduledAt,
          attempt: job.attempt,
          type: job.type,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,

          removeOnFail: 50,
          delay: Math.max(0, job.scheduledAt.getTime() - Date.now()),
        }
      );

      console.log(
        `✅ Queued job ${job.jobId} (scheduled: ${job.scheduledJobId}) for ${job.scheduledAt.toISOString()}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to enqueue job ${job.jobId} (scheduled: ${job.scheduledJobId}):`,
        error
      );
    }
  }

  private async resetStuckJobs(): Promise<void> {
    try {
      const resetCount = await this.jobQueueService.resetStuckJobs(
        this.config.stuckJobTimeoutMinutes
      );

      if (resetCount > 0) {
        console.log(`🔄 Reset ${resetCount} stuck jobs back to pending`);
      }
    } catch (error) {
      console.error("❌ Error resetting stuck jobs:", error);
    }
  }

  private async cleanupOldRecords(): Promise<void> {
    try {
      const cleanedScheduledJobs =
        await this.jobQueueService.cleanupOldScheduledJobs(7);

      const cleanedExecutions =
        await this.jobQueueService.cleanupOldExecutions(30);

      if (cleanedScheduledJobs > 0 || cleanedExecutions > 0) {
        console.log(
          `🧹 Cleaned up ${cleanedScheduledJobs} scheduled jobs, ${cleanedExecutions} execution records`
        );
      }
    } catch (error) {
      console.error("❌ Error cleaning up old records:", error);
    }
  }

  private async getMetrics(): Promise<SchedulerMetrics> {
    try {
      return await this.jobQueueService.getSchedulerMetrics();
    } catch (error) {
      console.error("❌ Error getting scheduler metrics:", error);
      return {
        currentHour: getPartitionHour(new Date()),
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        totalJobsInHour: 0,
      };
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log("⚠️  Scheduler is not running");
      return;
    }

    this.isShuttingDown = true;
    console.log("🛑 Shutting down Partitioned Scheduler...");

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    this.isRunning = false;
    console.log("✅ Partitioned Scheduler stopped gracefully");
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    metrics: SchedulerMetrics;
    config: PartitionedSchedulerConfig;
  }> {
    const metrics = await this.getMetrics();
    return {
      isRunning: this.isRunning,
      metrics,
      config: this.config,
    };
  }
}
