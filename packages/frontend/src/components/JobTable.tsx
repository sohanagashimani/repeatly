import {
  Button,
  Table,
  Tag,
  Popconfirm,
  Typography,
  Switch,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Job, PaginationInfo } from "../hooks/useJobs";
import { useState } from "react";

// Timezone handling:
// - Last Run: Shows in job's configured timezone (converted from UTC database timestamp)
// - Next Run: Shows in job's configured timezone (when job will actually execute)
// - Created: Shows in user's browser timezone (for user reference)
// - When job timezone is updated: Only affects future scheduling, past executions remain in their original timezone context

dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);

const { Text } = Typography;

interface JobTableProps {
  jobs: Job[];
  pagination: PaginationInfo;
  loading: boolean;
  updatingJobId: string | null;
  triggeringJobId: string | null;
  showLocalTimezone: boolean;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onTrigger: (jobId: string) => void;
  onToggleStatus: (jobId: string, enabled: boolean) => void;
  onPageChange: (page: number, pageSize?: number) => void;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  pagination,
  loading,
  updatingJobId,
  triggeringJobId,
  showLocalTimezone,
  onEdit,
  onDelete,
  onTrigger,
  onToggleStatus,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const [togglingJobIds, setTogglingJobIds] = useState<string[]>([]);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      PATCH: "purple",
      DELETE: "red",
    };
    return colors[method as keyof typeof colors] || "default";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("ID copied to clipboard!");
  };

  const handleViewDetails = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleToggleStatus = async (jobId: string, checked: boolean) => {
    setTogglingJobIds(ids => [...ids, jobId]);
    try {
      await onToggleStatus(jobId, checked);
    } finally {
      setTogglingJobIds(ids => ids.filter(id => id !== jobId));
    }
  };

  // Helper to format time based on timezone preference
  const formatTime = (timestamp: string, jobTimezone: string) => {
    if (showLocalTimezone) {
      return dayjs(timestamp).format("MMM D, HH:mm:ss");
    } else {
      return dayjs.utc(timestamp).tz(jobTimezone).format("MMM D, HH:mm:ss");
    }
  };

  // Helper to get timezone label
  const getTimezoneLabel = (jobTimezone: string) => {
    return showLocalTimezone ? "Local" : jobTimezone;
  };

  // Helper to get tooltip text
  const getTimezoneTooltip = (context: string, jobTimezone: string) => {
    if (showLocalTimezone) {
      return `${context} in your local timezone (job runs in ${jobTimezone})`;
    } else {
      return `${context} in job timezone: ${jobTimezone}`;
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "6%",
      render: (id: string) => (
        <div className="flex items-center gap-1">
          <Text style={{ fontSize: "12px", fontFamily: "monospace" }}>
            {id.substring(0, 8)}...
          </Text>
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyToClipboard(id)}
            title="Copy full ID"
            className="p-0"
          />
        </div>
      ),
    },
    {
      title: "Job Name",
      dataIndex: "name",
      key: "name",
      width: "16%",
      render: (name: string, record: Job) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.cron}
          </Text>
        </div>
      ),
    },
    {
      title: "Method & URL",
      key: "methodUrl",
      width: "20%",
      render: (_: unknown, record: Job) => (
        <div>
          <Tag color={getMethodColor(record.method)} className="mb-1">
            {record.method}
          </Tag>
          <br />
          <Text
            style={{ fontSize: "12px", wordBreak: "break-all" }}
            title={record.url}
          >
            {record.url.length > 35
              ? `${record.url.substring(0, 35)}...`
              : record.url}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: "6%",
      align: "center" as const,
      render: (enabled: boolean, record: Job) => {
        const loading = togglingJobIds.includes(record.id);
        return (
          <span>
            <Switch
              checked={enabled}
              onChange={(checked: boolean) =>
                handleToggleStatus(record.id, checked)
              }
              size="small"
              checkedChildren="ON"
              unCheckedChildren="OFF"
              disabled={loading}
            />
            {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
          </span>
        );
      },
    },
    {
      title: "Last Run",
      dataIndex: "lastRun",
      key: "lastRun",
      width: "12%",
      render: (lastRun: string | null, record: Job) => (
        <div>
          {lastRun ? (
            <>
              <Tooltip title={getTimezoneTooltip("Last Run", record.timezone)}>
                <Text style={{ fontSize: "12px" }}>
                  {formatTime(lastRun, record.timezone)}
                </Text>
              </Tooltip>
              <br />
              <div className="flex items-center gap-1">
                <Text type="secondary" style={{ fontSize: "11px" }}>
                  {dayjs(lastRun).fromNow()}
                </Text>
                {record.lastExecutionStatus && (
                  <Tooltip
                    title={`Last execution: ${record.lastExecutionStatus}`}
                  >
                    <Tag
                      color={
                        record.lastExecutionStatus === "completed"
                          ? "green"
                          : record.lastExecutionStatus === "failed"
                            ? "red"
                            : record.lastExecutionStatus === "running"
                              ? "blue"
                              : "default"
                      }
                      style={{
                        fontSize: "10px",
                        margin: 0,
                        padding: "0 4px",
                        lineHeight: "14px",
                      }}
                    >
                      {record.lastExecutionStatus === "completed"
                        ? "✓"
                        : record.lastExecutionStatus === "failed"
                          ? "✗"
                          : record.lastExecutionStatus === "running"
                            ? "⟳"
                            : "?"}
                    </Tag>
                  </Tooltip>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: "10px" }}>
                {getTimezoneLabel(record.timezone)}
              </Text>
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Never
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Next Run",
      dataIndex: "nextRun",
      key: "nextRun",
      width: "12%",
      render: (nextRun: string | null, record: Job) => (
        <div>
          {nextRun ? (
            <>
              <Tooltip title={getTimezoneTooltip("Next Run", record.timezone)}>
                <Text style={{ fontSize: "12px" }}>
                  {formatTime(nextRun, record.timezone)}
                </Text>
              </Tooltip>
              <br />
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {dayjs(nextRun).fromNow()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "10px" }}>
                {getTimezoneLabel(record.timezone)}
              </Text>
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.enabled ? "Scheduling..." : "Disabled"}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Success / Retries",
      key: "successRetries",
      width: "7%",
      align: "center" as const,
      render: (_: unknown, record: Job) => (
        <div>
          <Tag color="green" style={{ marginBottom: 2 }}>
            ✓ {record.successCount}
          </Tag>
          <br />
          <Tag color={record.retries > 0 ? "orange" : "default"}>
            ↻ {record.retries}
          </Tag>
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "7%",
      render: (date: string) => (
        <Tooltip
          title={`Created: ${dayjs(date).format("MMM D, YYYY h:mm:ss A")} (local time)`}
        >
          <Text style={{ fontSize: "12px" }} type="secondary">
            {dayjs(date).format("MMM D, h:mm A")}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      align: "left" as const,
      render: (_: unknown, record: Job) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="default"
            icon={<PlayCircleOutlined />}
            size="small"
            className="text-green-600 border-green-600 hover:bg-green-50"
            loading={triggeringJobId === record.id}
            disabled={!record.enabled || triggeringJobId === record.id}
            onClick={() => onTrigger(record.id)}
          >
            {triggeringJobId === record.id ? "Running" : "Run"}
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
            loading={updatingJobId === record.id}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete job"
            description="Are you sure you want to delete this job? This action cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="default"
              icon={<DeleteOutlined />}
              size="small"
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total} jobs`,
        onChange: onPageChange,
        onShowSizeChange: onPageChange,
        pageSizeOptions: ["10", "20", "50", "100"],
      }}
      locale={{
        emptyText: (
          <div className="text-center py-8">
            <ClockCircleOutlined className="text-4xl text-gray-300 mb-4" />
            <div className="text-gray-500">No scheduled jobs yet</div>
            <div className="text-gray-400 text-sm">
              Set up your first HTTP cron job to automate requests
            </div>
          </div>
        ),
      }}
    />
  );
};
