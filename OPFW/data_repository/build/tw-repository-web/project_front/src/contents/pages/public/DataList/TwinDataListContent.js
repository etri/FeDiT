'use strict';

import React, {useCallback, useEffect, useState} from "react";
import styled from "styled-components";
import axios from 'axios';
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";

const TwinDataListContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
`

const TwinDataListContent = ({ searchValue }) => {
    const [twinData, setTwinData] = useState(null)
    const [page, setPage] = useState(0)
    const [timestamp, setTimestamp] = useState(Date.now)
    const [error, setError] = useState(null)

    const fetchTwinData = async () => {
        try {
            const response = await axios.get(
                '/public/data-item/list.json', {
                    params: {
                        type: "TWIN",
                        name: searchValue,
                        start: page * 10
                    }
                }
            );

            setTwinData(response?.data)
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        setPage(0)
        setTimestamp(Date.now())
    }, [searchValue]);

    useEffect(() => {
        fetchTwinData();
    }, [page, timestamp]);

    const onClickCard = useCallback((key) => {
        const currentScheme = window.location.protocol
        const currentHost = window.location.host

        let url = currentScheme + "//" +  currentHost + "/detail.mng";
        window.location.href = url + `?type=twin&id=${key}`
    }, []);

    if (error) return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>

    return (
        <TwinDataListContentWrapper>
            {twinData && twinData.data?.map(twin => (
                <Card key={twin.id}
                      title={twin.name}
                      content={`${twinData.gatewayUrl}/${twin.serviceId}/v1`}
                      onClickCard={() => onClickCard(twin.id)}
                      width={"62%"}
                      isCursor={true}/>
            ))}
            {twinData &&
                <Pagination
                    page={page}
                    lastPage={parseInt(twinData.recordsTotal / 10)}
                    setPage={setPage}
                />
            }
        </TwinDataListContentWrapper>
    )
}

export default TwinDataListContent