import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";

type UseTooltipProps = {
  ref: MutableRefObject<HTMLElement>;
  tooltipRef: MutableRefObject<HTMLDivElement>;
};

type Position = {
    top?: number;
    left?: number;
    width?: number;
};

export function useTooltip({ ref, tooltipRef }: UseTooltipProps) {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [position, setPosition] = useState<Position>({});

    useEffect(() => {
        if (!ref || !ref.current) {
            return;
        }

        if (isVisible) {

            const { left, width, bottom } = ref.current.getBoundingClientRect();
            const targetCenter = left + width / 2;
            const screenWidth = document.body.clientWidth;

            const tooltipWidth = tooltipRef?.current?.getBoundingClientRect().width || 0;

            const tooltipRight = left + width / 2 + tooltipWidth / 2;
            const xOffset = Math.min(0, screenWidth - tooltipRight);

            const tooltipLeft = left + width / 2 - tooltipWidth / 2 + xOffset;
            const pointerPosition = ((targetCenter - tooltipLeft) / tooltipWidth) * 100;


            const verticalOffset = 12 // If you change the size of the arrow in the css class tooltip-container::before then you will need to change this value

            setPosition({
                top: bottom + verticalOffset,
                left: tooltipLeft,
                width,
            });

            tooltipRef.current.style.setProperty('--pointer-position', `${pointerPosition}%`);
        }

        if (!isVisible) {
            setPosition({});
        }
    }, [isVisible, ref, tooltipRef]);

    const onMouseEnter = useCallback(() => {
        setIsVisible(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsVisible(false);
    }, []);

    return {
        position: {
            top: position.top ?? 0,
            left: position.left ?? 0,
            width: position.width ?? 0,
        },
        isVisible,
        onMouseEnter,
        onMouseLeave,
    };
}