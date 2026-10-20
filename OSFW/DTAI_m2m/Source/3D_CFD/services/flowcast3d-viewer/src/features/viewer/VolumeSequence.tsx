import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  Color,
  Data3DTexture,
  DepthTexture,
  DoubleSide,
  FloatType,
  FramebufferTexture,
  GLSL3,
  LinearFilter,
  Light,
  LineSegments,
  Matrix4,
  Mesh,
  NearestFilter,
  NoColorSpace,
  PlaneGeometry,
  RedFormat,
  Scene,
  ShaderMaterial,
  UnsignedIntType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";
import type { Scene as ThreeScene, Camera, Material, Texture } from "three";
import { useWorkspace } from "../../stores/workspace";
import { usePlaybackTransport } from "./playbackTransport";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import type { EmissionParticlePaths } from "./preparedEmission";
import { getContourLevels } from "./contourLevels";
import { updateStreamlineRibbon } from "./streamlineRibbon";
import {
  streamlineFragment,
  streamlineVertex,
  volumeFragment,
  volumeVertex,
} from "./volumeShaders";
import "./Volume.css";

type PlaybackMode = "volume" | "iso" | "streamlines";

interface RenderStats {
  cityCaptures: number;
  depthCaptures: number;
}

function framePair(times: number[], requested: number) {
  const time = Number.isFinite(requested) ? requested : times[0];
  if (time <= times[0]) return { lower: 0, upper: 0, mix: 0 };
  const last = times.length - 1;
  if (time >= times[last]) return { lower: last, upper: last, mix: 0 };
  let lower = 0,
    upper = last;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if (times[middle] <= time) lower = middle;
    else upper = middle;
  }
  return {
    lower,
    upper,
    mix: (time - times[lower]) / (times[upper] - times[lower]),
  };
}

function fieldTexture(
  values: Float32Array,
  dimensions: [number, number, number],
) {
  const texture = new Data3DTexture(values, ...dimensions);
  texture.format = RedFormat;
  texture.type = FloatType;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

function createResources(clip: PreparedPlaybackClip) {
  let pendingReady:
    | {
        context: WebGL2RenderingContext;
        fence: WebGLSync;
        timer?: ReturnType<typeof setTimeout>;
        started: number;
      }
    | undefined;
  const cancelReady = () => {
    if (!pendingReady) return;
    if (pendingReady.timer !== undefined) clearTimeout(pendingReady.timer);
    pendingReady.context.deleteSync(pendingReady.fence);
    pendingReady = undefined;
  };
  const first = clip.frames[0];
  const dimensions = first.asset.dimensions!;
  const contourLevels = getContourLevels(clip);
  const fields = [
    fieldTexture(first.values, dimensions),
    fieldTexture(clip.frames[1]?.values ?? first.values, dimensions),
  ] as const;
  const indices = [0, Math.min(1, clip.frames.length - 1)];
  const mask = new Data3DTexture(first.mask, ...dimensions);
  mask.format = RedFormat;
  mask.minFilter = mask.magFilter = NearestFilter;
  mask.unpackAlignment = 1;
  mask.needsUpdate = true;
  const depthTarget = new WebGLRenderTarget(1, 1);
  depthTarget.depthTexture = new DepthTexture(1, 1, UnsignedIntType);
  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: volumeVertex,
    fragmentShader: volumeFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    side: BackSide,
    uniforms: {
      field: { value: fields[0] },
      nextField: { value: fields[1] },
      interpolate: { value: true },
      frameMix: { value: 0 },
      raySteps: { value: 128 },
      contour: { value: false },
      contourThreshold: { value: 0 },
      contourLevels: { value: contourLevels },
      gridDimensions: { value: new Vector3(...dimensions) },
      mask: { value: mask },
      sceneDepth: { value: depthTarget.depthTexture },
      volumeToClip: { value: new Matrix4() },
      resolution: { value: new Vector2() },
      valueRange: { value: clip.range },
      opacity: { value: 1 },
      highlightRange: { value: [0, 0] },
      hasHighlight: { value: false },
      concentration: {
        value:
          first.scene.field?.id.toLowerCase().includes("concentration") ??
          false,
      },
      localCamera: { value: new Vector3() },
    },
  });
  const volumeScene = new Scene();
  const volumeGeometry = new BoxGeometry();
  const volume = new Mesh(volumeGeometry, material);
  volume.name = "concentration-volume";
  const spacing = first.asset.spacing ?? [1, 1, 1];
  const origin = first.asset.origin ?? first.scene.origin;
  const scale = dimensions.map((count, axis) => count * spacing[axis]);
  volume.scale.set(scale[0], scale[1], scale[2]);
  volume.position.set(
    origin[0] + scale[0] / 2,
    origin[1] + scale[1] / 2,
    origin[2] + scale[2] / 2,
  );
  volumeScene.add(volume);
  const lineGeometry = new BufferGeometry();
  updateStreamlineRibbon(lineGeometry, new Float32Array(), new Float32Array());
  const lineMaterial = new ShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: streamlineVertex,
    side: DoubleSide,
    fragmentShader: streamlineFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    uniforms: {
      field: material.uniforms.field,
      nextField: material.uniforms.nextField,
      frameMix: material.uniforms.frameMix,
      concentrationScale: { value: contourLevels[0] },
      lineWidth: { value: 2.75 },
      playbackTime: { value: clip.times[0] },
      mask: material.uniforms.mask,
      sceneDepth: material.uniforms.sceneDepth,
      resolution: material.uniforms.resolution,
      valueRange: material.uniforms.valueRange,
      opacity: material.uniforms.opacity,
      highlightRange: material.uniforms.highlightRange,
      hasHighlight: material.uniforms.hasHighlight,
    },
  });
  const lines = new Mesh(lineGeometry, lineMaterial);
  lines.name = "emission-concentration-streamlines";
  lines.frustumCulled = false;
  lines.matrixAutoUpdate = false;
  lines.visible = false;
  volume.updateMatrix();
  lines.matrix.copy(volume.matrix);
  volumeScene.add(lines);
  const volumeTarget = new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const composite = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    uniforms: {
      plume: { value: volumeTarget.texture },
      city: { value: null },
    },
    vertexShader: `
varying vec2 plumeUv;
void main() {
  plumeUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
    fragmentShader: `
