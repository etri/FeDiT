import React from 'react';
import PropTypes, {node} from 'prop-types';
import { ReactNode } from 'react'


const MyPageWrapper = (props: any) => {
    const {
        children: ReactNode
    } = props;

    return (
        <div id="mypage-container" className="flex flex-row gap-x-24 relative px-7 py-28">
            {props.children}
        </div>
    );
};

MyPageWrapper.propTypes = {
    children: PropTypes.node
};

MyPageWrapper.defaultProps = {};

export default MyPageWrapper;