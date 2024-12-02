import React from 'react';
import PropTypes from 'prop-types';
import ButtonView from "../button/ButtonView";
import {buttonCategories, buttonLevels} from "../constants";
import Modal from "./Modal";

type props = {
    title?: string;
    isOpen: boolean;
    onClickClose: () => void;
    onClickModify: () => void;
    className?: string;
    children: React.ReactNode;
}

const ModalModify = ({ title, className, isOpen, onClickClose, onClickModify, children }: props) => {
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
            <div className="flex flex-row justify-center gap-x-2 mt-5">
                <ButtonView
                    level={buttonLevels.secondary}
                    category={buttonCategories.info}
                    onClick={onClickClose}
                    text="닫기"
                />
                <ButtonView
                    type="submit"
                    level={buttonLevels.primary}
                    category={buttonCategories.info}
                    onClick={onClickModify}
                    text="수정"
                />
            </div>
        </Modal>
    );
};

ModalModify.defaultProps = {};

export default ModalModify;