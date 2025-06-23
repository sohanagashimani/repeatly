import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../../prisma";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";
import type { UpdateJobSchemaType } from "../schemas/updateJobSchema.schema";

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Get the request method to determine if it's a full or partial update
    const isPartialUpdate = req.method === "PATCH";

    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingJob) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const jobSchedulingService = new JobSchedulingService(prisma);

    // For partial updates, only update provided fields
    // For full updates (PUT), update all fields
    const updateData: any = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.cron !== undefined) updateData.cron = req.body.cron;
    if (req.body.url !== undefined) updateData.url = req.body.url;
    if (req.body.method !== undefined) updateData.method = req.body.method;
    if (req.body.headers !== undefined) updateData.headers = req.body.headers;
    if (req.body.body !== undefined) updateData.body = req.body.body;
    if (req.body.enabled !== undefined) updateData.enabled = req.body.enabled;
    if (req.body.timezone !== undefined)
      updateData.timezone = req.body.timezone;

    // Check if cron or timezone changed (requiring rescheduling)
    const cronChanged = updateData.cron && updateData.cron !== existingJob.cron;
    const timezoneChanged =
      updateData.timezone && updateData.timezone !== existingJob.timezone;
    const enabledChanged =
      updateData.enabled !== undefined &&
      updateData.enabled !== existingJob.enabled;

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    // Handle scheduling changes
    if (cronChanged || timezoneChanged) {
      // Reschedule with new cron/timezone
      await jobSchedulingService.rescheduleJob(job.id, job.cron, job.timezone);
    } else if (enabledChanged) {
      if (job.enabled) {
        // Job was enabled - schedule runs if none exist
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
        // Job was disabled - cancel future runs
        await jobSchedulingService.cancelScheduledRuns(job.id, new Date());
      }
    }

    // Get the next scheduled run to include in response
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
