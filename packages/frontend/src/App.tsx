import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import "./index.css";

// Component that shows landing or dashboard based on auth status
function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return user ? (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ) : (
    <LandingPage />
  );
}

function App() {
  return (
    <div>
      <ConfigProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/jobs/:jobId"
                element={
                  <ProtectedRoute>
                    <JobDetailsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </div>
  );
}

export default App;
