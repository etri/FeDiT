import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

type props = {
  isOpen: boolean;
  // hasCloseBtn?: boolean;
  onClickClose?: () => void;
  className?: string;
  children: React.ReactNode;
};

const Modal = ({
  isOpen,
  className,
  // hasCloseBtn = true,
  onClickClose,
  children,
}: props) => {
  const [isModalOpen, setModalOpen] = useState(isOpen);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleCloseModal = () => {
    if (onClickClose) {
        onClickClose();
    }
    setModalOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const modalElement = modalRef.current;

    if (modalElement) {
      if (isModalOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isModalOpen]);

  return (
    <dialog className="rounded-lg border-2 border-grayscale-400 backdrop:backdrop-brightness-50" ref={modalRef} onKeyDown={handleKeyDown}>
      <div className={className}>
        {children}
      </div>
    </dialog>
  );
};

Modal.propTypes = {};

Modal.defaultProps = {};

export default Modal;
