'use strict';

import React, { forwardRef, ReactElement, useEffect, useMemo, useRef } from "react";
import SysInputOption, { SysInputOptionProps } from "@/components/sysModal/SysInputOption";

type props = {
  name: string;
  inputName: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

const SysInputSelect = forwardRef(({name, inputName, children, onChange}: props, ref) => {

  const childrenArray = useMemo( () => {
    return React.Children.toArray(children)
                        .filter((child): child is ReactElement<SysInputOptionProps> =>
                              React.isValidElement(child) && child.type === SysInputOption
                        )
  }, [React.Children.count(children)]);

  const selectRef = useRef(null);

  useEffect(() => {
    if(ref.current) {
      $(ref.current).selectpicker('refresh');
    }
  }, [React.Children.count(children)]);

  return (
    <div className="form-group">
      <label className="control-label col-md-3 col-sm-3 col-xs-12">
        {name} <span className="required">*</span>
      </label>
      <div className="col-md-7 col-sm-7 col-xs-12">
        <select
          ref={ref}
          className="selectpicker"
          id={inputName}
          name={inputName}
          data-toggle="toggle"
          onChange={onChange}
        >
          <option value="" hidden selected>
            {" "}
            {name + "을/를 선택하세요"}
          </option>
          {childrenArray.map((child, index) => (
            <option value={child.props.value} key={child.props.value}>
              {child.props.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

SysInputSelect.defaultProps = {};

export default SysInputSelect;