import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../../prisma";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";

export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

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

    const jobSchedulingService = new JobSchedulingService(prisma);

    // Get the next scheduled run
    const nextScheduledRun = await jobSchedulingService.getNextScheduledRun(
      job.id
    );

    const lastExecution = await jobSchedulingService.getLastExecution(job.id);

    res.status(200).json({
      ...job,
      nextRun: nextScheduledRun?.scheduledAt || null,
      nextScheduledJobId: nextScheduledRun?.scheduledJobId || null,
      lastRun: lastExecution
        ? lastExecution.completedAt || lastExecution.startedAt
        : null,
      lastExecutionStatus: lastExecution?.status || null,
      lastExecutionId: lastExecution?.executionId || null,
    });
  } catch (error) {
    next(error);
  }
};
