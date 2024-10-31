"use strict";

import React from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";
import ModifyInfoContent from "./ModifyInfoContent";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicContainer } from "@/components/PublicContainer";

const ModifyInfoWrapper = styled.div`
  position: relative;
  //min-height: calc(100vh - 180px);
  min-height: calc(100vh - var(--width-side-bar));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ModifyInfoBlock = styled.div`
  height: 100%;

  // custom
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModifyInfo = () => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader/>
        <ModifyInfoWrapper>
          <ModifyInfoBlock>
            <ModifyInfoContent />
          </ModifyInfoBlock>
        </ModifyInfoWrapper>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<ModifyInfo />, domContainer);
