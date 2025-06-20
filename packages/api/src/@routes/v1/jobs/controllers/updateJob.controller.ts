import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import type { UpdateJobSchemaType } from "../schemas/updateJobSchema.schema";

const prisma = new PrismaClient();

export const updateJob = async (
  req: Request<any, any, UpdateJobSchemaType["body"]>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, cron, url, method, headers, body } = req.body;
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

    const job = await prisma.job.update({
      where: { id },
      data: {
        name,
        cron,
        url,
        method,
        headers,
        body,
      },
    });

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};
