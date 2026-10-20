import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import { useWorkspace } from "../../stores/workspace";
import type { Scene } from "./types";
export function CameraControls({ scene }: { scene: Scene }) {
  const { camera } = useThree();
  const revision = useWorkspace((state) => state.cameraRevision),
    datasetId = useWorkspace((state) => state.datasetId);
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null),
    source = useRef(scene);
  source.current = scene;
  const originKey = scene.origin.join(",");
  useEffect(() => {
    const current = source.current,
      saved = useWorkspace.getState().camera;
    const low = new Vector3(...current.bounds[0]).sub(
        new Vector3(...current.origin),
      ),
      high = new Vector3(...current.bounds[1]).sub(
        new Vector3(...current.origin),
      );
    const box = new Box3(low, high),
      size = box.getSize(new Vector3()).length(),
      center = box.getCenter(new Vector3());
    if (saved && saved.origin.join(",") === originKey) {
      camera.position.fromArray(saved.position);
      controls.current?.target.fromArray(saved.target);
    } else {
      camera.position
        .copy(center)
        .add(new Vector3(size * 0.7, size * 0.8, size * 0.7));
      controls.current?.target.copy(center);
    }
    camera.near = Math.max(size / 10000, 0.01);
    camera.far = Math.max(size * 10, 1000);
    camera.updateProjectionMatrix();
    controls.current?.update();
  }, [originKey, datasetId, camera, revision]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      onEnd={() => {
        if (controls.current)
          useWorkspace.getState().set({
            camera: {
              position: camera.position.toArray() as [number, number, number],
              target: controls.current.target.toArray() as [
                number,
                number,
                number,
              ],
              origin: [...source.current.origin],
            },
          });
      }}
    />
  );
}
