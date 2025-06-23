/**
 * Utility functions for working with hourly partitioned scheduled jobs
 */

/**
 * Extracts the hour component (0-23) from a Date for partitioning
 */
export function getPartitionHour(date: Date): number {
  return date.getUTCHours();
}

/**
 * Creates scheduled job data with proper hour partitioning
 */
export function createScheduledJobData(data: {
  jobId: string;
  scheduledAt: Date;
  jobData?: any;
  status?: string;
  type?: string;
}) {
  return {
    ...data,
    scheduledHour: getPartitionHour(data.scheduledAt),
    status: data.status || "pending",
    type: data.type || "scheduled",
  };
}

/**
 * Creates job execution data with proper hour reference
 */
export function createJobExecutionData(data: {
  jobId: string;
  scheduledJobId: string;
  scheduledJobHour: number;
  status: string;
  startedAt: Date;
  response?: any;
  error?: string;
  attempt?: number;
}) {
  return {
    ...data,
    attempt: data.attempt || 1,
  };
}

/**
 * Query helpers for scheduler service
 */
export const SchedulerQueries = {
  /**
   * Gets jobs for the current hour partition
   */
  getJobsForCurrentHour: (currentTime: Date = new Date()) => {
    const hour = getPartitionHour(currentTime);
    return {
      where: {
        scheduledHour: hour,
        status: "pending",
        scheduledAt: {
          lte: currentTime,
        },
      },
      orderBy: {
        scheduledAt: "asc" as const,
      },
    };
  },

  /**
   * Gets jobs for a specific hour (0-23)
   */
  getJobsForHour: (hour: number, beforeTime: Date = new Date()) => {
    return {
      where: {
        scheduledHour: hour,
        status: "pending",
        scheduledAt: {
          lte: beforeTime,
        },
      },
      orderBy: {
        scheduledAt: "asc" as const,
      },
    };
  },
};
