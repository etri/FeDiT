import React from 'react';
import PropTypes from 'prop-types';
import { ReactNode } from 'react'

const MyPageBlock = (props: any) => {
    const {
        children: ReactNode
    } = props;

    return (
        <div className="w-[calc(100%-var(--width-side-bar))] flex flex-col">
            {props.children}
        </div>
    );
};

MyPageBlock.propTypes = {
    children: PropTypes.node
};

MyPageBlock.defaultProps = {};

export default MyPageBlock;