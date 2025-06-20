import { Button, Table, Tag, Popconfirm, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Job, PaginationInfo } from "../hooks/useJobs";

const { Text } = Typography;

interface JobTableProps {
  jobs: Job[];
  pagination: PaginationInfo;
  loading: boolean;
  updatingJobId: string | null;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onPageChange: (page: number, pageSize?: number) => void;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  pagination,
  loading,
  updatingJobId,
  onEdit,
  onDelete,
  onPageChange,
}) => {
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

  const columns = [
    {
      title: "Job Name",
      dataIndex: "name",
      key: "name",
      width: "20%",
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
      width: "35%",
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
            {record.url}
          </Text>
        </div>
      ),
    },
    {
      title: "ETA",
      dataIndex: "nextRun",
      key: "nextRun",
      width: "15%",
      render: (nextRun: string) => (
        <Text style={{ fontSize: "14px" }}>
          {dayjs(nextRun).format("DD MMM YYYY, HH:mm:ss")}
        </Text>
      ),
    },
    {
      title: "Retries",
      dataIndex: "retries",
      key: "retries",
      width: "10%",
      align: "center" as const,
      render: (retries: number) => (
        <Tag color={retries > 0 ? "orange" : "green"}>{retries}</Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "12%",
      render: (date: string) => (
        <Text style={{ fontSize: "12px" }} type="secondary">
          {dayjs(date).format("MMM D, h:mm A")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "8%",
      align: "center" as const,
      render: (_: unknown, record: Job) => (
        <div className="flex gap-1">
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            size="small"
            title="Trigger now"
            className="text-green-600"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
            loading={updatingJobId === record.id}
            title="Edit job"
          />
          <Popconfirm
            title="Delete job"
            description="Are you sure you want to delete this job? This action cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              title="Delete job"
            />
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
