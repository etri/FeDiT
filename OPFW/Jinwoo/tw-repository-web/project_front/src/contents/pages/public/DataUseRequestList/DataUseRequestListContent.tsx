"use strict";

import React, { RefObject, useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import MyPageTable from "@/components/myPageTable/MyPageTable";
import { createColumnHelper } from "@tanstack/react-table";
import Tooltip from "@/components/tooltip/Tooltip";
import ModalModifyDataUseRequest from "./ModalModifyDataUseRequest";
import ModalDetailDataUseRequest from "./ModalDetailDataUseRequest";
import { fetchJson } from "@/utils/fetchUtil";
import {customAlert, customConfirm} from "@/utils/dialogUtil";
import {getDateStringWithoutTimeFromString} from "@/utils/timeUtils";

const SearchBoxBlock = styled.div`
  margin-bottom: 20px;
  transition: all 0.3s ease 0s;
  padding: 22px 24px;
  border: 1px solid #f0f0f0;
  background: #fff;
  box-shadow: 0px 5px 0px 0px #f1f1f1;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;

  & > * {
    margin: 5px 0;
  }
`;

const FormItem = styled.div`
  display: inline-block;
  vertical-align: middle;
`;

const FormItemLabel = styled.label`
  font-weight: 500;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
`;

const FormInput = styled.input`
  font-size: 14px;
  border: 1px solid rgb(230, 230, 230);
  border-radius: 5px;
  padding: 5px 10px;
  min-width: 140px;
  margin-right: 10px !important;
`;

const BtnGroup = styled.div``;

const InitBtn = styled.button`
  background: #3e3e3e;
  border-radius: 5px;
  min-width: 80px;
  height: 34px;
  color: rgb(255, 255, 255);
  padding: 6px 16px;
  border-top: 9px;
  vertical-align: middle;
  font-size: 13px;
  font-weight: 400;
  margin-right: 15px;
`;

const SearchBtn = styled.button`
  background: #0771cb url(../images/cmn/ico_search.png) no-repeat left 16px
    center;
  background-size: 13px;
  padding-left: 28px;
  border-radius: 5px;
  min-width: 80px;
  height: 34px;
  color: rgb(255, 255, 255);
  padding: 6px 16px;
  padding-top: 9px;
  vertical-align: middle;
  font-size: 13px;
  font-weight: 400;
`;

type DataRegistType = {
  name: string;
  category: string;
  type: string;
  status: string;
  expireTime: string;
  currentCallCount: string;
  maxCallCount: string;
  regDt: string;
};

const columnHelper = createColumnHelper<DataRegistType>();

const DataUseRequestListContent = () => {
  const [tableRowSize] = useState(5);
  const [dataName, setDataName] = useState("");
  const [initialColumnFilter, setInitialColumnFilter] = useState({});
  const [isModalDetailOpen, setModalDetailOpen] = useState<boolean>(false);
  const [isModalModifyOpen, setModalModifyOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableKey, setTableKey] = useState(0);

  const detailButtonRefs = useMemo<RefObject<HTMLElement>[]>(
    () =>
      Array(tableRowSize)
        .fill(0)
        .map((i) => React.createRef()),
    [],
  );
  const modButtonRefs = useMemo<RefObject<HTMLElement>[]>(
    () =>
      Array(tableRowSize)
        .fill(0)
        .map((i) => React.createRef()),
    [],
  );
  const deleteButtonRefs = useMemo<RefObject<HTMLElement>[]>(
    () =>
      Array(tableRowSize)
        .fill(0)
        .map((i) => React.createRef()),
    [],
  );

  const [columns] = useState<any[]>([
    columnHelper.accessor("name", {
      header: "이름",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("purpose", {
      header: "목적",
      maxSize: 150,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("category", {
      header: "카테고리",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("type", {
      header: "타입",
      cell: ({ cell, row }) => {
        if (cell.getValue() === "TWIN") {
          return "트윈";
        } else {
          return "데이터";
        }
      },
    }),
    columnHelper.accessor("regDt", {
      header: "신청일",
      cell: (info) => getDateStringWithoutTimeFromString(info.getValue()),
    }),
    columnHelper.accessor("status", {
      header: "상태",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("currentCallCount", {
      header: "현재호출횟수",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("maxCallCount", {
      header: "최대호출횟수",
      cell: (info) => info.getValue(),
    }),
    // columnHelper.accessor('actions', {
    //     header: '기능',
    //     cell: info => <button onClick={()=>{console.log("click")}}>상세보기</button>
    // }),
    {
      id: "actions",
      header: "기능",
      cell: ({ cell, row }: { cell: any; row: any }) => {
        const canModify = row.original.status==="waiting";
        return (
          <>
            <Tooltip elementRef={detailButtonRefs[row.index]}>
              <span>상세보기</span>
            </Tooltip>
            <Tooltip elementRef={modButtonRefs[row.index]}>
              <span> {canModify?"수정":"상태가 waiting 일 경우만 수정할 수 있습니다."}</span>
            </Tooltip>
            <Tooltip elementRef={deleteButtonRefs[row.index]}>
              <span>삭제</span>
            </Tooltip>
            <div className="flex flex-row justify-start gap-x-1">
              <button
                className="rounded border border-grayscale-600"
                ref={(el: any) => (detailButtonRefs[row.index].current = el)}
                onClick={() => {
                  setSelectedItem(row.original);
                  setModalDetailOpen(true);
                }}
              >
                <img
                  draggable="false"
                  className="max-w-none h-6 w-6 p-1"
                  src={require(`../../../../../assets/images/description.png`)}
                  alt="상세보기"
                />
              </button>
              <button
                disabled={!canModify}
                className="rounded border border-grayscale-600 disabled:border-disabled disabled:bg-grayscale-200 disabled:text-disabled"
                ref={(el: any) => (modButtonRefs[row.index].current = el)}
                onClick={() => {
                  setSelectedItem(row.original);
                  setModalModifyOpen(true);
                }}
              >
                <img
                  draggable="false"
                  className="max-w-none h-6 w-6 p-1"
                  src={require(`../../../../../assets/images/edit.png`)}
                  alt="수정"
                />
              </button>
              <button
                className="rounded border border-grayscale-600"
                ref={(el: any) => (deleteButtonRefs[row.index].current = el)}
                onClick={() => onClickDelete(row.original.id) }
              >
                <img
                  draggable="false"
                  className="max-w-none h-6 w-6 p-1"
                  src={require(`../../../../../assets/images/delete.png`)}
                  alt="삭제"
                />
              </button>
            </div>
          </>
        );
      },
    },
  ]);

  const onClickDelete = (id:number) => {
    if(customConfirm("삭제하시겠습니까?")){
      fetchJson("DELETE", `/public/data-use-request/${id}.json`, {
        successCallback : (responseJson:any) => {
          setTableKey((prevKey) => prevKey + 1);
          customAlert("삭제하였습니다.");
        }
      });
    }
  }

  const onClickCloseModalDetail = () => {
    setModalDetailOpen(false);
  };

  const onClickCloseModalModify = () => {
    setModalModifyOpen(false);
  };

  const onClickModify = (data: any) => {
    setModalModifyOpen(false);

    fetchJson("PATCH", "/public/data-use-request.json", {
      data: data,
      successCallback : (responseJson:any) => {
        setTableKey((prevKey) => prevKey + 1);
        customAlert("수정되었습니다.");
      }
    });
  };

  const onClickInitBtn = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      setDataName("");
      setInitialColumnFilter({});
    },
    [setDataName, setInitialColumnFilter],
  );

  const onClickSearchBtn = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      setInitialColumnFilter({ name: dataName });
    },
    [dataName, setInitialColumnFilter],
  );

  return (
    <>
      <SearchBoxBlock>
        <FormItem>
          <FormItemLabel>이름</FormItemLabel>
          <FormInput
            type="text"
            value={dataName}
            onChange={(e) => setDataName(e.target.value)}
          />
        </FormItem>
        <BtnGroup>
          <InitBtn onClick={onClickInitBtn}>초기화</InitBtn>
          <SearchBtn onClick={onClickSearchBtn}>조회</SearchBtn>
        </BtnGroup>
      </SearchBoxBlock>
      <MyPageTable
        key={tableKey}
        columns={columns}
        pageSize={tableRowSize}
        initialColumnSort={{ id: "REG_DT", desc: true }}
        initialColumnFilter={initialColumnFilter}
        fetchUrl={"/user/data-use-request/tan-list.json"}
      />

      <ModalDetailDataUseRequest
        title="상세보기"
        isModalOpen={isModalDetailOpen}
        onClickClose={onClickCloseModalDetail}
        selectedItem={selectedItem}
      />
      <ModalModifyDataUseRequest
        title="수정"
        isModalOpen={isModalModifyOpen}
        onClickClose={onClickCloseModalModify}
        onClickModify={onClickModify}
        selectedItem={selectedItem}
      />
    </>
  );
};

export default DataUseRequestListContent;
