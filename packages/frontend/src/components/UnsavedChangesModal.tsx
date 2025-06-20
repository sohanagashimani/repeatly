import { Modal, Button } from "antd";

export const UnsavedChangesModal = ({
  visible = true,
  setQuitModalVisible = () => true,
  onOkClick = () => true,
  title = "Quit Editing?",
  subTitle = "You have unsaved changes. Are you sure you want to leave?",
}: {
  visible: boolean;
  setQuitModalVisible: (value: boolean) => void;
  onOkClick: () => void;
  title?: string;
  subTitle?: string;
}) => {
  return (
    <Modal
      title={
        <p className="text-black text-2xl font-bold mt-4 text-center">
          {title}
        </p>
      }
      open={visible}
      onCancel={setQuitModalVisible}
      destroyOnClose={true}
      style={{ fontFamily: "figtree", top: "25%" }}
      transitionName=""
      width={400}
      footer={
        <div className="flex flex-row gap-2 justify-center w-full">
          <Button
            key="stay"
            onClick={setQuitModalVisible}
            className="text-textColor text-base font-normal leading-snug text-center w-full h-10"
          >
            No
          </Button>
          <Button
            key="discard"
            type="primary"
            danger
            onClick={onOkClick}
            className="text-textColor text-base font-normal leading-snug text-center w-full h-10"
          >
            Yes, cancel
          </Button>
        </div>
      }
    >
      <div className="w-auto h-auto mt-3 text-textColor text-base font-normal leading-snug text-center">
        {subTitle}
      </div>
    </Modal>
  );
};
