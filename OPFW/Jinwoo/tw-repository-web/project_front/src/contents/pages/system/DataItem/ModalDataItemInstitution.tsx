"use strict";

import React, { useState } from "react";
import SysModal from "@/components/sysModal/SysModal";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import DatatableDataItemInstitution from "@/contents/pages/system/DataItem/DatatableDataItemInstitution";

type props = {
  isOpened: boolean;
  onClose: ()=>void;
  onClickAssignInstitution: (data:any)=>void;
}

const ModalDataItemInstitution = ({isOpened, onClose, onClickAssignInstitution}: props) => {
  const [searchData, setSearchData] = useState<{} | null>({});
  const [rerenderTime, setRerenderTime] = useState<number>(Date.now());

  const onCloseThis = () => {
    setRerenderTime(Date.now());
    onClose();
  }

  const handleClickSearch = (data: Object) => {
    setSearchData((prevData) => {
      return data;
    });
  };

  const handleClickReset = () => {
    setSearchData((prevData) => {
      return {};
    });
  };

  return (
    <SysModal
      ownClassName="data-item-institution-modal"
      modalWidthClass="modal-lg"
      isOpened={isOpened}
      onClose={onCloseThis}
      title={"기관설정"}
    >
      <div className="row">
        <BoxSearch onSearchCb={handleClickSearch} onResetCb={handleClickReset} rerenderTime={rerenderTime}>
          <div className="col-sm-6 col-xs-12">
            <BoxSearchText
              title={"이름명"}
              elementId={"name"}
              dataKey={"name"}
              maxlength={30}
            />
          </div>
        </BoxSearch>
      </div>
      <div className="row">
        <div className="col-xs-12">
          <div className="box box-primary">
            <div className="box-body">
              <DatatableDataItemInstitution
                searchData={searchData}
                onClickAssign={onClickAssignInstitution}
              />
            </div>
          </div>
        </div>
      </div>
    </SysModal>
  );
};

ModalDataItemInstitution.defaultProps = {};

export default ModalDataItemInstitution;