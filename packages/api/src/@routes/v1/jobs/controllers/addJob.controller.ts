import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AddJobSchemaType } from "../schemas/addJobSchema.schema";

const prisma = new PrismaClient();

export const addJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, cron, url, method, headers, body } =
      req.body as AddJobSchemaType["body"];
    const userId = req.userId!;

    const job = await prisma.job.create({
      data: {
        name,
        cron,
        url,
        method,
        headers,
        body,
        userId,
        nextRun: new Date(), // TODO: Calculate next run based on cron expression
      },
    });

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};
