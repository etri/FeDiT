import { Box } from "lucide-react";
import { useWorkspace } from "../../stores/workspace";
import type { Bounds } from "../datasets/types";
import type { Scene } from "./types";
import "./SceneBounds.css";

// 단위 상자의 열두 모서리만 구성
const corners = Array.from({ length: 8 }, (_, index) =>
  [0, 1, 2].map((axis) => (index & (1 << axis) ? 0.5 : -0.5)),
);
const edges = new Float32Array(
  corners.flatMap((corner, index) =>
    [0, 1, 2].flatMap((axis) =>
      index & (1 << axis) ? [] : [...corner, ...corners[index | (1 << axis)]],
    ),
  ),
);

export function SceneBounds({
  scene,
  bounds = scene.bounds,
}: {
  scene: Scene;
  bounds?: Bounds;
}) {
  const visible = useWorkspace((state) => state.showBounds);
  if (!visible) return null;
  const center = bounds[0].map(
    (value, axis) => (value + bounds[1][axis]) / 2 - scene.origin[axis],
  ) as [number, number, number];
  const scale = bounds[0].map((value, axis) => bounds[1][axis] - value) as [
    number,
    number,
    number,
  ];
  return (
    <lineSegments
      name="scene-bounds"
      position={center}
      scale={scale}
      raycast={() => undefined}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[edges, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#4d75ad"
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </lineSegments>
  );
}

export function SceneBoundsToggle({ disabled }: { disabled: boolean }) {
  const visible = useWorkspace((state) => state.showBounds);
  return (
    <button
      type="button"
      role="switch"
      className="scene-bounds-toggle"
      aria-label="정육면체 경계"
      aria-checked={visible}
      title={visible ? "정육면체 경계 숨기기" : "정육면체 경계 표시"}
      disabled={disabled}
      onClick={() =>
        useWorkspace
          .getState()
          .set({ showBounds: !useWorkspace.getState().showBounds })
      }
    >
      <span className="scene-bounds-label">정육면체 경계</span>
      <Box className="scene-bounds-icon" size={16} aria-hidden="true" />
      <span className="scene-bounds-switch" aria-hidden="true" />
    </button>
  );
}
