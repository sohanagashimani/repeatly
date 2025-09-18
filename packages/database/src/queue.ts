import { Queue, Worker, QueueOptions, WorkerOptions, Job } from "bullmq";
import { sharedRedisConnection } from "./redis";

export const QUEUE_NAMES = {
  JOBS: "repeatly:jobs",
  LOGS: "repeatly:logs",
} as const;

export interface JobQueueData {
  scheduledJobId: string;
  scheduledJobHour: number;
  scheduledAt?: Date;
  attempt: number;
  isManual?: boolean;
  type: string;
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

export const defaultQueueOptions: QueueOptions = {
  connection: sharedRedisConnection,
  defaultJobOptions: {
    removeOnComplete: 5, // Keep only 5 completed jobs
    removeOnFail: 3, // Keep only 3 failed jobs
    attempts: 1,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

export const defaultWorkerOptions: WorkerOptions = {
  connection: sharedRedisConnection,
  concurrency: 1,
  drainDelay: 30000, // Shorter drain delay
  stalledInterval: 60000, // Shorter stalled interval
  maxStalledCount: 0,
  skipStalledCheck: true,
  limiter: {
    max: 1,
    duration: 10000,
  },
  removeOnFail: {
    count: 3, // Keep only 3 failed jobs
  },
  removeOnComplete: {
    count: 5, // Keep only 5 completed jobs
  },
};

export function createQueue(name: string, options?: QueueOptions): Queue {
  return new Queue(name, { ...defaultQueueOptions, ...options });
}

let _jobsQueue: Queue | null = null;
export function getJobsQueue(): Queue {
  if (!_jobsQueue) {
    _jobsQueue = createQueue(QUEUE_NAMES.JOBS);
  }
  return _jobsQueue;
}

export function createWorker(
  name: string,
  processor: (job: Job) => Promise<unknown>,
  options?: WorkerOptions
): Worker {
  return new Worker(name, processor, { ...defaultWorkerOptions, ...options });
}
