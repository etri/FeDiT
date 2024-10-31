import React from "react";
import PropTypes from "prop-types";

const MyPageTitleView = (props: any) => {
  const { parentTitle, childTitle } = props;

  return (
    <div className="flex flex-col mb-6">
      <span className="text-sm font-normal leading-7">{parentTitle}</span>
      <strong className="text-5xl font-bold leading-[75px]">
        {childTitle}
      </strong>
    </div>
  );
};

MyPageTitleView.propTypes = {
  parentTitle: PropTypes.string,
  childTitle: PropTypes.string,
};

MyPageTitleView.defaultProps = {};

export default MyPageTitleView;
