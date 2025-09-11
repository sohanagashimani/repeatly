import { Input, Button, Typography, Select, Switch } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { JobFormData } from "../hooks/useJobForm";
import { TIMEZONE_OPTIONS } from "../constants/timezones";

const { Text } = Typography;

interface JobFormBasicTabProps {
  control: Control<JobFormData>;
  errors: FieldErrors<JobFormData>;
  watchedCron: string;
  onCronPreset: (cron: string) => void;
}

const cronPresets = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 10 minutes", value: "*/10 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every Sunday at midnight", value: "0 0 * * 0" },
  { label: "Every month on 1st", value: "0 0 1 * *" },
];

export const JobFormBasicTab: React.FC<JobFormBasicTabProps> = ({
  control,
  errors,
  watchedCron,
  onCronPreset,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Job Name</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="e.g., Daily backup task"
              status={errors.name ? "error" : ""}
            />
          )}
        />
        <ErrorMessage
          errors={errors}
          name="name"
          render={({ message }) => (
            <Text type="danger" className="text-xs block mt-1">
              {message}
            </Text>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Schedule (Cron Expression)
        </label>
        <Controller
          name="cron"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="0 0 * * *"
              status={errors.cron ? "error" : ""}
              suffix={
                <InfoCircleOutlined
                  title="Format: minute hour day month weekday"
                  className="text-gray-400"
                />
              }
            />
          )}
        />
        <ErrorMessage
          errors={errors}
          name="cron"
          render={({ message }) => (
            <Text type="danger" className="text-xs block mt-1">
              {message}
            </Text>
          )}
        />

        <div className="mt-2">
          <Text type="secondary" className="text-xs">
            Quick presets:
          </Text>
          <div className="flex flex-wrap gap-1 mt-1">
            {cronPresets.map(preset => (
              <Button
                key={preset.value}
                size="small"
                type={watchedCron === preset.value ? "primary" : "default"}
                onClick={() => onCronPreset(preset.value)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Timezone</label>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select timezone"
              showSearch
              optionFilterProp="label"
              options={TIMEZONE_OPTIONS}
              status={errors.timezone ? "error" : ""}
              className="w-full"
            />
          )}
        />
        <ErrorMessage
          errors={errors}
          name="timezone"
          render={({ message }) => (
            <Text type="danger" className="text-xs block mt-1">
              {message}
            </Text>
          )}
        />
        <Text type="secondary" className="text-xs mt-1 block">
          Timezone for cron schedule execution
        </Text>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Job Status</label>
        <Controller
          name="enabled"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center gap-2">
              <Switch
                checked={value}
                onChange={onChange}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
              <Text type="secondary" className="text-sm">
                {value ? "Job will run on schedule" : "Job is paused"}
              </Text>
            </div>
          )}
        />
        <ErrorMessage
          errors={errors}
          name="enabled"
          render={({ message }) => (
            <Text type="danger" className="text-xs block mt-1">
              {message}
            </Text>
          )}
        />
      </div>
    </div>
  );
};
