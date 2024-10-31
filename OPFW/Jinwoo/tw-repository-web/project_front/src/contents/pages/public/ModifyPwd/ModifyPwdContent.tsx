"use strict";

import React, { useCallback } from "react";
import ButtonView from "@/components/button/ButtonView";
import { buttonCategories, buttonLevels } from "@/components/constants";
import { useForm } from "react-hook-form";
import { fetchForm, fetchJson } from "@/utils/fetchUtil";
import { MENU_DATA } from "@/components/MenuData";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";
import { customAlert } from "@/utils/dialogUtil";

const ModifyPwdContent = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const onClickCancelBtn = useCallback(() => {
    history.back();
  }, []);

  const onSubmit = useCallback(async (data: any) => {
    fetchJson("POST", "/public/user/modifyPwd.json", {
      data: {
        currentPwd: data.currentPwd,
        newPwd: data.newPwd,
      },
      successCallback: (responseJson: any) => {
        customAlert("비밀번호가 수정되었습니다.");
        window.location.href = MENU_DATA.MY_INFO_MODIFY.path;
      },
      failCallback: (errorMessage:string) => {
        customAlert(errorMessage);
      }
    });
  }, []);

  return (
    <div className="w rounded-lg border-2 border-grayscale-400 p-10">
      <form onSubmit={handleSubmit(onSubmit)} id="form-login">
        <div className="flex flex-col gap-y-3">
          <h2 className="mb-10 text-center font-nanumSquareR text-2xl font-bold">
            비밀번호 수정
          </h2>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold">현재 비밀번호</div>
            <input
              type="password"
              data-name="현재 비밀번호"
              {...register(
                "currentPwd",
                ReactHookFormOptions.Password("현재 비밀번호"),
              )}
              className="w-7/12 rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              aria-invalid={errors.currentPwd ? "true" : "false"}
            />
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold"></div>
            <div className="error-message w-7/12">
              {errors.currentPwd?.message}
            </div>
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold">새 비밀번호</div>
            <input
              type="password"
              data-name="새 비밀번호"
              {...register(
                "newPwd",
                ReactHookFormOptions.Password("새 비밀번호"),
              )}
              className="w-7/12 rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              aria-invalid={errors.newPwd ? "true" : "false"}
            />
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold"></div>
            <div className="error-message w-7/12">{errors.newPwd?.message}</div>
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold">새 비밀번호 확인</div>
            <input
              type="password"
              data-name="새 비밀번호 확인"
              {...register("confirmNewPwd", {
                ...ReactHookFormOptions.Password("새 비밀번호 확인"),
                validate: (value: string, formValues: any) => {
                  return value === formValues.newPwd || "비밀번호가 다릅니다.";
                },
              })}
              className="w-7/12 rounded-lg border border-enabled px-4 py-1 text-xl font-normal shadow-md focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              aria-invalid={errors.confirmNewPwd ? "true" : "false"}
            />
          </div>
          <div className="flex flex-row gap-x-1">
            <div className="w-5/12 text-xl font-bold"></div>
            <div className="error-message w-7/12">{errors.confirmNewPwd?.message}</div>
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

export default ModifyPwdContent;
