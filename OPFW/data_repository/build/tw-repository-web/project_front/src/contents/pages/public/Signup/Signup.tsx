"use strict";

import React, { RefObject, useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import "@scss/base.scss";
import InputErrorDialog from "@/components/dialog/InputErrorDialog";
import {
  buttonCategories,
  buttonLevels,
} from "@/components/constants";
import ButtonView from "@/components/button/ButtonView";
import ImageButton from "@/components/imageButton/ImageButton";
import ModalSetInstitution from "@/contents/pages/public/Signup/ModalSetInstitution";

import "@/components/myPageTable/MyPageTableStyle";
import "./SignupStyle";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";
import Global from "@/modules/Global";

const Signup = ({}) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [dataInitial, setDataInitial] = React.useState<any>(null);

  const [institutionList, setInstitutionList] = useState<any[]>([
    { label: "선택하세요.", value: ""}
  ]);
  const [isModalSetInstitutionOpen, setModalSetInstitutionOpen] = useState<boolean>(false);
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    setValue,
  } = useForm({ mode: "onBlur" });

  const inputElementRef: RefObject<HTMLElement> = React.createRef();

  const onClickSelfVerification = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      e.preventDefault();
      window.MOBILEOK.process("/mok/mok-request.json", "WB", "result");
    },[]);

  const onClickSetInstitution = useCallback((data: any) => {
      setValue('institutionId', data.id);
      setValue('institutionName', data.name);
      setModalSetInstitutionOpen(false);
    },[]);

  const onSubmit = useCallback(async (data: any) => {
    // console.log(data);
    let error = false;
    await fetchJson("POST", "/public/check-id-duplicate.json", {
      data: {
        userLoginId: data.userLoginId
      },
      successCallback: (responseJson: any) => {
        if (responseJson.result === "exist") {
          setError("userLoginId", { message: responseJson.message });
          error = true;
        }
      },
      failCallback: (errorMessage:string) => {
        customAlert(errorMessage);
        error = true;
      }
    });

    if(error) {
      return;
    }

    const payload = {
      userLoginId: data.userLoginId,
      institutionId: (data.institutionId === "" ? null : parseInt(data.institutionId)),
      userPwd: data.userPwd,
      userNm: data.userNm,
      email: data.email,
      mobile: data.phoneNumber,
    };

    fetchJson("POST", "/public/signup.json", {
      data: payload,
      successCallback: (responseJson: any) => {
        customAlert("저장되었습니다.");
        location.href = "/loginForm.mng";
      },
      failCallback: (errorMessage:string) => {
        customAlert(errorMessage);
        return;
      }
    });
  }, []);

  const fetchInitial = useCallback( async () => {
    let params = new URLSearchParams();
    let options = Global.getFetchOption(params);

    fetch("/public/signup/initial.json", options)
        .then(res => res.json())
        .then(
            (res) => {
              if( res.result === "success" ) {
                setDataInitial(res.data);
                setLoading(false);
              } else {
                alert(res.message);
              }
            }
        );
  }, []);

  useEffect(() => {

    fetchInitial();

    const handleCustomEvent = (event:any) => {
      setValue('userNm', event.detail.userNm);
      setValue('phoneNumber', event.detail.phoneNumber);
    };

    // 인증결과 콜백함수 정의
    const script = document.createElement("script");
    const callBackFunc = document.createTextNode(
      `function result(result) {
                const res = JSON.parse(result);
                const event = new CustomEvent('callReactFunction', { detail : { userNm: res.userName, phoneNumber: res.userPhone }});
                window.dispatchEvent(event);
            }`,
    );

    script.appendChild(callBackFunc);
    document.body.appendChild(script);

    window.addEventListener("callReactFunction", handleCustomEvent);
    return () => {
      window.removeEventListener("callReactFunction", handleCustomEvent);
    };
  }, []);

  const renderError = () => {
    if (errors === null || errors === undefined || errors.length <= 0) return;

    let firstError = Object.entries(errors).at(0);
    if (firstError === null || firstError === undefined) return;

    let firstErrorValue = firstError[1];

    inputElementRef.current = firstErrorValue?.ref;
    return (
      <InputErrorDialog elementRef={inputElementRef} isVisible={true}>
        <span>{firstErrorValue?.message}</span>
      </InputErrorDialog>
    );
  };

  const getContents = () => {
    if(loading)
      return;

    return (
        <>
          <div className="mx-auto my-0 w-[500px]">
            <div className="py-4 pl-5">
              <ImageButton
                  imageSrc={require(`@images/twin_repository.png`)}
                  onClick={() => (window.location.href = "/index.mng")}
              />
            </div>
            <div className="rounded-lg border-2 border-grayscale-400 px-16 py-10">
              <div className="mb-10 text-center font-nanumSquareR text-2xl font-bold">
                <div>회원 가입을 위해</div>
                <div>정보를 입력해주세요</div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} id="form-sing-up">
                <input data-name="기관아이디" {...register("institutionId")} type="hidden" />
                <div className="flex flex-col gap-y-3">
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
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex flex-col justify-center">
                      <div className="text-xl font-bold">비밀번호 확인</div>
                    </div>
                    <input
                        type="password"
                        data-name="비밀번호 확인"
                        {...register("confirmPassword", {
                          required: "* 비밀번호 확인 : 필수 정보입니다.",
                          validate: (value: string, formValues: any) => {
                            return (
                                value === formValues.confirmPassword ||
                                "비밀번호가 다릅니다."
                            );
                          },
                        })}
                        className="w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
                        aria-invalid={errors.confirmPassword ? "true" : "false"}
                    />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex flex-col justify-center">
                      <div className="text-xl font-bold">이름</div>
                    </div>
                    <div className="flex flex-row justify-start gap-x-2">
                      <input
                          disabled={dataInitial.idAuthEnabled}
                          data-name="이름"
                          {...register("userNm", ReactHookFormOptions.UserName)}
                          className={dataInitial.idAuthEnabled?
                                            "w-full rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled shadow-md":
                                            "w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"}
                          aria-invalid={errors.userNm ? "true" : "false"}
                      />
                      {dataInitial.idAuthEnabled && (<ButtonView
                          level={buttonLevels.secondary}
                          category={buttonCategories.info}
                          onClick={onClickSelfVerification}
                          text="본인확인"
                      />)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex flex-col justify-center">
                      <div className="text-xl font-bold">연락처</div>
                    </div>
                    <input
                        disabled={dataInitial.idAuthEnabled}
                        data-name="연락처"
                        {...register("phoneNumber", ReactHookFormOptions.PhoneNumber)}
                        className={dataInitial.idAuthEnabled?
                            "w-full rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled shadow-md":
                            "w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"}
                        aria-invalid={errors.phoneNumber ? "true" : "false"}
                    />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex flex-col justify-center">
                      <div className="text-xl font-bold">이메일</div>
                    </div>
                    <input
                        data-name="이메일"
                        {...register("email", ReactHookFormOptions.Email)}
                        className="w-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
                        aria-invalid={errors.email ? "true" : "false"}
                    />
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex flex-col justify-center">
                      <div className="text-xl font-bold">기관</div>
                    </div>
                    <div className="flex flex-row justify-start gap-x-2">
                      <input
                          disabled
                          data-name="기관"
                          {...register("institutionName")}
                          className="w-full rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled shadow-md"
                          aria-invalid={errors.institutionName ? "true" : "false"}
                      />
                      <ButtonView
                          level={buttonLevels.secondary}
                          category={buttonCategories.info}
                          onClick={() => {
                            setModalSetInstitutionOpen(true);
                          }}
                          text="기관설정"
                      />
                    </div>
                  </div>
                </div>
                <div className="py-4">
                  <label className="flex cursor-pointer items-center space-x-3">
                    <input
                        id="checkboxDefault"
                        type="checkbox"
                        data-name="정보수집동의"
                        {...register("agreeCheck", ReactHookFormOptions.AgreeCheckbox)}
                        className="custom-checkbox h-6 w-6 cursor-pointer appearance-none rounded-md border border-gray-300 transition duration-200 checked:border-transparent checked:bg-blue-600 focus:outline-none"
                        aria-invalid={errors.agreeCheck ? "true" : "false"}
                    />
                    <span className="text-lg font-normal">
                  개인정보 수집에 동의합니다.
                </span>
                  </label>
                </div>
                <div className="btn">
                  <ButtonView
                      formId="form-sing-up"
                      type="submit"
                      level={buttonLevels.primary}
                      category={buttonCategories.info}
                      text="가입하기"
                      className="w-full"
                  />
                </div>
              </form>
            </div>
            <div>{renderError()}</div>
          </div>

          <ModalSetInstitution
              title="기관설정"
              isModalOpen={isModalSetInstitutionOpen}
              onClickClose={() => setModalSetInstitutionOpen(false)}
              onClickSetInstitution={onClickSetInstitution}
          />
        </>
    );
  }

  return(
    <>
      {getContents()}
    </>
  )
};

let domContainer = document.querySelector("#contentContainer");
ReactDOM.render(<Signup />, domContainer);
