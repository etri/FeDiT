"use strict";

import React, { useCallback, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  PaginationState,
  ColumnSort,
  useReactTable,
} from "@tanstack/react-table";
import {customAlert} from "../../utils/dialogUtil";

type MyPageTableType = {
  key: number;
  columns: any[];
  meta?: any;
  pageSize: number;
  fetchUrl: string;
  initialColumnSort: ColumnSort;
  initialColumnFilter?: Record<string, any>;
};

const MyPageTable = ({
  key,
  columns,
  pageSize,
  fetchUrl,
  initialColumnSort,
  initialColumnFilter,
}: MyPageTableType) => {
  const [data, setData] = React.useState([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [rowCount, setRowCount] = React.useState(0);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    manualPagination: true,
    rowCount: rowCount,
  });

  const fetchList = useCallback(async () => {
    let params = new URLSearchParams();
    params.append(
      `start`,
      (pagination.pageIndex * pagination.pageSize).toString(),
    );
    params.append(`length`, pagination.pageSize);
    params.append(`pagingYn`, "true");
    if (initialColumnSort) {
      params.append(`sort`, initialColumnSort.id);
      params.append(`sortOrd`, initialColumnSort.desc ? "desc" : "asc");
    }

    // 필터링 파라미터를 URLSearchParams에 추가
    if (initialColumnFilter) {
      Object.keys(initialColumnFilter).forEach((key) => {
        params.append(key, initialColumnFilter[key]);
      });
    }

    return fetch(`${fetchUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }).then(async (response) => {
      if (!response.ok) {
        let message = await response.text();
        throw new Error(message);
      }

      return response.json();
    });
  }, [pagination, initialColumnSort, fetchUrl, initialColumnFilter]);

  const renderPagination = () => {
    let pageRange = 2;
    let pageStart = Math.max(pagination.pageIndex - pageRange, 0);
    let pageEnd = Math.min(
      pagination.pageIndex + pageRange,
      table.getPageCount() - 1,
    );
    let pageArray = Array.from(
      { length: pageEnd - pageStart + 1 },
      (_, index) => index + pageStart,
    );

    return (
      <div className="pagination flex flex-row justify-center space-x-1">
        <button
          className="control"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="control"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <div className="flex flex-row justify-center">
          {pageArray.map((item) => (
            <a
              className={
                item === table.getState().pagination.pageIndex ? "active" : ""
              }
              onClick={(e: any) =>
                setPagination((prevState) => {
                  return { ...prevState, pageIndex: item };
                })
              }
            >
              {item + 1}
            </a>
          ))}
        </div>
        <button
          className="control"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="control"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        {/*<div>{table.getRowCount()}</div>*/}
        {/*<div className="flex-row items-center gap-1">*/}
        {/*    <div>Page</div>*/}
        {/*    <strong>*/}
        {/*    {table.getState().pagination.pageIndex + 1} of{' '}*/}
        {/*        {table.getPageCount().toLocaleString()}*/}
        {/*    </strong>*/}
        {/*    <div>{table.getRowCount()}</div>*/}
        {/*</div>*/}
      </div>
    );
  };

  useEffect(() => {
    fetchList()
      .then((res: any) => {
        setData(res.data);
        setRowCount(res.recordsTotal);
      })
      .catch((e) => {
        console.log(e);
        customAlert("리스트 데이터를 받아오는 중 에러가 발생하였습니다.");
      });
  }, [pagination]);

  useEffect(() => {
    if (initialColumnFilter) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [initialColumnFilter]);

  return (
    <div className="p-2">
      <table key={key} className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={{ width: `${header.getSize()}px` }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    maxWidth: `${cell.column.columnDef.maxSize}px`,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-2" />
      {renderPagination()}
    </div>
  );
};

export default MyPageTable;
