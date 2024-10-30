'use strict'

import React, {useEffect, useState} from "react";
import styled, { css } from "styled-components";
import Chart from "react-apexcharts";

const CollectorCardWrapper = styled.div`
    background-color: #f5f6fa;
    gap: 3px;
    padding: 5px 10px 5px 10px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e5e9f2;
    border-bottom: 1px solid #e5e9f2;
    ${
    props => props.width && css`
            width: ${props.width};
        `
}
    ${
    props => props.isCursor && css`
                cursor: pointer;
                &:hover {
                    background-color: #dcdde1;
                }
            `
}
`;

const CardName = styled.div`
    font-size: 13px;
    flex: 1;
    text-align: center;
`;

const CardLabel = styled.div`
    font-size: 13px;
    flex: 4;
    text-align: center;
`;

const ChartBlock = styled.div`
    flex: 5;
`

const CollectorCard = ({ name, label, values, width, isCursor }) => {
    const [series, setSeries] = useState([{
        name: "memory_rss_byte",
        data: values.map(data=>parseInt(data[1]))
    }])

    useEffect(() => {
        if (values) {
            setSeries(prev => ([{
                ...prev[0],
                data: values.map(data=>parseInt(data[1]))
            }]))
        }
    }, [values]);

    return (
        <CollectorCardWrapper width={width} isCursor={isCursor}>
            <CardName>{name}</CardName>
            <CardLabel>{label}</CardLabel>
            <ChartBlock>
                <Chart
                    options={{
                        chart: {
                            toolbar: {
                                show: false
                            }
                        },
                        stroke: {
                            curve: 'smooth',
                            width: 2,
                            colors: ['#56A64B']
                        },
                        tooltip: {
                            marker: {
                                show: true,
                                fillColors: ['#56A64B']
                            }
                        },
                        xaxis: {
                            categories: values.map(data=>data[0]),
                            labels: {
                                formatter: function(value) {
                                    const date = new Date(value * 1000);
                                    const hours = date.getHours();
                                    const minutes = date.getMinutes();
                                    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
                                    return formattedTime;
                                },
                                rotate: 0
                            },
                            tickAmount: 5
                        }
                    }}
                    series={series}
                    height={'100px'}
                    type="line"
                />
            </ChartBlock>
        </CollectorCardWrapper>
    )
}

export default React.memo(CollectorCard)