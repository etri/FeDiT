"use strict";

import React from "react";

import SysModal from "@/components/sysModal/SysModal";

type ModalDataItemDetailProps = {
  data: any | null;
  isOpened: boolean;
  onClose: () => any;
};

const ModalDataItemDetail = ({
  data,
  isOpened,
  onClose,
}: ModalDataItemDetailProps) => {

  return (
    <SysModal
      ownClassName={"detail-modal"}
      isOpened={isOpened}
      onClose={onClose}
      title={"상세보기"}
    >
      <table className="table-condensed table">
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
            <th className="text-center">서비스ID</th>
            <td>
              <div id="contextpath">
              {data?.serviceId}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">외부 URL</th>
            <td>
              <div id="external_url">
              {data?.externalUrl}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">REST IP</th>
            <td>
              <div id="rest_ip">{data?.restIp}</div>
            </td>
          </tr>
          <tr>
            <th className="text-center">REST PORT</th>
            <td>
              <div id="rest_port">{data?.restPort}</div>
            </td>
          </tr>
          <tr>
            <th className="text-center">SWAGGER URL</th>
            <td>
              <div id="swagger_url">
              {data?.swaggerUrl}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">SWAGGER HomePath</th>
            <td>
              <div id="swagger_homepath">
              {data?.swaggerHomepath}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">등록인</th>
            <td>
              <div id="provider">
              {data?.registrantName}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">등록인 연락처</th>
            <td>
              <div id="provider">
              {data?.registrantPhoneNumber}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">제공업체</th>
            <td>
              <div id="provider">
              {data?.institutionName}
              </div>
            </td>
          </tr>
          <tr>
            <th className="text-center">담당자</th>
            <td>
              <div id="manager">{data?.managerName}</div>
            </td>
          </tr>
          <tr>
            <th className="text-center">담당자 연락처</th>
            <td>
              <div id="manager_phone_number">
              {data?.managerPhoneNumber}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </SysModal>
  );
};

export default ModalDataItemDetail;
