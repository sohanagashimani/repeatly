import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "antd";
import { useEffect } from "react";
import * as yup from "yup";
import { CreateJobData, Job } from "./useJobs";
import { isValidCron } from "cron-validator";

const hasMinimumInterval = (cronExpression: string): boolean => {
  if (!cronExpression) return false;

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, day, month, weekday] = parts;

  if (minute === "*") return false;

  if (minute.startsWith("*/")) {
    const step = parseInt(minute.substring(2));
    return step >= 5;
  }

  if (hour !== "*" || day !== "*" || month !== "*" || weekday !== "*") {
    return true;
  }

  if (minute.includes(",")) {
    const values = minute
      .split(",")
      .map(v => parseInt(v.trim()))
      .sort((a, b) => a - b);
    let minInterval = 60;

    for (let i = 1; i < values.length; i++) {
      const interval = values[i] - values[i - 1];
      minInterval = Math.min(minInterval, interval);
    }

    if (values.length > 1) {
      const wrapInterval = 60 - values[values.length - 1] + values[0];
      minInterval = Math.min(minInterval, wrapInterval);
    }

    return minInterval >= 5;
  }

  if (minute.includes("-")) {
    return hour !== "*" || day !== "*" || month !== "*" || weekday !== "*";
  }

  if (/^\d+$/.test(minute)) {
    return true;
  }

  return false;
};

interface JobFormData {
  name: string;
  cron: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: string;
  body?: string;
  timezone?: string;
  enabled?: boolean;
}

const jobSchema: yup.ObjectSchema<JobFormData> = yup.object({
  name: yup
    .string()
    .required("Job name is required")
    .min(1, "Job name cannot be empty")
    .max(100, "Job name must be 100 characters or less"),
  cron: yup
    .string()
    .required("Cron expression is required")
    .test("is-valid-cron", "Invalid cron expression", value => {
      if (!value) return false;
      return isValidCron(value);
    })
    .test("min-interval", "Minimum interval is 5 minutes", value => {
      if (!value) return false;
      return hasMinimumInterval(value);
    }),
  url: yup.string().required("URL is required").url("Must be a valid URL"),
  method: yup
    .string()
    .required("HTTP method is required")
    .oneOf(
      ["GET", "POST", "PUT", "PATCH", "DELETE"],
      "Invalid HTTP method"
    ) as yup.StringSchema<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">,
  headers: yup
    .string()
    .optional()
    .test("valid-json", "Headers must be valid JSON", value => {
      if (!value || !value.trim()) return true;
      try {
        const parsed = JSON.parse(value);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }),
  body: yup
    .string()
    .optional()
    .test("valid-json", "Body must be valid JSON", value => {
      if (!value || !value.trim()) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }),
  timezone: yup.string().optional(),
  enabled: yup.boolean().optional(),
});

export const useJobForm = (
  job?: Job | null,
  onSubmit?: (data: CreateJobData) => Promise<boolean>
) => {
  const getDefaultValues = (jobData?: Job | null): JobFormData => ({
    name: jobData?.name || "",
    cron: jobData?.cron || "",
    url: jobData?.url || "",
    method: jobData?.method || "GET",
    headers: jobData?.headers ? JSON.stringify(jobData.headers, null, 2) : "",
    body: jobData?.body ? JSON.stringify(jobData.body, null, 2) : "",
    timezone: jobData?.timezone || "UTC",
    enabled: jobData?.enabled !== undefined ? jobData.enabled : true,
  });

  const form = useForm<JobFormData>({
    resolver: yupResolver(jobSchema),
    mode: "onChange",
    defaultValues: getDefaultValues(job),
  });

  useEffect(() => {
    const defaultValues = getDefaultValues(job);
    form.reset(defaultValues);
  }, [job, form]);

  const parseFormData = (formData: JobFormData): CreateJobData => {
    let parsedHeaders: Record<string, string> | undefined = undefined;
    let parsedBody = undefined;

    try {
      if (formData.headers && formData.headers.trim()) {
        parsedHeaders = JSON.parse(formData.headers.trim());
      }

      if (formData.body && formData.body.trim()) {
        parsedBody = JSON.parse(formData.body.trim());
      }
    } catch (error) {
      Modal.error({
        title: "Invalid JSON",
        content: "Please check your headers and body JSON format.",
      });
      throw error;
    }

    return {
      name: formData.name,
      cron: formData.cron,
      url: formData.url,
      method: formData.method,
      headers: parsedHeaders,
      body: parsedBody,
      timezone: formData.timezone,
      enabled: formData.enabled,
    };
  };

  const handleSubmit = async (formData: JobFormData) => {
    if (!onSubmit) return;

    try {
      const jobData = parseFormData(formData);
      await onSubmit(jobData);
    } catch (error) {
      // Error already handled in parseFormData
      throw error;
    }
  };

  const getErrorCount = () => {
    return Object.keys(form.formState.errors).length;
  };

  const resetForm = () => {
    form.reset();
  };

  return {
    ...form,
    handleSubmit: form.handleSubmit(handleSubmit),
    getErrorCount,
    resetForm,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  };
};

export type { JobFormData };
