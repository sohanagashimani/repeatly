import { Input, Select, Typography } from "antd";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { JobFormData } from "../hooks/useJobForm";

const { TextArea } = Input;
const { Text } = Typography;

interface JobFormRequestTabProps {
  control: Control<JobFormData>;
  errors: FieldErrors<JobFormData>;
  watchedMethod: string;
}

export const JobFormRequestTab: React.FC<JobFormRequestTabProps> = ({
  control,
  errors,
  watchedMethod,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Method</label>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                className="w-full"
                options={[
                  { value: "GET", label: "GET" },
                  { value: "POST", label: "POST" },
                  { value: "PUT", label: "PUT" },
                  { value: "PATCH", label: "PATCH" },
                  { value: "DELETE", label: "DELETE" },
                ]}
              />
            )}
          />
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium mb-1">URL</label>
          <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="https://api.example.com/webhook"
                status={errors.url ? "error" : ""}
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name="url"
            render={({ message }) => (
              <Text type="danger" className="text-xs block mt-1">
                {message}
              </Text>
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Headers (JSON){" "}
          <span className="text-gray-400 font-normal">- Optional</span>
        </label>
        <Controller
          name="headers"
          control={control}
          render={({ field }) => (
            <TextArea
              {...field}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              rows={3}
              className="font-mono text-sm"
              status={errors.headers ? "error" : ""}
            />
          )}
        />
        <ErrorMessage
          errors={errors}
          name="headers"
          render={({ message }) => (
            <Text type="danger" className="text-xs block mt-1">
              {message}
            </Text>
          )}
        />
      </div>

      {["POST", "PUT", "PATCH"].includes(watchedMethod) && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Request Body (JSON){" "}
            <span className="text-gray-400 font-normal">- Optional</span>
          </label>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                placeholder='{"message": "Hello World", "timestamp": "2024-01-01T00:00:00Z"}'
                rows={4}
                className="font-mono text-sm"
                status={errors.body ? "error" : ""}
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name="body"
            render={({ message }) => (
              <Text type="danger" className="text-xs block mt-1">
                {message}
              </Text>
            )}
          />
        </div>
      )}
    </div>
  );
};
