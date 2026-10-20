import type { ReactElement, RefObject } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Data3DTexture,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
} from "three";
import { VolumeSequence } from "./VolumeSequence";
import { useWorkspace } from "../../stores/workspace";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import type { EmissionParticlePaths } from "./preparedEmission";

const transport = vi.hoisted(() => ({
  key: "clip",
  time: 0,
  playing: false,
  listeners: new Set<() => void>(),
}));
vi.mock("./playbackTransport", () => ({
  usePlaybackTransport: {
    getState: () => transport,
    subscribe: (callback: () => void) => {
      transport.listeners.add(callback);
      return () => transport.listeners.delete(callback);
    },
  },
}));

let frame: (() => void) | undefined;
let frameDelta = 1 / 60;
let priority = 0;
const camera = new PerspectiveCamera();
const scene = new Scene();
const invalidate = vi.fn();
const size = { width: 800, height: 600 };
const gpu = {
  SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
  ALREADY_SIGNALED: 0x911a,
  TIMEOUT_EXPIRED: 0x911b,
  CONDITION_SATISFIED: 0x911c,
  WAIT_FAILED: 0x911d,
  fenceSync: vi.fn(() => ({}) as WebGLSync),
  clientWaitSync: vi.fn(() => 0x911a),
  deleteSync: vi.fn(),
  flush: vi.fn(),
  isContextLost: vi.fn(() => false),
};
const gl = {
  autoClear: true,
  getDrawingBufferSize: vi.fn((target) => target.set(size.width, size.height)),
  getRenderTarget: vi.fn(() => null),
  getViewport: vi.fn((target) => target.copy(new Vector4(0, 0, 800, 600))),
  getScissor: vi.fn((target) => target.copy(new Vector4(0, 0, 800, 600))),
  getScissorTest: vi.fn(() => false),
  getPixelRatio: vi.fn(() => 1),
  copyFramebufferToTexture: vi.fn(),
  getContext: vi.fn(() => gpu),
  getClearColor: vi.fn((target) => target.copy(new Color(0x123456))),
  getClearAlpha: vi.fn(() => 0.75),
  setRenderTarget: vi.fn(),
  setViewport: vi.fn(),
  setScissor: vi.fn(),
  setScissorTest: vi.fn(),
  setClearColor: vi.fn(),
  render: vi.fn(),
};
vi.mock("@react-three/fiber", () => ({
  useFrame: (
    callback: (state: undefined, delta: number) => void,
    value = 0,
  ) => {
    priority = value;
    frame = () => callback(undefined, frameDelta);
  },
  useThree: () => ({ camera, gl, scene, invalidate }),
}));

