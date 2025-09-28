import { Job } from "bullmq";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { prisma } from "@repeatly/database";
import {
  JobExecutionService,
  JobExecutionResult,
} from "./services/jobExecutionService";
import { getNextRunTime } from "./cron";
import {
  createWorker,
  getPartitionHour,
  JobQueueData,
  QUEUE_NAMES,
} from "@repeatly/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export class JobWorker {
  private worker: any;
  private isShuttingDown = false;
  private jobExecutionService: JobExecutionService;
  constructor() {
    this.jobExecutionService = new JobExecutionService(prisma);

    this.worker = createWorker(QUEUE_NAMES.JOBS, this.processJob.bind(this), {
      concurrency: 1,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on("completed", (job: Job) => {
      console.log(
        `✅ Job ${job.data.jobId} (scheduled: ${job.data.scheduledJobId}) completed successfully`
      );
    });

    this.worker.on("failed", (job: Job, err: Error) => {
      console.error(
        `❌ Job ${job?.data?.jobId} (scheduled: ${job?.data?.scheduledJobId}) failed:`,
        err.message
      );
    });

    this.worker.on("error", (err: Error) => {
      console.error("💥 Worker error:", err);
    });

    this.worker.on("stalled", (jobId: string) => {
      console.warn(`⚠️  Job ${jobId} stalled`);
    });

    this.worker.on("waiting", (jobId: string) => {
      console.log(`⏳ Job ${jobId} waiting to be processed`);
    });

    this.worker.on("active", (job: Job) => {
      console.log(`🚀 Job ${job.data.jobId} started processing`);
    });
  }

  private async processJob(
    job: Job<JobQueueData>
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    const { scheduledJobId, scheduledJobHour, jobId, jobData } = job.data;

    const jobKey = `${jobId}-${scheduledJobId}-${scheduledJobHour}`;
    console.log(
      `🔄 Processing job: ${jobId} (scheduled: ${scheduledJobId}) - ${jobData.name} [${jobKey}]`
    );

    try {
      const existingExecution =
        await this.jobExecutionService.findRunningExecution(
          jobId,
          scheduledJobId,
          scheduledJobHour
        );

      if (existingExecution) {
        console.log(`⚠️  Job ${jobKey} is already running, skipping...`);
        return {
          success: false,
          error: "Job already running",
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error("Error checking for existing execution:", error);
    }

    let executionId: string;
    try {
      executionId = await this.jobExecutionService.startExecution(
        jobId,
        scheduledJobId,
        scheduledJobHour,
        job.data.attempt
      );
    } catch (error) {
      console.error("Failed to start execution tracking:", error);
      throw error;
    }

    try {
      const result = await this.executeHttpRequest(jobData);

      await this.jobExecutionService.completeExecution(executionId, result);

      await this.handleSuccessfulExecution(job.data);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const result: JobExecutionResult = {
        success: false,
        error: errorMessage,
        duration,
      };

      await this.jobExecutionService.failExecution(
        executionId,
        errorMessage,
        result
      );

      await this.handleFailedExecution(job.data, errorMessage);

      throw error;
    }
  }

  private async executeHttpRequest(
    jobData: JobQueueData["jobData"]
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();

    try {
      const config: AxiosRequestConfig = {
        method: jobData.method.toLowerCase() as any,
        url: jobData.url,
        timeout: 15000,
        headers: jobData.headers || {},
        validateStatus: () => true,
      };

      if (["POST", "PUT", "PATCH"].includes(jobData.method) && jobData.body) {
        config.data = jobData.body;
      }

      console.log(`🌐 Making ${jobData.method} request to: ${jobData.url}`);

      const response: AxiosResponse = await axios(config);
      const duration = Date.now() - startTime;

      const responseSize = this.calculateResponseSize(response.data);

      const contentType = response.headers["content-type"] || "unknown";

      const result: JobExecutionResult = {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        response: this.sanitizeResponseBody(response.data),
        duration,
        responseSize,
        contentType,
        responseHeaders: this.extractImportantHeaders(response.headers),
      };

      if (result.success) {
        console.log(
          `✅ HTTP ${jobData.method} ${jobData.url} → ${response.status} (${duration}ms, ${responseSize} bytes)`
        );
      } else {
        console.log(
          `⚠️  HTTP ${jobData.method} ${jobData.url} → ${response.status} (${duration}ms, ${responseSize} bytes)`
        );
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        console.error(
          `❌ HTTP ${jobData.method} ${jobData.url} → ${error.code || "ERROR"} (${duration}ms)`
        );

        const responseSize = error.response?.data
          ? this.calculateResponseSize(error.response.data)
          : 0;
        const contentType =
          error.response?.headers?.["content-type"] || "unknown";

        return {
          success: false,
          statusCode: error.response?.status,
          error: error.message,
          response: error.response?.data
            ? this.sanitizeResponseBody(error.response.data)
            : undefined,
          duration,
          responseSize,
          contentType,
          responseHeaders: error.response?.headers
            ? this.extractImportantHeaders(error.response.headers)
            : undefined,
        };
      }

      throw error;
    }
  }

  private calculateResponseSize(data: any): number {
    try {
      if (data == null) return 0;
      if (typeof data === "string") return data.length;
      if (Buffer.isBuffer(data)) return data.length;
      if (data instanceof ArrayBuffer) return data.byteLength;

      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private extractImportantHeaders(headers: any): Record<string, string> {
    const importantHeaders = [
      "content-type",
      "content-length",
      "content-encoding",
      "cache-control",
      "etag",
      "last-modified",
      "location",
      "server",
      "x-powered-by",
      "x-ratelimit-remaining",
    ];

    const result: Record<string, string> = {};

    for (const header of importantHeaders) {
      if (headers[header]) {
        result[header] = String(headers[header]).substring(0, 200);
      }
    }

    return result;
  }

  private async handleSuccessfulExecution(
    queueData: JobQueueData
  ): Promise<void> {
    try {
      await prisma.$transaction(
        async tx => {
          await tx.scheduledJob.updateMany({
            where: {
              id: queueData.scheduledJobId,
              scheduledHour: queueData.scheduledJobHour,
            },
            data: {
              status: "completed",
            },
          });

          await tx.job.update({
            where: { id: queueData.jobId },
            data: {
              successCount: { increment: 1 },
              retries: 0,
            },
          });

          if (!queueData.isManual && queueData.type === "scheduled") {
            const job = await tx.job.findUnique({
              where: { id: queueData.jobId },
              select: { enabled: true },
            });
            if (!job?.enabled) {
              console.log(
                `❌ Job ${queueData.jobId} is disabled, skipping scheduling`
              );

              return;
            }

            const baseTime = queueData.scheduledAt ?? new Date();
            const nextRun = getNextRunTime(
              queueData.jobData.cron,
              queueData.jobData.timezone,
              baseTime
            );

            const exists = await tx.scheduledJob.findFirst({
              where: {
                jobId: queueData.jobId,
                scheduledAt: nextRun,
                scheduledHour: getPartitionHour(nextRun),
              },
            });

            if (!exists) {
              console.log(
                "Scheduling next run for jobId:",
                queueData.jobId,
                "nextRun:",
                dayjs(nextRun).utc().format("YYYY-MM-DD HH:mm:ss")
              );
              await tx.scheduledJob.create({
                data: {
                  jobId: queueData.jobId,
                  scheduledAt: nextRun,
                  scheduledHour: getPartitionHour(nextRun),
                  jobData: queueData.jobData,
                  status: "pending",
                  type: "scheduled",
                },
              });
            }
          }
        },
        {
          timeout: 50000,
        }
      );

      const executionType = queueData.isManual ? "manual" : "scheduled";
      console.log(
        `✅ ${executionType} execution for job ${queueData.jobId} completed successfully`
      );
    } catch (error) {
      console.error(
        `Failed to handle successful execution for job ${queueData.jobId}:`,
        error
      );
    }
  }

  private async handleFailedExecution(
    queueData: JobQueueData,
    errorMessage: string
  ): Promise<void> {
    try {
      await prisma.$transaction(async tx => {
        await tx.scheduledJob.updateMany({
          where: {
            id: queueData.scheduledJobId,
            scheduledHour: queueData.scheduledJobHour,
          },
          data: {
            status: "failed",
            jobData: {
              ...queueData.jobData,
              lastError: errorMessage,
              failedAt: new Date().toISOString(),
            },
          },
        });

        if (!queueData.isManual) {
          await tx.job.update({
            where: { id: queueData.jobId },
            data: {
              retries: { increment: 1 },
            },
          });
        }
      });

      const executionType = queueData.isManual ? "manual" : "scheduled";
      console.log(
        `❌ ${executionType} execution for job ${queueData.jobId} marked as failed`
      );
    } catch (error) {
      console.error(
        `Failed to handle failed execution for job ${queueData.jobId}:`,
        error
      );
    }
  }

  private sanitizeResponseBody(data: any): any {
    try {
      if (data == null) {
        return null;
      }

      if (Buffer.isBuffer(data)) {
        return {
          _type: "binary",
          size: data.length,
          message: "Binary data not stored",
        };
      }

      if (data instanceof ArrayBuffer) {
        return {
          _type: "binary",
          size: data.byteLength,
          message: "Binary data not stored",
        };
      }

      if (typeof data === "string") {
        if (this.isBinaryString(data)) {
          return {
            _type: "binary_string",
            size: data.length,
            message: "Binary string data not stored",
          };
        }

        if (data.length > 2000) {
          return {
            _type: "truncated_string",
            size: data.length,
            preview: data.substring(0, 500) + "...[truncated]",
            message: `String truncated (original size: ${data.length} chars)`,
          };
        }

        return data;
      }

      if (Array.isArray(data)) {
        if (data.length > 100) {
          return {
            _type: "large_array",
            size: data.length,
            preview: data.slice(0, 10),
            message: `Array truncated (original size: ${data.length} items)`,
          };
        }

        return data.slice(0, 50).map(item => this.sanitizeResponseBody(item));
      }

      if (typeof data === "object") {
        const str = JSON.stringify(data);
        if (str.length > 5000) {
          return {
            _type: "large_object",
            size: str.length,
            keys: Object.keys(data).slice(0, 10),
            message: `Object too large to store (${str.length} chars)`,
            preview: this.getObjectPreview(data),
          };
        }

        const sanitized: any = {};
        const keys = Object.keys(data).slice(0, 50);

        for (const key of keys) {
          if (this.isSensitiveKey(key)) {
            sanitized[key] = "[REDACTED]";
            continue;
          }

          sanitized[key] = this.sanitizeResponseBody(data[key]);
        }

        if (Object.keys(data).length > 50) {
          sanitized._truncated = `${Object.keys(data).length - 50} keys omitted`;
        }

        return sanitized;
      }

      return data;
    } catch (error) {
      return {
        _type: "serialization_error",
        message: "Unable to serialize response",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private isBinaryString(str: string): boolean {
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      const code = str.charCodeAt(i);
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        return true;
      }
      if (code > 126) {
        return true;
      }
    }
    return false;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "api_key",
      "apikey",
      "access_token",
      "refresh_token",
      "jwt",
      "authorization",
      "cookie",
      "session",
      "private",
      "confidential",
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }

  private getObjectPreview(obj: any): any {
    try {
      const preview: any = {};
      const keys = Object.keys(obj).slice(0, 5);

      for (const key of keys) {
        const value = obj[key];
        if (typeof value === "string") {
          preview[key] =
            value.length > 100 ? value.substring(0, 100) + "..." : value;
        } else if (typeof value === "object" && value !== null) {
          preview[key] = Array.isArray(value)
            ? `[Array with ${value.length} items]`
            : `[Object with ${Object.keys(value).length} keys]`;
        } else {
          preview[key] = value;
        }
      }

      return preview;
    } catch {
      return { message: "Unable to create preview" };
    }
  }

  async start(): Promise<void> {
    console.log("🏃‍♂️ Partitioned Worker started, waiting for jobs...");
  }

  async stop(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log("🛑 Shutting down Partitioned Worker...");

    try {
      await this.worker.close();
      console.log("✅ Partitioned Worker stopped gracefully");
    } catch (error) {
      console.error("Error during worker shutdown:", error);
    }
  }
}
