"use strict";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";

import "@scss/base.scss";
import {
  buttonCategories,
  buttonLevels,
} from "@/components/constants";
import ButtonView from "@/components/button/ButtonView";
import ImageButton from "@/components/imageButton/ImageButton";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";
// import "./Login.css";

const Login = ({}) => {
  const [responseErrorMessage, setResponseErrorMessage] = useState<
    string | null
  >(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let error = urlParams.get("error");
    if (error === "-1")
      setResponseErrorMessage("아이디 또는 비밀번호를 다시 확인하세요.");
    else if (error === "-2")
      setResponseErrorMessage("패스워드 5회 이상 실패(관리자에게 문의하세요.)");

    window.history.replaceState(null, "", "?");
  }, []);

  const onSubmit = async (data: any) => {
    let params = new URLSearchParams();
    params.append(`userLoginId`, data.userLoginId);
    params.append(`userPwd`, data.userPwd);

    fetch("/public/login.mng", {
      method: "POST",
      headers: {
        Accept: "text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params,
    })
      .then((res) => {
        if (res.ok && res.redirected) {
          window.location.href = res.url;
        }
        return Promise.reject(res);
      })
      .catch((error) => console.log("Error: ", error));
  };

  const onFocus = () => {
    setResponseErrorMessage(null);
  };

  return (
    <div className="mx-auto my-0 w-[500px]">
      <div className="mt-28 pb-12">
        <ImageButton
          imageSrc={require(`@images/twin_repository.png`)}
          onClick={() => (window.location.href = "/index.mng")}
        />
      </div>
      <div className="rounded-lg border-2 border-grayscale-400 px-16 py-10">
        <form onSubmit={handleSubmit(onSubmit)} id="form-login">
          <div className="flex flex-col gap-y-3">
            <h2 className="mb-10 text-center font-nanumSquareR text-2xl font-bold">
              LOGIN
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
            <div className="flex flex-col gap-y-1">
              <div className="flex flex-col justify-center">
                <div className="text-xl font-bold">비밀번호</div>
              </div>
              <input
                type="password"
                data-name="비밀번호"
                {...register("userPwd", ReactHookFormOptions.Password("비밀번호"))}
                className="w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
                aria-invalid={errors.userPwd ? "true" : "false"}
              />
              <div className="error-message">{errors.userPwd?.message}</div>
            </div>
            {responseErrorMessage && (
              <div className="error-message">{responseErrorMessage}</div>
            )}
            <div className="submit">
              <ButtonView
                type="submit"
                formId="form-login"
                level={buttonLevels.primary}
                category={buttonCategories.info}
                text="로그인"
                className="mt-3 w-full"
              />
            </div>
            <div className="flex flex-row justify-between">
              <div className="siginup">
                <a href="/public/signup.do">회원가입</a>
              </div>
              <div className="forgot_pw">
                <a href="/public/findPassword.do">비밀번호 찾기</a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<Login />, domContainer);
