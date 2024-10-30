import React, { RefObject, useCallback, useMemo, useState } from "react";
import ModalDetail from "@/components/modal/ModalDetail";
import { createColumnHelper } from "@tanstack/react-table";
import MyPageTable from "@/components/myPageTable/MyPageTable";
import Tooltip from "@/components/tooltip/Tooltip";
import styled from "styled-components";

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

type props = {
  title: string;
  isModalOpen: boolean;
  onClickClose: () => void;
  onClickSetInstitution: (data:any) => void;
};

type Institution = {
  id: number
  name: string
  phoneNumber: string
}

const columnHelper = createColumnHelper<Institution>()

const ModalSetInstitution = ({ title, isModalOpen, onClickClose, onClickSetInstitution }: props) => {
  const [tableKey, setTableKey] = useState(0);
  const [tableRowSize] = useState(5);
  const [dataName, setDataName] = useState("");
  const [initialColumnFilter, setInitialColumnFilter] = useState({});

  const tableButtonRefs = useMemo<RefObject<HTMLElement>[]>(
    () =>
      Array(tableRowSize)
        .fill(0)
        .map((i) => React.createRef()),
    [],
  );

  const [columns] = useState<any[]>([
    columnHelper.accessor('name', {
      header: '이름',
      cell: info => info.renderValue(),
    }),
    columnHelper.accessor('phoneNumber', {
      header: '전화번호',
      cell: info => info.renderValue(),
    }),
    {
      id: "action",
      header: ({column}:{column:any}) => (
        <div className="flex flex-row justify-center">
          기능
        </div>
      ),
      cell: ({cell, row}:{ cell: any; row: any }) => {
        return (
          <>
            <Tooltip elementRef={tableButtonRefs[row.index]}>
              <span>설정하기</span>
            </Tooltip>
            <div className="flex flex-row justify-center gap-x-1">
              <button
                className="rounded border border-grayscale-600"
                ref={(el: any) => (tableButtonRefs[row.index].current = el)}
                onClick={() => {
                  onClickSetInstitution(row.original);
                }}
              >
                <img
                  draggable="false"
                  className="max-w-none h-6 w-6 p-1"
                  src={require(`../../../../../assets/images/description.png`)}
                  alt="상세보기"
                />
              </button>
            </div>
          </>
        )
      }
    }
  ]);

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

  return <ModalDetail
    title={title}
    className="min-w-[800px] gap-y-2"
    isOpen={isModalOpen}
    onClickClose={onClickClose}
  >
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
    <MyPageTable key={tableKey} columns={columns} pageSize={5} initialColumnSort={{ id: "name", desc: true }} initialColumnFilter={initialColumnFilter}
                 fetchUrl={`/public/institution/list.json`} />
  </ModalDetail>;
};

ModalSetInstitution.defaultProps = {};

export default ModalSetInstitution;
