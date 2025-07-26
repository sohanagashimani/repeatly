import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { getJobsQueue } from "@repeatly/database";

export const triggerJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

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

    if (!job.enabled) {
      res.status(400).json({
        error: "Cannot trigger disabled job. Please enable the job first.",
      });
      return;
    }

    const now = new Date();
    const hour = now.getUTCHours();

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

    const jobsQueue = getJobsQueue();

    const queueableJob = {
      jobId: job.id,
      scheduledJobId: tempScheduledJob.id,
      scheduledJobHour: hour,
      attempt: 1,
      isManual: true,
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
      delay: 0,
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
  } catch (error) {
    console.error("Failed to trigger job:", error);
    next(error);
  }
};
