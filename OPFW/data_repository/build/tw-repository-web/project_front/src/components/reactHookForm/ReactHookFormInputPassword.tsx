'use strict';

import React from "react";
import {ReactHookFormInputProps} from "./ReactHookFormInputTypes";

const ReactHookFormInputPassword = ({name, label, className, reactHookFormOption, errors, register}: ReactHookFormInputProps) => {

    const confirmOption = {
        validate : (value:string, formValues:any) => {
            return value === formValues[name] || "비밀번호가 다릅니다.";
        }
    }

    return (
        <div>
            <div className={`input-block ${className}`}>
                <div>{label}</div>
                <input type="password" {...register(name, reactHookFormOption)}/>
                <div className="error-message">{errors[name]?.message}</div>
            </div>
            <div className={`input-block ${className}`} style={{ marginTop: "21px" }}>
                <div>{label} 확인</div>
                <input type="password" {...register("confirmPassword", confirmOption)}/>
                <div className="error-message">{errors?.confirmPassword?.message}</div>
            </div>
        </div>
    );
}

export default ReactHookFormInputPassword;