import { Job } from "bullmq";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { createWorker, QUEUE_NAMES, JobQueueData } from "./queue";
import { prisma } from "./prisma";
import {
  JobExecutionService,
  JobExecutionResult,
} from "./services/jobExecutionService";

export class JobWorker {
  private worker: any;
  private isShuttingDown = false;
  private jobExecutionService: JobExecutionService;

  constructor() {
    this.jobExecutionService = new JobExecutionService(prisma);

    this.worker = createWorker(QUEUE_NAMES.JOBS, this.processJob.bind(this), {
      concurrency: 5,
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
  }

  private async processJob(
    job: Job<JobQueueData>
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    const { scheduledJobId, scheduledJobHour, jobId, jobData } = job.data;
    console.log(
      `🔄 Processing job: ${jobId} (scheduled: ${scheduledJobId}) - ${jobData.name}`
    );

    // Start execution tracking
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
      // Execute the HTTP request using the job data snapshot
      const result = await this.executeHttpRequest(jobData);

      // Mark execution as completed
      await this.jobExecutionService.completeExecution(executionId, result);

      // Mark scheduled job as completed and schedule next run
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

      // Mark execution as failed
      await this.jobExecutionService.failExecution(
        executionId,
        errorMessage,
        result
      );

      // Mark scheduled job as failed
      await this.handleFailedExecution(job.data, errorMessage);

      throw error; // Re-throw to let BullMQ handle retries
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
        timeout: 30000, // 30 second timeout
        headers: jobData.headers || {},
        validateStatus: () => true, // Don't throw on HTTP error status
      };

      // Add body for POST, PUT, PATCH requests
      if (["POST", "PUT", "PATCH"].includes(jobData.method) && jobData.body) {
        config.data = jobData.body;
      }

      console.log(`🌐 Making ${jobData.method} request to: ${jobData.url}`);

      const response: AxiosResponse = await axios(config);
      const duration = Date.now() - startTime;

      // Calculate response size
      const responseSize = this.calculateResponseSize(response.data);

      // Extract content type
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
      // For objects, estimate size by JSON stringifying
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
        result[header] = String(headers[header]).substring(0, 200); // Limit header value length
      }
    }

    return result;
  }

  private async handleSuccessfulExecution(
    queueData: JobQueueData
  ): Promise<void> {
    try {
      await prisma.$transaction(async tx => {
        // 1. Mark scheduled job as completed (for both scheduled and manual executions)
        await tx.scheduledJob.updateMany({
          where: {
            id: queueData.scheduledJobId,
            scheduledHour: queueData.scheduledJobHour,
          },
          data: {
            status: "completed",
          },
        });

        // 2. Update job success count and reset retries
        await tx.job.update({
          where: { id: queueData.jobId },
          data: {
            successCount: { increment: 1 },
            retries: 0, // Reset retries on success
          },
        });
      });

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
        // 1. Mark scheduled job as failed (for both scheduled and manual executions)
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

        // 2. Update job retry count (only for scheduled executions, manual executions don't affect retry count)
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
      // Handle null/undefined
      if (data == null) {
        return null;
      }

      // Handle Buffer or binary data
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

      // Handle strings
      if (typeof data === "string") {
        // Check if it's likely binary data (contains non-printable characters)
        if (this.isBinaryString(data)) {
          return {
            _type: "binary_string",
            size: data.length,
            message: "Binary string data not stored",
          };
        }

        // Limit string response size to 2KB to prevent database bloat
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

      // Handle arrays
      if (Array.isArray(data)) {
        // Limit array size
        if (data.length > 100) {
          return {
            _type: "large_array",
            size: data.length,
            preview: data.slice(0, 10),
            message: `Array truncated (original size: ${data.length} items)`,
          };
        }

        // Recursively sanitize array items (limit depth)
        return data.slice(0, 50).map(item => this.sanitizeResponseBody(item));
      }

      // Handle objects
      if (typeof data === "object") {
        // Stringify to check total size first
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

        // For smaller objects, recursively sanitize values
        const sanitized: any = {};
        const keys = Object.keys(data).slice(0, 50); // Limit number of keys

        for (const key of keys) {
          // Skip potentially sensitive keys
          if (this.isSensitiveKey(key)) {
            sanitized[key] = "[REDACTED]";
            continue;
          }

          sanitized[key] = this.sanitizeResponseBody(data[key]);
        }

        // Add truncation notice if there were more keys
        if (Object.keys(data).length > 50) {
          sanitized._truncated = `${Object.keys(data).length - 50} keys omitted`;
        }

        return sanitized;
      }

      // For primitives (number, boolean, etc.)
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
    // Check for non-printable characters (except common whitespace)
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
