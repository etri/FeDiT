import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type ResizeDirection = 'left' | 'right' | 'up' | 'down';

export interface ResizeHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  role: 'separator';
  tabIndex: number;
  'aria-orientation': 'horizontal' | 'vertical';
}

interface UseResizableOptions {
  initialWidth?: number;
  initialHeight?: number;
  direction?: ResizeDirection;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface ResizeState {
  width: number;
  height: number;
  isResizing: boolean;
}

const DEFAULTS = {
  width: 320,
  height: 320,
  minWidth: 240,
  maxWidth: 800,
  minHeight: 240,
  maxHeight: 800,
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getInitialSize = (initial: number, min: number, max: number) =>
  clamp(initial, min, max);

export const useResizable = ({
  initialWidth = DEFAULTS.width,
  initialHeight = DEFAULTS.height,
  direction = 'left',
  minWidth = DEFAULTS.minWidth,
  maxWidth = DEFAULTS.maxWidth,
  minHeight = DEFAULTS.minHeight,
  maxHeight = DEFAULTS.maxHeight,
}: UseResizableOptions) => {
  const [state, setState] = useState<ResizeState>(() => ({
    width: getInitialSize(initialWidth, minWidth, maxWidth),
    height: getInitialSize(initialHeight, minHeight, maxHeight),
    isResizing: false,
  }));

  const startRef = useRef({
    x: 0,
    y: 0,
    width: state.width,
    height: state.height,
    pointerId: null as number | null,
  });

  const calculateNewSize = useCallback(
    (
      delta: number,
      startSize: number,
      min: number,
      max: number,
      multiplier: number,
    ) => {
      return clamp(startSize + multiplier * delta, min, max);
    },
    [],
  );

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (startRef.current.pointerId !== e.pointerId) {
        return;
      }
      e.preventDefault();

      const deltaX = e.clientX - startRef.current.x;
      const deltaY = e.clientY - startRef.current.y;

      setState((prev) => {
        const updates: Partial<ResizeState> = {};

        if (direction === 'left' || direction === 'right') {
          const multiplier = direction === 'left' ? -1 : 1;
          updates.width = calculateNewSize(
            deltaX,
            startRef.current.width,
            minWidth,
            maxWidth,
            multiplier,
          );
        }

        if (direction === 'up' || direction === 'down') {
          const multiplier = direction === 'up' ? -1 : 1;
          updates.height = calculateNewSize(
            deltaY,
            startRef.current.height,
            minHeight,
            maxHeight,
            multiplier,
          );
        }

        return { ...prev, ...updates };
      });
    },
    [direction, minWidth, maxWidth, minHeight, maxHeight, calculateNewSize],
  );

  const handleStop = useCallback(() => {
    setState((prev) => ({ ...prev, isResizing: false }));
    startRef.current.pointerId = null;

    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerup', handleStop);
    document.removeEventListener('pointercancel', handleStop);
  }, [handleMove]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();

      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        width: state.width,
        height: state.height,
        pointerId: event.pointerId,
      };

      setState((prev) => ({ ...prev, isResizing: true }));
      event.currentTarget.setPointerCapture?.(event.pointerId);

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleStop);
      document.addEventListener('pointercancel', handleStop);
    },
    [state.width, state.height, handleMove, handleStop],
  );

  const setWidth = useCallback(
    (newWidth: number) => {
      setState((prev) => ({
        ...prev,
        width: clamp(newWidth, minWidth, maxWidth),
      }));
    },
    [minWidth, maxWidth],
  );

  const setHeight = useCallback(
    (newHeight: number) => {
      setState((prev) => ({
        ...prev,
        height: clamp(newHeight, minHeight, maxHeight),
      }));
    },
    [minHeight, maxHeight],
  );

  const resizeHandleProps: ResizeHandleProps = {
    onPointerDown,
    role: 'separator',
    tabIndex: 0,
    'aria-orientation':
      direction === 'up' || direction === 'down' ? 'vertical' : 'horizontal',
  };

  return {
    ...state,
    setWidth,
    setHeight,
    resizeHandleProps,
  };
};

export default useResizable;
