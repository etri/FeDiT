"use strict";

import React, { useEffect, useMemo, useRef, useState } from "react";

import SysModal from "@/components/sysModal/SysModal";
import Global from "@/modules/Global";
import SysLabelText from "@/components/sysModal/SysLabelText";
import TabList from "@/components/tab/TabList";
import TabItem from "@/components/tab/TabItem";
import { getObjectFromForm } from "@/utils/formUtil";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";
import SysInputSelect from "@/components/sysModal/SysInputSelect";
import SysInputOption from "@/components/sysModal/SysInputOption";
import useFetchCodeValues from "@/hooks/fetch/useFetchCodeValues";

const ModalDataItemSave = ({
  data,
  isOpened,
  onClose,
  onClickOpenInstitutionModal,
  reloadDatatable,
}: {
  data: any;
  isOpened: boolean;
  onClose: () => void;
  onClickOpenInstitutionModal: (data:any)=>void;
  reloadDatatable: () => void;
}) => {
  const { codeValues, loading, error } = useFetchCodeValues('dataClassification' );

  const defaultFormValue = useMemo<any>(() => {
    const defaultValue: any = {
      id: "",
      name: "",
      serviceId: "",
      externalUrl: "",
      restIp: "",
      restPort: "",
      swaggerUrl: "",
      swaggerHomepath: "",
      institutionId: "",
      institutionName: "",
      category: ""
    };

    return defaultValue;
  }, []);
  const [formData, setFormData] = useState<any>(defaultFormValue);
  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef(null);

  useEffect(() => {
    if (isOpened) {
      if (null != data) {
        $(selectRef.current).selectpicker("val", data.category);
        setFormData({...defaultFormValue, ...data});
      } else {
        setFormData(defaultFormValue);
      }
    }
  }, [isOpened]);

  useEffect(() => {
    if (isOpened) {
      setFormData({...defaultFormValue, ...data});
    }
  }, [data]);

  const onSave = () => {
    if (null == formRef.current) {
      console.log("formRef is null.");
      return;
    }

    let formJson = getObjectFromForm(formRef.current);

    // console.log(formJson);
    // console.log(codeValues);

    if (data) {
      if (confirm("수정하시겠습니까?")) {
        fetchJson("PATCH", "/system/data-item.json", {
          data: formJson,
          successCallback: (responseJson: any) => {
            customAlert("수정하였습니다.");
            reloadDatatable();
            onClose();
          },
        });
      }
    }
    // else {
    //   if (confirm("등록하시겠습니까?")) {
    //     fetchJson("POST", "/user/service/insert.json", {
    //       data: formJson,
    //       successCallback: (responseJson: any) => {
    //         customAlert("등록하였습니다.");
    //         reloadDatatable();
    //         onClose();
    //       },
    //     });
    //   }
    // }
  };

  const onChangeDetail = (
    key: string,
    value: any,
  ) => {
    setFormData((prevState: any) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const footerBeforeCloseButton = (
    <button type="button" className="btn btn-outline-primary" onClick={onSave}>
      {null == data ? "저장" : "수정"}
    </button>
  );

  return (
    <React.Fragment>
      <SysModal
        ownClassName={"save-modal"}
        isOpened={isOpened}
        onClose={onClose}
        title={null == data ? "등록" : "수정"}
        footerBeforeCloseButton={footerBeforeCloseButton}
      >
        <form
          ref={formRef}
          id="saveForm"
          name="saveForm"
          className="form-horizontal form-label-left"
        >
          <input type="hidden" name="id" value={formData?.id}/>
          <input type="hidden" name="institutionId" value={formData?.institutionId}/>
          <TabList activeTabIndex={0}>
            <TabItem label="외부">
              <SysLabelText
                hidden={false}
                inputName={"external_url"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("externalUrl", e.target.value)
                }
                value={formData.externalUrl}
                name={"외부URL"}
              />
              <SysLabelText
                hidden={true}
                inputName={"rest_ip"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("restIp", e.target.value)
                }
                value={formData.restIp}
                name={"REST IP"}
              />
              <SysLabelText
                hidden={true}
                inputName={"rest_port"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("restPort", e.target.value)
                }
                value={formData.restPort}
                name={"REST PORT"}
              />
              <SysLabelText
                hidden={true}
                inputName={"swagger_url"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("swaggerUrl", e.target.value)
                }
                value={formData.swaggerUrl}
                name={"SWAGGER URL"}
              />
            </TabItem>
            <TabItem label="내부">
              <SysLabelText
                hidden={true}
                inputName={"external_url"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("externalUrl", e.target.value)
                }
                value={formData.externalUrl}
                name={"외부URL"}
              />
              <SysLabelText
                hidden={false}
                inputName={"rest_ip"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("restIp", e.target.value)
                }
                value={formData.restIp}
                name={"REST IP"}
              />
              <SysLabelText
                hidden={false}
                inputName={"rest_port"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("restPort", e.target.value)
                }
                value={formData.restPort}
                name={"REST PORT"}
              />
              <SysLabelText
                hidden={false}
                inputName={"swagger_url"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("swaggerUrl", e.target.value)
                }
                value={formData.swaggerUrl}
                name={"SWAGGER URL"}
              />
            </TabItem>
          </TabList>
          <SysInputSelect
            ref={selectRef}
            name={"데이터분류"}
            inputName={"category"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onChangeDetail("category", e.target.value)
            }
          >
            {codeValues &&
              codeValues.map((item: any) => (
                <SysInputOption label={item.cdDtlNm} value={item.cdDtlId} />
              ))}
            {/*<SysInputOption label="교통1" value="traffic1" />*/}
          </SysInputSelect>
          <SysLabelText
            inputName={"name"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("name", e.target.value)
            }
            value={formData.name}
            name={"데이터명"}
          />
          <SysLabelText
            inputName={"service_id"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("serviceId", e.target.value)
            }
            value={formData.serviceId}
            name={"서비스 ID"}
          />
          <SysLabelText
            inputName={"swagger_homepath"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("swaggerHomepath", e.target.value)
            }
            value={formData.swaggerHomepath}
            name={"API문서 주소"}
          />
          {/*<SysLabelText*/}
          {/*  inputName={"institutionName"}*/}
          {/*  className="col-md-5 col-sm-5 col-xs-12"*/}
          {/*  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>*/}
          {/*    onChangeDetail("institutionName", e.target.value)*/}
          {/*  }*/}
          {/*  value={formData.institutionName}*/}
          {/*  name={"제공업체"}*/}
          {/*/>*/}
          <div className="form-group">
            <label className="control-label col-md-3 col-sm-3 col-xs-12">
              {"제공업체"} <span className="required">*</span>
            </label>
            <div className="col-md-5 col-sm-5 col-xs-10">
              <input
                type="text"
                name={"institutionName"}
                id={"institutionName"}
                data-name={"제공업체"}
                disabled
                className="form-control col-md-7 col-xs-12 req"
                placeholder={"제공업체" + "입력"}
                value={formData.institutionName}
              />
            </div>
            <div className="col-md-2 col-sm-2 col-xs-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={(e) => onClickOpenInstitutionModal(data)}
              >
                설정하기
              </button>
            </div>
          </div>
        </form>
      </SysModal>
    </React.Fragment>
  );
};

export default ModalDataItemSave;
