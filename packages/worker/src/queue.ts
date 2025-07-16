import { Worker, QueueOptions, WorkerOptions, Job } from "bullmq";
import { redisConfig } from "./redis";

/**
 * Queue names used across the application
 */
export const QUEUE_NAMES = {
  JOBS: "repeatly:jobs",
  LOGS: "repeatly:logs",
} as const;

/**
 * Enhanced job data structure for the jobs queue (partitioned approach)
 */
export interface JobQueueData {
  // Scheduled job information (real scheduled job record, even for manual executions)
  scheduledJobId: string;
  scheduledJobHour: number;
  scheduledAt?: Date;
  attempt: number;
  isManual?: boolean; // Flag to indicate manual execution

  // Original job information
  jobId: string;
  jobData: {
    name: string;
    url: string;
    method: string;
    headers?: Record<string, any>;
    body?: any;
    retries: number;
    userId: string;
    timezone: string;
    cron: string;
  };
}

/**
 * Default queue options
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

/**
 * Default worker options
 */
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConfig,
  concurrency: 5,
};

/**
 * Create a worker instance
 */
export function createWorker(
  name: string,
  processor: (job: Job) => Promise<unknown>,
  options?: WorkerOptions
): Worker {
  return new Worker(name, processor, { ...defaultWorkerOptions, ...options });
}
