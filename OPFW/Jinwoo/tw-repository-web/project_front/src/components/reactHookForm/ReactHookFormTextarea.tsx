'use strict';

import React from "react";
import {ReactHookFormTextAreaProps} from "./ReactHookFormInputTypes";

const ReactHookFormTextarea = ({name, label, className, type, onFocus, reactHookFormOption, form}: ReactHookFormTextAreaProps) => {
    let attributes : any = {};
    const watchData = form.watch(name, "");

    if(type){
        attributes.type = type;
    }
    if(onFocus){
        attributes.onFocus = onFocus;
    }

    return (
        <div className={className}>
            <div className="input-element">
                <div className="label">{label}</div>
                <textarea {...attributes} {...form.register(name, reactHookFormOption)}/>
            </div>
            {reactHookFormOption.maxLength&&<div> ({watchData.length}/2000)</div>}
            <div className="error-message">{form.formState.errors[name]?.message}</div>
        </div>
    );
}

export default ReactHookFormTextarea;