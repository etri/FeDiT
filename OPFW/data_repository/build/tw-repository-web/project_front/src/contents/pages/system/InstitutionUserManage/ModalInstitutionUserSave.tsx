import React, { useEffect, useMemo, useRef, useState } from "react";
import { getObjectFromForm } from "@/utils/formUtil";
import { customAlert, customConfirm } from "@/utils/dialogUtil";
import { fetchJson } from "@/utils/fetchUtil";
import SysModal from "@/components/sysModal/SysModal";
import SysLabelText from "@/components/sysModal/SysLabelText";
import SysLabelToggle from "@/components/sysModal/SysLabelToggle";

type props = {
  data: any;
  isOpened: boolean;
  onClose: () => void;
  reloadDatatable: () => void;
}

const ModalInstitutionUserSave = ({data,
                                    isOpened,
                                    onClose,
                                    reloadDatatable,}: props) => {

  const defaultFormValue = useMemo<any>(() => {
    const defaultValue: any = {
      userId: "",
      managerUserId: "",
      userLoginId: "",
      userNm: "",
      email: "",
      mobile: "",
      isActive: false,
    };

    return defaultValue;
  }, []);
  const [formData, setFormData] = useState<any>(defaultFormValue);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpened) {
      let curData = data?data:defaultFormValue;
      curData.isActive=!!(curData.userSt && curData.userSt === '1');
      setFormData(curData);
    }
  }, [isOpened, data]);

  const onSave = () => {
    if (null == formRef.current) {
      console.log("formRef is null.");
      return;
    }

    let formJson = getObjectFromForm(formRef.current);
    formJson.userSt=(formJson.isActive&&formJson.isActive==="on")?'1':'8';

    if (customConfirm("수정하시겠습니까?")) {
      fetchJson("PATCH", "/system/user/update-patch.json", {
        data: formJson,
        successCallback: (responseJson: any) => {
          customAlert("수정하였습니다.");
          reloadDatatable();
          onClose();
        },
      });
    }
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
      수정
    </button>
  );

  return (
    <>
      <SysModal
        ownClassName={"save-modal"}
        isOpened={isOpened}
        onClose={onClose}
        title="기관 회원 사용설정"
        footerBeforeCloseButton={footerBeforeCloseButton}
      >
        <form
          ref={formRef}
          id="saveForm"
          name="saveForm"
          className="form-horizontal form-label-left"
        >
          <input type="hidden" name="userId" value={formData.userId} />
          <input type="hidden" name="managerUserId" value={formData.managerUserId} />
          <SysLabelText
            disabled={true}
            inputName={"userLoginId"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("userLoginId", e.target.value)
            }
            value={formData.userLoginId}
            name={"로그인아이디"}
          />
          <SysLabelText
            disabled={true}
            inputName={"userNm"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("userNm", e.target.value)
            }
            value={formData.userNm}
            name={"이름"}
          />
          <SysLabelText
            disabled={true}
            inputName={"addr"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("addr", e.target.value)
            }
            value={formData.addr}
            name={"주소"}
          />
          <SysLabelText
            disabled={true}
            inputName={"email"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeDetail("email", e.target.value)
            }
            value={formData.email}
            name={"이메일"}
          />
          {/*<SysLabelText*/}
          {/*  disabled={true}*/}
          {/*  inputName={"mobile"}*/}
          {/*  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>*/}
          {/*    onChangeDetail("mobile", e.target.value)*/}
          {/*  }*/}
          {/*  value={formData.mobile}*/}
          {/*  name={"전화번호"}*/}
          {/*/>*/}
          <SysLabelToggle inputName={"isActive"} name={"사용여부"} checked={formData.isActive}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            onChangeDetail("isActive", e.target.checked)
                          }}
          />
        </form>
      </SysModal>
    </>
  );
};

ModalInstitutionUserSave.defaultProps = {};

export default ModalInstitutionUserSave;