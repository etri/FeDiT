import React, { forwardRef } from "react";

type props = {
  disabled?: boolean;
  options: any[];
  onChange: (e: any) => void;
  onBlur: (e: any) => void;
  name: string;
  className: string;
  ariaInvalid: string;
};

const Select = forwardRef(
  (
    {
      disabled,
      options,
      onChange,
      onBlur,
      name,
      className,
      ariaInvalid,
    }: props,
    ref,
  ) => {
    return (
      <div>
        <select
          disabled={disabled}
          name={name}
          ref={ref}
          onChange={onChange}
          onBlur={onBlur}
          className={className}
          aria-invalid={ariaInvalid}
        >
          {options.map((option) => (
            <option  key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.defaultProps = {
  disabled: false,
};

export default Select;
