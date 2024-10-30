"use strict";

import React from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicSidebar from "@/components/publicSidebar/PublicSidebar";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import DataRegistListContent from "./DataRegistListContent";

import "@/components/myPageTable/MyPageTableStyle";
import "./DataRegistListStyle";
import MyPageWrapper from "@/components/MyPageWrapper";
import MyPageBlock from "@/components/MyPageBlock";
import { PublicContainer } from "@/components/PublicContainer";

const DataRegistList = () => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader />
        <MyPageWrapper>
          <PublicSidebar index={1} />
          <MyPageBlock>
            <DataRegistListContent />
          </MyPageBlock>
        </MyPageWrapper>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<DataRegistList />, domContainer);
