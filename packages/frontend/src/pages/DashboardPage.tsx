import { Button, Avatar, Tabs } from "antd";
import { UserOutlined, LogoutOutlined, KeyOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ApiKeyManager from "../components/ApiKeyManager";

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
        <div className="space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Repeatly
            </h2>
            <p className="text-gray-600">
              Your self-hosted cron-as-a-service platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Jobs
              </h3>
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-gray-600">No jobs scheduled yet</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Total Executions
              </h3>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-gray-600">No executions yet</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Success Rate
              </h3>
              <div className="text-3xl font-bold text-purple-600">-</div>
              <p className="text-gray-600">No data available</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                Job management features coming soon. For now, you can:
              </p>
              <div className="flex space-x-4">
                <Button type="primary" disabled>
                  Create New Job
                </Button>
                <Button disabled>View Job History</Button>
                <Button disabled>API Documentation</Button>
              </div>
            </div>
          </div>
        </div>
      ),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Repeatly Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar icon={<UserOutlined />} />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                type="text"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs
          items={items}
          defaultActiveKey="overview"
          size="large"
          className="bg-white rounded-lg shadow p-6"
        />
      </main>
    </div>
  );
}
