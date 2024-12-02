"use strict";

import React, { useEffect, useState } from "react";
import Global from "@/modules/Global";
import {
  topMenuData,
  getMenuKeyFromString,
  MENU_DATA,
  MENU_DATA_TYPE,
} from "@/components/MenuData";

import "@scss/base.scss";
import PublicHeaderView from "./PublicHeaderView";
import {showRegistDataButton} from "@/utils/userUtil";

const PublicHeader = () => {
  const [loginInfo, setLoginInfo] = useState(null);
  const [topmenu, setTopmenu] = useState<null | MENU_DATA_TYPE>(null);

  const fetchLoginInfo = () => {
    let params = new URLSearchParams();
    let options = Global.getFetchOption(params);

    fetch("/public/login-info.json", options)
      .then((res) => res.json())
      .then((res) => {
        if (res.result === "success") {
          setLoginInfo(res?.data);
        } else {
          alert(res.message);
        }
      });
  };

  const getCurrentMenu = () => {
    const regex = /(?<=\/)([\w|-]+)(?=\.\w+(\?.*)*$)/;

    let menuStringFromPath = window.location.pathname.match(regex);
    let menuFromPath: MENU_DATA_TYPE | null = menuStringFromPath
      ? getMenuKeyFromString(menuStringFromPath[0])
      : null;

    let topmenuFromPath = topMenuData.findTopMenu(menuFromPath);

    setTopmenu(topmenuFromPath ? topmenuFromPath.data.key : null);
  };

  useEffect(() => {
    getCurrentMenu();
    fetchLoginInfo();
  }, []);

  const onClickTopMenu = (selectedTopmenu: MENU_DATA_TYPE) => {
    window.location.href = `/${selectedTopmenu.path}`;
  };

  const onClickHeaderRightBtn = () => {
    window.location.href = "/loginForm.mng";
  };

  const onClickRequestDataRegistrationBtn = () => {
    window.location.href = "/public/data-regist-request.mng";
  };

  const onClickMypageBtn = () => {
    window.location.href = MENU_DATA.MY_INFO_MODIFY.path;
  };

  const onClickLogoutBtn = () => {
    window.location.href = "/public/logout.mng";
  };

  const onClickGoIndexBtn = () => {
    window.location.href = "/index.mng";
  };

  return (
    <PublicHeaderView
      userName={loginInfo?.userName}
      currentTopMenuKey={topmenu}
      showRegistDataButton={showRegistDataButton()}
      onClickRequestDataRegistrationBtn={onClickRequestDataRegistrationBtn}
      onClickMypageBtn={onClickMypageBtn}
      onClickLogoutBtn={onClickLogoutBtn}
      onClickGoIndexBtn={onClickGoIndexBtn}
      onClickTopMenu={onClickTopMenu}
      onClickHeaderRightBtn={onClickHeaderRightBtn}
    />
  );
};

export default React.memo(PublicHeader);
