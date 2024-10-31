'use strict';

import React, {useState, useCallback, useEffect} from "react";
import styled from "styled-components";
import {
        createColumnHelper,
        flexRender,
        getCoreRowModel,
        PaginationState,
        useReactTable} from '@tanstack/react-table';
import MyPageTable from "@/components/myPageTable/MyPageTable";
import {getDateStringWithoutTimeFromString} from "@/utils/timeUtils";
import { fetchGet } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";

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
`

const FormItemSelect = styled.select`
    font-size: 14px;
    border: 1px solid rgb(230, 230, 230);
    border-radius: 5px;
    padding: 5px 10px;
    min-width: 140px;
    margin-right: 10px !important;
`

const BtnGroup = styled.div`

`;

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
`

const SearchBtn = styled.button`
    background: #0771cb url(../images/cmn/ico_search.png) no-repeat left 16px center;
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
`

type RestKey = {
    issueTime: string
    status: string
    token: string
    expireTime: string
}
// 발급일자, 상태, 인증키
const columnHelper = createColumnHelper<RestKey>()

const columns = [
    columnHelper.accessor('issueTime', {
        header: '발급일',
        cell: info => getDateStringWithoutTimeFromString(info.getValue())
    }),
    columnHelper.accessor('status', {
        header: '상태',
        cell: info => info.renderValue(),
    }),
    columnHelper.accessor('token', {
        header: '인증키',
        cell: info => info.renderValue(),
    }),
    columnHelper.accessor('expireTime', {
        header: '만료일',
        cell: info => info.getValue()
    }),
]

const RestKeyListContent = () => {
    const [selectedStatus, setSelectedStatus] = useState("")
    const [initialColumnFilter, setInitialColumnFilter] = useState({})
    const [tableKey, setTableKey] = useState(0);

    const onClickInitBtn = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        setSelectedStatus('')
        setInitialColumnFilter({})
    }, [setSelectedStatus, setInitialColumnFilter])

    const onClickSearchBtn = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (selectedStatus === '') {
            setInitialColumnFilter({})
        } else {
            setInitialColumnFilter({status: selectedStatus})
        }
    }, [selectedStatus, setInitialColumnFilter])

    const reissueToken = useCallback(() => {
        fetchGet("/public/user/reissueRestKey.json", {
            successCallback: (responseJson: any) => {
                customAlert("인증키가 재발급 되었습니다.");
                setTableKey(prevKey=>prevKey+1);
            },
        })
    },[]);

    return (
        <div>
            <SearchBoxBlock>
                <FormItem>
                    <FormItemLabel>상태</FormItemLabel>
                    <FormItemSelect value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="">전체</option>
                        <option value="issued">issued</option>
                        <option value="expired">expired</option>
                    </FormItemSelect>
                </FormItem>
                <BtnGroup>
                    <InitBtn onClick={onClickInitBtn}>초기화</InitBtn>
                    <SearchBtn onClick={onClickSearchBtn}>조회</SearchBtn>
                </BtnGroup>
            </SearchBoxBlock>
            <MyPageTable key={tableKey} columns={columns} pageSize={5} initialColumnSort={{id:"issue_time", desc:true}} initialColumnFilter={initialColumnFilter} fetchUrl={`/user/rest-key/list.json`}/>
            <div>
                <button onClick={reissueToken}>인증키 재발급</button>
            </div>
        </div>
    );
}

export default RestKeyListContent;