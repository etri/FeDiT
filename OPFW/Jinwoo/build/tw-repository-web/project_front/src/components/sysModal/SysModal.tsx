"use strict";

import React, { useEffect } from "react";

type props = {
  title: string;
  isOpened: boolean;
  ownClassName: string;
  modalWidthClass?: string;
  onClose: () => void;
  footerBeforeCloseButton?: React.ReactNode;
  children: React.ReactNode;
};

const SysModal = ({title, isOpened, ownClassName, modalWidthClass, onClose, footerBeforeCloseButton, children}:props) => {
  useEffect(() => {
    if (isOpened) {
      $("." + ownClassName).modal("show");
    } else {
      $("." + ownClassName).modal("hide");
    }
  }, [isOpened]);

  return (
    <>
      <div
        className={"modal fade " + ownClassName}
        style={{ overflowY: "auto" }}
        data-keyboard="false"
        data-backdrop="static"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className={"modal-dialog" + (modalWidthClass?" "+modalWidthClass:"")}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="modal-title">{title}</h2>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <>
                {footerBeforeCloseButton}
              </>
              <button
                type="button"
                className="btn btn-outline-primary"
                data-dismiss="modal"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SysModal;