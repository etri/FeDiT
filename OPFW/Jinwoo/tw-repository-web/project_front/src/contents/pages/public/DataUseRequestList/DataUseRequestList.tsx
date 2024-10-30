"use strict";

import React from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicSidebar from "@/components/publicSidebar/PublicSidebar";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import DataUseRequestListContent from "./DataUseRequestListContent";

import "@/components/myPageTable/MyPageTableStyle";
import "./DataUseRequestListStyle";
import MyPageWrapper from "@/components/MyPageWrapper";
import MyPageBlock from "@/components/MyPageBlock";
import {PublicMain} from "@/components/PublicMain";
import {PublicContainer} from "@/components/PublicContainer";

const DataUseRequestList = () => {
    return (
        <PublicContainer>
          <div>
            <PublicHeader/>
            <PublicMain>
                <MyPageWrapper>
                    <PublicSidebar index={0}/>
                    <MyPageBlock>
                        <DataUseRequestListContent/>
                    </MyPageBlock>
                </MyPageWrapper>
            </PublicMain>
          </div>
          <PublicFooter/>
        </PublicContainer>
    )
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<DataUseRequestList />, domContainer);