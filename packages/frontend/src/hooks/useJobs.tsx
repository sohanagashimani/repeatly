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
  nextRun: string;
  retries: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobData {
  name: string;
  cron: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
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

    try {
      await apiHelper({
        slug: `jobs/deleteJob/${jobId}`,
        method: "DELETE",
      });
      message.success("Job deleted successfully!");
      // If deleting the last item on a page > 1, go to previous page
      const newPage =
        jobs.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      fetchJobs(newPage, pagination.limit);
      return true;
    } catch (error: any) {
      message.error(error.message || "Failed to delete job");
      return false;
    }
  };

  const changePage = (page: number, pageSize?: number) => {
    const newLimit = pageSize || pagination.limit;
    fetchJobs(page, newLimit);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    jobs,
    pagination,
    loading,
    creatingJob,
    updatingJobId,
    createJob,
    updateJob,
    deleteJob,
    fetchJobs,
    changePage,
    refetch: () => fetchJobs(pagination.page, pagination.limit),
  };
};
