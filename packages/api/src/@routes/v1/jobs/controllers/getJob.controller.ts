import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};
