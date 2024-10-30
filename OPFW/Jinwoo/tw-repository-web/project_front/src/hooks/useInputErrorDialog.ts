import React, {RefObject, useEffect, useState} from 'react';

type props = {
    ref: RefObject<HTMLElement>;
    dialogRef: RefObject<HTMLDivElement>;
    isVisible: boolean;
}

type Position = {
    top?: number;
    left?: number;
    width?: number;
};

const UseInputErrorDialog = ({isVisible, ref, dialogRef}: props) => {
    const [position, setPosition] = useState<Position>({});

    useEffect(() => {
        if (!ref || !ref.current) {
            return;
        }

        if (isVisible) {

            const { left, width, bottom } = ref.current.getBoundingClientRect();

            const tooltipWidth = dialogRef?.current?.getBoundingClientRect().width || 0;

            const middle = left + width / 2 - tooltipWidth / 2;

            const verticalOffset = 12 // If you change the size of the arrow in the css class tooltip-container::before then you will need to change this value

            setPosition({
                top: bottom + verticalOffset,
                left: middle,
                width,
            });
        }

        if (!isVisible) {
            setPosition({});
        }
    }, [isVisible, ref, dialogRef]);

    return {
        position: {
            top: position.top ?? 0,
            left: position.left ?? 0,
            width: position.width ?? 0,
        }
    };
};

UseInputErrorDialog.defaultProps = {};

export default UseInputErrorDialog;