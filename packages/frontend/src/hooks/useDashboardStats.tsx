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

  const fetchStats = async () => {
    try {
      setLoading(true);

      const data = await apiHelper({
        slug: `jobs/dashboard/stats?days=${days}`,
        method: "GET",
      });

      setStats(data);
    } catch (err: unknown) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};
