import React, { useEffect, useState } from "react";

import "./SysLabelToggleStyle.scss"

type props = {
  inputName:string;
  name:string;
  checked:boolean;
  onChange:(data:any)=>void;
  hidden?:boolean;
  disabled?:boolean;
}

const SysLabelToggle = ({inputName, name, onChange, checked, hidden=false, disabled=false}: props) => {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked)
  }, [checked]);

  const handleToggle = (e:React.ChangeEvent<HTMLInputElement>) => {
    // setIsChecked(!isChecked);
    onChange(e);
  };

  return (
    <div className="form-group"  style={{display: hidden ? 'none' :'block' }}>
      <label className="control-label col-md-3 col-sm-3 col-xs-12">{name} <span
        className="required">*</span></label>
      <div className="col-md-7 col-sm-7 col-xs-12">
        <label className="switch">
          <input
            type="checkbox"
            name={inputName} id={inputName} data-name={name}
            checked={isChecked}
            onChange={handleToggle}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
};

SysLabelToggle.defaultProps = {};

export default SysLabelToggle;