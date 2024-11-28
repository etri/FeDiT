import React from 'react';
import PropTypes from 'prop-types';

const ImageButton = props => {
    const {
        imageSrc,
        onClick
    } = props;

    return (
        <button onClick={onClick} className="bg-none border-none p-0 cursor-pointer">
            <img src={imageSrc}/>
        </button>
    );
};

ImageButton.propTypes = {
    imageSrc: PropTypes.string,
    onClick: PropTypes.func,
};

ImageButton.defaultProps = {};

export default ImageButton;