import React, {forwardRef, RefObject, useRef} from 'react';
import useInputErrorDialog from "../../hooks/useInputErrorDialog";
import "../tooltip/Tooltip.css"

type props = {
    elementRef: RefObject<HTMLElement>;
    children: React.ReactNode;
    isVisible: boolean;
}

const InputErrorDialog = forwardRef(({children, elementRef, isVisible}:props, ref) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    const {
        position,
    } = useInputErrorDialog({
        isVisible,
        ref: elementRef,
        dialogRef,
    });

    return (
        <div
            ref={dialogRef}
            className="tooltip-container" // adding className here for later use
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {children}
        </div>
    );
});

InputErrorDialog.defaultProps = {};

export default InputErrorDialog;