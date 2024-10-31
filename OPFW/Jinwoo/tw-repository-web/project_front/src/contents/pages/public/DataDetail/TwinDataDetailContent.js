"use strict";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import SwaggerUI from "swagger-ui-react";
import TwinDataDetailTable from "@/components/tables/DataDetailTable";
import "swagger-ui-react/swagger-ui.css";
import Global from "@/modules/Global";
import Card from "@/components/Card";
import MultiplePhraseFilterPlugin from "@/libs/plugins/MultiplePhraseFilterPlugin";
import NeverShowInfoPlugin from "@/libs/plugins/NeverShowInfoPlugin";
import { showRegistDataButton } from "@/utils/userUtil";
import ButtonDataUseRequest from "@/components/button/ButtonDataUseRequest";
import { fetchGet } from "@/utils/fetchUtil";

const TwinDataDetailContentWrapper = styled.div`
    width: 86%;
    margin: 0 auto;

    & .filter-container {
        display: none;
    }
`;

const TwinDataDetailTitle = styled.div`
    font-weight: 500;
    font-size: 25px;
    height: 80px;
    display: flex;
    align-items: center;
    margin-bottom: 15px;
`;

const TwinDataDetailTableBox = styled.div`
    margin-top: 40px;
    display: flex;
    flex-direction: column;
`;

const TwinDataDetailTableTitle = styled.div`
    font-size: 22px;
    //margin-bottom: 20px;
`;

const TwinDataDetailContent = () => {
  const [detailData, setDetailData] = useState(null);
  const [error, setError] = useState(null);
  const [swaggerSpec, setSwaggerSpec] = useState(null)

  useEffect(() => {
    const fetchTwinDetailData = async () => {
      try {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        let options = Global.getFetchOption(params);

        return await fetch("/public/data-item/detail.json", options)
          .then(res => res.json())
          .then(
            (responseJson) => {
              if (responseJson.result === "success") {
                setDetailData(responseJson);
                return responseJson;
              } else {
                alert(responseJson.message);
              }
            }
          );
      } catch (e) {
        setError(e);
      }
    };

    const fetchSwagger = async (responseDetailData) => {
      await fetchGet(`${responseDetailData.gatewayUrl}/${responseDetailData.data?.serviceId}api/swagger`, {
        successCallback: (responseJson) => {

          responseJson.servers.at(0).url = `${responseDetailData.gatewayUrl}/${responseDetailData.data?.serviceId}/v1`;
          // responseJson.security = [{ApiKeyAuth:[]}]
          // responseJson.components.securitySchemes = {}
          // responseJson.components.securitySchemes.ApiKeyAuth = {
          //   type: "apiKey",
          //   in: "header",
          //   name: "X-API-KEY"
          // }

          responseJson.components.parameters.rest_key = {
            description: "rest key",
            in: "query",
            name: "rest_key",
            required: true,
            schema: {
              type: "string"
            }
          }
          // console.log(responseJson);

          let targetMethods = ["get", "post", "put"]
          for(const [api, value] of Object.entries(responseJson.paths)) {
            for(const [method, methodValue] of Object.entries(value)) {
              if(targetMethods.includes(method)){
                // console.log(`api : ${api}, method : ${method}`);
                methodValue.parameters.unshift({
                  $ref: "#/components/parameters/rest_key"
                })
              }
            }
          }

          setSwaggerSpec(responseJson);
        }
      });
    };

    const executeSequentially = async () => {
      const responseJson = await fetchTwinDetailData();
      await fetchSwagger(responseJson);
    }

    executeSequentially();
  }, []);

  if (error) return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>;

  return (
    <TwinDataDetailContentWrapper>
      <TwinDataDetailTitle>데이터 상세</TwinDataDetailTitle>
      {detailData && <Card title={detailData.data?.name}
                           content={`${detailData.gatewayUrl}/${detailData.data?.serviceId}/v1`}></Card>}
      <TwinDataDetailTableBox>
        <div className="flex flex-row justify-between">
          <TwinDataDetailTableTitle>데이터 정보</TwinDataDetailTableTitle>
          {detailData && <ButtonDataUseRequest dataId={detailData.data?.id} />}
        </div>
        <div className="w-full h-8" />
        {detailData && <TwinDataDetailTable
          tableStructure={[
            [{ type: "name", name: "트윈명" }],
            [{
              value: `${detailData.gatewayUrl}/${detailData.data?.serviceId}/v1`,
              name: "api base url"
            }],
            [{
              value: `${detailData.gatewayUrl}/${detailData.data?.serviceId}api`,
              name: "swagger base url"
            }],
            [{ type: "swaggerHomepath", name: "swagger homepath" }],
            [{ type: "apiType", name: "타입" }, { type: "dataFormat", name: "포맷" }],
            [{ type: "serviceId", name: "아이디" }],
            [{ type: "registrantName", name: "등록인" }, { type: "registrantPhoneNumber", name: "등록인 전화번호" }],
            [{ type: "institutionName", name: "제공기관" }],
            [{ type: "managerName", name: "담당자" }, { type: "managerPhoneNumber", name: "담당자 전화번호" }],
            [{ type: "description", name: "설명" }]
          ]}
          data={detailData.data}
        />}
      </TwinDataDetailTableBox>
      {detailData && swaggerSpec &&
        <SwaggerUI
          // url={`${detailData.gatewayUrl}/${detailData.data?.serviceId}api/swagger`}
          spec={swaggerSpec}
          plugins={[MultiplePhraseFilterPlugin, NeverShowInfoPlugin]}
        />
      }
    </TwinDataDetailContentWrapper>
  );
};

export default TwinDataDetailContent;