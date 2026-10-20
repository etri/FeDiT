import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
  type Object3D,
  type Plane,
} from "three";
import { CityTiles, Geometry } from "./Geometry";
import { clearSceneAssetCache } from "./sceneAssets";
import { useWorkspace } from "../../stores/workspace";
import type { Bounds } from "../datasets/types";
import type { Scene, SceneAsset } from "./types";

type TileListener = (event: { scene: Object3D }) => void;
interface TestTiles {
  group: Group;
  loaded: Object3D[];
  listeners: Map<string, Set<TileListener>>;
  emit: (name: string, scene: Object3D) => void;
  dispose: ReturnType<typeof vi.fn>;
}
const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  parse: vi.fn(),
  report: vi.fn(),
  tiles: [] as TestTiles[],
}));
vi.mock("./decode", () => ({ boundedAsset: mocks.download }));
vi.mock("./loading", () => ({ useAssetProgress: () => mocks.report }));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    parseAsync = mocks.parse;
  },
}));
vi.mock("3d-tiles-renderer", async () => {
  const { Group } = await vi.importActual<typeof import("three")>("three");
  return {
    TilesRenderer: class implements TestTiles {
      group = new Group();
      loaded: Object3D[] = [];
      listeners = new Map<string, Set<TileListener>>();
      lruCache = {};
      dispose = vi.fn();
      setCamera = vi.fn();
      setResolutionFromRenderer = vi.fn();
      update = vi.fn();
      constructor() {
        mocks.tiles.push(this);
      }
      addEventListener(name: string, listener: TileListener) {
        const listeners = this.listeners.get(name) ?? new Set<TileListener>();
        listeners.add(listener);
        this.listeners.set(name, listeners);
      }
      removeEventListener(name: string, listener: TileListener) {
        this.listeners.get(name)?.delete(listener);
      }
      forEachLoadedModel(callback: (scene: Object3D) => void) {
        this.loaded.forEach(callback);
      }
      emit(name: string, scene: Object3D) {
        this.listeners.get(name)?.forEach((listener) => listener({ scene }));
      }
    },
  };
});
const camera = new PerspectiveCamera();
const gl = {};
const invalidate = vi.fn();
vi.mock("@react-three/fiber", () => ({
  useThree: () => ({ camera, gl, invalidate }),
  useFrame: vi.fn(),
}));
vi.mock("@react-three/drei", () => ({ Html: () => null }));

const scene: Scene = {
  contextKey: "domain-clipping",
  origin: [1000, 2000, 30],
  bounds: [
    [1003, 2005, 37],
    [1007, 2010, 44],
  ],
  assets: [],
};
const firstBounds: Bounds = [
  [1002, 2004, 36],
  [1010, 2020, 60],
];
const nextBounds: Bounds = [
  [980, 1980, 0],
  [1080, 2180, 80],
];
const geometryAsset: SceneAsset = {
  kind: "geometry",
  format: "glb",
  url: "/city.glb",
};
const tilesAsset: SceneAsset = {
  kind: "tiles",
  format: "3d-tiles",
  url: "/tileset.json",
};
function meshFixture() {
  const geometry = new BoxGeometry();
  geometry.setAttribute(
    "color",
    new Float32BufferAttribute(
      new Array(geometry.getAttribute("position").count * 3).fill(0.5),
      3,
    ),
  );
  const material = new MeshStandardMaterial({ color: "#247ba0" });
  const mesh = new Mesh(geometry, material);
  const group = new Group();
  group.add(mesh);
  return { group, mesh, geometry, material };
}
function expectDomain(planes: Plane[] | null | undefined, bounds: Bounds) {
  expect(planes).toHaveLength(6);
  const min = new Vector3(...bounds[0]).sub(new Vector3(...scene.origin));
  const max = new Vector3(...bounds[1]).sub(new Vector3(...scene.origin));
  const center = min.clone().add(max).multiplyScalar(0.5);
  expect(planes!.every((plane) => plane.distanceToPoint(center) >= 0)).toBe(
    true,
  );
  for (const axis of ["x", "y", "z"] as const) {
    for (const edge of [min[axis], max[axis]]) {
      const boundary = center.clone();
      boundary[axis] = edge;
      expect(
        planes!.some(
          (plane) => Math.abs(plane.distanceToPoint(boundary)) < 1e-3,
        ),
      ).toBe(true);
    }
    for (const value of [min[axis] - 1, max[axis] + 1]) {
      const outside = center.clone();
      outside[axis] = value;
      expect(planes!.some((plane) => plane.distanceToPoint(outside) < 0)).toBe(
        true,
      );
    }
  }
}

