import React from "react";
import SysModal from "@/components/sysModal/SysModal";

type props = {
  data: any | null;
  isOpened: boolean;
  onClose: () => void;
};

const ModalDataUseDetail = ({data, isOpened, onClose}: props) => {

  return (
    <SysModal ownClassName={"detail-modal"} isOpened={isOpened} onClose={onClose} title={"상세보기"}>
      <table className="table table-condensed">
        <colgroup>
          <col width="30%" />
          <col width="70%" />
        </colgroup>
        <tbody>
        <tr>
          <th className="text-center">데이터이름</th>
          <td>
            <div id="name">{data?.name}</div>
          </td>
        </tr>

        <tr>
          <th className="text-center">신청자</th>
          <td>
            <div id="contextpath">{data?.userName}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">신청일</th>
          <td>
            <div id="external_url">{data?.regDt}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">분류</th>
          <td>
            <div id="rest_category">{data?.category}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">타입</th>
          <td>
            <div id="type">{data?.type}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">상태</th>
          <td>
            <div id="swagger_url">{data?.status}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">만료일</th>
          <td>
            <div id="swagger_homepath">{data?.expireTime}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">목적</th>
          <td>
            <div id="provider">{data?.purpose}</div>
          </td>
        </tr>
        </tbody>
      </table>
    </SysModal>
  );
};

ModalDataUseDetail.defaultProps = {};

export default ModalDataUseDetail;