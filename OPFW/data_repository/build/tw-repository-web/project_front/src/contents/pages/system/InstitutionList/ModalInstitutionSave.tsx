"use strict";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SysLabelText from "@/components/sysModal/SysLabelText";
import SysModal from "@/components/sysModal/SysModal";
import { getObjectFromForm } from "@/utils/formUtil";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert, customConfirm } from "@/utils/dialogUtil";
import ModalInstitutionDetail from "@/contents/pages/system/InstitutionList/ModalInstitutionDetail";
import ModalInstitutionManager from "@/contents/pages/system/InstitutionList/ModalInstitutionManager";

type props = {
  data: any;
  isOpened: boolean;
  onClose: () => void;
  onClickSetManager: (data:any) => void;
  reloadDatatable: () => void;
};

const ModalInstitutionSave = ({
  data,
  isOpened,
  onClose,
  onClickSetManager,
  reloadDatatable,
}: props) => {
  const defaultFormValue = useMemo<any>(() => {
    const defaultValue: any = {
      id: "",
      name: "",
      managerUserName: "",
      managerUserId: "",
      address: "",
      addressDetail: "",
      zipCode: "",
      phoneNumber: "",
    };

    return defaultValue;
  }, []);
  const [formData, setFormData] = useState<any>(defaultFormValue);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpened) {
      if (null != data) {
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

    if (data) {
      if (customConfirm("수정하시겠습니까?")) {
        fetchJson("PATCH", "/system/institution.json", {
          data: formJson,
          successCallback: (responseJson: any) => {
            customAlert("수정하였습니다.");
            reloadDatatable();
            onClose();
          },
        });
      }
    } else {
      if (customConfirm("등록하시겠습니까?")) {
        fetchJson("PUT", "/system/institution.json", {
          data: formJson,
          successCallback: (responseJson: any) => {
            customAlert("등록하였습니다.");
            reloadDatatable();
            onClose();
          },
        });
      }
    }
  };

  const onChangeDetail = (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prevState: any) => ({
      ...prevState,
      [key]: event.target.value,
    }));
  };

  const footerBeforeCloseButton = (
    <button type="button" className="btn btn-outline-primary" onClick={onSave}>
      {null == data ? "저장" : "수정"}
    </button>
  );

  return (
    <>
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
          <input type="hidden" name="managerUserId" value={formData?.managerUserId}/>
          <SysLabelText
            inputName={"name"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("name", e)
            }
            value={formData.name}
            name={"이름"}
          />
          <div className="form-group">
            <label className="control-label col-md-3 col-sm-3 col-xs-12">
              관리자 <span className="required">*</span>
            </label>
            <div className="row">
              <div className="col-md-5">
                <input
                  disabled
                  type="text"
                  name="managerUserName"
                  id="managerUserName"
                  data-name="관리자"
                  className="form-control col-md-5 col-xs-12 req"
                  placeholder={"관리자" + "입력"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChangeDetail("managerUserName", e)
                  }
                  value={formData.managerUserName}
                />
              </div>
              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={(e) => onClickSetManager(data)}
                >
                  변경
                </button>
              </div>
            </div>
          </div>
          <SysLabelText
            inputName={"address"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("address", e)
            }
            value={formData.address}
            name={"주소"}
          />
          <SysLabelText
            inputName={"addressDetail"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("addressDetail", e)
            }
            value={formData.addressDetail}
            name={"상세주소"}
          />
          <SysLabelText
            inputName={"zipCode"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("zipCode", e)
            }
            value={formData.zipCode}
            name={"우편번호"}
          />
          <SysLabelText
            inputName={"phoneNumber"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("phoneNumber", e)
            }
            value={formData.phoneNumber}
            name={"전화번호"}
          />
        </form>
      </SysModal>
    </>
  );
};

ModalInstitutionSave.defaultProps = {};

export default ModalInstitutionSave;
