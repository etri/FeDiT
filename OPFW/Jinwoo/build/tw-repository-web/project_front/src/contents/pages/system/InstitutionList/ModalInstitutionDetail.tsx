import React from "react";
import SysModal from "@/components/sysModal/SysModal";

type props = {
  data: any | null;
  isOpened: boolean;
  onClose: () => void;
}

const ModalInstitutionDetail = ({data, isOpened, onClose}: props) => {

  return (
    <SysModal ownClassName={"detail-modal"} isOpened={isOpened} onClose={onClose} title={"상세보기"}>
      <table className="table table-condensed">
        <colgroup>
          <col width="30%" />
          <col width="70%" />
        </colgroup>
        <tbody>
        <tr>
          <th className="text-center">이름</th>
          <td>
            <div id="name">{data?.name}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">관리자</th>
          <td>
            <div id="name">{data?.managerUserId}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">주소</th>
          <td>
            <div id="contextpath">{data?.address}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">상세주소</th>
          <td>
            <div id="address_detail">{data?.addressDetail}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">우편번호</th>
          <td>
            <div id="zip_code">{data?.zipCode}</div>
          </td>
        </tr>
        <tr>
          <th className="text-center">전화번호</th>
          <td>
            <div id="phone_number">{data?.phoneNumber}</div>
          </td>
        </tr>
        </tbody>
      </table>
    </SysModal>
  );
};

ModalInstitutionDetail.defaultProps = {};

export default ModalInstitutionDetail;