"use strict";

import React, { useState } from "react";
import MenuInfoTag from "@/components/MenuInfoTag";
import BoxButtonRightAligned from "@/components/boxSearch/BoxButtonRightAligned";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import DatatableInstitution from "@/contents/pages/system/InstitutionList/DatatableInstitution";
import Global from "@/modules/Global";
import DatatableDataItemInstitution from "@/contents/pages/system/DataItem/DatatableDataItemInstitution";
import DatatableDataCategory from "@/contents/pages/system/DataCategoryList/DatatableDataCategory";
import ReactDOM from "react-dom";
import ModalDataCategorySave from "@/contents/pages/system/DataCategoryList/ModalDataCategorySave";
import { customAlert, customConfirm } from "@/utils/dialogUtil";
import { fetchJson } from "@/utils/fetchUtil";

type props = {

}

const DataCategoryList = ({}: props) => {
  const [searchData, setSearchData] = useState<{} | null>({});
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [isOpenedModalSave, setIsOpenedModalSave] =
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
        stateDate: new Date()
      };
    });
  };

  const openSaveModal = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalSave(true);
  };

  const closeSaveModal = () => {
    setIsOpenedModalSave(false);
  };

  const onClickDelete = (data: any) => {
    if (customConfirm("삭제하시겠습니까?")) {
      fetchJson("DELETE", `/system/data-category/${data.category}.json`, {
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
                <DatatableDataCategory
                  searchData={searchData}
                  // onClickDetail={openDetailModal}
                  onClickModify={openSaveModal}
                  onClickDelete={onClickDelete}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalDataCategorySave data={selectedItem} isOpened={isOpenedModalSave} onClose={closeSaveModal} reloadDatatable={reloadDatatable}/>
    </>
  );
};

DataCategoryList.defaultProps = {};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<DataCategoryList />, domContainer);