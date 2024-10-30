'use strict'

import React from "react";
import styled, { css } from "styled-components";

const MpBtn = styled.button`
    background-color: white;
    padding: 2px 10px;
    cursor: pointer;
    border: 1px solid #e4e2e2;
    font-size: 20px;
    
    &:hover {
        background-color: #f0f0f0;
    }

    ${
            props => props.padding && css`
                padding: ${props.padding}
            `
    }
`;

const InfoBtn = ({ children, onClickHandler, padding }) => {
    return <MpBtn onClick={onClickHandler} padding={padding}>{children}</MpBtn>
}

export default InfoBtn