"use strict";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import MyPageTitle from "@/components/myPageTitle/MyPageTitle";
import ButtonView from "@/components/button/ButtonView";
import { buttonCategories, buttonLevels } from "@/components/constants";
import { getDateStringWithoutTimeFromString } from "@/utils/timeUtils";

const MyPageContent = () => {
  const [myInfo, setMyInfo] = useState(null);
  const [error, setError] = useState(null);

  const onClickInfoModifyBtn = useCallback(() => {
    window.location.href = "/public/user/modifyInfo.mng";
  }, []);

  const onClickPwdModifyBtn = useCallback(() => {
    window.location.href = "/public/user/modifyPwd.mng";
  }, []);

  const fetchMyData = async () => {
    try {
      const response = await axios.get("/public/user/getInfo.json");

      setMyInfo(response?.data);
    } catch (e: any) {
      setError(e);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  if (error)
    return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>;

  return (
    <div className="flex flex-col gap-2.5">
      <MyPageTitle />
      <div className="mb-5 flex flex-col text-xl">
        <div className="flex flex-row">
          <div className="w-32 leading-8">ID</div>
          <div className="font-bold">{myInfo?.data.userLoginId}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-32 leading-8">가입일</div>
          <div className="font-bold">
            {myInfo
              ? getDateStringWithoutTimeFromString(myInfo.data.regDt)
              : ""}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-y-8">
        <h3 className="text-4xl font-bold">기본 정보</h3>
        <div className="flex flex-col text-xl leading-8">
          <div className="flex flex-row">
            <div className="flex-1">이름</div>
            <div className="flex-1">{myInfo?.data.userNm}</div>
          </div>
          <div className="flex flex-row">
            <div className="flex-1">이메일</div>
            <div className="flex-1">{myInfo?.data.email}</div>
          </div>
          <div className="flex flex-row">
            <div className="flex-1">휴대전화번호</div>
            <div className="flex-1">{myInfo?.data.mobile}</div>
          </div>
        </div>
        <h3 className="text-4xl font-bold">정보수정</h3>
        <div className="flex flex-col">
          <div className="flex flex-row gap-x-1">
            <ButtonView
              level={buttonLevels.secondary}
              category={buttonCategories.info}
              onClick={onClickInfoModifyBtn}
              text="기본 정보 수정"
            />
            <ButtonView
              level={buttonLevels.secondary}
              category={buttonCategories.info}
              onClick={onClickPwdModifyBtn}
              text="비밀번호 변경"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPageContent;
