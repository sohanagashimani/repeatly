import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Alert,
  Spin,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { ExecutionHistoryItem } from "../hooks/useJobExecutions";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const { Text } = Typography;

// Create Card component to avoid import issues
const Card: React.FC<{
  title?: string;
  size?: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    {title && (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

interface ExecutionDetailsModalProps {
  visible: boolean;
  execution: ExecutionHistoryItem | null;
  onClose: () => void;
}

export const ExecutionDetailsModal: React.FC<ExecutionDetailsModalProps> = ({
  visible,
  execution,
  onClose,
}) => {
  if (!execution) {
    return (
      <Modal
        title="Execution Details"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading execution details...</p>
        </div>
      </Modal>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "failed":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      case "running":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      default:
        return <PlayCircleOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "running":
        return "processing";
      default:
        return "default";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    return dayjs.duration(seconds, "seconds").humanize();
  };

  const renderResponseData = (response: any) => {
    if (!response) return null;

    return (
      <div className="space-y-4">
        {/* HTTP Response Info */}
        <div>
          <Text strong className="block mb-2">
            Response Information
          </Text>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text type="secondary">Status Code:</Text>
              <br />
              <Tag
                color={
                  response.statusCode >= 200 && response.statusCode < 300
                    ? "success"
                    : "error"
                }
              >
                {response.statusCode || "N/A"}
              </Tag>
            </Col>
            <Col span={8}>
              <Text type="secondary">Content Type:</Text>
              <br />
              <Text>{response.contentType || "N/A"}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Response Size:</Text>
              <br />
              <Text>
                {response.responseSize
                  ? `${response.responseSize} bytes`
                  : "N/A"}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Response Data */}
        {response.data && (
          <div>
            <Text strong className="block mb-2">
              Response Data
            </Text>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const isRunning = execution.status === "running";
  const currentDuration = isRunning
    ? dayjs().diff(dayjs(execution.startedAt), "second")
    : execution.duration;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {getStatusIcon(execution.status)}
          <span>Execution Details</span>
          <Tag color={getStatusColor(execution.status)}>
            {execution.status.charAt(0).toUpperCase() +
              execution.status.slice(1)}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="execution-details-modal"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Card title="Basic Information" size="small">
          <Descriptions column={2}>
            <Descriptions.Item label="Execution ID">
              <Text code>{execution.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={execution.type === "manual" ? "blue" : "default"}>
                {execution.type === "manual" ? "Manual" : "Scheduled"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Attempt">
              <Tag color={execution.attempt > 1 ? "orange" : "default"}>
                #{execution.attempt}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {isRunning ? (
                <div className="flex items-center gap-2">
                  <Spin size="small" />
                  <Text>{formatDuration(currentDuration)} (running)</Text>
                </div>
              ) : (
                formatDuration(execution.duration)
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Started At">
              <div>
                <div>
                  {dayjs(execution.startedAt).format("MMM D, YYYY h:mm:ss A")}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(execution.startedAt).fromNow()}
                </Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {execution.completedAt ? (
                <div>
                  <div>
                    {dayjs(execution.completedAt).format(
                      "MMM D, YYYY h:mm:ss A"
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(execution.completedAt).fromNow()}
                  </Text>
                </div>
              ) : (
                <Text type="secondary">
                  {isRunning ? "Still running..." : "N/A"}
                </Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Error Information */}
        {execution.error && (
          <Alert
            message="Execution Error"
            description={execution.error}
            type="error"
            showIcon
          />
        )}

        {/* Response Information */}
        {execution.response && (
          <Card title="Response Details" size="small">
            {renderResponseData(execution.response)}
          </Card>
        )}

        {/* Running Status */}
        {isRunning && (
          <Alert
            message="Execution in Progress"
            description="This execution is currently running. The details will update automatically when it completes."
            type="info"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
};