type VolumeElement = ReactElement<{
  ref: RefObject<Mesh | null>;
  children: [ReactElement, ReactElement<{ object: ShaderMaterial }>];
  onAfterRender: () => void;
}>;
function clipFixture(): PreparedPlaybackClip {
  return {
    key: "clip",
    times: [0, 2, 5],
    range: [0, 8],
    bytes: 104,
    frames: [0, 2, 5].map((time, index) => ({
      index,
      values: new Float32Array(8).fill(index * 3),
      mask: new Uint8Array(8).fill(1),
      asset: {
        kind: "volume",
        format: "float32",
        url: `/${index}.bin`,
        dimensions: [2, 2, 2],
        spacing: [1, 1, 1],
        origin: [0, 0, 0],
      },
      scene: {
        contextKey: `frame-${index}`,
        time,
        origin: [0, 0, 0],
        bounds: [
          [0, 0, 0],
          [2, 2, 2],
        ],
        field: { id: "concentration", name: "Concentration", unit: "µg/m3" },
        range: [0, 8],
        assets: [],
      },
    })),
  };
}
function mount(
  clip = clipFixture(),
  onReady = vi.fn(),
  onFrame?: (time: number, mix: number) => void,
) {
  const hook = renderHook(() => VolumeSequence({ clip, onReady, onFrame }));
  const element = hook.result.current as VolumeElement;
  const composite = element.props.children[1].props.object;
  const mesh = new Mesh(new BoxGeometry(), composite);
  scene.add(mesh);
  element.props.ref.current = mesh;
  act(() => frame?.());
  const volumeScene = [...gl.render.mock.calls]
    .reverse()
    .find(([pass]) => pass.getObjectByName("concentration-volume"))![0];
  const volume = volumeScene.children[0] as Mesh;
  const material = volume.material as ShaderMaterial;
  return { ...hook, element, material, composite, volume, mesh, clip, onReady };
}
function mountModes() {
  const clip = clipFixture();
  const onReady = vi.fn();
  const streamlines: EmissionParticlePaths = {
    kind: "particle-paths",
    positions: new Float32Array([0.25, 0.5, 0.5, 0.75, 0.5, 0.5]),
    times: new Float32Array([0, 5]),
    particleIds: new Uint32Array([7]),
    count: 1,
    source: [0.5, 0.5, 0.5],
    bytes: 36,
  };
  const hook = renderHook(
    ({
      mode,
      paths,
    }: {
      mode: "volume" | "iso" | "streamlines";
      paths: EmissionParticlePaths;
    }) => VolumeSequence({ clip, mode, streamlines: paths, onReady }),
    {
      initialProps: {
        mode: "volume" as "volume" | "iso" | "streamlines",
        paths: streamlines,
      },
    },
  );
  const element = hook.result.current as VolumeElement;
  const composite = element.props.children[1].props.object;
  const mesh = new Mesh(new BoxGeometry(), composite);
  scene.add(mesh);
  element.props.ref.current = mesh;
  act(() => frame?.());
  const volumeScene = [...gl.render.mock.calls]
    .reverse()
    .find(([pass]) => pass.getObjectByName("concentration-volume"))![0];
  const volume = volumeScene.getObjectByName("concentration-volume") as Mesh;
  const lines = volumeScene.getObjectByName(
    "emission-concentration-streamlines",
  ) as Mesh;
  return {
    ...hook,
    clip,
    onReady,
    streamlines,
    volumeScene,
    volume,
    lines,
    composite,
  };
}

function draw(time: number) {
  transport.time = time;
  act(() => frame?.());
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  gl.render.mockReset();
  gpu.clientWaitSync.mockReset().mockReturnValue(gpu.ALREADY_SIGNALED);
  frame = undefined;
  priority = 0;
  frameDelta = 1 / 60;
  transport.key = "clip";
  transport.time = 0;
  transport.playing = false;
  transport.listeners.clear();
  useWorkspace.setState({ threshold: 0 });
  scene.clear();
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld();
  size.width = 800;
  size.height = 600;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  scene.clear();
});

