import { useState } from "react";
import { Button, Typography, Space, Switch, Tooltip } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useJobs, Job, CreateJobData } from "../hooks/useJobs";
import { JobTable } from "./JobTable";
import { JobModal } from "./CreateJobModal";

const { Title, Text } = Typography;

export const JobManager: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLocalTimezone, setShowLocalTimezone] = useState(() => {
    // Load preference from localStorage, default to false (job timezone)
    const saved = localStorage.getItem("repeatly-show-local-timezone");
    return saved ? JSON.parse(saved) : false;
  });

  const {
    jobs,
    pagination,
    loading,
    creatingJob,
    updatingJobId,
    triggeringJobId,
    createJob,
    updateJob,
    deleteJob,
    triggerJob,
    toggleJobStatus,
    changePage,
    refetch,
  } = useJobs();

  const handleSubmitJob = async (data: CreateJobData) => {
    let success;
    if (selectedJob) {
      // Edit mode
      success = await updateJob(selectedJob.id, data);
    } else {
      // Create mode
      success = await createJob(data);
    }

    if (success) {
      setModalVisible(false);
      setSelectedJob(null);
    }
    return success;
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const handleCreateJob = () => {
    setSelectedJob(null);
    setModalVisible(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteJob(jobId);
  };

  const handleToggleStatus = async (jobId: string, enabled: boolean) => {
    await toggleJobStatus(jobId, enabled);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
  };

  const handleTimezoneToggle = (checked: boolean) => {
    setShowLocalTimezone(checked);
    localStorage.setItem(
      "repeatly-show-local-timezone",
      JSON.stringify(checked)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <Title level={3} className="mb-2 text-lg sm:text-xl">
              Cron Job Management
            </Title>
            <Text type="secondary" className="text-sm sm:text-base">
              Create and manage scheduled HTTP requests. Your jobs will be
              executed automatically according to their cron schedules.
            </Text>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Space>
              <Tooltip
                title={
                  !showLocalTimezone
                    ? "Show times in your local timezone"
                    : "Show times in job's configured timezone"
                }
              >
                <div className="flex items-center gap-2">
                  <GlobalOutlined />
                  <Switch
                    checked={showLocalTimezone}
                    onChange={handleTimezoneToggle}
                    size="small"
                  />
                  <Text style={{ fontSize: "12px" }}>
                    {showLocalTimezone ? "Local TZ" : "Job TZ"}
                  </Text>
                </div>
              </Tooltip>
              <Button
                icon={<ReloadOutlined />}
                onClick={refetch}
                loading={loading}
                title="Refresh jobs"
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateJob}
                size="small"
                className="sm:size-large"
              >
                Create Job
              </Button>
            </Space>
          </div>
        </div>

        <JobTable
          jobs={jobs}
          pagination={pagination}
          loading={loading}
          updatingJobId={updatingJobId}
          triggeringJobId={triggeringJobId}
          showLocalTimezone={showLocalTimezone}
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
          onTrigger={triggerJob}
          onToggleStatus={handleToggleStatus}
          onPageChange={changePage}
        />
      </div>

      <JobModal
        visible={modalVisible}
        loading={selectedJob ? !!updatingJobId : creatingJob}
        job={selectedJob}
        onClose={handleCloseModal}
        onSubmit={handleSubmitJob}
      />
    </div>
  );
};
