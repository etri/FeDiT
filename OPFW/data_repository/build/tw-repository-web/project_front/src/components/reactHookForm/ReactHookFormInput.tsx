"use strict";

import React from "react";
import { ReactHookFormInputProps } from "./ReactHookFormInputTypes";

const ReactHookFormInput = ({
  name,
  label,
  className,
  type,
  onFocus,
  readOnly,
  reactHookFormOption,
  errors,
  register,
}: ReactHookFormInputProps) => {
  let attributes: any = {};
  if (type) {
    attributes.type = type;
  }
  if (onFocus) {
    attributes.onFocus = onFocus;
  }
  if (readOnly) {
    attributes.readOnly = readOnly;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 text-xl">{label}</div>
      <input
        className="flex-1 rounded-lg border border-grayscale-600 px-4 py-1 text-xl focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        {...attributes}
        {...register(name, reactHookFormOption)}
      />
      <div className="error-message">{errors[name]?.message}</div>
    </div>
  );
};

export default ReactHookFormInput;
