import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../../prisma";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verify job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!existingJob) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    // Build update data from provided fields
    const { name, cron, url, method, headers, body, enabled, timezone } =
      req.body;
    const updateData = Object.fromEntries(
      Object.entries({
        name,
        cron,
        url,
        method,
        headers,
        body,
        enabled,
        timezone,
      }).filter(([_, value]) => value !== undefined)
    );

    // Detect changes that require rescheduling
    const cronChanged = cron && cron !== existingJob.cron;
    const timezoneChanged = timezone && timezone !== existingJob.timezone;
    const enabledChanged =
      enabled !== undefined && enabled !== existingJob.enabled;

    // Update the job
    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    // Handle scheduling changes
    const jobSchedulingService = new JobSchedulingService(prisma);

    if (cronChanged || timezoneChanged) {
      // Reschedule with new cron/timezone
      await jobSchedulingService.rescheduleJob(job.id, job.cron, job.timezone);
    } else if (enabledChanged) {
      if (job.enabled) {
        // Job enabled - ensure it has scheduled runs
        const nextRun = await jobSchedulingService.getNextScheduledRun(job.id);
        if (!nextRun) {
          await jobSchedulingService.scheduleMultipleRuns(
            job.id,
            job.cron,
            job.timezone,
            5
          );
        }
      } else {
        // Job disabled - cancel future runs
        await jobSchedulingService.cancelScheduledRuns(job.id, new Date());
      }
    }

    // Get next scheduled run for response
    const nextScheduledRun = await jobSchedulingService.getNextScheduledRun(
      job.id
    );

    res.status(200).json({
      ...job,
      nextRun: nextScheduledRun?.scheduledAt || null,
      nextScheduledJobId: nextScheduledRun?.scheduledJobId || null,
    });
  } catch (error) {
    next(error);
  }
};