describe("continuous concentration volume", () => {
  it("switches all three modes at the same time without replacing scalar textures or recapturing the city", () => {
    const view = mountModes();
    draw(1);
    const material = view.volume.material as ShaderMaterial;
    const lineMaterial = view.lines.material as ShaderMaterial;
    const fields = [
      material.uniforms.field.value,
      material.uniforms.nextField.value,
    ];
    const city = view.composite.uniforms.city.value;
    expect(view.volume.visible).toBe(true);
    expect(view.lines.visible).toBe(false);
    view.rerender({ mode: "iso", paths: view.streamlines });
    draw(1);
    expect(material.uniforms.contour.value).toBe(true);
    expect(view.volume.visible).toBe(true);
    expect(view.lines.visible).toBe(false);
    view.rerender({ mode: "streamlines", paths: view.streamlines });
    draw(1);
    expect(view.volume.visible).toBe(false);
    expect(view.lines.visible).toBe(true);
    expect(view.lines.geometry.attributes.position.count).toBe(6);
    expect(
      Array.from(view.lines.geometry.attributes.segmentStart.array).slice(0, 3),
    ).toEqual([0.25, 0.5, 0.5]);
    expect(
      Array.from(view.lines.geometry.attributes.segmentEnd.array).slice(0, 3),
    ).toEqual([0.75, 0.5, 0.5]);
    expect(view.lines.matrix.equals(view.volume.matrix)).toBe(true);
    expect(lineMaterial.uniforms.field.value).toBe(fields[0]);
    expect(lineMaterial.uniforms.nextField.value).toBe(fields[1]);
    expect(lineMaterial.uniforms.frameMix.value).toBe(0.5);
    expect(lineMaterial.uniforms.playbackTime.value).toBe(1);
    expect(view.composite.uniforms.city.value).toBe(city);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    expect(transport.time).toBe(1);
    draw(5);
    expect(lineMaterial.uniforms.playbackTime.value).toBe(5);
    expect(lineMaterial.uniforms.field.value.image.data).toBe(
      view.clip.frames[2].values,
    );
    expect(lineMaterial.uniforms.nextField.value).toBe(
      lineMaterial.uniforms.field.value,
    );
    view.rerender({ mode: "volume", paths: view.streamlines });
    draw(5);
    expect(material.uniforms.contour.value).toBe(false);
    expect(view.volume.visible).toBe(true);
    expect(view.lines.visible).toBe(false);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
  });

  it("updates a custom contour threshold without resetting textures, time, or the cached city", () => {
    const view = mountModes();
    view.rerender({ mode: "iso", paths: view.streamlines });
    draw(1);
    const material = view.volume.material as ShaderMaterial;
    const field = material.uniforms.field.value;
    expect(material.uniforms.contourThreshold.value).toBe(0);
    const levels = [...material.uniforms.contourLevels.value];
    expect(material.uniforms.gridDimensions.value.toArray()).toEqual([2, 2, 2]);
    const plumePasses = () =>
      gl.render.mock.calls.filter(([pass]) => pass === view.volumeScene).length;
    const passes = plumePasses();
    const invalidations = invalidate.mock.calls.length;
    act(() => useWorkspace.getState().set({ threshold: 4 }));
    expect(invalidate.mock.calls.length).toBeGreaterThan(invalidations);
    draw(1);
    expect(material.uniforms.contourThreshold.value).toBe(4);
    expect(material.uniforms.contourLevels.value).toEqual(levels);
    expect(plumePasses()).toBe(passes + 1);
    expect(material.uniforms.field.value).toBe(field);
    expect(material.uniforms.frameMix.value).toBe(0.5);
    expect(transport.time).toBe(1);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    act(() => useWorkspace.getState().set({ threshold: 8 }));
    draw(1);
    expect(material.uniforms.contourThreshold.value).toBe(0);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
  });

  it("keeps emission ribbons at screen resolution while the animation clock advances", () => {
    const view = mountModes();
    view.rerender({ mode: "streamlines", paths: view.streamlines });
    transport.playing = true;
    frameDelta = 0.2;
    for (let index = 1; index <= 10; index++) draw(index / 10);
    const material = view.lines.material as ShaderMaterial;
    expect(material.uniforms.resolution.value.toArray()).toEqual([800, 600]);
    expect(material.uniforms.lineWidth.value).toBe(2.75);
    expect(material.uniforms.concentrationScale.value).toBeGreaterThan(0);
    const target = gl.setRenderTarget.mock.calls
      .map(([value]) => value)
      .filter((value) => value?.depthBuffer === false)
      .at(-1);
    expect(target.width).toBe(800);
    expect(target.height).toBe(600);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    expect(material.uniforms.sceneDepth.value).toBe(
      (view.volume.material as ShaderMaterial).uniforms.sceneDepth.value,
    );
  });

  it("seeks particle path time forward and backward without replacing or uploading ribbon buffers", () => {
    const view = mountModes();
    view.rerender({ mode: "streamlines", paths: view.streamlines });
    const material = view.lines.material as ShaderMaterial;
    const attributes = { ...view.lines.geometry.attributes } as Record<
      string,
      BufferAttribute
    >;
    const versions = Object.fromEntries(
      Object.entries(attributes).map(([key, attribute]) => [
        key,
        attribute.version,
      ]),
    );
    for (const time of [0, 2.5, 5, 1.25, 0]) {
      draw(time);
      expect(material.uniforms.playbackTime.value).toBe(time);
      for (const [key, attribute] of Object.entries(attributes)) {
        expect(view.lines.geometry.attributes[key]).toBe(attribute);
        expect(attribute.version).toBe(versions[key]);
      }
    }
    expect(Array.from(attributes.segmentTimes.array)).toEqual([
      0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5,
    ]);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
  });

  it("cancels readiness from the previous mode and announces only the new mode after drawing", async () => {
    const view = mountModes();
    await act(async () =>
      (view.result.current as VolumeElement).props.onAfterRender(),
    );
    expect(gpu.fenceSync).toHaveBeenCalledOnce();
    view.rerender({ mode: "iso", paths: view.streamlines });
    expect(gpu.deleteSync).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(view.onReady).not.toHaveBeenCalled();
    await act(async () =>
      (view.result.current as VolumeElement).props.onAfterRender(),
    );
    expect(gpu.fenceSync).toHaveBeenCalledOnce();
    draw(0);
    await act(async () =>
      (view.result.current as VolumeElement).props.onAfterRender(),
    );
    await act(async () => vi.advanceTimersByTimeAsync(16));
    expect(gpu.fenceSync).toHaveBeenCalledTimes(2);
    expect(view.onReady).toHaveBeenCalledOnce();
  });

  it("releases replaced streamline buffers and final line material without disposing shared scalar textures early", () => {
    const view = mountModes();
    const geometryDispose = vi.spyOn(view.lines.geometry, "dispose");
    const materialDispose = vi.spyOn(
      view.lines.material as ShaderMaterial,
      "dispose",
    );
    const fieldDispose = vi.spyOn(
      (view.volume.material as ShaderMaterial).uniforms.field.value,
      "dispose",
    );
    const replacement = {
      ...view.streamlines,
      positions: view.streamlines.positions.slice(),
    };
    view.rerender({ mode: "streamlines", paths: replacement });
    draw(1);
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(fieldDispose).not.toHaveBeenCalled();
    expect(view.lines.geometry.attributes.position.count).toBe(6);
    expect(view.lines.geometry.attributes.position.array).not.toBe(
      replacement.positions,
    );
    view.unmount();
    expect(geometryDispose).toHaveBeenCalledTimes(2);
    expect(materialDispose).toHaveBeenCalledOnce();
    expect(fieldDispose).toHaveBeenCalledOnce();
  });

  it("keeps GPU resources while inactive and resumes without recreating them", () => {
    const clip = clipFixture();
    const onReady = vi.fn();
    const hook = renderHook(
      ({ active }) => VolumeSequence({ clip, onReady, active }),
      { initialProps: { active: true } },
    );
    const element = hook.result.current as VolumeElement;
    const material = element.props.children[1].props.object;
    const mesh = new Mesh(new BoxGeometry(), material);
    scene.add(mesh);
    element.props.ref.current = mesh;
    act(() => frame?.());
    const dispose = vi.spyOn(material, "dispose");
    const renders = gl.render.mock.calls.length;
    hook.rerender({ active: false });
    expect(priority).toBe(0);
    act(() => frame?.());
    expect(gl.render).toHaveBeenCalledTimes(renders);
    expect(dispose).not.toHaveBeenCalled();
    hook.rerender({ active: true });
    expect(priority).toBe(1);
    expect(
      (hook.result.current as VolumeElement).props.children[1].props.object,
    ).toBe(material);
    act(() => frame?.());
    expect(gl.render.mock.calls.length).toBeGreaterThan(renders);
    expect(dispose).not.toHaveBeenCalled();
  });

  it("reuses two field textures across irregular frame intervals without changing raw values", () => {
    const { material, clip } = mount();
    draw(1);
    const raw = clip.frames.map((entry) => [...entry.values]);
    const first = material.uniforms.field.value as Data3DTexture;
    const second = material.uniforms.nextField.value as Data3DTexture;
    const mask = material.uniforms.mask.value as Data3DTexture;
    const firstVersion = first.version;
    const secondVersion = second.version;
    expect(new Set([first, second, mask]).size).toBe(3);
    draw(1);
    expect(material.uniforms.field.value).toBe(first);
    expect(material.uniforms.nextField.value).toBe(second);
    expect(material.uniforms.frameMix.value).toBe(0.5);
    expect(first.version).toBe(firstVersion);
    expect(second.version).toBe(secondVersion);
    draw(2);
    expect(material.uniforms.field.value).toBe(second);
    expect(material.uniforms.nextField.value).toBe(first);
    expect(first.image.data).toBe(clip.frames[2].values);
    expect(first.version).toBe(firstVersion + 1);
    expect(second.version).toBe(secondVersion);
    draw(3.5);
    expect(material.uniforms.frameMix.value).toBe(0.5);
    expect(first.version).toBe(firstVersion + 1);
    expect(second.version).toBe(secondVersion);
    expect(material.uniforms.mask.value).toBe(mask);
    expect(clip.frames.map((entry) => [...entry.values])).toEqual(raw);
  });

  it("clamps timeline endpoints and keeps exact final-frame concentration", () => {
    const { material, clip } = mount();
    draw(100);
    expect(material.uniforms.field.value.image.data).toBe(
      clip.frames[2].values,
    );
    expect(material.uniforms.nextField.value).toBe(
      material.uniforms.field.value,
    );
    expect(material.uniforms.frameMix.value).toBe(0);
    draw(-100);
    expect(material.uniforms.field.value.image.data).toBe(
      clip.frames[0].values,
    );
    expect(material.uniforms.frameMix.value).toBe(0);
    draw(Number.NaN);
    expect(material.uniforms.field.value.image.data).toBe(
      clip.frames[0].values,
    );
    expect(material.uniforms.frameMix.value).toBe(0);
  });

  it("takes over rendering and reuses the unchanged original-resolution city while only time advances", () => {
    const { composite, mesh } = mount();
    expect(priority).toBe(1);
    expect(
      gl.render.mock.calls.filter(([pass]) => pass === scene),
    ).toHaveLength(2);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    expect(composite.uniforms.city.value.image).toMatchObject({
      width: 800,
      height: 600,
    });
    for (let index = 1; index <= 20; index++) draw(index / 10);
    expect(
      gl.render.mock.calls.filter(([pass]) => pass === scene),
    ).toHaveLength(2);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    expect(mesh.visible).toBe(true);
  });

  it("ignores subpixel camera drift but refreshes cached city pixels when a material changes", () => {
    mount();
    camera.position.x += 1e-10;
    draw(0.1);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledOnce();
    const city = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    scene.add(city);
    draw(0.2);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledTimes(2);
    city.material.color.set(0x123456);
    draw(0.3);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledTimes(3);
    city.geometry.attributes.position.needsUpdate = true;
    draw(0.4);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledTimes(4);
    const worldPasses = gl.render.mock.calls.filter(
      ([pass]) => pass === scene,
    ).length;
    city.material.wireframe = true;
    draw(0.5);
    expect(gl.copyFramebufferToTexture).toHaveBeenCalledTimes(5);
    expect(
      gl.render.mock.calls.filter(([pass]) => pass === scene),
    ).toHaveLength(worldPasses + 2);
    expect(city.visible).toBe(true);
  });

  it("refreshes cached city and depth when boundary lines change while paused at the same time", () => {
    mount();
    draw(0.5);
    const box = new BoxGeometry();
    const geometry = new EdgesGeometry(box);
    const material = new LineBasicMaterial({ depthWrite: false });
    const boundary = new LineSegments(geometry, material);
    const captures = () => gl.copyFramebufferToTexture.mock.calls.length;
    const worldPasses = () =>
      gl.render.mock.calls.filter(([pass]) => pass === scene).length;
    const initialCaptures = captures(),
      initialPasses = worldPasses();
    expect(transport.playing).toBe(false);
    scene.add(boundary);
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 1);
    expect(worldPasses()).toBe(initialPasses + 2);
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 1);
    boundary.visible = false;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 2);
    boundary.visible = true;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 3);
    scene.remove(boundary);
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 4);
    expect(worldPasses()).toBe(initialPasses + 8);
    expect(transport.time).toBe(0.5);
    box.dispose();
    geometry.dispose();
    material.dispose();
  });

  it("refreshes city and depth for plane edits at the same paused time without relying on material versions", () => {
    mount();
    const city = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    scene.add(city);
    draw(0.5);
    const captures = () => gl.copyFramebufferToTexture.mock.calls.length;
    const worldPasses = () =>
      gl.render.mock.calls.filter(([pass]) => pass === scene).length;
    const initialCaptures = captures(),
      initialPasses = worldPasses(),
      initialVersion = city.material.version;
    expect(transport.playing).toBe(false);
    const plane = new Plane(new Vector3(1, 0, 0), 1);
    city.material.clippingPlanes = [plane];
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 1);
    expect(worldPasses()).toBe(initialPasses + 2);
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 1);
    plane.constant = 0.75;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 2);
    plane.normal.y = 0.25;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 3);
    city.material.clipIntersection = true;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 4);
    city.material.clipShadows = true;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 5);
    city.material.clippingPlanes = null;
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 6);
    expect(worldPasses()).toBe(initialPasses + 12);
    draw(0.5);
    expect(captures()).toBe(initialCaptures + 6);
    expect(city.material.version).toBe(initialVersion);
    expect(transport.time).toBe(0.5);
    city.geometry.dispose();
    city.material.dispose();
  });

  it("replaces a resized screen cache, preserves pixel dimensions and uses upright screen UVs", () => {
    const { composite } = mount();
    const initial = composite.uniforms.city.value;
    const disposed = vi.spyOn(initial, "dispose");
    size.width = 1600;
    size.height = 1200;
    draw(0.2);
    const replacement = composite.uniforms.city.value;
    expect(replacement).not.toBe(initial);
    expect(disposed).toHaveBeenCalledOnce();
    expect(replacement.image).toMatchObject({ width: 1600, height: 1200 });
    expect(replacement.colorSpace).toBe("");
    const screenScene = gl.render.mock.calls.at(-1)![0];
    const screen = screenScene.children[0] as Mesh;
    expect(screen.geometry.attributes.position.getY(0)).toBe(1);
    expect(screen.geometry.attributes.uv.getY(0)).toBe(1);
    expect(screen.geometry.attributes.position.getY(2)).toBe(-1);
    expect(screen.geometry.attributes.uv.getY(2)).toBe(0);
  });

  it("does not render city depth again for time changes but refreshes camera, geometry and DPR changes", () => {
    const { mesh, material } = mount();
    const city = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    scene.add(city);
    const geometryPasses = () => gl.copyFramebufferToTexture.mock.calls;
    gl.render.mockImplementation((pass) => {
      if (pass === scene) expect(mesh.visible).toBe(false);
    });
    draw(0);
    expect(geometryPasses()).toHaveLength(2);
    draw(0.5);
    draw(1);
    expect(geometryPasses()).toHaveLength(2);
    expect(mesh.visible).toBe(true);
    camera.position.x = 1;
    draw(1.5);
    expect(geometryPasses()).toHaveLength(3);
    city.position.x = 3;
    draw(1.6);
    expect(geometryPasses()).toHaveLength(4);
    size.width = 1600;
    size.height = 1200;
    draw(1.7);
    expect(geometryPasses()).toHaveLength(5);
    expect(material.uniforms.resolution.value.toArray()).toEqual([1536, 1152]);
    const target = gl.setRenderTarget.mock.calls
      .map(([value]) => value)
      .filter((value) => value?.depthBuffer === false)
      .at(-1);
    expect(target.width).toBe(1536);
    expect(target.height).toBe(1152);
  });

  it("raymarches into a bounded playback target and restores full paused quality and renderer state", () => {
    const { material, composite, mesh } = mount();
    const geometryPasses = gl.copyFramebufferToTexture.mock.calls.length;
    transport.playing = true;
    draw(0.25);
    expect(material.uniforms.raySteps.value).toBe(64);
    expect(material.uniforms.resolution.value.toArray()).toEqual([256, 192]);
    const target = gl.setRenderTarget.mock.calls
      .map(([value]) => value)
      .filter((value) => value?.depthBuffer === false)
      .at(-1);
    expect(target.width).toBe(256);
    expect(target.height).toBe(192);
    expect(target.depthBuffer).toBe(false);
    expect(composite.uniforms.plume.value).toBe(target.texture);
    expect(composite.premultipliedAlpha).toBe(true);
    expect(composite.depthTest).toBe(false);
    expect(mesh.visible).toBe(true);
    expect(gl.setRenderTarget).toHaveBeenLastCalledWith(null);
    expect(gl.setClearColor).toHaveBeenLastCalledWith(
      new Color(0x123456),
      0.75,
    );
    transport.playing = false;
    draw(0.5);
    expect(material.uniforms.raySteps.value).toBe(128);
    expect(material.uniforms.resolution.value.toArray()).toEqual([800, 600]);
    expect(gl.copyFramebufferToTexture.mock.calls).toHaveLength(geometryPasses);
    const rendered = gl.render.mock.calls.length;
    draw(0.5);
    expect(gl.render).toHaveBeenCalledTimes(rendered + 1);
  });

  it("announces readiness only after the first actual volume draw and once per mount", async () => {
    const first = mount();
    draw(0);
    expect(first.onReady).not.toHaveBeenCalled();
    gpu.clientWaitSync
      .mockReturnValueOnce(gpu.TIMEOUT_EXPIRED)
      .mockReturnValueOnce(gpu.CONDITION_SATISFIED);
    await act(async () => {
      first.element.props.onAfterRender();
      first.element.props.onAfterRender();
    });
    expect(first.onReady).not.toHaveBeenCalled();
    expect(gpu.fenceSync).toHaveBeenCalledOnce();
    expect(gpu.flush).toHaveBeenCalledOnce();
    await act(async () => vi.advanceTimersByTimeAsync(16));
    expect(first.onReady).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(16));
    expect(first.onReady).toHaveBeenCalledOnce();
    expect(gpu.deleteSync).toHaveBeenCalledOnce();
    first.unmount();
    const recovered = mount(first.clip);
    await act(async () => recovered.element.props.onAfterRender());
    await act(async () => vi.advanceTimersByTimeAsync(16));
    expect(recovered.onReady).toHaveBeenCalledOnce();
  });

  it("reduces playback quality only after consecutive slow draws and resets for the next play", () => {
    const { material } = mount();
    transport.playing = true;
    frameDelta = 2;
    draw(0.1);
    expect(material.uniforms.resolution.value.toArray()).toEqual([256, 192]);
    expect(material.uniforms.raySteps.value).toBe(64);
    frameDelta = 1 / 60;
    for (let index = 0; index < 10; index++) draw(0.2 + index * 0.01);
    expect(material.uniforms.resolution.value.toArray()).toEqual([256, 192]);
    frameDelta = 0.07;
    draw(0.4);
    draw(0.5);
    expect(material.uniforms.raySteps.value).toBe(64);
    draw(0.6);
    expect(material.uniforms.resolution.value.toArray()).toEqual([192, 144]);
    expect(material.uniforms.raySteps.value).toBe(48);
    draw(0.7);
    draw(0.8);
    draw(0.9);
    expect(material.uniforms.resolution.value.toArray()).toEqual([128, 96]);
    expect(material.uniforms.raySteps.value).toBe(32);
    frameDelta = 1 / 60;
    draw(1);
    expect(material.uniforms.raySteps.value).toBe(32);
    transport.playing = false;
    draw(1.1);
    expect(material.uniforms.resolution.value.toArray()).toEqual([800, 600]);
    expect(material.uniforms.raySteps.value).toBe(128);
    transport.playing = true;
    draw(1.2);
    expect(material.uniforms.resolution.value.toArray()).toEqual([256, 192]);
    expect(material.uniforms.raySteps.value).toBe(64);
  });

  it("restores renderer state and keeps the composite visible when an offscreen draw fails", () => {
    const { mesh, onReady } = mount();
    gl.render.mockImplementation((pass) => {
      if (pass !== scene) throw new Error("Volume draw failed.");
    });
    expect(() => draw(0.25)).toThrow("Volume draw failed.");
    expect(mesh.visible).toBe(true);
    expect(gl.autoClear).toBe(true);
    expect(gl.setRenderTarget).toHaveBeenLastCalledWith(null);
    expect(gl.setViewport).toHaveBeenLastCalledWith(
      new Vector4(0, 0, 800, 600),
    );
    expect(gl.setScissorTest).toHaveBeenLastCalledWith(false);
    expect(gl.setClearColor).toHaveBeenLastCalledWith(
      new Color(0x123456),
      0.75,
    );
    expect(onReady).not.toHaveBeenCalled();
    gl.render.mockReset();
    draw(0.25);
    expect(gl.render).toHaveBeenCalledTimes(2);
  });

  it("reports the time and mix captured for the actual draw without reading a newer transport clock", async () => {
    const onFrame = vi.fn();
    const { element, onReady } = mount(clipFixture(), vi.fn(), onFrame);
    draw(1);
    expect(onFrame).not.toHaveBeenCalled();
    transport.time = 4;
    await act(async () => element.props.onAfterRender());
    expect(onFrame).toHaveBeenLastCalledWith(1, 0.5, {
      cityCaptures: 1,
      depthCaptures: 1,
    });
    draw(3.5);
    expect(onFrame).toHaveBeenCalledTimes(1);
    await act(async () => {
      element.props.onAfterRender();
      element.props.onAfterRender();
    });
    await act(async () => vi.advanceTimersByTimeAsync(16));
    expect(onFrame).toHaveBeenCalledTimes(3);
    expect(onFrame).toHaveBeenLastCalledWith(3.5, 0.5, {
      cityCaptures: 1,
      depthCaptures: 1,
    });
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("disposes both fields, mask, depth and material and removes transport subscriptions", async () => {
    const { material, composite, volume, element, onReady, unmount } = mount();
    draw(1);
    const textures = [
      material.uniforms.field.value,
      material.uniforms.nextField.value,
      material.uniforms.mask.value,
    ] as Data3DTexture[];
    const disposed = textures.map((texture) => vi.spyOn(texture, "dispose"));
    const targets = [
      ...new Set(
        gl.setRenderTarget.mock.calls.map(([target]) => target).filter(Boolean),
      ),
    ];
    expect(targets).toHaveLength(2);
    const disposeTargets = targets.map((target) => vi.spyOn(target, "dispose"));
    const disposeMaterial = vi.spyOn(material, "dispose");
    const cityTexture = composite.uniforms.city.value;
    const disposeCity = vi.spyOn(cityTexture, "dispose");
    const disposeComposite = vi.spyOn(composite, "dispose");
    const disposeGeometry = vi.spyOn(volume.geometry, "dispose");
    expect(transport.listeners.size).toBe(1);
    act(() => {
      element.props.onAfterRender();
      unmount();
    });
    await act(async () => {});
    disposed.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    disposeTargets.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(disposeCity).toHaveBeenCalledOnce();
    expect(disposeComposite).toHaveBeenCalledOnce();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(transport.listeners.size).toBe(0);
    expect(gpu.deleteSync).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(onReady).not.toHaveBeenCalled();
  });

  it("invalidates a demand canvas when transport time changes while retaining the mesh and material", () => {
    const { result, rerender, composite } = mount();
    const before = invalidate.mock.calls.length;
    act(() => transport.listeners.forEach((listener) => listener()));
    expect(invalidate).toHaveBeenCalledTimes(before + 1);
    rerender();
    expect(
      (result.current as VolumeElement).props.children[1].props.object,
    ).toBe(composite);
  });
});
