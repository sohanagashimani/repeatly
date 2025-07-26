import { PrismaClient } from "@prisma/client";
import { createJobExecutionData } from "@repeatly/database";

export interface JobExecutionResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  duration?: number;
  responseSize?: number;
  contentType?: string;
  responseHeaders?: Record<string, string>;
}

export class JobExecutionService {
  constructor(private prisma: PrismaClient) {}

  async startExecution(
    jobId: string,
    scheduledJobId: string,
    scheduledJobHour: number,
    attempt: number = 1
  ): Promise<string> {
    const executionData = createJobExecutionData({
      jobId,
      scheduledJobId: scheduledJobId!,
      scheduledJobHour: scheduledJobHour!,
      status: "running",
      startedAt: new Date(),
      attempt,
    });

    const execution = await this.prisma.jobExecution.create({
      data: executionData,
    });

    return execution.id;
  }

  async completeExecution(
    executionId: string,
    result: JobExecutionResult
  ): Promise<void> {
    const responseMetadata = {
      statusCode: result.statusCode,
      success: result.success,
      duration: result.duration,
      responseSize: result.responseSize,
      contentType: result.contentType,
      data: result.response,
      timestamp: new Date().toISOString(),
    };

    await this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: "completed",
        completedAt: new Date(),
        response: responseMetadata,
      },
    });
  }

  async failExecution(
    executionId: string,
    error: string,
    result?: JobExecutionResult
  ): Promise<void> {
    const failureMetadata = {
      statusCode: result?.statusCode,
      success: false,
      duration: result?.duration,
      responseSize: result?.responseSize,
      contentType: result?.contentType,
      error: error,
      data: result?.response,
      timestamp: new Date().toISOString(),
    };

    await this.prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        completedAt: new Date(),
        error,
        response: failureMetadata,
      },
    });
  }

  async findRunningExecution(
    jobId: string,
    scheduledJobId: string,
    scheduledJobHour: number
  ): Promise<any | null> {
    return await this.prisma.jobExecution.findFirst({
      where: {
        jobId,
        scheduledJobId,
        scheduledJobHour,
        status: "running",
      },
    });
  }
}
