"use strict";

import React from "react";
import ReactDOM from "react-dom";
import DatatableDataRegistRequest from "../DataRegistRequestList/DatatableDataRegistRequest";
import ModalDataItemDetail from "../DataItem/ModalDataItemDetail";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import MenuInfoTag from "@/components/MenuInfoTag";
import BoxSearchDate from "@/components/boxSearch/BoxSearchDate";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import BoxSearchSelect from "@/components/boxSearch/BoxSearchSelect";
import BoxSearchOption from "@/components/boxSearch/BoxSearchOption";
import DatatableDataUseRequest from "./DatatableDataUseRequest";
import ModalDataUseDetail from "./ModalDataUseDetail";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert, customConfirm } from "@/utils/dialogUtil";

const DataUseRequestList = () => {
  const [searchData, setSearchData] = React.useState<{} | null>({});
  const [isOpenedModalDetail, setIsOpenedModalDetail] =
    React.useState<boolean>(false);

  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);

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

  const clickModalApprove = (data: any) => {
    if (customConfirm("승인하시겠습니까?")) {
      fetchJson("PATCH",
        `/system/data-use-request/approve/${data.dataUseId}.json`,
        {
          successCallback: (responseJson: any) => {
            customAlert("적용되었습니다.");
            reloadDatatable();
          },
        },
      );
    }
  };

  const clickModalDeny = (data: any) => {
    if (customConfirm("거절하시겠습니까?")) {
      fetchJson("PATCH",
        `/system/data-use-request/deny/${data.dataUseId}.json`,
        {
          successCallback: (responseJson: any) => {
            customAlert("적용되었습니다.");
            reloadDatatable();
          },
        },
      );
    }
  };

  const openDetailModal = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalDetail(true);
  };

  const closeDetailModal = () => {
    setIsOpenedModalDetail(false);
  };

  return (
    <React.Fragment>
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
                <BoxSearchDate
                  title={"신청기간"}
                  startDataKey={"startRegDt"}
                  endDataKey={"endRegDt"}
                />
              </div>
            </div>
            <div className="row" style={{ marginBottom: "5px" }}>
              <div className="col-sm-6 col-xs-12">
                <BoxSearchText
                  title={"데이터명"}
                  elementId={"name"}
                  dataKey={"name"}
                  maxlength={50}
                />
              </div>
              <div className="col-sm-6 col-xs-12">
                <BoxSearchSelect
                  title={"승인여부"}
                  elementId={"status"}
                  dataKey={"status"}
                >
                  <BoxSearchOption label="승인대기" value="waiting" />
                  <BoxSearchOption label="승인" value="approved" />
                  <BoxSearchOption label="거절" value="denied" />
                  <BoxSearchOption label="사용중지" value="deprecated" />
                </BoxSearchSelect>
              </div>
            </div>
          </BoxSearch>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <div className="box box-primary">
              <div className="box-body">
                {
                  <DatatableDataUseRequest
                    searchData={searchData}
                    onClickDetail={openDetailModal}
                    onClickApprove={clickModalApprove}
                    onClickDeny={clickModalDeny}
                  />
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModalDataUseDetail
        data={selectedItem}
        isOpened={isOpenedModalDetail}
        onClose={closeDetailModal}
      />
    </React.Fragment>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<DataUseRequestList />, domContainer);
