import React, { FC, RefObject, useEffect, useRef } from "react";
import {useTooltip} from "@/hooks/useTooltip";
import './Tooltip.css'

type TooltipProps = {
    elementRef: RefObject<HTMLElement>;
    children: React.ReactNode;
};

const Tooltip: FC<TooltipProps> = ({ children, elementRef }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);

    const {
        position,
        isVisible,
        onMouseEnter,
        onMouseLeave,
    } = useTooltip({
        ref: elementRef,
        tooltipRef,
    });

    useEffect(() => {
        const element = elementRef?.current;

        if (element) {
            element.addEventListener("mouseenter", onMouseEnter);
            element.addEventListener("mouseleave", onMouseLeave);
        }

        // cleans up event listeners by removing them when the component is unmounted
        return () => {
            if (element) {
                element.removeEventListener("mouseenter", onMouseEnter);
                element.removeEventListener("mouseleave", onMouseLeave);
            }
        };
    }, [elementRef, onMouseEnter, onMouseLeave]);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            ref={tooltipRef}
            className="tooltip-container" // adding className here for later use
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {children}
        </div>
    );
};

export default Tooltip;