import { Request, Response, NextFunction } from "express";
import { prisma } from "@repeatly/database";
import { JobExecutionService } from "../../../../services/jobExecutionService";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const days = parseInt(req.query.days as string) || 30;

    const jobExecutionService = new JobExecutionService(prisma);

    const stats = await jobExecutionService.getDashboardStats(userId, days);

    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};
