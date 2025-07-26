import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Input,
  Tooltip,
  Drawer,
  Spin,
  Empty,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  ExportOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  useJobExecutions,
  ExecutionHistoryItem,
  type ExecutionFilters,
} from "../hooks/useJobExecutions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Create Card component to avoid import issues
const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    {title && (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// Enhanced ExecutionDetailsModal with comprehensive data display
const ExecutionDetailsModal: React.FC<{
  visible: boolean;
  execution: ExecutionHistoryItem | null;
  onClose: () => void;
}> = ({ visible, execution, onClose }) => {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span>Execution Details</span>
          {execution && (
            <Tag
              color={getStatusColor(execution.status)}
              icon={getStatusIcon(execution.status)}
            >
              {execution.status.charAt(0).toUpperCase() +
                execution.status.slice(1)}
            </Tag>
          )}
        </div>
      }
      open={visible}
      onClose={onClose}
      width="60%"
      placement="right"
    >
      {execution && (
        <div className="space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <div>
                  <Text type="secondary" className="block text-sm">
                    Status
                  </Text>
                  <Tag
                    color={getStatusColor(execution.status)}
                    icon={getStatusIcon(execution.status)}
                  >
                    {execution.status.charAt(0).toUpperCase() +
                      execution.status.slice(1)}
                  </Tag>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div>
                  <Text type="secondary" className="block text-sm">
                    Type
                  </Text>
                  <Tag color={execution.type === "manual" ? "blue" : "default"}>
                    {execution.type === "manual" ? "Manual" : "Scheduled"}
                  </Tag>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div>
                  <Text type="secondary" className="block text-sm">
                    Attempt
                  </Text>
                  <Tag color={execution.attempt > 1 ? "orange" : "default"}>
                    #{execution.attempt}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Timing Information */}
          <Card title="Timing">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div>
                  <Text type="secondary" className="block text-sm">
                    Started At
                  </Text>
                  <Text className="block">
                    {dayjs(execution.startedAt).format("MMM D, YYYY h:mm:ss A")}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(execution.startedAt).fromNow()}
                  </Text>
                </div>
              </Col>
              {execution.completedAt && (
                <Col xs={24} sm={8}>
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Completed At
                    </Text>
                    <Text className="block">
                      {dayjs(execution.completedAt).format(
                        "MMM D, YYYY h:mm:ss A"
                      )}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {dayjs(execution.completedAt).fromNow()}
                    </Text>
                  </div>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <div>
                  <Text type="secondary" className="block text-sm">
                    Duration
                  </Text>
                  <Text className="block">
                    {execution.duration ? `${execution.duration}s` : "N/A"}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Response Information */}
          {execution.response && (
            <Card title="Response Details">
              <Row gutter={[16, 16]}>
                {execution.response.statusCode && (
                  <Col xs={12} sm={6}>
                    <div>
                      <Text type="secondary" className="block text-sm">
                        Status Code
                      </Text>
                      <Tag
                        color={
                          execution.response.statusCode >= 200 &&
                          execution.response.statusCode < 300
                            ? "green"
                            : "red"
                        }
                      >
                        {execution.response.statusCode}
                      </Tag>
                    </div>
                  </Col>
                )}
                {execution.response.contentType && (
                  <Col xs={12} sm={6}>
                    <div>
                      <Text type="secondary" className="block text-sm">
                        Content Type
                      </Text>
                      <Text className="block">
                        {execution.response.contentType}
                      </Text>
                    </div>
                  </Col>
                )}
                {execution.response.responseSize && (
                  <Col xs={12} sm={6}>
                    <div>
                      <Text type="secondary" className="block text-sm">
                        Response Size
                      </Text>
                      <Text className="block">
                        {formatBytes(execution.response.responseSize)}
                      </Text>
                    </div>
                  </Col>
                )}
                {execution.response.duration && (
                  <Col xs={12} sm={6}>
                    <div>
                      <Text type="secondary" className="block text-sm">
                        HTTP Duration
                      </Text>
                      <Text className="block">
                        {execution.response.duration}ms
                      </Text>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Response Headers */}
              {execution.response.data?.headers && (
                <div className="mt-4">
                  <Text type="secondary" className="block text-sm mb-2">
                    Response Headers
                  </Text>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(execution.response.data.headers, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Data */}
              {execution.response.data && (
                <div className="mt-4">
                  <Text type="secondary" className="block text-sm mb-2">
                    Response Data
                  </Text>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(execution.response.data, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          )}

          {/* Error Information */}
          {execution.error && (
            <Card title="Error Details">
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <Text type="danger" className="font-mono text-sm">
                  {execution.error}
                </Text>
              </div>
            </Card>
          )}

          {/* Raw JSON */}
          <Card title="Raw Execution Data">
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(execution, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </Drawer>
  );
};

interface ExecutionHistoryProps {
  jobId: string;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  jobId,
}) => {
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedExecution, setSelectedExecution] =
    useState<ExecutionHistoryItem | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const {
    executions,
    runningExecutions,
    stats,
    pagination,
    loading,
    statsLoading,
    filters,
    applyFilters,
    clearFilters,
    changePage,
    refresh,
    exportExecutions,
    getExecutionDetails,
  } = useJobExecutions(jobId);

  const handleViewDetails = async (execution: ExecutionHistoryItem) => {
    const details = await getExecutionDetails(execution.id);
    if (details) {
      setSelectedExecution(details);
      setDetailsModalVisible(true);
    }
  };

  const handleFilterChange = (
    key: keyof ExecutionFilters,
    value: string | number | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    const newFilters = { ...filters };
    if (dates && dates.length === 2) {
      newFilters.startDate = dateStrings[0];
      newFilters.endDate = dateStrings[1];
    } else {
      delete newFilters.startDate;
      delete newFilters.endDate;
    }
    applyFilters(newFilters);
  };

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

  const exportMenuItems: MenuProps["items"] = [
    {
      key: "json",
      label: "Export as JSON",
      icon: <ExportOutlined />,
      onClick: () => exportExecutions("json"),
    },
    {
      key: "csv",
      label: "Export as CSV",
      icon: <ExportOutlined />,
      onClick: () => exportExecutions("csv"),
    },
  ];

  const statusOptions = [
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Running", value: "running" },
  ];

  const typeOptions = [
    { label: "Scheduled", value: "scheduled" },
    { label: "Manual", value: "manual" },
  ];

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => (
        <Tag color={type === "manual" ? "blue" : "default"}>
          {type === "manual" ? "Manual" : "Scheduled"}
        </Tag>
      ),
    },
    {
      title: "Started At",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 180,
      render: (startedAt: string) => (
        <div>
          <div>{dayjs(startedAt).format("MMM D, YYYY")}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(startedAt).format("h:mm:ss A")}
          </Text>
        </div>
      ),
      sorter: true,
      defaultSortOrder: "descend" as const,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 100,
      render: (duration: number | null, record: ExecutionHistoryItem) => {
        if (record.status === "running") {
          const elapsed = dayjs().diff(dayjs(record.startedAt), "second");
          return (
            <Text type="secondary">
              {formatDuration(elapsed)} <Spin size="small" />
            </Text>
          );
        }
        return formatDuration(duration);
      },
    },
    {
      title: "Attempt",
      dataIndex: "attempt",
      key: "attempt",
      width: 80,
      render: (attempt: number) => (
        <Tag color={attempt > 1 ? "orange" : "default"}>#{attempt}</Tag>
      ),
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
      width: 200,
      render: (error: string | null) => {
        if (!error) return <Text type="secondary">-</Text>;
        return (
          <Tooltip title={error} placement="topLeft">
            <Text type="danger" style={{ fontSize: 12 }} ellipsis>
              {error.length > 50 ? `${error.substring(0, 50)}...` : error}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: ExecutionHistoryItem) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Executions"
                value={stats.total}
                loading={statsLoading}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={stats.successRate}
                suffix="%"
                loading={statsLoading}
                valueStyle={{
                  color:
                    stats.successRate >= 90
                      ? "#52c41a"
                      : stats.successRate >= 70
                        ? "#fa8c16"
                        : "#ff4d4f",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Avg Duration"
                value={
                  stats.averageDuration
                    ? formatDuration(stats.averageDuration)
                    : "N/A"
                }
                loading={statsLoading}
                valueStyle={{ fontSize: "16px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Running Now"
                value={stats.running}
                loading={statsLoading}
                valueStyle={{
                  color: stats.running > 0 ? "#1890ff" : "#52c41a",
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Running Executions Alert */}
      {runningExecutions.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClockCircleOutlined style={{ color: "#1890ff" }} />
            <Text strong>Currently Running ({runningExecutions.length})</Text>
          </div>
          <div className="space-y-2">
            {runningExecutions.map(execution => (
              <div
                key={execution.id}
                className="flex justify-between items-center p-2 bg-blue-50 rounded"
              >
                <div>
                  <Text>Execution #{execution.attempt}</Text>
                  <Text type="secondary" className="ml-2">
                    Started {dayjs(execution.startedAt).fromNow()}
                  </Text>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() => handleViewDetails(execution)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="mb-0">
            Execution History
          </Title>
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFiltersVisible(!filtersVisible)}
              type={Object.keys(filters).length > 0 ? "primary" : "default"}
            >
              Filters{" "}
              {Object.keys(filters).length > 0 &&
                `(${Object.keys(filters).length})`}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
              <Button icon={<ExportOutlined />}>
                Export <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>

        {/* Filter Controls */}
        {filtersVisible && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong className="block mb-2">
                  Status
                </Text>
                <Select
                  placeholder="Filter by status"
                  style={{ width: "100%" }}
                  value={filters.status}
                  onChange={(value: string) =>
                    handleFilterChange("status", value)
                  }
                  allowClear
                  options={statusOptions}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong className="block mb-2">
                  Type
                </Text>
                <Select
                  placeholder="Filter by type"
                  style={{ width: "100%" }}
                  value={filters.type}
                  onChange={(value: string) =>
                    handleFilterChange("type", value)
                  }
                  allowClear
                  options={typeOptions}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong className="block mb-2">
                  Date Range
                </Text>
                <RangePicker
                  style={{ width: "100%" }}
                  value={
                    filters.startDate && filters.endDate
                      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                      : null
                  }
                  onChange={handleDateRangeChange}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong className="block mb-2">
                  Attempt
                </Text>
                <Input
                  type="number"
                  placeholder="Filter by attempt #"
                  value={filters.attempt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange(
                      "attempt",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </Col>
            </Row>
            <div className="mt-4">
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                disabled={Object.keys(filters).length === 0}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Executions Table */}
        <Table
          columns={columns}
          dataSource={executions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `${range[0]}-${range[1]} of ${total} executions`,
            onChange: changePage,
            onShowSizeChange: changePage,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                description="No execution history found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Execution Details Modal */}
      <ExecutionDetailsModal
        visible={detailsModalVisible}
        execution={selectedExecution}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedExecution(null);
        }}
      />
    </div>
  );
};
