'use strict';

import React, {useCallback, useEffect, useMemo, useState} from "react";
import styled from "styled-components";
import SwaggerUI from "swagger-ui-react";
import Card from "@/components/Card";
import Global from "@/modules/Global";
import RawDataDetailTable from "@/components/tables/DataDetailTable";
import MultiplePhraseFilterPlugin from "@/libs/plugins/MultiplePhraseFilterPlugin";
import NeverShowInfoPlugin from "@/libs/plugins/NeverShowInfoPlugin";
import { showRegistDataButton } from "@/utils/userUtil";

import "swagger-ui-react/swagger-ui.css";
import ButtonDataUseRequest from "@/components/button/ButtonDataUseRequest";
import { fetchGet } from "@/utils/fetchUtil";

const RawDataDetailContentWrapper = styled.div`
    width: 86%;
    margin: 0 auto;
    
    & .filter-container {
        display: none;
    }
`;

const RawDataDetailTitle = styled.div`
    font-weight: 500;
    font-size: 25px;
    height: 80px;
    display: flex;
    align-items: center;
    margin-bottom: 15px;
`;

const RawDataDetailTableBox = styled.div`
    margin-top: 40px;
    display: flex;
    flex-direction: column;
`;

const RawDataDetailTableTitle = styled.div`
    font-size: 22px;
    //margin-bottom: 20px;
`;

const RawDataDetailContent = () => {
    const [detailData, setDetailData] = useState(null)
    const [tag, setTag] = useState("")
    const [error, setError] = useState(null)
    const [swaggerSpec, setSwaggerSpec] = useState(null)



    useEffect(() => {
        const fetchRawDetailData = async () => {
            try {
                const queryString = window.location.search;
                const params = new URLSearchParams(queryString)
                let options = Global.getFetchOption(params);

                return await fetch("/public/data-item/detail.json", options)
                  .then(res => res.json())
                  .then(
                    (responseJson) => {
                        if( responseJson.result === "success" ) {
                            setDetailData(responseJson);
                            setTag(`measure-position, ${responseJson.data.swaggerTagList}`);
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
                    //     type: "apiKey",
                    //     in: "header",
                    //     name: "X-API-KEY"
                    // }

                    // console.log(responseJson);

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
                                if(methodValue.parameters===null || methodValue.parameters===undefined) {
                                    methodValue.parameters = [{
                                        $ref: "#/components/parameters/rest_key"
                                    }];
                                }else{
                                    methodValue.parameters.unshift({
                                        $ref: "#/components/parameters/rest_key"
                                    })
                                }
                            }
                        }
                    }


                    setSwaggerSpec(responseJson);
                }
            })
        }

        const executeSequentially = async () => {
            const responseJson = await fetchRawDetailData();
            await fetchSwagger(responseJson);
        }

        executeSequentially();
    }, []);

    const getTableStructure = () => {
        let tableStructure=[
              [{type: "name", name: "데이터명"}],
            [{value: `${detailData.gatewayUrl}/${detailData.data?.serviceId}/v1`, name: "api base url"}],
            // [{value: `${detailData.gatewayUrl}/${detailData.data?.serviceId}api`, name: "swagger base url"}],
            // [{type: "swaggerHomepath", name: "swagger homepath"}],
            [{type: "apiType", name: "타입"}, {type: "dataFormat", name: "포맷"}],
            [{type: "registrantName", name: "등록인"}/*, {type: "registrantPhoneNumber", name: "등록인 전화번호"}*/],
            [{type: "institutionName", name: "제공기관"}],
            [{type: "managerName", name: "담당자"}/*,{type: "managerPhoneNumber", name: "담당자 전화번호"}*/],
            [{type: "description", name: "설명"}]
        ]

      if(detailData.userInstitutionId) {
          tableStructure[1].push({value: `${detailData.data.restIp}:${detailData.data.restPort}/v1`, name: "inner api base url"});
          // tableStructure[2].push({value: `${detailData.data.swaggerUrl}`, name: "inner swagger base url"});
      }

      return tableStructure;
    }

    if (error) return <div>시스템 오류가 발생했습니다. 관리자에게 문의하십시오.</div>

    return (
        <RawDataDetailContentWrapper>
            <RawDataDetailTitle>데이터 상세</RawDataDetailTitle>
            {detailData && <Card title={detailData.data?.name} content={`${detailData.gatewayUrl}/${detailData.data?.serviceId}/v1`}></Card>}
            <RawDataDetailTableBox>
                <div className="flex flex-row justify-between">
                    <RawDataDetailTableTitle>데이터 정보</RawDataDetailTableTitle>
                    {detailData&&<ButtonDataUseRequest dataId={detailData.data?.id} disabled={detailData.alreadyRequested}/>}
                </div>
                <div className="w-full h-8"/>
                {detailData && <RawDataDetailTable
                    tableStructure={getTableStructure()}
                    data={detailData.data}
                />}
            </RawDataDetailTableBox>
            {(detailData && tag && swaggerSpec) &&
                <SwaggerUI
                    // url={`${detailData.gatewayUrl}/${detailData.data?.serviceId}api/swagger`}
                    spec={swaggerSpec}
                    plugins={[ MultiplePhraseFilterPlugin, NeverShowInfoPlugin ]}
                    filter={tag}
                />
            }
        </RawDataDetailContentWrapper>
    );
}

export default RawDataDetailContent