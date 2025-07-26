import { useEffect, useState } from "react";
import { Badge, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

type HealthStatus = "healthy" | "unhealthy" | "checking" | "unknown";

interface HealthResponse {
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected";
  uptime: number;
}

export function HealthIndicator() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      setHealthStatus("checking");

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data: HealthResponse = await response.json();

      setHealthStatus(data.status === "healthy" ? "healthy" : "unhealthy");
      setLastCheck(new Date());
    } catch (error) {
      setHealthStatus("unhealthy");
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = () => {
    switch (healthStatus) {
      case "healthy":
        return "success";
      case "unhealthy":
        return "error";
      case "checking":
        return "processing";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (healthStatus) {
      case "healthy":
        return <CheckCircleOutlined />;
      case "unhealthy":
        return <CloseCircleOutlined />;
      case "checking":
        return <LoadingOutlined />;
      default:
        return <CloseCircleOutlined />;
    }
  };

  const getTooltipText = () => {
    const statusText =
      healthStatus === "healthy"
        ? "Backend is healthy"
        : healthStatus === "unhealthy"
          ? "Backend is unhealthy"
          : "Checking backend health...";

    const lastCheckText = lastCheck
      ? `Last checked: ${lastCheck.toLocaleTimeString()}`
      : "Never checked";

    return `${statusText}\n${lastCheckText}`;
  };

  return (
    <Tooltip title={getTooltipText()} placement="bottom">
      <Badge
        status={getStatusColor() as any}
        icon={getStatusIcon()}
        className="cursor-pointer"
        onClick={checkHealth}
      />
    </Tooltip>
  );
}
