import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../../prisma";
import { JobExecutionService } from "../../../../services/jobExecutionService";

export const getJobExecutionDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId, executionId } = req.params;
    const userId = req.userId!;

    const jobExecutionService = new JobExecutionService(prisma);

    const execution = await jobExecutionService.getExecutionDetails(
      executionId,
      jobId,
      userId
    );

    if (!execution) {
      res.status(404).json({ error: "Execution not found" });
      return;
    }

    res.status(200).json(execution);
  } catch (error: any) {
    if (error.message === "Job not found") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    next(error);
  }
};
