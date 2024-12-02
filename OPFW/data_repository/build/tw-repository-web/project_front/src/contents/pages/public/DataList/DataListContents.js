'use strict';

import React, {useEffect, useState, useCallback} from "react";
import styled from "styled-components";
import axios from 'axios';
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";

const EmptyContent = styled.div`
    height: 2000px;
`
const DataListContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
`

const DataListContent = ({ searchValue, category }) => {
    const [dataList, setDataList] = useState(null)

    const [page, setPage] = useState(0)
    const [timestamp, setTimestamp] = useState(Date.now())
    const [error, setError] = useState(null)

    const fetchData = async () => {
        try {
            const response = await axios.get(
                '/public/data-item/list.json', {
                    params: {
                        name: searchValue,
                        category: category,
                        start: page * 10
                    }
                }
            );

            setDataList(response?.data)
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        setPage(0)
        setTimestamp(Date.now())
    }, [searchValue, category]);

    useEffect(() => {
        fetchData();
    }, [page, timestamp]);

    const onClickCard = useCallback((type, key) => {
        const currentScheme = window.location.protocol
        const currentHost = window.location.host

        let url = currentScheme + "//" +  currentHost + "/detail.mng";
        window.location.href = url + `?type=${type}&id=${key}`
    }, []);

    if (error) return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>

    return (
        <DataListContentWrapper>
            {dataList && dataList.data?.map(dataElement => (
                <Card key={dataElement.id}
                      type={dataElement.type}
                      title={dataElement.name}
                      dataFormat={dataElement.dataFormat}
                      content={`${dataList.gatewayUrl}/${dataElement.serviceId}/v1`}
                      onClickCard={() => onClickCard(dataElement.type, dataElement.id)}
                      width={"62%"}
                      isCursor={true} />
            ))}
            {dataList &&
                <Pagination
                    page={page}
                    lastPage={parseInt(dataList.recordsTotal / 10)}
                    setPage={setPage}
                />
            }
            {!dataList && <EmptyContent/>}
        </DataListContentWrapper>
    )
}

export default React.memo(DataListContent)