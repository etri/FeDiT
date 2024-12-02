'use strict';

import React, {ReactElement} from "react";
import { Controller } from "react-hook-form";
import {ReactHookFormOptionProps, ReactHookFormSelectProps} from "./ReactHookFormInputTypes";
import ReactHookFormOption from "./ReactHookFormOption";
import Select from "react-select";

const ReactHookFormSelect = ({name, label, className, onFocus, children, reactHookFormOption, errors, control}: ReactHookFormSelectProps) => {
    let controllerAttributes : any = {};
    let selectAttributes : any = {};

    if(onFocus){
        selectAttributes.onFocus = onFocus;
    }

    const childrenArray = React.Children.toArray(children).filter(
        (child): child is ReactElement<ReactHookFormOptionProps> =>
            React.isValidElement(child) && child.type === ReactHookFormOption
    );

    return (
        <div className={className}>
            <div>{label}</div>
            <Controller  name={name} {...controllerAttributes} control={control} rules={reactHookFormOption} render={({field, formState}) =>
                <Select {...field} {...selectAttributes}
                        options = {childrenArray.map((child, index) => (
                            {value: child.props.value, label: child.props.label}
                        ))}/>
                }
            />
            <div className="error-message">{errors[name]?.message}</div>
        </div>
    );
}

export default ReactHookFormSelect;