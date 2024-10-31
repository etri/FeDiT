"use strict";

import ReactDOM from "react-dom";
import DatatableDataRegistRequest from "./DatatableDataRegistRequest";
import BoxSearchText from "@/components/boxSearch/BoxSearchText";
import BoxSearch from "@/components/boxSearch/BoxSearch";
import MenuInfoTag from "@/components/MenuInfoTag";
import Global from "@/modules/Global";
import ModalDataItemDetail from "../DataItem/ModalDataItemDetail";
import BoxSearchOption from "@/components/boxSearch/BoxSearchOption";
import BoxSearchSelect from "@/components/boxSearch/BoxSearchSelect";
import BoxSearchDate from "@/components/boxSearch/BoxSearchDate";
import ModalDataItemConfirm from "./ModalDataItemConfirm";
import { useState } from "react";

const DataRegistRequestList = ({}) => {
  const [searchData, setSearchData] = useState<{} | null>({});
  const [isOpenedModalDetail, setIsOpenedModalDetail] =
    useState<boolean>(false);
  const [isOpenedModalApprove, setIsOpenedModalApprove] =
    useState<boolean>(false);
  const [isOpenedModalDeny, setIsOpenedModalDeny] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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

  const closeDataItemApproveModal = () => {
    setIsOpenedModalApprove(false);
  };

  const approveDataItem = () => {
    let params = new URLSearchParams();
    params.append("id", selectedItem.id.toString());

    let options = Global.getFetchOptionPostRequestParam(params);
    fetch("/system/data-regist-request/approve.json", options)
      .then((res) => res.json())
      .then((res) => {
        if (res.result === "success") {
          alert("적용되었습니다.");
          reloadDatatable();
        } else {
          alert(res.message);
        }
      });

    setIsOpenedModalApprove(false);
  };

  const clickModalApprove = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalApprove(true);
  };

  const closeDataItemDenyModal = () => {
    setIsOpenedModalDeny(false);
  };

  const denyDataItem = () => {
    let params = new URLSearchParams();
    params.append("id", selectedItem.id.toString());

    let options = Global.getFetchOptionPostRequestParam(params);
    fetch("/system/data-regist-request/deny.json", options)
      .then((res) => res.json())
      .then((res) => {
        if (res.result === "success") {
          alert("적용되었습니다.");
          reloadDatatable();
        } else {
          alert(res.message);
        }
      });

    setIsOpenedModalDeny(false);
  };

  const clickModalDeny = (data: any) => {
    setSelectedItem(data);
    setIsOpenedModalDeny(true);
  };

  const onClickDelete = (itemId: number) => {
    if (confirm("해당 항목을 삭제하시겠습니까?")) {
      let params = new URLSearchParams();
      params.append("id", itemId.toString());

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
                  <DatatableDataRegistRequest
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

      <ModalDataItemDetail
        data={selectedItem}
        isOpened={isOpenedModalDetail}
        onClose={closeDetailModal}
      />

      <ModalDataItemConfirm
        title="데이터 승인"
        data={selectedItem}
        isOpened={isOpenedModalApprove}
        ownClassName="modal-approve"
        onClose={closeDataItemApproveModal}
        onConfirm={approveDataItem}
      >
        <div>
          rest api(
          <a
            href={`${selectedItem?.restIp}:${selectedItem?.restPort}`}
            target="_blank"
          >{`${selectedItem?.restIp}:${selectedItem?.restPort}`}</a>
          )와 <br /> swagger client({" "}
          <a
            href={`${selectedItem?.swaggerUri}`}
            target="_blank"
          >{`${selectedItem?.swaggerUri}`}</a>
          )를 확인 하였습니까?
        </div>
      </ModalDataItemConfirm>

      <ModalDataItemConfirm
        title="데이터 거절"
        data={selectedItem}
        isOpened={isOpenedModalDeny}
        ownClassName="modal-deny"
        onClose={closeDataItemDenyModal}
        onConfirm={denyDataItem}
      >
        <div>
          rest api(
          <a
            href={`${selectedItem?.restIp}:${selectedItem?.restPort}`}
            target="_blank"
          >{`${selectedItem?.restIp}:${selectedItem?.restPort}`}</a>
          )와 <br /> swagger client({" "}
          <a
            href={`${selectedItem?.swaggerUri}`}
            target="_blank"
          >{`${selectedItem?.swaggerUri}`}</a>
          )를 확인 하였습니까?
        </div>
      </ModalDataItemConfirm>
    </>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<DataRegistRequestList />, domContainer);
