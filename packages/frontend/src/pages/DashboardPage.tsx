import { Button, Avatar, Tabs, Spin, Alert } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import ApiKeyManager from "../components/ApiKeyManager";
import { JobManager } from "../components/JobManager";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { stats, loading, error } = useDashboardStats();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      throw error;
    }
  };

  const renderOverviewStats = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      );
    }

    if (!stats) {
      return (
        <Alert
          message="No data available"
          description="Unable to load dashboard statistics"
          type="info"
          showIcon
          className="mb-4"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Active Jobs
          </h3>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {stats.activeJobs}
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {stats.activeJobs === 0
              ? "No active jobs"
              : `${stats.activeJobs} enabled job${stats.activeJobs > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Executions
          </h3>
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            {stats.totalExecutions.toLocaleString()}
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {stats.totalExecutions === 0
              ? "No executions yet"
              : "All-time executions"}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Success Rate
          </h3>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">
            {stats.successRate}%
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {stats.totalExecutions === 0
              ? "No data available"
              : "Overall success rate"}
          </p>
        </div>
      </div>
    );
  };

  const items = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div className="space-y-4 sm:space-y-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Welcome to Repeatly
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Your self-hosted cron-as-a-service platform
            </p>
          </div>

          {renderOverviewStats()}
        </div>
      ),
    },
    {
      key: "jobs",
      label: (
        <span>
          <ClockCircleOutlined className="mr-2" />
          Jobs
        </span>
      ),
      children: <JobManager />,
    },
    {
      key: "api-keys",
      label: (
        <span>
          <KeyOutlined className="mr-2" />
          API Keys
        </span>
      ),
      children: <ApiKeyManager />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Repeatly Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <Avatar icon={<UserOutlined />} />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                type="text"
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto py-4 sm:py-6 px-2 sm:px-3 lg:px-4">
        <Tabs
          items={items}
          defaultActiveKey="overview"
          size="large"
          className="bg-white rounded-lg shadow p-2 sm:p-4"
        />
      </main>
    </div>
  );
}
