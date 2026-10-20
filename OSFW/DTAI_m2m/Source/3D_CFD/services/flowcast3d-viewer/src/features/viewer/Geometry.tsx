import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { TilesRenderer } from "3d-tiles-renderer";
import { Failure } from "../../components/ui/status";
import { useWorkspace } from "../../stores/workspace";
import { acquireGeometryAsset } from "./sceneAssets";
import { ScenePortal } from "./ScenePortal";
import { useAssetProgress } from "./loading";
import { applyGeometryClipping, domainClippingPlanes } from "./clipping";
import type { Bounds } from "../datasets/types";
import type { Scene, SceneAsset } from "./types";
export function Geometry({
  asset,
  scene,
  clipBounds,
}: {
  asset: SceneAsset;
  scene: Scene;
  clipBounds?: Bounds;
}) {
  const portal = useContext(ScenePortal);
  const report = useAssetProgress(asset.url);
  const [object, setObject] = useState<{ scene: Object3D }>(),
    [error, setError] = useState<Error>();
  const wireframe = useWorkspace((state) => state.wireframe);
  const hasField = Boolean(scene.field);
  const { invalidate } = useThree();
  const planes = useMemo(
    () => domainClippingPlanes(clipBounds, scene.origin),
    [clipBounds, scene.origin],
  );
  const latestPlanes = useRef(planes);
  latestPlanes.current = planes;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let lease: Awaited<ReturnType<typeof acquireGeometryAsset>> | undefined;
    setObject(undefined);
    setError(undefined);
    report({ download: 0 });
    acquireGeometryAsset(
      { url: asset.url },
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
        if (active) {
          value.scene.traverse((node) => {
            if (node instanceof Mesh) {
              const materials = Array.isArray(node.material)
                ? node.material
                : [node.material];
              for (const material of materials) {
                if (
                  !hasField &&
                  !node.geometry.hasAttribute("color") &&
                  !material.map
                )
                  material.color = new Color("#8d9fb3");
                if (!hasField && material instanceof MeshStandardMaterial) {
                  material.roughness = 0.9;
                  material.metalness = 0;
                }
                material.transparent = false;
              }
            }
          });
          applyGeometryClipping(value.scene, latestPlanes.current);
          setObject(value);
          report({ download: 1, ready: true });
        }
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
  }, [asset.url, hasField, report]);
  useLayoutEffect(() => {
    if (!object) return;
    applyGeometryClipping(object.scene, planes);
    object?.scene.traverse((node) => {
      if (node instanceof Mesh)
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material])
          material.wireframe = wireframe;
    });
    invalidate();
  }, [object, wireframe, planes, invalidate]);
  if (error)
    return (
      <Html portal={portal} center>
        <Failure error={error} />
      </Html>
    );
  return object ? (
    <group name={`geometry-${scene.contextKey}`}>
      <primitive object={object.scene} dispose={null} />
    </group>
  ) : null;
}
export function CityTiles({
  asset,
  scene,
  clipBounds,
}: {
  asset: SceneAsset;
  scene: Scene;
  clipBounds?: Bounds;
}) {
  const report = useAssetProgress(asset.url);
  const { camera, gl, invalidate } = useThree();
  const portal = useContext(ScenePortal),
    [error, setError] = useState<Error>();
  const wireframe = useWorkspace((state) => state.wireframe);
  const planes = useMemo(
    () => domainClippingPlanes(clipBounds, scene.origin),
    [clipBounds, scene.origin],
  );
  const tiles = useMemo(() => {
    const value = new TilesRenderer(asset.url);
    value.setCamera(camera);
    value.setResolutionFromRenderer(camera, gl);
    value.lruCache.maxSize = 150;
    value.lruCache.minSize = 100;
    value.lruCache.maxBytesSize = 256 * 1024 * 1024;
    value.lruCache.minBytesSize = 192 * 1024 * 1024;
    return value;
  }, [asset.url, camera, gl]);
  useFrame(() => {
    camera.updateMatrixWorld();
    tiles.group.updateMatrixWorld(true);
    tiles.setResolutionFromRenderer(camera, gl);
    tiles.update();
  });
  useEffect(() => {
    report({ download: 0 });
    const failed = (event: { error: Error }) => {
      setError(new Error(`City tile unavailable: ${event.error.message}`));
      report({ download: 0, failed: true });
    };
    const loaded = () => report({ download: 1, ready: true });
    const update = () => invalidate();
    const rootLoaded = ({
      tileset,
    }: {
      tileset: {
        root: {
          content?: unknown;
          children?: unknown[];
          geometricError: number;
        };
      };
    }) => {
      // 빈 루트는 표시할 표면이 없으므로 첫 자식까지 탐색
      if (!tileset.root.content && tileset.root.children?.length)
        tileset.root.geometricError = Infinity;
      if (!tileset.root.content && !tileset.root.children?.length) loaded();
      invalidate();
    };
    tiles.fetchOptions = { credentials: "same-origin" };
    tiles.addEventListener("load-error", failed);
    tiles.addEventListener("needs-update", update);
    tiles.addEventListener("load-model", update);
    tiles.addEventListener("tiles-load-end", loaded);
    tiles.forEachLoadedModel(loaded);
    tiles.addEventListener("load-root-tileset", rootLoaded);
    if (tiles.rootTileset) rootLoaded({ tileset: tiles.rootTileset });
    return () => {
      tiles.removeEventListener("load-error", failed);
      tiles.removeEventListener("needs-update", update);
      tiles.removeEventListener("load-model", update);
      tiles.removeEventListener("tiles-load-end", loaded);
      tiles.removeEventListener("load-root-tileset", rootLoaded);
    };
  }, [tiles, invalidate, report]);
  useEffect(() => () => tiles.dispose(), [tiles]);
  useLayoutEffect(() => {
    const apply = ({ scene }: { scene: import("three").Object3D }) => {
      applyGeometryClipping(scene, planes);
      scene.traverse((node) => {
        if (node instanceof Mesh)
          for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material]) {
            material.wireframe = wireframe;
            if (material instanceof MeshStandardMaterial) {
              material.roughness = 0.9;
              material.metalness = 0;
              if (!node.geometry.hasAttribute("color") && !material.map)
                material.color = new Color("#8d9fb3");
            }
          }
      });
      invalidate();
    };
    tiles.forEachLoadedModel((scene) => apply({ scene }));
    tiles.addEventListener("load-model", apply);
    return () => tiles.removeEventListener("load-model", apply);
  }, [tiles, wireframe, invalidate, planes]);
  return (
    <>
      <primitive object={tiles.group} />
      {error && (
        <Html portal={portal} center>
          <Failure error={error} />
        </Html>
      )}
    </>
  );
}
