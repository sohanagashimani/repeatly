import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Breadcrumb,
  Tabs,
  Typography,
  Space,
  Tag,
  Tooltip,
  Alert,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useJobs, Job } from "../hooks/useJobs";
import { ExecutionHistory } from "../components/ExecutionHistory";
import { JobModal } from "../components/CreateJobModal";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import apiHelper from "../lib/apiHelper";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

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

export const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const {
    updateJob,
    deleteJob: deleteJobAction,
    triggerJob,
    toggleJobStatus,
    updatingJobId,
    triggeringJobId,
  } = useJobs();

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      setLoading(true);
      try {
        const jobData = await apiHelper({
          slug: `/jobs/getJob/${jobId}`,
          method: "GET",
        });

        setJob(jobData);
      } catch (error) {
        message.error("Failed to load job details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, navigate]);

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = async () => {
    if (!job) return;
    const success = await deleteJobAction(job.id);
    if (success) {
      navigate("/");
    }
  };

  const handleTrigger = async () => {
    if (!job) return;
    await triggerJob(job.id);
  };

  const handleToggleStatus = async () => {
    if (!job) return;
    const success = await toggleJobStatus(job.id, !job.enabled);
    if (success) {
      setJob({ ...job, enabled: !job.enabled });
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!job) return false;
    const success = await updateJob(job.id, data);
    if (success) {
      setEditModalVisible(false);
      // Refresh job data
      window.location.reload();
    }
    return success;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert
          message="Job Not Found"
          description="The requested job could not be found."
          type="error"
          showIcon
          action={<Button onClick={() => navigate("/")}>Back to Jobs</Button>}
        />
      </div>
    );
  }

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

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div className="space-y-6">
          {/* Job Info Card */}
          <Card title="Job Information">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <div className="space-y-4">
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Job Name
                    </Text>
                    <Text strong className="text-base">
                      {job.name}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Schedule
                    </Text>
                    <Text code className="text-base">
                      {job.cron}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Timezone
                    </Text>
                    <Text className="text-base">{job.timezone}</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div className="space-y-4">
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Method & URL
                    </Text>
                    <div className="space-y-1">
                      <Tag color={getMethodColor(job.method)}>{job.method}</Tag>
                      <Text className="block text-sm break-all">{job.url}</Text>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Status
                    </Text>
                    <Tag color={job.enabled ? "green" : "red"}>
                      {job.enabled ? "Enabled" : "Disabled"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div className="space-y-4">
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Next Run
                    </Text>
                    {job.nextRun ? (
                      <div>
                        <Text className="block">
                          {dayjs(job.nextRun).format("MMM D, YYYY h:mm A")}
                        </Text>
                        <Text type="secondary" className="text-sm">
                          {dayjs(job.nextRun).fromNow()}
                        </Text>
                      </div>
                    ) : (
                      <Text type="secondary">No upcoming runs</Text>
                    )}
                  </div>
                  <div>
                    <Text type="secondary" className="block text-sm">
                      Last Run
                    </Text>
                    {job.lastRun ? (
                      <div>
                        <Text className="block">
                          {dayjs(job.lastRun).format("MMM D, YYYY h:mm A")}
                        </Text>
                        <Text type="secondary" className="text-sm">
                          {dayjs(job.lastRun).fromNow()}
                        </Text>
                      </div>
                    ) : (
                      <Text type="secondary">Never executed</Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Success Count"
                  value={
                    typeof job.successCount === "number" ? job.successCount : 0
                  }
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Retries"
                  value={typeof job.retries === "number" ? job.retries : 0}
                  valueStyle={{
                    color:
                      typeof job.retries === "number" && job.retries > 0
                        ? "#fa8c16"
                        : "#52c41a",
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Created"
                  value={
                    job.createdAt
                      ? dayjs(job.createdAt).format("MMM D, YYYY")
                      : "N/A"
                  }
                  valueStyle={{ fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Last Status"
                  value={
                    typeof job.lastExecutionStatus === "string" &&
                    job.lastExecutionStatus.length > 0
                      ? job.lastExecutionStatus
                      : "N/A"
                  }
                  valueStyle={{
                    color:
                      job.lastExecutionStatus === "completed"
                        ? "#52c41a"
                        : job.lastExecutionStatus === "failed"
                          ? "#ff4d4f"
                          : "#1890ff",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {(job.headers && Object.keys(job.headers).length > 0) ||
          (typeof job.body === "string" && job.body.length > 0) ? (
            <Card title="Request Configuration">
              {job.headers && Object.keys(job.headers).length > 0 && (
                <div className="mb-4">
                  <Text type="secondary" className="block text-sm mb-2">
                    Headers
                  </Text>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(job.headers, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      ),
    },
    {
      key: "executions",
      label: "Executions",
      children: <ExecutionHistory jobId={job.id} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item>
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/")}
                  className="p-0"
                >
                  Jobs
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{job.name}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Title and Actions */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Title level={2} className="mb-0 truncate">
                    {job.name}
                  </Title>
                  <Tag color={job.enabled ? "green" : "red"}>
                    {job.enabled ? "Enabled" : "Disabled"}
                  </Tag>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <ClockCircleOutlined />
                    {job.cron}
                  </span>
                  <span>Created {dayjs(job.createdAt).fromNow()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <Space wrap>
                <Tooltip title="Trigger job now">
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={handleTrigger}
                    loading={triggeringJobId === job.id}
                    disabled={!job.enabled}
                  >
                    Trigger
                  </Button>
                </Tooltip>

                <Tooltip title={job.enabled ? "Disable job" : "Enable job"}>
                  <Button
                    icon={
                      job.enabled ? (
                        <PauseCircleOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={handleToggleStatus}
                    loading={updatingJobId === job.id}
                  >
                    {job.enabled ? "Disable" : "Enable"}
                  </Button>
                </Tooltip>

                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  Edit
                </Button>

                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                  Delete
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="bg-white rounded-lg shadow p-4"
        />
      </main>

      {/* Edit Modal */}
      <JobModal
        visible={editModalVisible}
        loading={!!updatingJobId}
        job={job}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};
