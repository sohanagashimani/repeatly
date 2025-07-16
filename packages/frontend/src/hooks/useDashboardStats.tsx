import { useState, useEffect } from "react";
import apiHelper from "../lib/apiHelper";

interface DashboardStats {
  activeJobs: number;
  totalExecutions: number;
  successRate: number;
  recentActivity: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}

export const useDashboardStats = (days: number = 30) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiHelper({
        slug: `jobs/dashboard/stats?days=${days}`,
        method: "GET",
      });

      setStats(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to fetch dashboard stats");
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
