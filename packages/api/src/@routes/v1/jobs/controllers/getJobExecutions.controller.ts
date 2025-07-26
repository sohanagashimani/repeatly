import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { JobExecutionService } from "../../../../services/jobExecutionService";

export const getJobExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status as string;
    }

    if (req.query.type) {
      filters.type = req.query.type as string;
    }

    if (req.query.attempt) {
      filters.attempt = parseInt(req.query.attempt as string);
    }

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const jobExecutionService = new JobExecutionService(prisma);

    const result = await jobExecutionService.getJobExecutionHistory(
      jobId,
      userId,
      page,
      limit,
      filters
    );

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Job not found") {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    next(error);
  }
};
