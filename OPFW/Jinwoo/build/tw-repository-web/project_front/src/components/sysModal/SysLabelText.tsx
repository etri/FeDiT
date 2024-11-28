'use strict';

import React from "react";

type props = {
  inputName:string;
  name:string;
  value:string;
  className?:string;
  onChange:(data:any)=>void;
  hidden?:boolean;
  disabled?:boolean;
}

const SysLabelText = ({inputName, name, onChange, value, className, hidden=false, disabled=false}:props) => {
    return (
        <div className="form-group"  style={{display: hidden ? 'none' :'block' }}>
            <label className="control-label col-md-3 col-sm-3 col-xs-12">{name} <span
                className="required">*</span></label>
            <div className={className?className:"col-md-7 col-sm-7 col-xs-12"}>
                <input type="text" name={inputName} id={inputName} data-name={name} disabled={disabled?disabled:false}
                       className="form-control col-md-7 col-xs-12 req" placeholder={name + "입력"}
                       onChange={onChange} value={value}/>
            </div>
        </div>
    );
}

export default SysLabelText;