import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "antd";
import * as yup from "yup";
import { isValidCron } from "cron-validator";
import { CreateJobData, Job } from "./useJobs";

// Form data interface (what the form handles)
interface JobFormData {
  name: string;
  cron: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: string; // JSON string input by user
  body?: string; // JSON string input by user
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
      if (!value || !value.trim()) return true; // Empty is valid
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
      if (!value || !value.trim()) return true; // Empty is valid
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }),
});

export const useJobForm = (
  job?: Job | null,
  onSubmit?: (data: CreateJobData) => Promise<boolean>
) => {
  const form = useForm<JobFormData>({
    resolver: yupResolver(jobSchema),
    mode: "onChange",
    defaultValues: {
      name: job?.name || "",
      cron: job?.cron || "",
      url: job?.url || "",
      method: job?.method || "GET",
      headers: job?.headers ? JSON.stringify(job.headers, null, 2) : "",
      body: job?.body ? JSON.stringify(job.body, null, 2) : "",
    },
  });

  const parseFormData = (formData: JobFormData): CreateJobData => {
    let parsedHeaders: Record<string, string> | undefined = undefined;
    let parsedBody = undefined;

    try {
      // Handle headers - only parse if it's a non-empty string
      if (formData.headers && formData.headers.trim()) {
        parsedHeaders = JSON.parse(formData.headers.trim());
      }

      // Handle body - only parse if it's a non-empty string
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
    };
  };

  const handleSubmit = async (formData: JobFormData) => {
    if (!onSubmit) return;

    try {
      const jobData = parseFormData(formData);
      await onSubmit(jobData);
    } catch (error) {
      // Error already handled in parseFormData
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
