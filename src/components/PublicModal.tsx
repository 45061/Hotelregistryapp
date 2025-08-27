/* eslint-disable arrow-body-style */
import { Modal } from "@mantine/core";

// eslint-disable-next-line react/function-component-definition
const PublicModal = ({ opened, children, onClose, size, title }) => {
  return (
    <Modal opened={opened} onClose={onClose} size={size} title={title} centered>
      {children}
    </Modal>
  );
};

export default PublicModal;
