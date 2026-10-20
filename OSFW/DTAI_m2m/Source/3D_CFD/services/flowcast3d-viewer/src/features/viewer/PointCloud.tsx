import { useContext, useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { Failure } from "../../components/ui/status";
import { useWorkspace } from "../../stores/workspace";
import { acquirePointAsset } from "./sceneAssets";
import { ScenePortal } from "./ScenePortal";
import { useAssetProgress } from "./loading";
import type { PointBuffers, Scene, SceneAsset } from "./types";
export function PointCloud({
  asset,
  scene,
  onPick,
  onReady,
  pointSize = 3,
}: {
  asset: SceneAsset;
  scene: Scene;
  onPick: (point: [number, number, number]) => void;
  onReady: (count: number) => void;
  pointSize?: number;
}) {
  const portal = useContext(ScenePortal);
  const report = useAssetProgress(asset.url);
  const [data, setData] = useState<PointBuffers>();
  const [error, setError] = useState<Error>();
  const opacity = useWorkspace((state) => state.opacity);
  const valueRange = useWorkspace((state) => state.valueRange);
  useEffect(() => {
    const controller = new AbortController();
    let lease: Awaited<ReturnType<typeof acquirePointAsset>> | undefined;
    let active = true;
    setData(undefined);
    setError(undefined);
    report({ download: 0 });
    acquirePointAsset(
      { url: asset.url },
      scene.range ?? [0, 1],
      controller.signal,
      (received, total) => {
        if (active)
          report({ download: total ? Math.min(1, received / total) : 0 });
      },
    )
      .then((value) => {
        lease = value;
        if (!active) {
          value.release();
          return;
        }
        setData(value.data);
        onReady(value.data.values.length);
        report({ download: 1, ready: true });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") {
          setError(error);
          report({ download: 0, failed: true });
        }
      });
    return () => {
      active = false;
      controller.abort();
      lease?.release();
    };
  }, [asset.url, scene.contextKey, scene.range, onReady, report]);
  const colors = useMemo(() => {
    if (!data || !valueRange) return data?.colors;
    const output = data.colors.slice();
    data.values.forEach((value, index) => {
      if (value < valueRange[0] || value >= valueRange[1])
        output.set([0.7, 0.75, 0.82], index * 3);
    });
    return output;
  }, [data, valueRange]);
  if (error)
    return (
      <Html portal={portal} center>
        <Failure error={error} />
      </Html>
    );
  if (!data) return null;
  return (
    <points
      onDoubleClick={(event) => {
        event.stopPropagation();
        const index = event.index;
        if (index != null)
          onPick([
            data.positions[index * 3] + scene.origin[0],
            data.positions[index * 3 + 1] + scene.origin[1],
            data.positions[index * 3 + 2] + scene.origin[2],
          ]);
      }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[colors!, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={pointSize}
        sizeAttenuation={false}
        transparent
        opacity={opacity}
        depthWrite={opacity >= 1}
      />
    </points>
  );
}
