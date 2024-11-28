import {ReactElement} from "react";

export interface ReactHookFormInputProps {
    name: string;
    label: string;
    className?: string;
    type?:string;
    onFocus?():any;
    readOnly?:boolean;
    reactHookFormOption: Object;
    maxLength?: number;
    errors: any;
    register: any;
}

export interface ReactHookFormOptionProps {
    value?: string;
    label: string;
}

export interface ReactHookFormSelectProps {
    name: string;
    label: string;
    className?: string;
    onFocus?():any;
    reactHookFormOption: Object;
    errors: any;
    control: any;
    children: ReactElement<ReactHookFormOptionProps> | ReactElement<ReactHookFormOptionProps>[];
}

export interface ReactHookFormCheckboxProps {
    name: string;
    label: string;
    className?: string;
    value?:string;
    reactHookFormOption: Object;
    errors: any;
    register: any;
}

export interface ReactHookFormRadioProps {
    name: string;
    label: string;
    className?: string;
    value?:string;
    hidden?:boolean;
    reactHookFormOption: Object;
    errors: any;
    register: any;
}

export interface ReactHookFormTextAreaProps {
    name: string;
    label: string;
    className?: string;
    type?:string;
    onFocus?():any;
    reactHookFormOption: Object;
    form: any;
}