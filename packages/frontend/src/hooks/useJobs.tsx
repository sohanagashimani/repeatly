import { useState, useEffect } from "react";
import { message } from "antd";
import { useAuth } from "./useAuth";
import apiHelper from "../lib/apiHelper";

export interface Job {
  id: string;
  name: string;
  cron: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  nextRun: string | null;
  lastRun?: string | null;
  retries: number;
  successCount: number;
  enabled: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  // New fields from partitioned system
  nextScheduledJobId?: string | null;
  lastExecutionStatus?: string | null;
  lastExecutionId?: string | null;
}

export interface CreateJobData {
  name: string;
  cron: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  enabled?: boolean;
  timezone?: string;
}

export interface UpdateJobData extends CreateJobData {
  id: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchJobs = async (page: number = 1, limit: number = 10) => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await apiHelper({
        slug: `jobs/getJobs?page=${page}&limit=${limit}`,
        method: "GET",
      });

      // Handle paginated response
      if (data && data.jobs && data.pagination) {
        setJobs(data.jobs);
        setPagination(data.pagination);
      } else {
        // Fallback for non-paginated response
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error(error.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: CreateJobData): Promise<boolean> => {
    if (!user) return false;

    setCreatingJob(true);
    try {
      await apiHelper({
        slug: "jobs/addJob",
        method: "POST",
        data: jobData,
      });
      message.success("Job created successfully!");
      fetchJobs(pagination.page, pagination.limit);
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to create job");
      return false;
    } finally {
      setCreatingJob(false);
    }
  };

  const updateJob = async (
    jobId: string,
    jobData: CreateJobData
  ): Promise<boolean> => {
    if (!user) return false;

    setUpdatingJobId(jobId);
    try {
      await apiHelper({
        slug: `jobs/updateJob/${jobId}`,
        method: "PUT",
        data: jobData,
      });
      message.success("Job updated successfully!");
      fetchJobs(pagination.page, pagination.limit);
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to update job");
      return false;
    } finally {
      setUpdatingJobId(null);
    }
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    if (!user) return false;

    setDeletingJobId(jobId);
    try {
      await apiHelper({
        slug: `jobs/deleteJob/${jobId}`,
        method: "DELETE",
      });

      message.success("Job deleted successfully!");
      await fetchJobs(); // Refresh the list
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to delete job");
      return false;
    } finally {
      setDeletingJobId(null);
    }
  };

  const triggerJob = async (jobId: string): Promise<boolean> => {
    setTriggeringJobId(jobId);
    try {
      const response = await apiHelper({
        slug: `jobs/triggerJob/${jobId}`,
        method: "POST",
        data: { type: "manual" }, // Request immediate execution
      });

      if (response.execution === "immediate") {
        message.success(
          `🚀 Job "${response.job.name}" triggered immediately and queued for execution!`
        );
      } else {
        message.success(
          `📅 Job "${response.job.name}" scheduled for execution!`
        );
      }

      // Refresh jobs list to show updated status
      await fetchJobs();
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to trigger job");
      return false;
    } finally {
      setTriggeringJobId(null);
    }
  };

  const toggleJobStatus = async (
    jobId: string,
    enabled: boolean
  ): Promise<boolean> => {
    if (!user) return false;

    setUpdatingJobId(jobId);
    try {
      await apiHelper({
        slug: `jobs/updateJob/${jobId}`,
        method: "PATCH",
        data: { enabled },
      });
      message.success(`Job ${enabled ? "enabled" : "disabled"} successfully!`);
      fetchJobs(pagination.page, pagination.limit);
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to update job status");
      return false;
    } finally {
      setUpdatingJobId(null);
    }
  };

  const changePage = (page: number, pageSize?: number) => {
    const newLimit = pageSize || pagination.limit;
    fetchJobs(page, newLimit);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    jobs,
    pagination,
    loading,
    creatingJob,
    updatingJobId,
    triggeringJobId,
    deletingJobId,
    createJob,
    updateJob,
    deleteJob,
    triggerJob,
    toggleJobStatus,
    fetchJobs,
    changePage,
    refetch: () => fetchJobs(),
  };
};
