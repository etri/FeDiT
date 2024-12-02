import React from "react";

type props = {
    name: string;
}

const Test = ({name}:props) => {
  return (
      <div className="flex w-full items-center justify-between bg-neutral-300">
          <div className="w-10 bg-primary-500">1</div>
          <div className="w-10 bg-danger-500">2</div>
          <div className="w-10 bg-success-500">3</div>
          <div className="w-10 bg-warning-500">3</div>
          <div>{name}</div>
      </div>
  );
};

Test.defaultProps = {
    name: "test"
}
export default Test;
