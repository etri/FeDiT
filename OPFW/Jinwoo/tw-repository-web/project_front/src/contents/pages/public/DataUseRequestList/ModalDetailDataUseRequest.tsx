import React from "react";
import ModalDetail from "@/components/modal/ModalDetail";
import { getDateStringWithoutTimeFromString } from "@/utils/timeUtils";

type props = {
  title: string;
  isModalOpen: boolean;
  onClickClose: () => void;
  selectedItem: any;
};

const ModalDetailDataUseRequest = ({
  title,
  isModalOpen,
  onClickClose,
  selectedItem,
}: props) => {
  return (
    <ModalDetail
      title={title}
      className="min-w-[600px] gap-y-2"
      isOpen={isModalOpen}
      onClickClose={onClickClose}
    >
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">이름</div>
        <div className="flex-1 text-xl font-normal">{selectedItem?.name}</div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">카테고리</div>
        <div className="flex-1 text-xl font-normal">
          {selectedItem?.category}
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">타입</div>
        <div className="flex-1 text-xl font-normal">
          {selectedItem?.type === "RAWDATA" ? "데이터" : "트윈"}
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">상태</div>
        <div className="flex-1 text-xl font-normal">{selectedItem?.status}</div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">신청일</div>
        <div className="flex-1 text-xl font-normal">
          {getDateStringWithoutTimeFromString(selectedItem?.regDt)}
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">현재호출횟수</div>
        <div className="flex-1 text-xl font-normal">
          {selectedItem?.currentCallCount}
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 text-xl font-bold">최대호출횟수</div>
        <div className="flex-1 text-xl font-normal">
          {selectedItem?.maxCallCount}
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <div className="flex-1 text-xl font-bold">신청목적</div>
        <textarea
          rows={7}
          disabled
          className="flex-1 text-xl font-normal"
          defaultValue={selectedItem?.purpose}
        />
      </div>
    </ModalDetail>
  );
};

ModalDetailDataUseRequest.defaultProps = {};

export default ModalDetailDataUseRequest;
