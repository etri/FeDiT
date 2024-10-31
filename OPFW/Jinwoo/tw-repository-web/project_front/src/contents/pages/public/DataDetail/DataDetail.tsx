'use strict';

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import RawDataDetailContent from "./RawDataDetailContent";
import TwinDataDetailContent from "./TwinDataDetailContent";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import {PublicContainer} from "@/components/PublicContainer";
import {PublicMain} from "@/components/PublicMain";

import "@scss/base.scss"

const DataDetail = () => {
    const [type, setType] = useState<String | null>(null)

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString)
        let typeParam = urlParams.get('type');
        if(typeParam!==null) typeParam=typeParam.toLowerCase();

        setType(typeParam)
    }, []);

    return (
        <PublicContainer>
            <PublicHeader/>
            <PublicMain>
                { type === "rawdata" && <RawDataDetailContent /> }
                { type === "twin" && <TwinDataDetailContent /> }
            </PublicMain>
            <PublicFooter/>
        </PublicContainer>
    )
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<DataDetail />, domContainer);