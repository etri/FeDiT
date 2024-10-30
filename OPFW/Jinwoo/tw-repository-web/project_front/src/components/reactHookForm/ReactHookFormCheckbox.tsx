'use strict';

import React from "react";
import {ReactHookFormCheckboxProps} from "./ReactHookFormInputTypes";

const ReactHookFormCheckbox = ({name, label, className, reactHookFormOption, errors, register}: ReactHookFormCheckboxProps) => {
    return (
        <div className={className}>
            <input type="checkbox" {...register(name, reactHookFormOption)}/>
            <label>{label}</label>
            <div className="error-message">{errors[name]?.message}</div>
        </div>
    );
}

export default ReactHookFormCheckbox;