import { Request, Response, NextFunction } from "express";
import { JobSchedulingService } from "../../../../services/jobSchedulingService";
import { prisma } from "@repeatly/database";

export const getJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalJobs = await prisma.job.count({
      where: {
        userId,
      },
    });

    const jobs = await prisma.job.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const jobSchedulingService = new JobSchedulingService(prisma);

    const jobsWithScheduling = await Promise.all(
      jobs.map(async job => {
        const nextScheduledRun = await jobSchedulingService.getNextScheduledRun(
          job.id
        );
        const lastExecution = await jobSchedulingService.getLastExecution(
          job.id
        );

        return {
          ...job,
          nextRun: nextScheduledRun?.scheduledAt || null,
          nextScheduledJobId: nextScheduledRun?.scheduledJobId || null,
          lastRun: lastExecution
            ? lastExecution.completedAt || lastExecution.startedAt
            : null,
          lastExecutionStatus: lastExecution?.status || null,
          lastExecutionId: lastExecution?.executionId || null,
        };
      })
    );

    res.status(200).json({
      jobs: jobsWithScheduling,
      pagination: {
        page,
        limit,
        total: totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
        hasNext: page < Math.ceil(totalJobs / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
