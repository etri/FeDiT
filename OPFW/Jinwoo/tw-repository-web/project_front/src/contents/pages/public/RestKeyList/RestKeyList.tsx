"use strict";

import React from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import PublicSidebar from "@/components/publicSidebar/PublicSidebar";
import RestKeyListContent from "./RestKeyListContent";

import "@/components/myPageTable/MyPageTableStyle";
import "./RestKeyListStyle";
import MyPageWrapper from "@/components/MyPageWrapper";
import MyPageBlock from "@/components/MyPageBlock";
import { PublicContainer } from "@/components/PublicContainer";

const RestKeyList = () => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader />
        <MyPageWrapper>
          <PublicSidebar index={0} />
          <MyPageBlock>
            <RestKeyListContent />
          </MyPageBlock>
        </MyPageWrapper>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<RestKeyList />, domContainer);
