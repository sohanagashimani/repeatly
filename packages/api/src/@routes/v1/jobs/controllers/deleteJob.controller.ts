import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";

const prisma = new PrismaClient();

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

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

    // Delete in the correct order to avoid foreign key constraints
    await prisma.$transaction(async tx => {
      // 1. Cancel all future scheduled runs
      await jobSchedulingService.cancelScheduledRuns(existingJob.id);

      // 2. Delete job executions first (they reference both job and scheduled_job)
      await tx.jobExecution.deleteMany({
        where: { jobId: existingJob.id },
      });

      // 3. Delete scheduled jobs (they reference job)
      await tx.scheduledJob.deleteMany({
        where: { jobId: existingJob.id },
      });

      // 4. Finally delete the main job
      await tx.job.delete({
        where: { id: existingJob.id },
      });
    });

    res.status(204).json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};
