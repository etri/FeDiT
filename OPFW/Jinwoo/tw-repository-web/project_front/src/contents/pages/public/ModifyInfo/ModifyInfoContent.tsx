"use strict";

import React, { useCallback, useEffect, useState } from "react";
import { MENU_DATA } from "@/components/MenuData";
import ButtonView from "@/components/button/ButtonView";
import { buttonCategories, buttonLevels } from "@/components/constants";
import { useForm } from "react-hook-form";
import {
  fetchGet, fetchJson
} from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";

const ModifyInfoContent = () => {
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ mode: "onBlur" });

  const onSubmit = useCallback(async (data: any) => {
    try {
      const res = await fetchJson("POST", "/public/user/modifyInfo.json", {
        data: {
          userNm: data.userNm,
          email: data.email,
          mobile: data.mobile
        },
        successCallback : (responseJson:any) => {
          customAlert("수정되었습니다.");
          window.location.href = MENU_DATA.MY_INFO_MODIFY.path;
        }
      });
    } catch (e) {
      customAlert("수정에 실패했습니다.");
    }
  }, []);

  const onClickCancelBtn = useCallback(() => {
    history.back();
  }, []);

  const fetchMyData = async () => {
    fetchGet("/public/user/getInfo.json", {
      successCallback: (responseJson: any) => {
          const defaultValues = {
            userNm: responseJson.data?.userNm,
            email: responseJson.data?.email,
            mobile: responseJson.data?.mobile,
          };
          reset(defaultValues);
      },
      failCallback: (errorMessage:string) => {
        setError(errorMessage);
      }
    })
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  if (error!=="") {
    console.log(error);
    return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>;
  }

  return (
    <div className="w rounded-lg border-2 border-grayscale-400 p-10">
      <form onSubmit={handleSubmit(onSubmit)} id="form-login">
        <div className="flex flex-col gap-y-3">
          <h2 className="mb-10 text-center font-nanumSquareR text-2xl font-bold">
            기본 정보 수정
          </h2>
          <div className="flex flex-row gap-x-1">
            <div className="w-4/12 text-xl font-bold">이름</div>
            <input
              data-name="이름"
              {...register("userNm", ReactHookFormOptions.UserName)}
              className="w-8/12 rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              aria-invalid={errors.userNm ? "true" : "false"}
            />
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-4/12 text-xl font-bold"></div>
            <div className="error-message w-8/12">{errors.userNm?.message}</div>
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-4/12 text-xl font-bold">이메일</div>
            <input
              data-name="이메일"
              {...register("email", ReactHookFormOptions.Email)}
              className="w-8/12 rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              aria-invalid={errors.email ? "true" : "false"}
            />
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-4/12 text-xl font-bold"></div>
            <div className="error-message w-8/12">{errors.email?.message}</div>
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-4/12 text-xl font-bold">연락처</div>
            <input
              disabled
              data-name="연락처"
              {...register("mobile", ReactHookFormOptions.PhoneNumber)}
              className="w-8/12 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
              aria-invalid={errors.mobile ? "true" : "false"}
            />
          </div>
        </div>
        <div className="mt-8 flex flex-row justify-center gap-5">
          <ButtonView
            level={buttonLevels.secondary}
            category={buttonCategories.info}
            onClick={onClickCancelBtn}
            text="취소"
          />
          <ButtonView
            type="submit"
            level={buttonLevels.primary}
            category={buttonCategories.info}
            text="수정"
          />
        </div>
      </form>
    </div>
  );
};

export default ModifyInfoContent;
