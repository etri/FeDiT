'use strict';

import React, {useState, useEffect} from "react";
import styled from "styled-components";
import CollectorCard from "./CollectorCard";
import Pagination from "@/components/Pagination";
import axios from "axios";
import Select from 'react-select';
import useTimer from "@/hooks/useTimer";

const CollectorMonitoringListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
`;

const IntervalPickerBlock = styled.div`
    display: flex;
    justify-content: right;
    width: 86%;
    margin-bottom: -5px;
`;

const CollectorMonitoringList = ({ searchValue }) => {
    const [monitoringData, setMonitoringData] = useState(null)
    const [page, setPage] = useState(0)
    const [timestamp, setTimestamp] = useState(Date.now())
    const [error, setError] = useState(null)
    const [selectVal, setSelectVal] = useState({value: 'off', label: 'off'})
    const [current, delayValue, isActive, setDelayValue, setIsActive] = useTimer(0, false)

    const options = [
        { value: 'off', label: 'off' },
        { value: '30', label: '30초' },
        { value: '60', label: '1분' },
    ]

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            height: '30px',
            minHeight: '30px'
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: '30px',
            padding: '0 6px'
        }),
        menu: (base) => ({ ...base, marginTop: '5px' }),
        input: (provided) => ({
            ...provided,
            margin: '0px',
        }),
        indicatorSeparator: state => ({
            display: 'none',
        }),
        indicatorsContainer: (provided, state) => ({
            ...provided,
            height: '30px',
        }),
    };
    const fetchMonitoringData = async () => {
        try {
            const response = await axios.get(
                '/system/collector/getMonitoringDataList.json', {
                    params: {
                        name: searchValue,
                        start: page * 6
                    }
                }
            );

            setMonitoringData(response?.data)
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        setPage(0)
        setTimestamp(Date.now())
    }, [searchValue]);

    useEffect(() => {
        fetchMonitoringData()
    }, [page, timestamp, current]);

    useEffect(() => {
        if (!selectVal) return

        if (selectVal?.value === "off") {
            setIsActive(false)
        } else if (selectVal?.value === "30" && delayValue !== 30000) {
            if (!isActive) setIsActive(true)
            setDelayValue(30000)
        } else if (selectVal?.value === "60" && delayValue !== 60000) {
            if (!isActive) setIsActive(true)
            setDelayValue(60000)
        }
    }, [selectVal])

    return (
        <CollectorMonitoringListWrapper>
            <IntervalPickerBlock>
                <Select
                    options={options}
                    defaultValue={selectVal}
                    onChange={setSelectVal}
                    styles={customStyles}
                />
            </IntervalPickerBlock>
            {
                monitoringData && monitoringData.data?.data?.map(data => (
                    <CollectorCard key={data.label} name={data.name} label={data.label} values={data.values} width={"86%"} isCursor={false} />
                ))
            }
            {monitoringData &&
                <Pagination
                    page={page}
                    lastPage={parseInt(monitoringData.recordsTotal / 6)}
                    setPage={setPage}
                />
            }
        </CollectorMonitoringListWrapper>
    );
}

export default React.memo(CollectorMonitoringList);