import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../../prisma";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";
import { Queue } from "bullmq";
import { redisConfig } from "../../../../redis";

export const triggerJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type = "manual" } = req.body; // Default to manual trigger
    const userId = req.userId!;

    // Verify job exists and belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    // Check if job is enabled
    if (!job.enabled) {
      res.status(400).json({
        error: "Cannot trigger disabled job. Please enable the job first.",
      });
      return;
    }

    if (type === "manual") {
      // Manual triggers: Create a temporary scheduled job for execution tracking
      const now = new Date();
      const hour = now.getUTCHours();

      // Create a temporary scheduled job for manual execution
      const tempScheduledJob = await prisma.scheduledJob.create({
        data: {
          jobId: job.id,
          scheduledAt: now,
          scheduledHour: hour,
          status: "processing",
          type: "manual",
          jobData: {
            ...job,
            manualExecution: true,
            triggeredAt: now.toISOString(),
          },
        },
      });

      const jobsQueue = new Queue("repeatly:jobs", { connection: redisConfig });

      const queueableJob = {
        jobId: job.id,
        scheduledJobId: tempScheduledJob.id,
        scheduledJobHour: hour,
        attempt: 1, // Manual triggers start at attempt 1
        isManual: true, // Flag to indicate this is a manual execution
        jobData: {
          name: job.name,
          url: job.url,
          method: job.method,
          headers: job.headers,
          body: job.body,
          retries: job.retries,
          timezone: job.timezone,
          cron: job.cron,
          userId: job.userId,
        },
      };

      await jobsQueue.add("execute-job", queueableJob, {
        delay: 0, // Execute immediately
        attempts: job.retries + 1,
        backoff: { type: "exponential", delay: 2000 },
      });

      console.log(
        `✅ Manual trigger for job ${job.id} (${job.name}) queued immediately`
      );

      res.status(200).json({
        message: "Job triggered immediately and queued for execution",
        execution: "immediate",
        job: {
          id: job.id,
          name: job.name,
          url: job.url,
          method: job.method,
        },
      });
    } else {
      // For scheduled triggers, create a scheduled job entry
      const jobSchedulingService = new JobSchedulingService(prisma);
      const triggerTime = new Date();

      const scheduledRun = await jobSchedulingService.scheduleNextRun(
        job.id,
        job.cron,
        job.timezone,
        triggerTime,
        type
      );

      console.log(
        `📅 Scheduled trigger for job ${job.id} (${job.name}) created for ${triggerTime.toISOString()}`
      );

      res.status(200).json({
        message: "Job scheduled successfully",
        execution: "scheduled",
        scheduledRun: {
          scheduledJobId: scheduledRun.scheduledJobId,
          scheduledAt: scheduledRun.scheduledAt,
          type: "scheduled",
        },
        job: {
          id: job.id,
          name: job.name,
          url: job.url,
          method: job.method,
        },
      });
    }
  } catch (error) {
    console.error("Failed to trigger job:", error);
    next(error);
  }
};
