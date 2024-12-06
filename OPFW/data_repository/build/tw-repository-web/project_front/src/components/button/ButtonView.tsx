import React, {useCallback} from 'react';
import PropTypes from 'prop-types';

import './ButtonView.css';

import {buttonSizes, buttonLevels, buttonCategories} from '../constants';

const ButtonView = (props:any) => {
    const {
        text,
        type,
        formId,
        isDisabled,
        level,
        category,
        size,
        onClick,
        className,
    } = props;


    const renderButton = useCallback(() => {
        let attributes:any = {};

        if(formId){
            attributes.formId = formId;
        }

        if(isDisabled){
            attributes.disabled = 'disabled';
        }

        let disabledClass = isDisabled? 'opacity-60 cursor-not-allowed text-grayscale-500' : '';

        let sizeClass = '';
        if(size===buttonSizes.small) {
            sizeClass = 'text-sm py-1.5 px-3';
        } else if(size===buttonSizes.medium) {
            sizeClass = 'text-base py-2 px-4';
        } else {
            sizeClass = 'text-lg py-3 px-5';
        }

        let color = '';
        if(category===buttonCategories.info) {
            color = 'primary';
        } else if(category===buttonCategories.success) {
            color = 'success';
        } else if(category===buttonCategories.warning) {
            color = 'warning';
        } else if(category===buttonCategories.danger) {
            color = 'danger';
        } else {
            color = 'grayscale';
        }

        let baseClass = '';
        if(level===buttonLevels.primary) {
            baseClass = "tracking-wider font-nanumSquareR shadow-md font-bold rounded text-nowrap w-fit h-fit";
            baseClass +=  ` bg-${color}-500 hover:bg-${color}-700 text-white`;
        } else if(level===buttonLevels.secondary) {
            baseClass = "tracking-wider font-nanumSquareR shadow-md font-semibold rounded border text-nowrap w-fit h-fit";
            baseClass += ` bg-${color}-50 hover:bg-${color}-500 text-${color}-700 hover:text-white border-${color}-500 hover:border-transparent`;
        } else {
            baseClass = "tracking-wider font-nanumSquareR shadow-md font-semibold rounded border text-nowrap w-fit h-fit";
            baseClass += ` bg-white hover:bg-${color}-100 text-${color}-700 border-${color}-400`;
        }

        return <button className={[
                        `${baseClass}`,
                        `${sizeClass}`,
                        `${disabledClass}`,
                        `${className}`
                   ].join(" ")}
                   type={type?type:'button'}
                   {...attributes}
                   onClick={onClick}>{text}</button>
    },[text, isDisabled])

    return (
        <>
            { renderButton() }
        </>
    )
};

ButtonView.propTypes = {
    text: PropTypes.string,
    type: PropTypes.oneOf([
        'submit',
        'button',
        'reset'
    ]),
    formId: PropTypes.string,
    isDisabled: PropTypes.bool,
    level: PropTypes.oneOf([
        buttonLevels.primary,
        buttonLevels.secondary,
        buttonLevels.tertiary,
    ]),
    category: PropTypes.oneOf([
        buttonCategories.default,
        buttonCategories.info,
        buttonCategories.success,
        buttonCategories.warning,
        buttonCategories.danger,
    ]),
    size: PropTypes.oneOf([
        buttonSizes.small,
        buttonSizes.medium,
        buttonSizes.large,
    ]),
    onClick: PropTypes.func,
    className: PropTypes.string,
};

ButtonView.defaultProps = {
    isDisabled: false,
    level: buttonLevels.primary,
    category: buttonCategories.default,
    size: buttonSizes.medium,
};

export default ButtonView;