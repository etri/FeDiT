"use strict";

import React from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";
import ModifyPwdContent from "./ModifyPwdContent";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicContainer } from "@/components/PublicContainer";

const ModifyPwdWrapper = styled.div`
  position: relative;
  //min-height: calc(100vh - 60px);
  min-height: calc(100vh - var(--width-side-bar));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ModifyPwdBlock = styled.div`
  height: 100%;

  // custom
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModifyPwd = () => {
  return (
    <PublicContainer>
      <div>
        <PublicHeader/>
        <ModifyPwdWrapper>
          <ModifyPwdBlock>
            <ModifyPwdContent/>
          </ModifyPwdBlock>
        </ModifyPwdWrapper>
      </div>
      <PublicFooter/>
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<ModifyPwd />, domContainer);