uniform sampler2D plume;
uniform sampler2D city;
varying vec2 plumeUv;
void main() {
  vec4 base = texture2D(city, plumeUv);
  vec4 volume = texture2D(plume, plumeUv);
  gl_FragColor = vec4(volume.rgb + base.rgb * (1.0 - volume.a), 1.0);
}
`,
  });
  const screenScene = new Scene();
  const screenGeometry = new PlaneGeometry(2, 2);
  const screen = new Mesh(screenGeometry, composite);
  screen.frustumCulled = false;
  screenScene.add(screen);
  return {
    clip,
    fields,
    mask,
    depthTarget,
    material,
    volumeScene,
    volume,
    lines,
    mode: "volume" as PlaybackMode,
    streamlines: undefined as EmissionParticlePaths | undefined,
    volumeTarget,
    composite,
    screenScene,
    screen,
    cityTexture: undefined as FramebufferTexture | undefined,
    stats: { cityCaptures: 0, depthCaptures: 0 },
    depthKey: "",
    cityKey: "",
    volumeKey: "",
    time: clip.times[0],
    mix: 0,
    ready: false,
    active: true,
    setMode(mode: PlaybackMode, streamlines?: EmissionParticlePaths) {
      if (this.mode === mode && this.streamlines === streamlines) return;
      cancelReady();
      this.ready = false;
      this.volumeKey = "";
      this.mode = mode;
      if (this.streamlines !== streamlines) {
        lineGeometry.dispose();
        updateStreamlineRibbon(
          lineGeometry,
          streamlines?.positions ?? new Float32Array(0),
          streamlines?.times ?? new Float32Array(0),
        );
      }
      this.streamlines = streamlines;
      material.uniforms.contour.value = mode === "iso";
      volume.visible = mode !== "streamlines";
      lines.visible = mode === "streamlines";
    },
    awaitReady(
      context: WebGL2RenderingContext,
      complete: () => void,
      failed: (error: Error) => void,
    ) {
      if (this.ready || pendingReady || !this.active) return;
      try {
        if (context.isContextLost()) return;
        if (typeof context.fenceSync !== "function")
          throw new Error("WebGL 2 synchronization is unavailable.");
        const fence = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!fence)
          throw new Error("GPU synchronization fence creation failed.");
        pendingReady = { context, fence, started: performance.now() };
        context.flush();
        // 최초 그림의 GPU 완료만 비동기로 확인하고 재생 중 대기는 생략
        const poll = () => {
          const pending = pendingReady;
          if (!pending) return;
          pending.timer = undefined;
          if (!this.active || context.isContextLost()) {
            cancelReady();
            return;
          }
          try {
            const status = context.clientWaitSync(fence, 0, 0);
            if (
              status === context.ALREADY_SIGNALED ||
              status === context.CONDITION_SATISFIED
            ) {
              cancelReady();
              this.ready = true;
              complete();
            } else {
              if (status === context.WAIT_FAILED)
                throw new Error("GPU synchronization failed.");
              if (performance.now() - pending.started > 30_000)
                throw new Error("GPU preparation timed out after 30 seconds.");
              pending.timer = setTimeout(poll, 16);
            }
          } catch (error) {
            cancelReady();
            failed(error instanceof Error ? error : new Error(String(error)));
          }
        };
        pendingReady.timer = setTimeout(poll, 16);
      } catch (error) {
        cancelReady();
        failed(error instanceof Error ? error : new Error(String(error)));
      }
    },
    update(time: number) {
      const pair = framePair(clip.times, time);
      let lowerSlot = indices.indexOf(pair.lower);
      let upperSlot = indices.indexOf(pair.upper);
      // 정수 프레임 경계에서 두 GPU 텍스처의 역할만 교환
      if (lowerSlot < 0) {
        lowerSlot = upperSlot === 0 ? 1 : 0;
        fields[lowerSlot].image.data = clip.frames[pair.lower].values;
        fields[lowerSlot].needsUpdate = true;
        indices[lowerSlot] = pair.lower;
      }
      if (pair.lower === pair.upper) upperSlot = lowerSlot;
      else if (upperSlot < 0) {
        upperSlot = 1 - lowerSlot;
        fields[upperSlot].image.data = clip.frames[pair.upper].values;
        fields[upperSlot].needsUpdate = true;
        indices[upperSlot] = pair.upper;
      }
      material.uniforms.field.value = fields[lowerSlot];
      material.uniforms.nextField.value = fields[upperSlot];
      material.uniforms.frameMix.value = pair.mix;
      this.time = Number.isFinite(time)
        ? Math.max(clip.times[0], Math.min(clip.times.at(-1)!, time))
        : clip.times[0];
      this.mix = pair.mix;
      lineMaterial.uniforms.playbackTime.value = this.time;
    },
    dispose() {
      this.active = false;
      cancelReady();
      fields.forEach((texture) => texture.dispose());
      mask.dispose();
      depthTarget.dispose();
      volumeTarget.dispose();
      this.cityTexture?.dispose();
      volumeGeometry.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      screenGeometry.dispose();
      material.dispose();
      composite.dispose();
      volumeScene.clear();
      screenScene.clear();
    },
  };
}

function geometryKey(scene: ThreeScene, camera: Camera, volume: Mesh) {
  // 카메라 제어의 화면에 보이지 않는 부동소수점 흔들림은 캐시에서 제외
  const matrixKey = (values: number[]) =>
    values.map((value) => Math.round(value * 1e7) / 1e7).join(",");
  const parts = [
    matrixKey(camera.matrixWorld.elements),
    matrixKey(camera.projectionMatrix.elements),
    scene.background instanceof Color
      ? scene.background.getHexString()
      : `${scene.background?.uuid}:${scene.background?.version}`,
  ];
  scene.traverseVisible((object) => {
    if (object instanceof Light) {
      parts.push(
        String(object.id),
        object.color.getHexString(),
        String(object.intensity),
        matrixKey(object.matrixWorld.elements),
      );
      return;
    }
    if (
      (!(object instanceof Mesh) && !(object instanceof LineSegments)) ||
      object === volume
    )
      return;
    const materials: Material[] = Array.isArray(object.material)
      ? object.material
      : [object.material];
    parts.push(
      String(object.id),
      String(object.geometry.id),
      String(object.geometry.attributes.position?.version ?? 0),
      String(object.geometry.index?.version ?? 0),
      matrixKey(object.matrixWorld.elements),
      ...materials.map((material) => {
        const textured = material as typeof material & {
          map?: Texture;
          alphaMap?: Texture;
          color?: Color;
          wireframe?: boolean;
        };
        const clipping = material.clippingPlanes
          ?.flatMap((plane) => [...plane.normal.toArray(), plane.constant])
          .join(",");
        return `${material.uuid}:${material.version}:${material.visible}:${material.depthWrite}:${material.side}:${material.alphaTest}:${material.opacity}:${textured.color?.getHexString()}:${textured.wireframe}:${textured.map?.uuid}:${textured.map?.version}:${textured.alphaMap?.uuid}:${textured.alphaMap?.version}:${clipping}:${material.clipIntersection}:${material.clipShadows}`;
      }),
    );
  });
  return parts.join("|");
}

export function VolumeSequence({
  clip,
  active = true,
  mode = "volume",
  streamlines,
  onReady,
  onFrame,
}: {
  clip: PreparedPlaybackClip;
  active?: boolean;
  mode?: PlaybackMode;
  streamlines?: EmissionParticlePaths;
  onReady: () => void;
  onFrame?: (time: number, mix: number, stats?: RenderStats) => void;
}) {
  const { camera, gl, scene, invalidate } = useThree();
  const [resources, setResources] =
    useState<ReturnType<typeof createResources>>();
  const [synchronizationError, setSynchronizationError] = useState<Error>();
  const mesh = useRef<Mesh>(null);
  const ready = useRef(onReady);
  ready.current = onReady;
  const rendered = useRef(onFrame);
  rendered.current = onFrame;
  const drawingSize = useRef(new Vector2());
  const localCamera = useRef(new Vector3());
  const clearColor = useRef(new Color());
  const quality = useRef({ playing: false, tier: 0, slow: 0 });
  useEffect(() => {
    const next = createResources(clip);
    setResources(next);
    invalidate();
    return () => next.dispose();
  }, [clip, invalidate]);
  useEffect(() => {
    if (!resources?.active) return;
    resources.setMode(mode, streamlines);
    invalidate();
  }, [resources, mode, streamlines, invalidate]);
  useEffect(() => {
    quality.current = { playing: false, tier: 0, slow: 0 };
    let wasPlaying = usePlaybackTransport.getState().playing;
    return usePlaybackTransport.subscribe(() => {
      const playing = usePlaybackTransport.getState().playing;
      if (playing && !wasPlaying)
        quality.current = { playing: false, tier: 0, slow: 0 };
      wasPlaying = playing;
      invalidate();
    });
  }, [clip.key, invalidate]);
  useEffect(
    () =>
      useWorkspace.subscribe((next, previous) => {
        if (
          next.opacity !== previous.opacity ||
          next.valueRange !== previous.valueRange ||
          next.threshold !== previous.threshold
        )
          invalidate();
      }),
    [invalidate],
  );
  const reportFrame = () => {
    if (!resources?.active || !resources.volumeKey || resources.mode !== mode)
      return;
    rendered.current?.(resources.time, resources.mix, { ...resources.stats });
    resources.awaitReady(
      gl.getContext() as WebGL2RenderingContext,
      () => ready.current(),
      setSynchronizationError,
    );
  };
  useFrame(
    (_state, delta) => {
      if (
        !active ||
        !resources?.active ||
        resources.clip !== clip ||
        !mesh.current
      )
        return;
      resources.setMode(mode, streamlines);
      const { material, depthTarget, volume, volumeTarget } = resources;
      const transport = usePlaybackTransport.getState();
      resources.update(
        transport.key === clip.key ? transport.time : clip.times[0],
      );
      const workspace = useWorkspace.getState();
      material.uniforms.opacity.value = workspace.opacity;
      material.uniforms.highlightRange.value = workspace.valueRange ?? [0, 0];
      material.uniforms.hasHighlight.value = Boolean(workspace.valueRange);
      const contourThreshold =
        Number.isFinite(workspace.threshold) &&
        workspace.threshold > clip.range[0] &&
        workspace.threshold < clip.range[1]
          ? workspace.threshold
          : 0;
      material.uniforms.contourThreshold.value = contourThreshold;
      scene.updateMatrixWorld();
      volume.updateWorldMatrix(true, false);
      camera.updateWorldMatrix(true, false);
      camera.getWorldPosition(localCamera.current);
      volume.worldToLocal(localCamera.current).addScalar(0.5);
      material.uniforms.localCamera.value.copy(localCamera.current);
      material.uniforms.volumeToClip.value
        .copy(camera.projectionMatrix)
        .multiply(camera.matrixWorldInverse)
        .multiply(volume.matrixWorld);

      // 실제 프레임버퍼 좌표로 깊이 텍스처와 기본 캔버스의 비율 일치
      gl.getDrawingBufferSize(drawingSize.current);
      const ratio = Math.min(
        1,
        1536 / Math.max(drawingSize.current.x, drawingSize.current.y),
      );
      const width = Math.max(1, Math.floor(drawingSize.current.x * ratio));
      const height = Math.max(1, Math.floor(drawingSize.current.y * ratio));
      const depthKey = `${drawingSize.current.x},${drawingSize.current.y}|${geometryKey(scene, camera, mesh.current)}`;
      const playing = transport.key === clip.key && transport.playing;
      // 느린 장치에서는 연속 지연을 확인한 뒤 재생 품질만 단계적으로 조정
      if (playing && !quality.current.playing)
        quality.current = { playing: true, tier: 0, slow: 0 };
      else if (playing) {
        quality.current.slow = delta > 0.06 ? quality.current.slow + 1 : 0;
        if (quality.current.slow >= 3 && quality.current.tier < 2) {
          quality.current.tier++;
          quality.current.slow = 0;
        }
      } else quality.current.playing = false;
      const playbackEdges = [256, 192, 128];
      const playbackSteps = [64, 48, 32];
      const volumeRatio = Math.min(
        1,
        (mode === "streamlines"
          ? Math.max(drawingSize.current.x, drawingSize.current.y)
          : playing
            ? playbackEdges[quality.current.tier]
            : 1536) / Math.max(drawingSize.current.x, drawingSize.current.y),
      );
      const volumeWidth = Math.max(
        1,
        Math.floor(drawingSize.current.x * volumeRatio),
      );
      const volumeHeight = Math.max(
        1,
        Math.floor(drawingSize.current.y * volumeRatio),
      );
      const steps = playing ? playbackSteps[quality.current.tier] : 128;
      material.uniforms.raySteps.value = steps;
      material.uniforms.resolution.value.set(volumeWidth, volumeHeight);
      const volumeKey = `${mode}|${depthKey}|${resources.time}|${resources.mix}|${workspace.opacity}|${workspace.valueRange?.join(",")}|${contourThreshold}|${volumeWidth},${volumeHeight},${steps}`;
      const previous = gl.getRenderTarget();
      const viewport = gl.getViewport(new Vector4());
      const scissor = gl.getScissor(new Vector4());
      const scissorTest = gl.getScissorTest();
      const visible = mesh.current.visible;
      const autoClear = gl.autoClear;
      gl.getClearColor(clearColor.current);
      const clearAlpha = gl.getClearAlpha();
      try {
        mesh.current.visible = false;
        gl.autoClear = true;
        gl.setScissorTest(false);
        if (depthTarget.width !== width || depthTarget.height !== height)
          depthTarget.setSize(width, height);
        if (
          volumeTarget.width !== volumeWidth ||
          volumeTarget.height !== volumeHeight
        )
          volumeTarget.setSize(volumeWidth, volumeHeight);
        if (resources.depthKey !== depthKey) {
          gl.setRenderTarget(depthTarget);
          gl.render(scene, camera);
          resources.depthKey = depthKey;
          resources.stats.depthCaptures++;
        }
        if (resources.cityKey !== depthKey) {
          if (
            !resources.cityTexture ||
            resources.cityTexture.image.width !== drawingSize.current.x ||
            resources.cityTexture.image.height !== drawingSize.current.y
          ) {
            resources.cityTexture?.dispose();
            resources.cityTexture = new FramebufferTexture(
              drawingSize.current.x,
              drawingSize.current.y,
            );
            resources.cityTexture.colorSpace = NoColorSpace;
            resources.composite.uniforms.city.value = resources.cityTexture;
          }
          // 원래 화면의 색 변환과 안티앨리어싱을 보존한 도시 그림을 복사
          gl.setRenderTarget(null);
          gl.setViewport(
            0,
            0,
            drawingSize.current.x / gl.getPixelRatio(),
            drawingSize.current.y / gl.getPixelRatio(),
          );
          gl.render(scene, camera);
          gl.copyFramebufferToTexture(resources.cityTexture);
          resources.cityKey = depthKey;
          resources.stats.cityCaptures++;
        }
        if (resources.volumeKey !== volumeKey) {
          // 재생 중에는 볼륨만 낮은 해상도로 렌더하고 도시는 원래 해상도 유지
          gl.setRenderTarget(volumeTarget);
          gl.setClearColor(0x000000, 0);
          gl.render(resources.volumeScene, camera);
          resources.volumeKey = volumeKey;
        }
        gl.setRenderTarget(previous);
        gl.setViewport(viewport);
        gl.setScissor(scissor);
        gl.setScissorTest(scissorTest);
        gl.setClearColor(clearColor.current, clearAlpha);
        resources.screen.onAfterRender = reportFrame;
        gl.render(resources.screenScene, camera);
      } finally {
        gl.setRenderTarget(previous);
        gl.setViewport(viewport);
        gl.setScissor(scissor);
        gl.setScissorTest(scissorTest);
        gl.setClearColor(clearColor.current, clearAlpha);
        gl.autoClear = autoClear;
        mesh.current.visible = visible;
      }
    },
    active ? 1 : 0,
  );
  if (synchronizationError) throw synchronizationError;
  if (!resources?.active || resources.clip !== clip) return null;
  return (
    <mesh
      ref={mesh}
      visible={active}
      renderOrder={2000}
      frustumCulled={false}
      raycast={() => undefined}
      onAfterRender={reportFrame}
    >
      <planeGeometry args={[2, 2]} />
      <primitive object={resources.composite} attach="material" />
    </mesh>
  );
}
