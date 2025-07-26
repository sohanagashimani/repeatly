import { useState } from "react";
import { Modal, Input } from "antd";
import { API_KEY_LIMITS } from "../constants/apiKeys";

interface CreateApiKeyModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<string | boolean>;
  onKeyGenerated: (key: string) => void;
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  visible,
  loading,
  onClose,
  onCreate,
  onKeyGenerated,
}) => {
  const [keyName, setKeyName] = useState("");

  const handleCreate = async () => {
    const result = await onCreate(keyName);
    if (result) {
      setKeyName("");
      onClose();
      if (typeof result === "string") {
        onKeyGenerated(result);
      }
    }
  };

  const handleCancel = () => {
    setKeyName("");
    onClose();
  };

  return (
    <Modal
      title="Generate New API Key"
      open={visible}
      onOk={handleCreate}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Generate"
      cancelText="Cancel"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Give your API key a descriptive name to help you identify it later.
          The key will be created in Google Cloud API Gateway.
        </p>
        <Input
          placeholder="e.g., Production API Key"
          value={keyName}
          maxLength={API_KEY_LIMITS.MAX_KEY_NAME_LENGTH}
          showCount
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setKeyName(e.target.value)
          }
          onPressEnter={handleCreate}
        />
      </div>
    </Modal>
  );
};
