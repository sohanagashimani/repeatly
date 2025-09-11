import { useEffect, useState } from "react";
import { Modal, Form, Button, Alert, Tabs, Typography } from "antd";
import { CreateJobData, Job } from "../hooks/useJobs";
import { useJobForm } from "../hooks/useJobForm";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { JobFormBasicTab } from "./JobFormBasicTab";
import { JobFormRequestTab } from "./JobFormRequestTab";

const { Text } = Typography;

interface JobModalProps {
  visible: boolean;
  loading: boolean;
  job?: Job | null;
  onClose: () => void;
  onSubmit: (data: CreateJobData) => Promise<boolean>;
}

export const JobModal: React.FC<JobModalProps> = ({
  visible,
  loading,
  job,
  onClose,
  onSubmit,
}) => {
  const isEditMode = !!job;
  const [activeTab, setActiveTab] = useState("basic");

  const form = useJobForm(job, async (data: CreateJobData) => {
    const success = await onSubmit(data);
    if (success) {
      form.resetForm();
      setActiveTab("basic");
      onClose();
    }
    return success;
  });

  // Unsaved changes logic hook
  const unsavedChanges = useUnsavedChanges(form.isDirty, () => {
    form.resetForm();
    setActiveTab("basic");
    onClose();
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      form.resetForm();
      setActiveTab("basic");
      unsavedChanges.resetQuitModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleNext = () => {
    setActiveTab("request");
  };

  const handleCronPreset = (cron: string) => {
    form.setValue("cron", cron, { shouldValidate: true });
  };

  const tabItems = [
    {
      key: "basic",
      label: "Basic Info",
      children: (
        <JobFormBasicTab
          control={form.control}
          errors={form.errors}
          watchedCron={form.watch("cron")}
          onCronPreset={handleCronPreset}
        />
      ),
    },
    {
      key: "request",
      label: "HTTP Request",
      children: (
        <JobFormRequestTab
          control={form.control}
          errors={form.errors}
          watchedMethod={form.watch("method")}
        />
      ),
    },
  ];

  return (
    <>
      <Modal
        title={isEditMode ? `Edit Job: ${job?.name}` : "Create New Cron Job"}
        open={visible}
        onCancel={unsavedChanges.handleCloseAttempt}
        width={600}
        footer={[
          <div
            key="footer-btn-row"
            className="flex flex-row items-center gap-2 w-full justify-end"
          >
            <Button onClick={unsavedChanges.handleCloseAttempt}>Cancel</Button>
            {activeTab === "basic" ? (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <>
                <Button onClick={() => setActiveTab("basic")}>Back</Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={form.handleSubmit}
                >
                  {isEditMode ? "Update Job" : "Create Job"}
                </Button>
              </>
            )}
          </div>,
          form.getErrorCount() > 0 && (
            <div key="footer-error-row" className="w-full text-left mt-1">
              <Text type="danger" className="text-xs">
                Fix {form.getErrorCount()} error
                {form.getErrorCount() > 1 ? "s" : ""} in form
              </Text>
            </div>
          ),
        ]}
      >
        <Alert
          message="Cron Job Scheduling"
          description="Your job will be executed according to the cron schedule. Make sure the target URL is accessible and can handle the HTTP requests."
          type="info"
          showIcon
          className="mb-2 p-3"
        />

        <Form layout="vertical">
          <Tabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </Form>
      </Modal>
      <UnsavedChangesModal
        visible={unsavedChanges.showQuitModal}
        setQuitModalVisible={unsavedChanges.handleCancelQuit}
        onOkClick={unsavedChanges.handleConfirmQuit}
      />
    </>
  );
};
