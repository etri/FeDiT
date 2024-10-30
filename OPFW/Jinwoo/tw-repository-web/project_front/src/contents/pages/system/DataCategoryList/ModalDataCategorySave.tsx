"use strict";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getObjectFromForm } from "@/utils/formUtil";
import SysModal from "@/components/sysModal/SysModal";
import SysLabelText from "@/components/sysModal/SysLabelText";
import { customAlert, customConfirm } from "@/utils/dialogUtil";

type props = {
  data: any;
  isOpened: boolean;
  onClose: () => void;
  reloadDatatable: () => void;
};

const ModalDataCategorySave = ({
  data,
  isOpened,
  onClose,
  reloadDatatable,
}: props) => {
  const defaultFormValue = useMemo<any>(() => {
    const defaultValue: any = {
      category: "",
      name: "",
      iconFileId: "",
      iconFileName: "",
      iconFilePath: "",
      description: "",
    };

    return defaultValue;
  }, []);
  const [formData, setFormData] = useState<any>(defaultFormValue);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpened) {
      if (null != data) {
        setFormData({ ...defaultFormValue, ...data });
      } else {
        setFormData(defaultFormValue);
      }
    }
  }, [isOpened]);

  useEffect(() => {
    if (isOpened) {
      setFormData({ ...defaultFormValue, ...data });
    }
  }, [data]);

  const onSave = () => {
    if (null == formRef.current) {
      console.log("formRef is null.");
      return;
    }

    let formData = new FormData(formRef.current);

    if (data) {
      if (customConfirm("수정하시겠습니까?")) {
        fetch("/system/data-category/modify.json", {
          method: "POST",
          body: formData,
        })
          .then(async (response) => {
            if (response.ok) {
              customAlert("수정하였습니다.");
              reloadDatatable();
              onClose();
            } else {
              let responseJson = await response.json();
              customAlert(responseJson.message);
              console.log(JSON.stringify(responseJson));
            }
          })
          .catch((err) => console.log(err));
      }
    } else {
      if (customConfirm("등록하시겠습니까?")) {
        fetch("/system/data-category/insert.json", {
          method: "POST",
          body: formData,
        })
          .then(async (response) => {
            if (response.ok) {
              customAlert("등록하였습니다.");
              reloadDatatable();
              onClose();
            } else {
              let responseJson = await response.json();
              customAlert(responseJson.message);
              console.log(JSON.stringify(responseJson));
            }
          })
          .catch((err) => console.log(err));
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
          <input type="hidden" name="iconFileId" value={formData?.iconFileId} />
          <SysLabelText
            inputName={"category"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("category", e)
            }
            value={formData.category}
            name={"카테고리"}
          />
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
              아이콘 <span className="required">*</span>
            </label>
            <div
              className="col-md-7 col-sm-7 col-xs-12"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <input
                disabled
                type="text"
                name="iconFileName"
                id="iconFileName"
                data-name="아이콘"
                className="form-control col-md-8 req"
                placeholder={"아이콘" + "입력"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeDetail("iconFileName", e)
                }
                value={formData.iconFileName}
              />
              <label htmlFor="iconFilePath" className="btn btn-outline-primary">
                파일찾기
              </label>
              <input
                type="file"
                accept=".jpg, .jpeg, .png"
                name="iconFilePath"
                id="iconFilePath"
                style={{ display: "none" }}
                onChange={(e) => {
                  setFormData((prevState: any) => ({
                    ...prevState,
                    iconFileName: e.target.value.replace(/^.*[\\/]/, ""),
                  }));
                }}
              />
            </div>
          </div>
          <SysLabelText
            inputName={"description"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("description", e)
            }
            value={formData.description}
            name={"설명"}
          />
        </form>
      </SysModal>
    </>
  );
};

ModalDataCategorySave.defaultProps = {};

export default ModalDataCategorySave;
