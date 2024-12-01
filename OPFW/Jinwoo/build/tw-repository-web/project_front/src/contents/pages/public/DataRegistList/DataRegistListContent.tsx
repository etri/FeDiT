'use strict';

import React, {useState, useCallback, useEffect} from "react";
import styled from "styled-components";
import axios from 'axios';
import MyPageTable from '@/components/myPageTable/MyPageTable'
import {createColumnHelper} from "@tanstack/react-table";

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

type DataRegistType = {
    id: number
    category: string
    type: string
    regDt: string
    status: string
    expireTime: string
}

const columnHelper = createColumnHelper<DataRegistType>()

const columns = [
    columnHelper.accessor('id', {
        header: 'id',
        cell: info => info.getValue()
    }),
    columnHelper.accessor('category', {
        header: '카테고리',
        cell: info => info.getValue()
    }),
    columnHelper.accessor('type', {
        header: '타입',
        cell: ({cell, row}) => {
            if(cell.getValue()==='TWIN'){
                return '트윈'
            }else{
                return '데이터'
            }
        }
    }),
    columnHelper.accessor('regDt', {
        header: '신청일',
        cell: info => info.getValue()
    }),
    columnHelper.accessor('status', {
        header: '상태',
        cell: info => info.getValue()
    }),
]

const DataRegistListContent = () => {
    const [searchData, setSearchData] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [initialColumnFilter, setInitialColumnFilter] = useState({})
    const [tableKey, setTableKey] = useState(0);

    const onClickInitBtn = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault()

        setSelectedCategory('')
        setSelectedStatus('')
        setSelectedType('')
        setInitialColumnFilter({})
    }, [setSelectedStatus, setSelectedType, setSelectedCategory]);

    const onClickSearchBtn = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault()

        let tempColumnFilter = {}
        if (selectedCategory && selectedCategory !== '') {
            tempColumnFilter["category"] = selectedCategory
        }
        if (selectedType && selectedType !== '') {
            tempColumnFilter["type"] = selectedType
        }
        if (selectedStatus && selectedStatus !== '') {
            tempColumnFilter["status"] = selectedStatus
        }

        setInitialColumnFilter(tempColumnFilter)
    }, [selectedType, selectedCategory, selectedStatus, setInitialColumnFilter]);

    const fetchSelectData = async () => {
        try {
            const response = await axios.get(
                '/user/data-item/select-list.json', {}
            )
            setSearchData(response?.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchSelectData()
    }, []);

    return (
        <>
            <SearchBoxBlock>
                <FormItem>
                    <FormItemLabel>카테고리</FormItemLabel>
                    <FormItemSelect value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">전체</option>
                        {searchData && searchData?.category?.map((str, index) => {
                            return <option key={str} value={str}>{str}</option>;
                        })}
                    </FormItemSelect>
                    <FormItemLabel>타입</FormItemLabel>
                    <FormItemSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="">전체</option>
                        {searchData && searchData?.type?.map((str, index) => {
                            const typeConverter = {
                                RAWDATA: "데이터",
                                TWIN: "트윈"
                            }

                            return <option key={str} value={str}>{typeConverter[str]}</option>;
                        })}
                    </FormItemSelect>
                    <FormItemLabel>상태</FormItemLabel>
                    <FormItemSelect value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="">전체</option>
                        {searchData && searchData?.status?.map((str, index) => {
                            return <option key={str} value={str}>{str}</option>;
                        })}
                    </FormItemSelect>
                </FormItem>
                <BtnGroup>
                    <InitBtn onClick={onClickInitBtn}>초기화</InitBtn>
                    <SearchBtn onClick={onClickSearchBtn}>조회</SearchBtn>
                </BtnGroup>
            </SearchBoxBlock>
            <MyPageTable key={tableKey} columns={columns} pageSize={5} initialColumnSort={{id:"REG_DT", desc:true}} initialColumnFilter={initialColumnFilter} fetchUrl={'/user/data-item/tan-list.json'}/>
        </>
    )
}

export default DataRegistListContent;