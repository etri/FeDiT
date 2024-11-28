"use strict";

import React from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicMain } from "@/components/PublicMain";
import { PublicContainer } from "@/components/PublicContainer";

const UserGuide = ({}) => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader />
        <PublicMain>
          <span>유저가이드</span>
        </PublicMain>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<UserGuide />, domContainer);
