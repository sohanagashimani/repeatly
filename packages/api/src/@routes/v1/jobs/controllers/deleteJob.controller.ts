import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

    await prisma.job.delete({
      where: { id },
    });

    res.status(204).json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};
