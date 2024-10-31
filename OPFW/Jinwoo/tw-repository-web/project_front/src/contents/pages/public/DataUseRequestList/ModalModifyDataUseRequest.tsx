import React, { RefObject, useMemo } from "react";
import ModalModify from "@/components/modal/ModalModify";
import { useForm } from "react-hook-form";
import Select from "@/components/select/Select";
import { getDateStringWithoutTimeFromString } from "@/utils/timeUtils";
import "react-datepicker/dist/react-datepicker.css";
import Textarea from "@/components/textarea/Textarea";
import InputErrorDialog from "@/components/dialog/InputErrorDialog";

type props = {
  title: string;
  isModalOpen: boolean;
  onClickClose: () => void;
  onClickModify: (data: any) => void;
  selectedItem: any;
};

const ModalModifyDataUseRequest = ({
  title,
  isModalOpen,
  onClickClose,
  onClickModify,
  selectedItem,
}: props) => {
  const form = useForm({
    mode: "onBlur",
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = form;

  const inputElementRef: RefObject<HTMLElement> = React.createRef();

  useMemo(() => {
    if (!isModalOpen) return;

    const defaultValues = {
      id: selectedItem?.id,
      name: selectedItem?.name,
      category: selectedItem?.category,
      status: selectedItem?.status,
      regDt: getDateStringWithoutTimeFromString(selectedItem?.regDt),
      purpose: selectedItem?.purpose,
    };
    reset(defaultValues);

    setValue("type", "traffic");
  }, [isModalOpen]);

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

  return (
    <ModalModify
      title={title}
      className="min-w-[600px] gap-y-2"
      isOpen={isModalOpen}
      onClickClose={onClickClose}
      onClickModify={handleSubmit(onClickModify)}
    >
      <form id="form-data-use-request">
        <input data-name="아이디" {...register("id")} type="hidden" />
        <div className="flex flex-col gap-y-1">
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">이름</div>
            </div>
            {/*<Input {...register("name", {required: "* 이름 : 필수 정보입니다."})} errors={errors}/>*/}
            <input
              disabled
              data-name="이름"
              {...register("name")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
              aria-invalid={errors.name ? "true" : "false"}
            />
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">카테고리</div>
            </div>
            <input
              disabled
              data-name="카테고리"
              {...register("category")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
              aria-invalid={errors.category ? "true" : "false"}
            />
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">타입</div>
            </div>
            <div className="w-4/6 basis-4/6">
              <Select
                disabled
                className="w-full rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
                {...register("type")}
                defaultValue="environment"
                options={[
                  { label: "교통", value: "traffic" },
                  { label: "환경", value: "environment" },
                  { label: "관광", value: "tourism" },
                ]}
                ariaInvalid={errors.type ? "true" : "false"}
              />
            </div>
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">상태</div>
            </div>
            <input
              disabled
              data-name="상태"
              {...register("status")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
              aria-invalid={errors.status ? "true" : "false"}
            />
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">신청일</div>
            </div>
            <input
              disabled
              data-name="신청일"
              {...register("regDt")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
            />
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">현재호출횟수</div>
            </div>
            <input
              disabled
              data-name="현재호출횟수"
              {...register("currentCallCount")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
            />
          </div>
          <div className="flex gap-8">
            <div className="flex w-2/6 basis-2/6 flex-col justify-center">
              <div className="text-xl font-bold">최대호출횟수</div>
            </div>
            <input
              disabled
              data-name="최대호출횟수"
              {...register("maxCallCount")}
              className="w-4/6 basis-4/6 rounded-lg border border-disabled bg-disabled px-4 py-1 text-xl text-disabled"
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex w-1/2 basis-1/2 flex-col justify-center">
              <div className="text-xl font-bold">신청목적</div>
            </div>
            <div className="w-full">
              <Textarea
                {...register("purpose", {
                  required: "* 신청목적 : 필수 정보입니다.",
                  maxLength: {
                    value: 2000,
                    message: "* 신청목적 : 2000자 이하로 입력해주세요.",
                  },
                })}
                rows={7}
                maxCount={2000}
                dataName="신청목적"
                className="w-full basis-full rounded-lg border border-enabled px-4 py-1 text-xl font-normal focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
                defaultValue={selectedItem?.purpose}
                errors={errors}
                watch={watch}
              />
            </div>
          </div>
        </div>
      </form>
      <div>{renderError()}</div>
    </ModalModify>
  );
};

ModalModifyDataUseRequest.defaultProps = {};

export default ModalModifyDataUseRequest;
