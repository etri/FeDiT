import { useContext, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { ScenePortal } from "./ScenePortal";
import "./ViewCompass.css";

const names = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
const cardinals = [
  { label: "N", x: 40, y: 9 },
  { label: "E", x: 71, y: 40 },
  { label: "S", x: 40, y: 71 },
  { label: "W", x: 9, y: 40 },
];
const overlayPosition = () => [0, 0] as [number, number];
const keepVisible = () => undefined;

function viewHeading(direction: Vector3) {
  if (![direction.x, direction.y, direction.z].every(Number.isFinite))
    return { label: "방향 미확정", accessible: "방향 미확정" };
  if (Math.hypot(direction.x, direction.y) < 0.0001) {
    const label = direction.z < 0 ? "수직 아래" : "수직 위";
    return { label, accessible: label };
  }
  // 북쪽 기준 시계 방향으로 실제 시선의 수평 방위 계산
  const heading =
    ((Math.atan2(direction.x, direction.y) * 180) / Math.PI + 360) % 360;
  const angle = (Math.round(heading * 10) % 3600) / 10;
  const name = names[Math.round(angle / 45) % 8];
  return {
    angle,
    label: `${name} ${angle}°`,
    accessible: `${name} ${angle}도`,
  };
}

export function ViewCompass() {
  const { camera, size } = useThree();
  const portal = useContext(ScenePortal);
  const container = useRef<HTMLDivElement>(null),
    arrow = useRef<SVGGElement>(null),
    dial = useRef<SVGGElement>(null),
    caption = useRef<HTMLSpanElement>(null);
  const direction = useRef(new Vector3());
  const view = viewHeading(camera.getWorldDirection(direction.current));

  useFrame(() => {
    const next = viewHeading(camera.getWorldDirection(direction.current));
    container.current?.setAttribute(
      "aria-label",
      `시점 방향 ${next.accessible}`,
    );
    if (caption.current) caption.current.textContent = next.label;
    arrow.current?.setAttribute(
      "opacity",
      next.angle === undefined ? "0" : "1",
    );
    // 시선 화살표는 고정하고 방위판만 반대 방향으로 회전
    dial.current?.setAttribute(
      "opacity",
      next.angle === undefined ? "0.4" : "1",
    );
    if (next.angle === undefined) dial.current?.removeAttribute("transform");
    else
      dial.current?.setAttribute("transform", `rotate(${-next.angle} 40 40)`);
    dial.current
      ?.querySelectorAll<SVGTextElement>("[data-cardinal]")
      .forEach((label) => {
        if (next.angle === undefined) label.removeAttribute("transform");
        else
          label.setAttribute(
            "transform",
            `rotate(${next.angle} ${label.getAttribute("x")} ${label.getAttribute("y")})`,
          );
      });
  });

  return (
    <Html
      portal={portal}
      calculatePosition={overlayPosition}
      onOcclude={keepVisible}
      zIndexRange={[2, 2]}
      wrapperClass="view-compass-overlay"
      style={{ width: size.width, height: size.height, pointerEvents: "none" }}
    >
      <div
        ref={container}
        className="view-compass"
        role="img"
        aria-label={`시점 방향 ${view.accessible}`}
      >
        <strong>시점 방향</strong>
        <svg
          className="view-compass-dial"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <g
            ref={dial}
            data-view-dial
            opacity={view.angle === undefined ? 0.4 : 1}
            transform={
              view.angle === undefined
                ? undefined
                : `rotate(${-view.angle} 40 40)`
            }
          >
            <circle className="view-compass-ring" cx="40" cy="40" r="26" />
            {Array.from({ length: 16 }, (_, index) => (
              <line
                key={index}
                data-view-tick
                x1="40"
                y1="15"
                x2="40"
                y2={index % 4 === 0 ? 20 : 17}
                transform={`rotate(${index * 22.5} 40 40)`}
              />
            ))}
            {cardinals.map(({ label, x, y }) => (
              <text
                key={label}
                data-cardinal={label}
                x={x}
                y={y}
                transform={
                  view.angle === undefined
                    ? undefined
                    : `rotate(${view.angle} ${x} ${y})`
                }
              >
                {label}
              </text>
            ))}
          </g>
          <g
            ref={arrow}
            data-view-arrow
            opacity={view.angle === undefined ? 0 : 1}
          >
            <path d="M40 58V22M32 30L40 22L48 30" />
          </g>
        </svg>
        <span ref={caption} className="view-compass-heading">
          {view.label}
        </span>
      </div>
    </Html>
  );
}
