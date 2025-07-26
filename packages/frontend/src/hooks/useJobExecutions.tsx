import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { useAuth } from "./useAuth";
import apiHelper from "../lib/apiHelper";

export interface ExecutionHistoryItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  attempt: number;
  response: any;
  error: string | null;
  scheduledJobId: string;
  scheduledJobHour: number;
  type: string; // 'scheduled' | 'manual'
}

export interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  averageDuration: number | null;
  lastExecution: string | null;
}

export interface ExecutionFilters {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  attempt?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const useJobExecutions = (jobId: string) => {
  const [executions, setExecutions] = useState<ExecutionHistoryItem[]>([]);
  const [runningExecutions, setRunningExecutions] = useState<
    ExecutionHistoryItem[]
  >([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filters, setFilters] = useState<ExecutionFilters>({});
  const { user } = useAuth();

  /**
   * Fetch execution history with pagination and filters
   */
  const fetchExecutions = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      currentFilters: ExecutionFilters = {}
    ) => {
      if (!user || !jobId) return;

      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...Object.fromEntries(
            Object.entries(currentFilters).filter(
              ([, value]) => value !== undefined && value !== ""
            )
          ),
        });

        const data = await apiHelper({
          slug: `jobs/${jobId}/executions?${queryParams.toString()}`,
          method: "GET",
        });

        setExecutions(data.executions || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (error: any) {
        message.error(error.message || "Failed to fetch execution history");
      } finally {
        setLoading(false);
      }
    },
    [user, jobId]
  );

  /**
   * Fetch execution statistics
   */
  const fetchStats = useCallback(
    async (days: number = 30) => {
      if (!user || !jobId) return;

      setStatsLoading(true);
      try {
        const data = await apiHelper({
          slug: `jobs/${jobId}/executions/stats?days=${days}`,
          method: "GET",
        });

        setStats(data);
      } catch (error: any) {
        message.error(error.message || "Failed to fetch execution statistics");
      } finally {
        setStatsLoading(false);
      }
    },
    [user, jobId]
  );

  /**
   * Fetch running executions for real-time updates
   */
  const fetchRunningExecutions = useCallback(async () => {
    if (!user || !jobId) return;

    try {
      const data = await apiHelper({
        slug: `jobs/${jobId}/executions/running`,
        method: "GET",
      });

      setRunningExecutions(data || []);
    } catch (error: any) {
      // Silently fail for running executions to avoid spam
      // console.error("Failed to fetch running executions:", error);
    }
  }, [user, jobId]);

  /**
   * Get detailed execution information
   */
  const getExecutionDetails = useCallback(
    async (executionId: string): Promise<ExecutionHistoryItem | null> => {
      if (!user || !jobId) return null;

      try {
        const data = await apiHelper({
          slug: `jobs/${jobId}/executions/${executionId}`,
          method: "GET",
        });

        return data;
      } catch (error: any) {
        message.error(error.message || "Failed to fetch execution details");
        return null;
      }
    },
    [user, jobId]
  );

  /**
   * Apply filters and refetch data
   */
  const applyFilters = useCallback(
    (newFilters: ExecutionFilters) => {
      setFilters(newFilters);
      fetchExecutions(1, pagination.limit, newFilters);
    },
    [fetchExecutions, pagination.limit]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchExecutions(1, pagination.limit, {});
  }, [fetchExecutions, pagination.limit]);

  /**
   * Change page
   */
  const changePage = useCallback(
    (page: number, pageSize?: number) => {
      const newLimit = pageSize || pagination.limit;
      fetchExecutions(page, newLimit, filters);
    },
    [fetchExecutions, pagination.limit, filters]
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    fetchExecutions(pagination.page, pagination.limit, filters);
    fetchStats();
    fetchRunningExecutions();
  }, [
    fetchExecutions,
    fetchStats,
    fetchRunningExecutions,
    pagination.page,
    pagination.limit,
    filters,
  ]);

  /**
   * Export executions data
   */
  const exportExecutions = useCallback(
    async (format: "json" | "csv" = "json") => {
      if (!user || !jobId) return;

      try {
        // Fetch all executions for export (without pagination)
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "10000", // Large number to get all
          ...Object.fromEntries(
            Object.entries(filters).filter(
              ([_, value]) => value !== undefined && value !== ""
            )
          ),
        });

        const data = await apiHelper({
          slug: `jobs/${jobId}/executions?${queryParams.toString()}`,
          method: "GET",
        });

        const executions = data.executions || [];

        if (format === "json") {
          const dataStr = JSON.stringify(executions, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `job-executions-${jobId}-${new Date().toISOString().split("T")[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === "csv") {
          const headers = [
            "ID",
            "Status",
            "Type",
            "Started At",
            "Completed At",
            "Duration (s)",
            "Attempt",
            "Error",
          ];
          const csvData = [
            headers.join(","),
            ...executions.map((exec: ExecutionHistoryItem) =>
              [
                exec.id,
                exec.status,
                exec.type,
                exec.startedAt,
                exec.completedAt || "",
                exec.duration || "",
                exec.attempt,
                exec.error || "",
              ]
                .map(field => `"${String(field).replace(/"/g, '""')}"`)
                .join(",")
            ),
          ].join("\n");

          const dataBlob = new Blob([csvData], { type: "text/csv" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `job-executions-${jobId}-${new Date().toISOString().split("T")[0]}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }

        message.success(
          `Execution history exported as ${format.toUpperCase()}`
        );
      } catch (error: any) {
        message.error(error.message || "Failed to export execution history");
      }
    },
    [user, jobId, filters]
  );

  // Initial data fetch
  useEffect(() => {
    if (jobId) {
      fetchExecutions();
      fetchStats();
      fetchRunningExecutions();
    }
  }, [jobId, fetchExecutions, fetchStats, fetchRunningExecutions]);

  // Polling for running executions (every 10 seconds)

  return {
    executions,
    runningExecutions,
    stats,
    pagination,
    loading,
    statsLoading,
    filters,
    fetchExecutions,
    fetchStats,
    fetchRunningExecutions,
    getExecutionDetails,
    applyFilters,
    clearFilters,
    changePage,
    refresh,
    exportExecutions,
  };
};
