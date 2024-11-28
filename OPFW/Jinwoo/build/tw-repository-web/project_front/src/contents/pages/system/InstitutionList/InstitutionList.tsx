import React, { useState } from "react";
import MenuInfoTag from "@/components/MenuInfoTag";
import BoxButtonRightAligned from "@/components/boxSearch/BoxButtonRightAligned";
import ReactDOM from "react-dom";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import DatatableInstitution from "./DatatableInstitution";
import Global from "@/modules/Global";
import ModalInstitutionSave from "./ModalInstitutionSave";
import { fetchGet, fetchJson } from "@/utils/fetchUtil";
import { customAlert, customConfirm } from "@/utils/dialogUtil";
import ModalInstitutionDetail from "@/contents/pages/system/InstitutionList/ModalInstitutionDetail";
import ModalInstitutionManager from "@/contents/pages/system/InstitutionList/ModalInstitutionManager";

type props = {};

const InstitutionList = ({}: props) => {
  const [searchData, setSearchData] = useState<{} | null>({});

  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
  const [isOpenedModalDetail, setIsOpenedModalDetail] =
    React.useState<boolean>(false);
  const [isOpenedModalSave, setIsOpenedModalSave] =
    React.useState<boolean>(false);
  const [isOpenedModalManager, setIsOpenedModalManager] =
    React.useState<boolean>(false);

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
        stateDate: new Date()
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

  const onClickSetManager = (data: any) => {
    openManagerModal();
  };

  const openManagerModal = () => {
    setIsOpenedModalManager(true);
  };

  const closeManagerModal = () => {
    setIsOpenedModalManager(false);
  };

  const onClickAssignManager = (data:any) => {
      fetchGet(`/system/user/detail/${data.userId}.json`, {
        successCallback: (responseJson: any) => {
          setSelectedItem((prev:any) => {
            return {
              ...prev,
              managerUserId:data.userId,
              managerUserName:responseJson.userNm,
            }
          })
          closeManagerModal();
        },
      });
  }

  const onClickDelete = (data: any) => {
    if (customConfirm("삭제하시겠습니까?")) {
      fetchJson("DELETE", `/system/institution/${data.id}.json`, {
        successCallback: (responseJson: any) => {
          reloadDatatable();
          customAlert("삭제하였습니다.");
        }
      });
    }
  };

  return (
    <>
      <section className="content-header">
        <MenuInfoTag />
      </section>
      <section className="content">
        <div className="row">
          <BoxButtonRightAligned clickHandler={openSaveModal} title={"등록"} />
        </div>
        <div className="row">
          <BoxSearch
            onSearchCb={handleClickSearch}
            onResetCb={handleClickReset}
          >
            <div className="col-sm-6 col-xs-12">
              <BoxSearchText
                title={"기관명"}
                elementId={"name"}
                dataKey={"name"}
                maxlength={50}
              />
            </div>
          </BoxSearch>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <div className="box box-primary">
              <div className="box-body">
                <DatatableInstitution
                  searchData={searchData}
                  hasWritePermission={Global.hasSystemRole()}
                  onClickDetail={openDetailModal}
                  onClickModify={openSaveModal}
                  onClickDelete={onClickDelete}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalInstitutionSave
        data={selectedItem}
        isOpened={isOpenedModalSave}
        onClose={closeSaveModal}
        onClickSetManager={onClickSetManager}
        reloadDatatable={reloadDatatable}
         />

      <ModalInstitutionDetail
        data={selectedItem}
        isOpened={isOpenedModalDetail}
        onClose={closeDetailModal}
      />

      <ModalInstitutionManager
        institutionId={selectedItem?.id}
        isOpened={isOpenedModalManager}
        onClose={closeManagerModal}
        onClickAssignManager={onClickAssignManager}
      />
    </>
  );
};

InstitutionList.defaultProps = {};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<InstitutionList />, domContainer);
