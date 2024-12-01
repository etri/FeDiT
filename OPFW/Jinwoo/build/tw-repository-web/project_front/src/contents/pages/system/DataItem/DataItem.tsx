"use strict";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import Global from "@/modules/Global";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import DatatableDataItem from "./DatatableDataItem";
import ModalDataItemDetail from "./ModalDataItemDetail";
import ModalDataItemSave from "./ModalDataItemSave";
import MenuInfoTag from "@/components/MenuInfoTag";
import ModalDataItemInstitution from "@/contents/pages/system/DataItem/ModalDataItemInstitution";

function DataItem() {
  const [searchData, setSearchData] = useState<{} | null>({});

  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [isOpenedModalDetail, setIsOpenedModalDetail] =
    useState<boolean>(false);
  const [isOpenedModalSave, setIsOpenedModalSave] =
    useState<boolean>(false);
  const [isOpenedModalInstitution, setIsOpenedModalInstitution] =
    useState<boolean>(false);

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

  const openInstitutionModal = () => {
    setIsOpenedModalInstitution(true);
  };

  const closeInstitutionModal = () => {
    setIsOpenedModalInstitution(false);
  };

  const onClickAssignInstitution = (data: any) => {
    setSelectedItem((prev: any) => {
      return {
        ...prev,
        institutionId: data.id,
        institutionName: data.name,
      };
    });

    closeInstitutionModal();
  };

  const onClickDelete = (data: any) => {
    if (confirm("해당 항목을 삭제하시겠습니까?")) {
      let params = new URLSearchParams();
      params.append("id", data.id.toString());

      let options = Global.getFetchOptionPostRequestParam(params);
      fetch("/user/data-item/delete.json", options)
        .then((res) => res.json())
        .then((res) => {
          if (res.result === "success") {
            alert("삭제되었습니다");
            reloadDatatable();
          } else {
            alert(res.message);
          }
        });
    } //if
  };

  return (
    <>
      <section className="content-header">
        <MenuInfoTag />
      </section>
      <section className="content">
        {/*{*/}
        {/*    !loading&&null!=dataInitial&&dataInitial.hasWritePermission?*/}
        {/*        <div className="row">*/}
        {/*            <BoxButtonRightAligned clickHandler={openSaveModal} title={"등록"}/>*/}
        {/*        </div>*/}
        {/*        : null*/}
        {/*}*/}
        <div className="row">
          <BoxSearch
            onSearchCb={handleClickSearch}
            onResetCb={handleClickReset}
          >
            <div className="col-sm-6 col-xs-12">
              <BoxSearchText
                title={"데이터명"}
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
                  <DatatableDataItem
                    searchData={searchData}
                    onClickDetail={openDetailModal}
                    onClickModify={openSaveModal}
                    onClickDelete={onClickDelete}
                  />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalDataItemDetail
        data={selectedItem}
        isOpened={isOpenedModalDetail}
        onClose={closeDetailModal}
      />

      <ModalDataItemSave
        data={selectedItem}
        isOpened={isOpenedModalSave}
        onClose={closeSaveModal}
        onClickOpenInstitutionModal={openInstitutionModal}
        reloadDatatable={reloadDatatable}
      />

      <ModalDataItemInstitution
        isOpened={isOpenedModalInstitution}
        onClose={closeInstitutionModal}
        onClickAssignInstitution={onClickAssignInstitution}
      />
    </>
  );
}

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<DataItem />, domContainer);
