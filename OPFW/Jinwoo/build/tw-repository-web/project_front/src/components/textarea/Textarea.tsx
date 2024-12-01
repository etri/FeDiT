import React, { forwardRef, RefObject, useEffect, useMemo } from "react";
import { FieldValues, UseFormStateReturn, UseFormWatch } from "react-hook-form";

type props = {
  name: string;
  onChange: (e: any) => void;
  onBlur: (e: any) => void;
  dataName: string;
  rows: number;
  className: string;
  defaultValue: string;
  maxCount: number;
  errors: UseFormStateReturn<FieldValues>;
  watch: UseFormWatch<FieldValues>;
};

const Textarea = forwardRef(
  (
    {
      name,
      onChange,
      onBlur,
      dataName,
      rows,
      className,
      defaultValue,
      maxCount,
      errors,
      watch,
    }: props,
    ref,
  ) => {
    const [count, setCount] = React.useState(0);

    useEffect(() => {
      setCount(defaultValue ? defaultValue.length : 0);
    }, [defaultValue]);

    return (
      <>
        <textarea
          data-name={dataName}
          name={name}
          ref={ref}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          className={className}
          defaultValue={defaultValue}
          aria-invalid={errors[name] ? "true" : "false"}
          onKeyUp={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              onChange(e.target.value);
            }
          }}
        />
        <p>
          {watch(name) ? watch(name).length : 0}/
          {maxCount}
        </p>
      </>
    );
  },
);

Textarea.defaultProps = {};

export default Textarea;
