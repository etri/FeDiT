import React from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import ButtonView from "../button/ButtonView";
import { buttonCategories, buttonLevels } from "../constants";

type props = {
  title?: string;
  isOpen: boolean;
  onClickClose: () => void;
  className?: string;
  children: React.ReactNode;
};

const ModalDetail = ({ title, className, isOpen, onClickClose, children }: props) => {
  return (
    <Modal
      className={`flex flex-col justify-center pt-10 pb-4 px-[12%] ${className}`}
      isOpen={isOpen}
      onClickClose={onClickClose}
    >
      <div>
        <h3 className="mb-8 text-center font-nanumSquareR text-2xl font-bold">
          {title}
        </h3>
      </div>
      {children}
      <div className="flex flex-row justify-center mt-5">
        <ButtonView
          level={buttonLevels.secondary}
          category={buttonCategories.info}
          onClick={onClickClose}
          text="닫기"
        />
      </div>
    </Modal>
  );
};

ModalDetail.defaultProps = {};

export default ModalDetail;