beforeEach(() => {
  clearSceneAssetCache();
  vi.clearAllMocks();
  mocks.tiles.length = 0;
  mocks.download.mockResolvedValue(new ArrayBuffer(0));
  mocks.report.mockReset();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
});
afterEach(() => {
  cleanup();
  clearSceneAssetCache();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("geometry domain clipping", () => {
  it("clips a late GLB with the latest bounds before reporting readiness", async () => {
    const { group, material } = meshFixture();
    const consumer = material.clone();
    vi.spyOn(material, "clone").mockReturnValue(consumer);
    let resolve!: (value: { scene: Group }) => void;
    mocks.parse.mockReturnValue(
      new Promise<{ scene: Group }>((done) => {
        resolve = done;
      }),
    );
    let readyPlanes: Plane[] | null | undefined;
    mocks.report.mockImplementation((progress: { ready?: boolean }) => {
      if (progress.ready) readyPlanes = consumer.clippingPlanes;
    });
    const hook = renderHook(
      ({ clipBounds }) => Geometry({ asset: geometryAsset, scene, clipBounds }),
      { initialProps: { clipBounds: firstBounds } },
    );
    await waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce());
    hook.rerender({ clipBounds: nextBounds });
    await act(async () => resolve({ scene: group }));

    expectDomain(readyPlanes, nextBounds);
    expectDomain(consumer.clippingPlanes, nextBounds);
    expect(material.clippingPlanes).toBeNull();
    expect(mocks.download).toHaveBeenCalledOnce();
    expect(mocks.parse).toHaveBeenCalledOnce();
  });

  it("updates a loaded GLB without redownloading or altering geometry and colors", async () => {
    const { group, geometry, material } = meshFixture();
    const consumer = material.clone();
    vi.spyOn(material, "clone").mockReturnValue(consumer);
    const disposeConsumer = vi.spyOn(consumer, "dispose");
    const positions = geometry.getAttribute("position").array.slice();
    const colors = geometry.getAttribute("color").array.slice();
    const color = material.color.clone();
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeMaterial = vi.spyOn(material, "dispose");
    mocks.parse.mockResolvedValue({ scene: group });
    useWorkspace.getState().set({ wireframe: true });
    const hook = renderHook(
      ({ clipBounds }) => Geometry({ asset: geometryAsset, scene, clipBounds }),
      { initialProps: { clipBounds: firstBounds } },
    );
    await waitFor(() => expectDomain(consumer.clippingPlanes, firstBounds));
    expect(hook.result.current?.props.children.props.object).not.toBe(group);
    hook.rerender({ clipBounds: nextBounds });

    expectDomain(consumer.clippingPlanes, nextBounds);
    expect(hook.result.current?.props.children.props.object).not.toBe(group);
    expect(mocks.download).toHaveBeenCalledOnce();
    expect(mocks.parse).toHaveBeenCalledOnce();
    expect(consumer.wireframe).toBe(true);
    expect(material.wireframe).toBe(false);
    expect(material.color).toEqual(color);
    expect(geometry.getAttribute("position").array).toEqual(positions);
    expect(geometry.getAttribute("color").array).toEqual(colors);
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeMaterial).not.toHaveBeenCalled();
    hook.unmount();
    expect(disposeConsumer).toHaveBeenCalledOnce();
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeMaterial).not.toHaveBeenCalled();
    clearSceneAssetCache();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
  });

  it("updates loaded tiles and late arrivals while retaining one renderer and cleaning listeners", () => {
    const first = meshFixture();
    const second = meshFixture();
    const color = new Color("#247ba0");
    const positions = first.geometry.getAttribute("position").array.slice();
    const hook = renderHook(
      ({ clipBounds }) => CityTiles({ asset: tilesAsset, scene, clipBounds }),
      { initialProps: { clipBounds: firstBounds } },
    );
    const tiles = mocks.tiles[0];
    tiles.loaded.push(first.group);
    act(() => tiles.emit("load-model", first.group));
    expectDomain(first.material.clippingPlanes, firstBounds);
    hook.rerender({ clipBounds: nextBounds });
    expectDomain(first.material.clippingPlanes, nextBounds);
    act(() => useWorkspace.getState().set({ wireframe: true }));
    tiles.loaded.push(second.group);
    act(() => tiles.emit("load-model", second.group));

    expectDomain(second.material.clippingPlanes, nextBounds);
    expect(first.material.wireframe).toBe(true);
    expect(second.material.wireframe).toBe(true);
    expect(first.material.color).toEqual(color);
    expect(second.material.color).toEqual(color);
    expect(first.geometry.getAttribute("position").array).toEqual(positions);
    expect(mocks.tiles).toHaveLength(1);
    expect(tiles.dispose).not.toHaveBeenCalled();
    hook.unmount();
    expect(tiles.dispose).toHaveBeenCalledOnce();
    expect(
      [...tiles.listeners.values()].every((listeners) => !listeners.size),
    ).toBe(true);
  });
});
