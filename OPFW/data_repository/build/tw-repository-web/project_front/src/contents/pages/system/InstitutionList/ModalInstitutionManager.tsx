"use strict";

import React, { useEffect, useState } from "react";
import SysModal from "@/components/sysModal/SysModal";
import DatatableManagerUser from "@/contents/pages/system/InstitutionList/DatatableManagerUser";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";

type props = {
  institutionId: number | null;
  isOpened: boolean;
  onClose: () => void;
  onClickAssignManager:(data:any)=>void;
}

const ModalInstitutionManager = ({institutionId, isOpened, onClose, onClickAssignManager}: props) => {
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
      ownClassName="manager-modal"
      modalWidthClass="modal-lg"
      isOpened={isOpened}
      onClose={onCloseThis}
      title={"관리자등록"}
    >
      <div className="row">
        <BoxSearch onSearchCb={handleClickSearch} onResetCb={handleClickReset} rerenderTime={rerenderTime}>
          <div className="col-sm-6 col-xs-12">
            <BoxSearchText
              title={"로그인아이디"}
              elementId={"userLoginIdLike"}
              dataKey={"userLoginIdLike"}
              maxlength={30}
            />
          </div>
          <div className="col-sm-6 col-xs-12">
            <BoxSearchText
              title={"이름명"}
              elementId={"userNmLike"}
              dataKey={"userNmLike"}
              maxlength={30}
            />
          </div>
        </BoxSearch>
      </div>
      <div className="row">
        <div className="col-xs-12">
          <div className="box box-primary">
            <div className="box-body">
              <DatatableManagerUser
                searchData={{...searchData, institutionId: institutionId}}
                onClickAssignManager={onClickAssignManager}
              />
            </div>
          </div>
        </div>
      </div>
    </SysModal>
  );
};

ModalInstitutionManager.defaultProps = {};

export default ModalInstitutionManager;