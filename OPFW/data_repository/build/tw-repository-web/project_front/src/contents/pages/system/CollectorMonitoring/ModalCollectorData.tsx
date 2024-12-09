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
    reloadDatatable: () => void;
};

const ModalCollectorSave = ({
                                  data,
                                  isOpened,
                                  onClose,
                                  reloadDatatable,
                              }: props) => {
    const defaultFormValue = useMemo<any>(() => {
        const defaultValue: any = {
            name: "",
            label: ""
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
                fetchJson("PATCH", "/system/collector.json", {
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
                fetchJson("PUT", "/system/collector.json", {
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
                    <SysLabelText
                        inputName={"name"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onChangeDetail("name", e)
                        }
                        value={formData.name}
                        name={"수집기 이름"}
                    />
                    <SysLabelText
                        inputName={"label"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onChangeDetail("label", e)
                        }
                        value={formData.label}
                        name={"계측 이름"}
                    />
                </form>
            </SysModal>
        </>
    );
};

ModalCollectorSave.defaultProps = {};

export default ModalCollectorSave;
