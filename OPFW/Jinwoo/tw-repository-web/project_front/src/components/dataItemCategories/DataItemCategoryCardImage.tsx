'use strict';

import React from "react";
import styled from "styled-components";
import { getDateString } from "@/utils/timeUtils";

const IconWrapper = styled.span`
    margin: 0 auto 14px;
    display: table;
    width: 107px;
    height: 107px;
    background: var(--color-deco-icon);
    text-align: center;
    border-radius: 56px;
    box-sizing: border-box;
`

const EmWrapper = styled.div`
    display: table-cell;
    vertical-align: middle;
    text-align: center;
`

const DataItemCategoryCardImage = ({icon}:{ icon:string }) => {
    return (
        <IconWrapper className="deco-icon">
          <EmWrapper>
            {/*<img draggable="false" className="w-full h-full" src={require(`../../../assets/images/${icon}?`)} alt=""/>*/}
            <img draggable="false" className="w-full h-full" src={`/static/icon/${icon}?${Date.now()}`} alt="" />
          </EmWrapper>
        </IconWrapper>
    )
}

export default DataItemCategoryCardImage;