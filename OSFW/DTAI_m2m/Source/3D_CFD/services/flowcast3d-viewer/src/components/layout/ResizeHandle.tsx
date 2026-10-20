import { useEffect, useRef } from "react";
export function ResizeHandle({
  axis = "x",
  value,
  min,
  max,
  onChange,
  label,
  reverse = false,
}: {
  axis?: "x" | "y";
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  reverse?: boolean;
}) {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cleanup.current?.(), []);
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      className={`resize-handle resize-${axis}`}
      onKeyDown={(event) => {
        if (
          ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          const sign = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
          onChange(
            Math.max(
              min,
              Math.min(max, value + sign * 16 * (reverse ? -1 : 1)),
            ),
          );
        }
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        cleanup.current?.();
        const start = axis === "x" ? event.clientX : event.clientY,
          initial = value;
        const move = (event: PointerEvent) => {
          const delta = (axis === "x" ? event.clientX : event.clientY) - start;
          onChange(
            Math.max(min, Math.min(max, initial + delta * (reverse ? -1 : 1))),
          );
        };
        const stop = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", stop);
          document.body.style.cursor = "";
          cleanup.current = undefined;
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop, { once: true });
        document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
        cleanup.current = stop;
      }}
    />
  );
}
