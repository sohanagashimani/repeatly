import { useState } from "react";
import { Button, Typography, Space } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useJobs, Job, CreateJobData } from "../hooks/useJobs";
import { JobTable } from "./JobTable";
import { JobModal } from "./CreateJobModal";

const { Title, Text } = Typography;

export const JobManager: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const {
    jobs,
    pagination,
    loading,
    creatingJob,
    updatingJobId,
    createJob,
    updateJob,
    deleteJob,
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

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
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
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
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
