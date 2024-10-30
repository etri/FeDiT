import React, { forwardRef } from "react";

type props = {
  onChange: (e: any) => void;
  onBlur: (e: any) => void;
  name: string;
    errors: any;
};

const Input = forwardRef(({ errors, onChange, onBlur, name }: props, ref) => {
  return (
      <input
        className="border-enabled focus:border-focus focus:ring-focus w-4/6 basis-4/6 rounded-lg border px-4 py-1 text-xl focus:outline-none focus:ring-1"
        name={name}
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={errors.name ? "true" : "false"}
      />
  );
});

Input.defaultProps = {};

export default Input;
