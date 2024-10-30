'use strict';

import React from "react";
import styled, { css } from "styled-components";

const CardWrapper = styled.div`
    background-color: #f5f6fa;
    gap: 3px;
    padding: 15px;
    display: flex;
    flex-direction: column;
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
const CardTypeWrapper  = styled.div`
    display: flex;
    flex-direction: row;
`
const CardType = styled.div`
    font-size: 15px;
    font-weight: 200;
    color: #835d22;
    border: 1px solid;
    border-color: #d1b783;    
    padding: 0 5px;
    margin: 5px 5px;
`

const CardTitleWrapper  = styled.div`
    display: flex;
    flex-direction: row;
`
const CardTitle = styled.div`
    font-size: 25px;
    font-weight: 500;
`
const CartDataFormat = styled.div`
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    ${
            props => props.dataFormat === 'JSON' && css`
                background-color: #0a7e88;
            `
    }
    padding: 0 5px;
    margin: 5px 5px;
`
const DateSpan = styled.span`
    background-color: white;
    padding: 5px;
`

const Card = ({ title, type, dataFormat, content, data, onClickCard, width, isCursor }) => {
    return (
        <CardWrapper width={width} isCursor={isCursor} onClick={onClickCard}>
            <CardTypeWrapper>
                <CardType>{type}</CardType>
            </CardTypeWrapper>
            <CardTitleWrapper>
                <CartDataFormat dataFormat={dataFormat}>{dataFormat}</CartDataFormat>
                <CardTitle>{title}</CardTitle>
            </CardTitleWrapper>
            <div>{content}</div>
            {
              data &&
                (<div style={{display: "flex"}}>
                    <DateSpan>{data}</DateSpan>
                </div>)
            }
        </CardWrapper>
    )
}

export default React.memo(Card)