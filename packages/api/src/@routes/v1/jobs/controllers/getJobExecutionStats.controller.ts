import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { JobExecutionService } from "../../../../services/jobExecutionService";

export const getJobExecutionStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;

    const days = parseInt(req.query.days as string) || 30;

    const jobExecutionService = new JobExecutionService(prisma);

    const stats = await jobExecutionService.getJobExecutionStats(
      jobId,
      userId,
      days
    );

    res.status(200).json(stats);
  } catch (error: any) {
    if (error.message === "Job not found") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    next(error);
  }
};
