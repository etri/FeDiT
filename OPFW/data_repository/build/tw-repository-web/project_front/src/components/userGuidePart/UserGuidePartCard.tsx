'use strict';

import React from "react";
import styled, { css } from "styled-components";


const CardTitleWapper = styled.div`
    //margin: 0 0 12px 0;
    padding: 0 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    outline-color: rgb(102, 102, 102);
    outline-style: none;
    outline-width: 0px;
    padding-bottom: 0px;
    padding-left: 0px;
    padding-right: 0px;
    padding-top: 0px;
    text-align: center;
`

const CardWrapper = styled.div`
    padding: 10px 0 10px 0;
    width: 180px;
    cursor: pointer;
    //display: flex;
    //flex-direction: column;
    //justify-content: center;

    ${props =>
            props.selected &&
            css `
            background:  var(--color-primary-700);
            border-color:  var(--color-secondary-700);
            color:#fff;
            font-weight:500;
        `
    }
`

const UserGuidePartCard = ({ onClick, title, selected }:{ onClick:(data:any)=>void, title:string, selected:boolean }) => {

    return (
        <CardWrapper onClick={() => onClick()} selected={selected}>
            <CardTitleWapper className="card" >
                <div className="font-semibold">{title}</div>
            </CardTitleWapper>
        </CardWrapper>
    )
}

export default UserGuidePartCard;