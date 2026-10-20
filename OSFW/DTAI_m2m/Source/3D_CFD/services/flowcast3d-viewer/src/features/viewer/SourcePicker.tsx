import { useContext, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Mesh,
  MeshStandardMaterial,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import {
  useSourcePlacement,
  validSourcePosition,
} from "../scenarios/sourcePlacement";
import type { SourcePosition } from "../scenarios/sourcePlacement";
import type { Object3D } from "three";
import { visibleGeometryIntersection } from "./clipping";
import { ScenePortal } from "./ScenePortal";
import type { Scene } from "./types";
import "./SourcePicker.css";

export function SourcePicker({
  scene: source,
  datasetId,
}: {
  scene: Scene;
  datasetId: string;
}) {
  const { camera, gl, scene, controls } = useThree();
  const portal = useContext(ScenePortal);
  const state = useSourcePlacement();
  const bounds =
    state.datasetId === datasetId && state.bounds
      ? state.bounds
      : source.bounds;
  const active = state.datasetId === datasetId && state.picking;
  const [preview, setPreview] = useState<SourcePosition>();

  useEffect(() => {
    if (!active) return;
    setPreview(undefined);
    const canvas = gl.domElement,
      previousCursor = canvas.style.cursor;
    const orbit = controls as { enabled: boolean } | null;
    const wasEnabled = orbit?.enabled;
    if (orbit) orbit.enabled = false;
    canvas.style.cursor = "crosshair";
    const raycaster = new Raycaster(),
      pointer = new Vector2();
    const origin = new Vector3(...source.origin);
    const ground = new Plane(
      new Vector3(0, 0, 1),
      source.origin[2] - bounds[0][2],
    );
    let down: [number, number] | undefined,
      frame = 0;
    let pending: PointerEvent | undefined;

    // 표면 선택은 모델 메시만 검사하고 빈 영역은 지면에 투영
    const locate = (event: PointerEvent): SourcePosition | undefined => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const models: Mesh[] = [];
      scene.traverseVisible((object) => {
        if (
          object instanceof Mesh &&
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).some((material) => material instanceof MeshStandardMaterial)
        ) {
          let ancestor: Object3D | null = object;
          while (ancestor && ancestor.userData.sourcePickable !== true)
            ancestor = ancestor.parent;
          if (ancestor?.userData.sourcePickable === true) models.push(object);
        }
      });
      const hit =
        raycaster
          .intersectObjects(models, false)
          .find(visibleGeometryIntersection)?.point ??
        raycaster.ray.intersectPlane(ground, new Vector3());
      if (!hit) return;
      const position = hit.clone().add(origin).toArray() as SourcePosition;
      position[2] += useSourcePlacement.getState().height;
      return validSourcePosition(position, bounds) ? position : undefined;
    };
    const move = (event: PointerEvent) => {
      event.stopImmediatePropagation();
      pending = event;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (pending) setPreview(locate(pending));
        });
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.stopImmediatePropagation();
      down = [event.clientX, event.clientY];
    };
    const release = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.stopImmediatePropagation();
      if (
        down &&
        Math.hypot(event.clientX - down[0], event.clientY - down[1]) < 5
      ) {
        const position = locate(event);
        if (position) useSourcePlacement.getState().place(position);
      }
      down = undefined;
    };
    const leave = () => {
      down = undefined;
      pending = undefined;
      setPreview(undefined);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") useSourcePlacement.getState().cancel();
    };
    canvas.addEventListener("pointermove", move, true);
    canvas.addEventListener("pointerdown", press, true);
    canvas.addEventListener("pointerup", release, true);
    canvas.addEventListener("pointerleave", leave);
    window.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame);
      canvas.style.cursor = previousCursor;
      if (orbit && wasEnabled !== undefined) orbit.enabled = wasEnabled;
      canvas.removeEventListener("pointermove", move, true);
      canvas.removeEventListener("pointerdown", press, true);
      canvas.removeEventListener("pointerup", release, true);
      canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("keydown", escape);
    };
  }, [active, camera, gl, scene, controls, source, bounds]);

  const position = active ? preview : state.position;
  if (
    state.datasetId !== datasetId ||
    !position ||
    !validSourcePosition(position, bounds)
  )
    return null;
  const local = position.map(
    (value, axis) => value - source.origin[axis],
  ) as SourcePosition;
  const size = Math.max(
    0.002,
    Math.min(
      3,
      Math.max(...bounds[1].map((value, axis) => value - bounds[0][axis])) *
        0.007,
    ),
  );
  return (
    <group position={local}>
      <mesh>
        <sphereGeometry args={[size * 0.6, 16, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh>
        <ringGeometry args={[size, size * 1.3, 32]} />
        <meshBasicMaterial color="#ef4444" side={2} />
      </mesh>
      <Html
        portal={portal}
        position={[0, 0, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="source-position-callout">
          <span
            className={active ? "source-preview-label" : "source-marker-label"}
            role="status"
            aria-label="Source position"
          >
            배출원 ({position.map((value) => value.toFixed(2)).join(", ")})
          </span>
          <span className="source-position-leader" aria-hidden="true" />
        </div>
      </Html>
    </group>
  );
}
