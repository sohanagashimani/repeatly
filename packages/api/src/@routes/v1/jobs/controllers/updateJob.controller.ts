import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const existingJob = await prisma.job.findFirst({
      where: { id, userId },
    });

    if (!existingJob) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

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

    const cronChanged = cron && cron !== existingJob.cron;
    const timezoneChanged = timezone && timezone !== existingJob.timezone;
    const enabledChanged =
      enabled !== undefined && enabled !== existingJob.enabled;

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    const jobSchedulingService = new JobSchedulingService(prisma);

    if (cronChanged || timezoneChanged) {
      await jobSchedulingService.rescheduleJob(job.id, job.cron, job.timezone);
    } else if (enabledChanged) {
      if (job.enabled) {
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
        await jobSchedulingService.cancelScheduledRuns(job.id, new Date());
      }
    }

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
