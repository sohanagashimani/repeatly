import { useState } from "react";
import { Button, Alert, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useApiKeys } from "../hooks/useApiKeys";
import { ApiKeyTable } from "./ApiKeyTable";
import { CreateApiKeyModal } from "./CreateApiKeyModal";
import { GeneratedKeyModal } from "./GeneratedKeyModal";
import { API_KEY_LIMITS } from "../constants/apiKeys";
import When from "./When";

const ApiKeyManager = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const {
    apiKeys,
    loading,
    checkingKeyId,
    createApiKey,
    checkKeyStatus,
    deleteApiKey,
  } = useApiKeys();

  const handleCreateApiKey = async (name: string) => {
    const result = await createApiKey(name);
    return result;
  };

  const handleCheckStatus = async (keyId: string) => {
    const key = await checkKeyStatus(keyId);
    if (key) {
      setGeneratedKey(key);
    }
  };

  const handleKeyGenerated = (key: string) => {
    setGeneratedKey(key);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys (WIP)</h2>
          <p className="text-gray-600">
            Manage your API keys for accessing the Repeatly API via Google Cloud
            API Gateway
          </p>
        </div>

        <Tooltip
          title={
            apiKeys.length >= API_KEY_LIMITS.MAX_KEYS_PER_USER
              ? `Maximum limit reached (${apiKeys.length}/${API_KEY_LIMITS.MAX_KEYS_PER_USER})`
              : null
          }
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={apiKeys.length >= API_KEY_LIMITS.MAX_KEYS_PER_USER}
            onClick={() => setModalVisible(true)}
          >
            Generate API Key
          </Button>
        </Tooltip>
      </div>
      <When
        condition={apiKeys.filter(key => key.status === "completed").length > 0}
      >
        <Alert
          message="Lost your API key?"
          description="For security reasons, API keys are shown only once during creation. If you've lost your key, revoke the old one and create a new key."
          type="warning"
          showIcon
          closable
        />
      </When>

      <ApiKeyTable
        apiKeys={apiKeys}
        loading={loading}
        checkingKeyId={checkingKeyId}
        onCheckStatus={handleCheckStatus}
        onDelete={deleteApiKey}
      />

      <CreateApiKeyModal
        visible={modalVisible}
        loading={loading}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateApiKey}
        onKeyGenerated={handleKeyGenerated}
      />

      <GeneratedKeyModal
        apiKey={generatedKey}
        onClose={() => setGeneratedKey(null)}
      />
    </div>
  );
};

export default ApiKeyManager;
