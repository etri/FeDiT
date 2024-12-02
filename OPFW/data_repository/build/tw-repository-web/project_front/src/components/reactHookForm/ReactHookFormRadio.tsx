'use strict';

import React from "react";
import {ReactHookFormCheckboxProps, ReactHookFormRadioProps} from "./ReactHookFormInputTypes";

const ReactHookFormRadio = ({name, label, className, value, hidden = false, reactHookFormOption, register}: ReactHookFormRadioProps) => {
    let attributes : any = {};
    if(value){
        attributes.value = value;
    }

    return (
        <div className={className} style={{display: hidden ? 'none' :'block' }}>
            <div className="radio-row">
                <input type="radio" {...attributes} {...register(name, reactHookFormOption)}/>
                <label>{label}</label>
            </div>
        </div>
    );
}

export default ReactHookFormRadio;