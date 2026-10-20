import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  Data3DTexture,
  FloatType,
  GLSL3,
  LinearFilter,
  Mesh,
  RedFormat,
  ShaderMaterial,
  Vector3,
  BackSide,
  WebGLRenderTarget,
  DepthTexture,
  UnsignedIntType,
  Matrix4,
  Vector2,
} from "three";
import { Failure } from "../../components/ui/status";
import { useWorkspace } from "../../stores/workspace";
import { boundedAsset } from "./decode";
import { ScenePortal } from "./ScenePortal";
import { useAssetProgress } from "./loading";
import { volumeVertex, volumeFragment } from "./volumeShaders";
import "./Volume.css";
import type { Scene, SceneAsset } from "./types";
export function Volume({ asset, scene }: { asset: SceneAsset; scene: Scene }) {
  const portal = useContext(ScenePortal);
  const report = useAssetProgress(asset.url);
  const [texture, setTexture] = useState<{
    field: Data3DTexture;
    mask: Data3DTexture;
  }>();
  const [error, setError] = useState<Error>();
  const mesh = useRef<Mesh>(null);
  const { camera, gl, scene: renderScene, size } = useThree();
  const opacity = useWorkspace((state) => state.opacity);
  const valueRange = useWorkspace((state) => state.valueRange);
  const dimensions = asset.dimensions ?? [1, 1, 1],
    spacing = asset.spacing ?? [1, 1, 1],
    origin = asset.origin ?? scene.origin;
  const scale = dimensions.map((size, index) => size * spacing[index]) as [
    number,
    number,
    number,
  ];
  const position = origin.map((value, index) => value + scale[index] / 2) as [
    number,
    number,
    number,
  ];
  useEffect(() => {
    const controller = new AbortController();
    let active = true,
      failed = false;
    let textures: typeof texture;
    setTexture(undefined);
    setError(undefined);
    report({ download: 0 });
    const downloads = [0, ...(asset.maskUrl ? [0] : [])];
    const received = (index: number) => (bytes: number, total?: number) => {
      downloads[index] = total ? Math.min(1, bytes / total) : 0;
      if (active && !failed)
        report({
          download: downloads.reduce((a, b) => a + b, 0) / downloads.length,
        });
    };
    Promise.all([
      boundedAsset(asset.url, controller.signal, undefined, received(0)),
      asset.maskUrl
        ? boundedAsset(asset.maskUrl, controller.signal, undefined, received(1))
        : Promise.resolve(undefined),
    ])
      .then(([buffer, maskBuffer]) => {
        const count = dimensions.reduce((a, b) => a * b, 1);
        if (
          buffer.byteLength !== count * 4 ||
          (maskBuffer && maskBuffer.byteLength !== count)
        )
          throw new Error("Invalid volume dimensions");
        const field = new Data3DTexture(
            new Float32Array(buffer),
            ...dimensions,
          ),
          mask = new Data3DTexture(
            maskBuffer
              ? new Uint8Array(maskBuffer)
              : new Uint8Array(count).fill(1),
            ...dimensions,
          );
        field.format = RedFormat;
        field.type = FloatType;
        field.minFilter = field.magFilter = LinearFilter;
        field.needsUpdate = true;
        mask.format = RedFormat;
        mask.needsUpdate = true;
        textures = { field, mask };
        if (active) {
          setTexture(textures);
          report({ download: 1, ready: true });
        } else {
          field.dispose();
          mask.dispose();
        }
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") {
          failed = true;
          controller.abort();
          setError(error);
          report({ download: 0, failed: true });
        }
      });
    return () => {
      active = false;
      controller.abort();
      textures?.field.dispose();
      textures?.mask.dispose();
    };
    // 볼륨 규격은 자산 URL에 포함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.url, asset.maskUrl, report]);
  const depthTarget = useMemo(() => {
    const ratio = Math.min(1, 1536 / Math.max(size.width, size.height));
    const target = new WebGLRenderTarget(
      Math.max(1, Math.floor(size.width * ratio)),
      Math.max(1, Math.floor(size.height * ratio)),
    );
    target.depthTexture = new DepthTexture(
      target.width,
      target.height,
      UnsignedIntType,
    );
    return target;
  }, [size.width, size.height]);
  useEffect(() => () => depthTarget.dispose(), [depthTarget]);
  const material = useMemo(
    () =>
      texture
        ? new ShaderMaterial({
            glslVersion: GLSL3,
            vertexShader: volumeVertex,
            fragmentShader: volumeFragment,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            premultipliedAlpha: true,
            side: BackSide,
            uniforms: {
              field: { value: texture.field },
              mask: { value: texture.mask },
              sceneDepth: { value: depthTarget.depthTexture },
              volumeToClip: { value: new Matrix4() },
              resolution: {
                value: new Vector2(
                  size.width * gl.getPixelRatio(),
                  size.height * gl.getPixelRatio(),
                ),
              },
              valueRange: { value: scene.range ?? [0, 1] },
              opacity: { value: opacity },
              highlightRange: { value: valueRange ?? [0, 0] },
              hasHighlight: { value: Boolean(valueRange) },
              concentration: {
                value:
                  scene.field?.id.toLowerCase().includes("concentration") ??
                  false,
              },
              localCamera: { value: new Vector3() },
            },
          })
        : undefined,
    [
      texture,
      scene.range,
      scene.field?.id,
      opacity,
      valueRange,
      depthTarget,
      size.width,
      size.height,
      gl,
    ],
  );
  useEffect(() => () => material?.dispose(), [material]);
  useFrame(() => {
    if (mesh.current && material) {
      mesh.current.updateWorldMatrix(true, false);
      const point = mesh.current
        .worldToLocal(camera.position.clone())
        .addScalar(0.5);
      material.uniforms.localCamera.value.copy(point);
      material.uniforms.volumeToClip.value
        .copy(camera.projectionMatrix)
        .multiply(camera.matrixWorldInverse)
        .multiply(mesh.current.matrixWorld);
      const previous = gl.getRenderTarget();
      mesh.current.visible = false;
      gl.setRenderTarget(depthTarget);
      gl.render(renderScene, camera);
      gl.setRenderTarget(previous);
      mesh.current.visible = true;
    }
  });
  if (error)
    return (
      <Html portal={portal} center>
        <Failure error={error} />
      </Html>
    );
  return material ? (
    <mesh ref={mesh} position={position} scale={scale}>
      <boxGeometry />
      <primitive object={material} attach="material" />
    </mesh>
  ) : null;
}
