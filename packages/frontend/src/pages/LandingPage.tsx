import { Button } from "antd";
import { ArrowRightOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

export function LandingPage() {
  useAuthRedirect();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <ClockCircleOutlined className="text-xl text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Repeatly</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/auth">
                <Button type="text" className="text-gray-600">
                  Sign in
                </Button>
              </Link>
              <Link to="/auth">
                <Button type="primary" size="middle">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-medium text-gray-900 mb-6 leading-tight">
            Cron jobs for developers
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Schedule HTTP requests with cron expressions. Self-hosted and
            simple.
          </p>
          <Link to="/auth">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              className="px-6"
            >
              Start building
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Simple API
              </h3>
              <p className="text-gray-600 text-sm">
                Create jobs with a single HTTP request
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reliable
              </h3>
              <p className="text-gray-600 text-sm">
                Built-in retries and error handling
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Self-hosted
              </h3>
              <p className="text-gray-600 text-sm">
                Deploy on your own infrastructure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Repeatly
          </p>
        </div>
      </footer>
    </div>
  );
}
