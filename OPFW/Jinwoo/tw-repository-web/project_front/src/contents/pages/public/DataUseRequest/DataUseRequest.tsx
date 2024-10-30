"use strict";

import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicMain } from "@/components/PublicMain";
import { PublicContainer } from "@/components/PublicContainer";

import "./DataUseRequestStyle";
import Global from "@/modules/Global";
import ReactHookFormTextarea from "@/components/reactHookForm/ReactHookFormTextarea";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";

const DataUseRequest = () => {
  const [detailData, setDetailData] = useState(null);
  const form = useForm({
    mode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = form;

  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);

  const fetchDetailData = useCallback(async () => {
    try {
      let options = Global.getFetchOption(params);

      fetch("/public/data-item/detail.json", options)
        .then((res) => res.json())
        .then((res) => {
          if (res.result === "success") {
            setDetailData(res.data);
          } else {
            alert(res.message);
          }
        });
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    fetchDetailData();
  }, []);

  const onSubmit = async (data: any) => {
    fetchJson("POST", "/user/data-use-request.json", {
      data: {
        dataId: detailData?.id,
        purpose: data.purpose,
      },
      successCallback: (responseJson: any) => {
        customAlert("사용 신청 하였습니다.");
        window.history.back();
      },
    });
  };

  return (
    <PublicContainer>
      <PublicHeader />
      <PublicMain>
        <div className="h-10 w-full" />
        <div className="flex items-center justify-center">
          <div className="max-w-3x1 rounded-2xl border bg-white p-10 shadow-xl">
            <div className="flex flex-col items-center space-y-4">
              <h1 className="w-4/6 text-center text-2xl font-bold text-gray-700">
                데이터 사용 신청
              </h1>
              <table className="data-desc-table">
                <tbody>
                  <tr>
                    <th>데이터 이름</th>
                    <td>{detailData ? detailData.name : ""}</td>
                  </tr>
                  <tr>
                    <th>데이터 분류</th>
                    <td>{detailData ? detailData.category : ""}</td>
                    <th>데이터 타입</th>
                    <td>{detailData ? detailData.type : ""}</td>
                  </tr>
                  <tr>
                    <th>등록인</th>
                    <td>{detailData ? detailData.registrantName : ""}</td>
                    <th>등록인 전화번호</th>
                    <td>
                      {detailData ? detailData.registrantPhoneNumber : ""}
                    </td>
                  </tr>
                  <tr>
                    <th>제공기관</th>
                    <td>{detailData ? detailData.institutionName : ""}</td>
                  </tr>
                  <tr>
                    <th>담당자</th>
                    <td>{detailData ? detailData.managerName : ""}</td>
                    <th>담당자 전화번호</th>
                    <td>{detailData ? detailData.managerPhoneNumber : ""}</td>
                  </tr>
                </tbody>
              </table>
              <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <ReactHookFormTextarea
                    name="purpose"
                    className="react-hook-form-input purpose"
                    label="활용목적"
                    reactHookFormOption={ReactHookFormOptions.DataUsePurpose("활용목적")}
                    form={form}
                  />
                </div>
                <div className="h-5"></div>
                <div
                  className="space-x-3"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    type="submit"
                  >
                    신청
                  </button>
                  <button
                    className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    type="button"
                    onClick={() => window.history.back()}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </PublicMain>
      <PublicFooter />
    </PublicContainer>
  );
};

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<DataUseRequest/>, domContainer);