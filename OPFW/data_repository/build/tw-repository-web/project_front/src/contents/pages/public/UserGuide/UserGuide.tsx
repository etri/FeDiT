"use strict";

import React, {useState} from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicMain } from "@/components/PublicMain";
import { PublicContainer } from "@/components/PublicContainer";
import UserGuidePart from "@/components/userGuidePart/UserGuidePart";

const UserGuide = ({}) => {
    // const [selectedId, setSelectedId] = useState("1")

  return (
    <PublicContainer>
      <div>
        <PublicHeader />
        <PublicMain>
            <UserGuidePart/>
        </PublicMain>
      </div>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<UserGuide />, domContainer);
