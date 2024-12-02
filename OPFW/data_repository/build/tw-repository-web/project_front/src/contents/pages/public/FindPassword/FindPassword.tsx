"use strict";

import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";
import ReactHookFormInput from "@/components/reactHookForm/ReactHookFormInput";
// import "./FindPassword.css"
import "@scss/base.scss";
import { buttonCategories, buttonLevels } from "@/components/constants";
import ButtonView from "@/components/button/ButtonView";
import ImageButton from "@/components/imageButton/ImageButton";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";

const FindPassword = ({}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const onSubmit = useCallback(async (data: any) => {
    fetchJson("POST", "/public/findPassword.json", {
      data: {
        userLoginId: data.userLoginId
      },
      successCallback: (responseJson: any) => {
        customAlert("임시 비밀번호가 발송되었습니다. 이메일을 확인하세요.");
        location.href = "/loginForm.mng";
      },
      failCallback: (errorMessage:string) => {
        customAlert(errorMessage);
        reset({
          userLoginId: "",
        });
      }
    });
  }, []);

  return (
    <div className="mx-auto my-0 w-[500px]">
      <div className="mt-28 pb-12">
        <ImageButton
          imageSrc={require(`@images/twin_repository.png`)}
          onClick={() => (window.location.href = "/index.mng")}
        />
      </div>
      <div className="rounded-lg border-2 border-grayscale-400 px-16 py-10">
        <form onSubmit={handleSubmit(onSubmit)} id="form-find-password">
          <div className="flex flex-col gap-y-3">
            <h2 className="mb-10 text-center font-nanumSquareR text-2xl font-bold">
              비밀번호 찾기
            </h2>
            <div className="flex flex-col gap-y-1">
              <div className="flex flex-col justify-center">
                <div className="text-xl font-bold">아이디</div>
              </div>
              <input
                data-name="아이디"
                {...register("userLoginId", ReactHookFormOptions.LoginId("아이디"))}
                className="w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
                aria-invalid={errors.userLoginId ? "true" : "false"}
              />
              <div className="error-message">{errors.userLoginId?.message}</div>
            </div>
            {/*<ReactHookFormInput*/}
            {/*  name="userLoginId"*/}
            {/*  className="user-info-login-id"*/}
            {/*  label="아이디"*/}
            {/*  reactHookFormOption={ReactHookFormOptions.LoginId}*/}
            {/*  errors={errors}*/}
            {/*  register={register}*/}
            {/*/>*/}
            <div className="submit">
              {/*<input type="submit" value="비밀번호 찾기" />*/}
              <ButtonView
                type="submit"
                formId="form-login"
                level={buttonLevels.primary}
                category={buttonCategories.info}
                text="확인"
                className="w-full"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<FindPassword />, domContainer);
