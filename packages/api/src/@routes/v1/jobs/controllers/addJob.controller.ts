import { NextFunction, Request, Response } from "express";
import { prisma } from "@repeatly/database";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";
import type { AddJobSchemaType } from "../schemas/addJobSchema.schema";

export const addJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, cron, url, method, headers, body, timezone, enabled } =
      req.body as AddJobSchemaType["body"];
    const userId = req.userId!;

    const jobSchedulingService = new JobSchedulingService(prisma);

    const job = await prisma.job.create({
      data: {
        name,
        cron,
        url,
        method,
        headers,
        body,
        timezone: timezone || "UTC",
        enabled: enabled !== undefined ? enabled : true,
        userId,
      },
    });

    if (job.enabled) {
      await jobSchedulingService.scheduleMultipleRuns(
        job.id,
        job.cron,
        job.timezone,
        5
      );
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
