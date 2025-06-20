import { Button, Table, Popconfirm, Tag } from "antd";
import { DeleteOutlined, CloudOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ApiKey } from "../hooks/useApiKeys";

interface ApiKeyTableProps {
  apiKeys: ApiKey[];
  loading: boolean;
  checkingKeyId: string | null;
  onCheckStatus: (keyId: string) => void;
  onDelete: (keyId: string) => void;
}

export const ApiKeyTable: React.FC<ApiKeyTableProps> = ({
  apiKeys,
  loading,
  checkingKeyId,
  onCheckStatus,
  onDelete,
}) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Key",
      dataIndex: "status",
      key: "key",
      render: (_: string, record: ApiKey) => {
        if (record.status === "creating") {
          return (
            <Button
              type="text"
              size="small"
              loading={checkingKeyId === record.id}
              onClick={() => onCheckStatus(record.id)}
            >
              Show Key
            </Button>
          );
        }
        return (
          <Tag color="blue" icon={<CloudOutlined />}>
            ••••{record.lastFour}
          </Tag>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM D, YYYY h:mm A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: ApiKey) => {
        // Only show actions for completed keys
        if (record.status === "creating") {
          return null;
        }

        return (
          <Popconfirm
            title="Are you sure you want to revoke this API key?"
            description="This will delete the key from Google Cloud and cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              Revoke
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={apiKeys}
      loading={loading}
      rowKey="id"
      pagination={false}
      locale={{
        emptyText: "No API keys found. Generate your first key to get started.",
      }}
    />
  );
};
