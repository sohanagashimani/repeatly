import { useState } from "react";
import { Modal, Button, Alert, Checkbox, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

interface GeneratedKeyModalProps {
  apiKey: string | null;
  onClose: () => void;
}

export const GeneratedKeyModal: React.FC<GeneratedKeyModalProps> = ({
  apiKey,
  onClose,
}) => {
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const handleClose = () => {
    setAcknowledgedWarning(false);
    onClose();
  };

  return (
    <Modal
      title="API Key Generated"
      open={!!apiKey}
      onOk={handleClose}
      okText="Done"
      closable={false}
      width={500}
      footer={[
        <Button key="copy" onClick={() => copyToClipboard(apiKey!)}>
          <CopyOutlined /> Copy Key
        </Button>,
        <Button
          key="done"
          type="primary"
          disabled={!acknowledgedWarning}
          onClick={handleClose}
        >
          Done
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="Important"
          description="This is the only time you'll see this API key. Make sure to copy it and store it securely. The key is managed by Google Cloud API Gateway."
          type="warning"
        />

        <div className="bg-gray-100 p-4 rounded">
          <code className="text-sm break-all font-mono">{apiKey}</code>
        </div>

        <Checkbox
          checked={acknowledgedWarning}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAcknowledgedWarning(e.target.checked)
          }
          className="mt-4"
        >
          I understand this is the only time I&apos;ll see this API key and have
          saved it securely
        </Checkbox>
      </div>
    </Modal>
  );
};
