export function getPartitionHour(date: Date): number {
  return date.getUTCHours();
}

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

export function SchedulerQueries() {
  return {
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

    getJobsForCurrentMinute: (currentTime: Date = new Date()) => {
      const startOfMinute = new Date(currentTime);
      startOfMinute.setSeconds(0, 0);

      const endOfMinute = new Date(currentTime);
      endOfMinute.setSeconds(59, 999);

      return {
        where: {
          scheduledAt: {
            gte: startOfMinute,
            lte: endOfMinute,
          },
          status: "pending",
        },
        orderBy: {
          scheduledAt: "asc" as const,
        },
      };
    },

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
}
