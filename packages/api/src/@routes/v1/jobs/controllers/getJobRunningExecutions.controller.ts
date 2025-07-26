import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { JobExecutionService } from "../../../../services/jobExecutionService";

export const getJobRunningExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;

    const jobExecutionService = new JobExecutionService(prisma);

    const runningExecutions = await jobExecutionService.getRunningExecutions(
      jobId,
      userId
    );

    res.status(200).json(runningExecutions);
  } catch (error: any) {
    if (error.message === "Job not found") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    next(error);
  }
};
