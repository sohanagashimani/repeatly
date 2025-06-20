import { useState, useEffect } from "react";
import { message } from "antd";
import { useAuth } from "./useAuth";
import { API_KEY_LIMITS, API_KEY_MESSAGES } from "../constants/apiKeys";

interface ApiKey {
  id: string;
  name: string;
  lastFour: string;
  status: "creating" | "completed";
  createdAt: string;
  keyHash?: string;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingKeyId, setCheckingKeyId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/v1/keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Failed to fetch API keys");
      }
    } catch (error) {
      message.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (displayName: string) => {
    if (!user || !displayName.trim()) {
      message.error(API_KEY_MESSAGES.KEY_NAME_REQUIRED);
      return false;
    }

    if (displayName.trim().length > API_KEY_LIMITS.MAX_KEY_NAME_LENGTH) {
      message.error(API_KEY_MESSAGES.KEY_NAME_TOO_LONG);
      return false;
    }

    if (apiKeys.length >= API_KEY_LIMITS.MAX_KEYS_PER_USER) {
      message.error(API_KEY_MESSAGES.MAX_KEYS_EXCEEDED);
      return false;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/v1/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "creating") {
          message.success(
            "API key creation started! It will be ready shortly."
          );
          fetchApiKeys();
          return true;
        } else {
          fetchApiKeys();
          return data.key; // Return the actual key if created immediately
        }
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Failed to generate API key");
        return false;
      }
    } catch (error) {
      message.error("Failed to generate API key");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkKeyStatus = async (keyId: string) => {
    if (!user) return null;

    setCheckingKeyId(keyId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/v1/keys/${keyId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "completed" && data.key) {
          fetchApiKeys();
          return data.key;
        } else {
          message.info(
            "API key is still being created. Please try again in a moment."
          );
          return null;
        }
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Failed to check key status");
        return null;
      }
    } catch (error) {
      message.error("Failed to check key status");
      return null;
    } finally {
      setCheckingKeyId(null);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!user) return false;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/v1/keys/${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        message.success("API key revoked from Google Cloud successfully!");
        fetchApiKeys();
        return true;
      } else {
        message.error("Failed to revoke API key");
        return false;
      }
    } catch (error) {
      message.error("Failed to revoke API key");
      return false;
    }
  };

  useEffect(() => {
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    apiKeys,
    loading,
    checkingKeyId,
    createApiKey,
    checkKeyStatus,
    deleteApiKey,
    refetch: fetchApiKeys,
  };
};

export type { ApiKey };
