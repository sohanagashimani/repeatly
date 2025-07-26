import { NextFunction, Request, Response } from "express";
import { prisma } from "@repeatly/database";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";

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

    await prisma.$transaction(
      async tx => {
        await jobSchedulingService.cancelScheduledRuns(existingJob.id);

        await tx.jobExecution.deleteMany({
          where: { jobId: existingJob.id },
        });

        await tx.scheduledJob.deleteMany({
          where: { jobId: existingJob.id },
        });

        await tx.job.delete({
          where: { id: existingJob.id },
        });
      },
      {
        timeout: 10000,
      }
    );

    res.status(204).json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};
