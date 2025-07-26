import { useState } from "react";

export const useUnsavedChanges = (isDirty: boolean, onClose: () => void) => {
  const [showQuitModal, setShowQuitModal] = useState(false);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowQuitModal(true);
    } else {
      onClose();
    }
  };

  const handleConfirmQuit = () => {
    setShowQuitModal(false);
    onClose();
  };

  const handleCancelQuit = () => {
    setShowQuitModal(false);
  };

  const resetQuitModal = () => {
    setShowQuitModal(false);
  };

  return {
    showQuitModal,
    handleCloseAttempt,
    handleConfirmQuit,
    handleCancelQuit,
    resetQuitModal,
  };
};
