"use strict";

import React from "react";
import ReactDOM from "react-dom";

import MyPageContent from "./MyPageContent";
import PublicSidebar from "@/components/publicSidebar/PublicSidebar";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import MyPageWrapper from "@/components/MyPageWrapper";
import MyPageBlock from "@/components/MyPageBlock";
import { PublicContainer } from "@/components/PublicContainer";

const MyPage = () => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader/>
        <MyPageWrapper>
          <PublicSidebar index={2} />
          <MyPageBlock>
            <MyPageContent />
          </MyPageBlock>
        </MyPageWrapper>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<MyPage />, domContainer);
