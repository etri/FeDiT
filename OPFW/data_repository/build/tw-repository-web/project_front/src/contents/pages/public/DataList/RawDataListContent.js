'use strict';

import React, {useEffect, useState, useCallback} from "react";
import styled from "styled-components";
import axios from 'axios';
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";

const RawDataListContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
`

const RawDataListContent = ({ searchValue }) => {
    const [rawData, setRawData] = useState(null)

    const [page, setPage] = useState(0)
    const [timestamp, setTimestamp] = useState(Date.now())
    const [error, setError] = useState(null)

    const fetchRawData = async () => {
        try {
            const response = await axios.get(
                '/public/data-item/list.json', {
                    params: {
                        type: "RAWDATA",
                        name: searchValue,
                        start: page * 10
                    }
                }
            );

            setRawData(response?.data)
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        setPage(0)
        setTimestamp(Date.now())
    }, [searchValue]);

    useEffect(() => {
        fetchRawData();
    }, [page, timestamp]);

    const onClickCard = useCallback((key) => {
        const currentScheme = window.location.protocol
        const currentHost = window.location.host

        let url = currentScheme + "//" +  currentHost + "/detail.mng";
        window.location.href = url + `?type=rawdata&id=${key}`
    }, []);

    if (error) return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>

    return (
        <RawDataListContentWrapper>
            {rawData && rawData.data?.map(raw => (
                  <Card key={raw.id}
                        title={raw.name}
                        content={`${rawData.gatewayUrl}/${raw.serviceId}/v1`}
                        onClickCard={() => onClickCard(raw.id)}
                        width={"62%"}
                        isCursor={true} />
            ))}
            {rawData &&
                <Pagination
                    page={page}
                    lastPage={parseInt(rawData.recordsTotal / 10)}
                    setPage={setPage}
                />
            }
        </RawDataListContentWrapper>
    )
}

export default RawDataListContent