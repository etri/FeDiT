import React from "react";

import SysModal from '@/components/sysModal/SysModal'

type props = {
  title:string;
  data:any;
  isOpened:boolean;
  ownClassName:string;
  onClose:()=>void;
  onConfirm:()=>void;
  children: React.ReactNode;
}

const ModalDataItemConfirm = ({title, data, isOpened, ownClassName, onClose, onConfirm, children}: props) => {

  const footerBeforeCloseButton = (<button type="button" className="btn btn-outline-primary" onClick={onConfirm}>확인</button>);

  return (
    <>
      <SysModal title={title} ownClassName={ownClassName} isOpened={isOpened} onClose={onClose}
             footerBeforeCloseButton={footerBeforeCloseButton}>
        {children}
      </SysModal>
    </>
  );
};

ModalDataItemConfirm.defaultProps = {};

export default ModalDataItemConfirm;