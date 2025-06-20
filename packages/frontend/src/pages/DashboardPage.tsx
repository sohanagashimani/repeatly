import { Button, Avatar, Tabs } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ApiKeyManager from "../components/ApiKeyManager";
import { JobManager } from "../components/JobManager";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // eslint-disable-next-line no-useless-catch
    try {
      await logout();
      navigate("/");
    } catch (error) {
      throw error;
    }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Jobs
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                0
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                No jobs scheduled yet
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Total Executions
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                0
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                No executions yet
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Success Rate
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                -
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                No data available
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Getting Started
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-600 text-sm sm:text-base">
                Welcome to Repeatly! Here&apos;s how to get started:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm sm:text-base">
                <li>Create an API key in the &quot;API Keys&quot; tab</li>
                <li>Create your first cron job in the &quot;Jobs&quot; tab</li>
                <li>Monitor your job executions from the overview</li>
              </ol>
            </div>
          </div>
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
