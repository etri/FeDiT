import React, { useEffect, useState } from "react";
import MenuInfoTag from "@/components/MenuInfoTag";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import DatatableInstitutionUser from "@/contents/pages/system/InstitutionUserManage/DatatableInstitutionUser";
import { fetchJson } from "@/utils/fetchUtil";
import ReactDOM from "react-dom";
import ModalInstitutionUserSave from "@/contents/pages/system/InstitutionUserManage/ModalInstitutionUserSave";

type props = {};

const InstitutionUserManage = ({}: props) => {
  const [searchData, setSearchData] = useState<{} | null>({});
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isOpenedModalDetail, setIsOpenedModalDetail] = useState<boolean>(false);
  const [isOpenedModalSave, setIsOpenedModalSave] = useState<boolean>(false);

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

  const reloadDatatable = () => {
    setSearchData((prevData) => {
      return {
        ...prevData,
        stateDate: new Date(),
      };
    });
  };

  const openDetailModal = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalDetail(true);
  };

  const closeDetailModal = () => {
    setIsOpenedModalDetail(false);
  };

  const openSaveModal = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalSave(true);
  };

  const closeSaveModal = () => {
    setIsOpenedModalSave(false);
  };

  return (
    <>
      <section className="content-header">
        <MenuInfoTag />
      </section>
      <section className="content">
        <div className="row">
          <BoxSearch
            onSearchCb={handleClickSearch}
            onResetCb={handleClickReset}
          >
            <div className="row" style={{ marginBottom: "5px" }}>
              <div className="col-sm-6 col-xs-12">
                <BoxSearchText
                  title={"로그인ID"}
                  elementId={"userLoginIdLike"}
                  dataKey={"userLoginIdLike"}
                  maxlength={30}
                />
              </div>
              <div className="col-sm-6 col-xs-12">
                <BoxSearchText
                  title={"이름"}
                  elementId={"userNmLike"}
                  dataKey={"userNmLike"}
                  maxlength={30}
                />
              </div>
            </div>
          </BoxSearch>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <div className="box box-primary">
              <div className="box-body">
                <DatatableInstitutionUser
                  searchData={searchData}
                  onClickModify={openSaveModal}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalInstitutionUserSave
        data={selectedItem}
        isOpened={isOpenedModalSave}
        onClose={closeSaveModal}
        reloadDatatable={reloadDatatable}
      />

    </>
  );
};

InstitutionUserManage.defaultProps = {};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<InstitutionUserManage />, domContainer);