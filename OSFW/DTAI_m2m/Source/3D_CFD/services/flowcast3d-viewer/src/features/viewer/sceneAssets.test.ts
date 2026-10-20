import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { decodePoints } from "./decode";
import {
  acquireGeometryAsset,
  acquirePointAsset,
  clearSceneAssetCache,
  preloadSceneAssets,
} from "./sceneAssets";
import type { PointBuffers, Scene, SceneAsset } from "./types";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  parse: vi.fn(),
  workers: vi.fn(),
}));
vi.mock("./decode", async (original) => ({
  ...(await original<typeof import("./decode")>()),
  boundedAsset: mocks.download,
}));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    parseAsync = mocks.parse;
  },
}));
const asset: SceneAsset = {
  kind: "geometry",
  format: "glb",
  url: "/app-api/assets/prediction.glb",
};
const pointAsset: SceneAsset = {
  kind: "points",
  format: "float32",
  url: "/app-api/assets/points.bin",
};
const signal = () => new AbortController().signal;
function fixture(imageSize = 0) {
  const geometry = new BoxGeometry();
  const texture = new Texture(
    imageSize
      ? ({ width: imageSize, height: imageSize } as HTMLImageElement)
      : undefined,
  );
  const material = new MeshStandardMaterial({ map: texture });
  const mesh = new Mesh(geometry, material);
  const scene = new Group();
  scene.add(mesh);
  return { scene, geometry, material, texture };
}
beforeEach(() => {
  clearSceneAssetCache();
  vi.clearAllMocks();
  mocks.download.mockResolvedValue(new ArrayBuffer(0));
  mocks.parse.mockImplementation(async () => fixture());
  vi.stubGlobal(
    "Worker",
    class {
      onmessage?: (event: MessageEvent<PointBuffers>) => void;
      onerror?: () => void;
      terminate = vi.fn();
      constructor() {
        mocks.workers();
      }
      postMessage(
        message: { buffer: ArrayBuffer; range: [number, number] },
        transfer: Transferable[],
      ) {
        const transferred = structuredClone(message, { transfer });
        const data = decodePoints(transferred.buffer, transferred.range);
        queueMicrotask(() =>
          this.onmessage?.({ data } as MessageEvent<PointBuffers>),
        );
      }
    },
  );
});
afterEach(() => {
  clearSceneAssetCache();
  vi.unstubAllGlobals();
});

describe("prepared scene assets", () => {
  it("reuses parsed GLB while keeping consumer materials and cleanup independent", async () => {
    const source = fixture();
    mocks.parse.mockResolvedValue(source);
    const geometryDispose = vi.spyOn(source.geometry, "dispose");
    const textureDispose = vi.spyOn(source.texture, "dispose");
    await preloadSceneAssets(
      { assets: [asset], field: { id: "speed" } } as Scene,
      signal(),
    );
    const first = await acquireGeometryAsset(asset, signal());
    const second = await acquireGeometryAsset(asset, signal());
    const firstMesh = first.scene.children[0] as Mesh;
    const secondMesh = second.scene.children[0] as Mesh;
    const firstMaterial = firstMesh.material as MeshStandardMaterial;
    const secondMaterial = secondMesh.material as MeshStandardMaterial;
    firstMaterial.wireframe = true;
    firstMaterial.clippingPlanes = [];
    expect(secondMaterial.wireframe).toBe(false);
    expect(source.material.wireframe).toBe(false);
    expect(source.material.clippingPlanes).toBeNull();
    expect(first.scene).not.toBe(second.scene);
    expect(firstMesh.geometry).toBe(secondMesh.geometry);
    expect(mocks.download).toHaveBeenCalledOnce();
    expect(mocks.parse).toHaveBeenCalledOnce();
    clearSceneAssetCache();
    first.release();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(textureDispose).not.toHaveBeenCalled();
    second.release();
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(textureDispose).toHaveBeenCalledOnce();
    second.release();
    expect(geometryDispose).toHaveBeenCalledOnce();
  });

  it("leaves original city geometry to the existing renderer", async () => {
    await preloadSceneAssets({ assets: [asset] } as Scene, signal());
    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.parse).not.toHaveBeenCalled();
  });

  it("shares concurrent loads and keeps the surviving subscriber after an abort", async () => {
    let complete!: (value: ReturnType<typeof fixture>) => void;
    mocks.parse.mockReturnValue(
      new Promise<ReturnType<typeof fixture>>((resolve) => {
        complete = resolve;
      }),
    );
    const canceled = new AbortController();
    const first = acquireGeometryAsset(asset, canceled.signal);
    const rejected = expect(first).rejects.toMatchObject({
      name: "AbortError",
    });
    const second = acquireGeometryAsset(asset, signal());
    await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce());
    canceled.abort();
    complete(fixture());
    await rejected;
    const lease = await second;
    lease.release();
    expect(mocks.download).toHaveBeenCalledOnce();
  });

  it("disposes a late aborted parse and never caches a failed load", async () => {
    let complete!: (value: ReturnType<typeof fixture>) => void;
    mocks.parse.mockReturnValueOnce(
      new Promise<ReturnType<typeof fixture>>((resolve) => {
        complete = resolve;
      }),
    );
    const source = fixture();
    const dispose = vi.spyOn(source.geometry, "dispose");
    const canceled = new AbortController();
    const request = acquireGeometryAsset(asset, canceled.signal);
    const rejected = expect(request).rejects.toMatchObject({
      name: "AbortError",
    });
    await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce());
    canceled.abort();
    complete(source);
    await rejected;
    await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
    mocks.parse.mockRejectedValueOnce(new Error("Invalid GLB"));
    await expect(acquireGeometryAsset(asset, signal())).rejects.toThrow(
      "Invalid GLB",
    );
    const valid = await acquireGeometryAsset(asset, signal());
    valid.release();
    expect(mocks.download).toHaveBeenCalledTimes(3);
  });

  it("evicts least recently used geometry within the 128 MiB retained budget", async () => {
    const sources: ReturnType<typeof fixture>[] = [];
    mocks.parse.mockImplementation(async () => {
      const source = fixture(3000);
      sources.push(source);
      return source;
    });
    for (let index = 0; index < 3; index++) {
      const lease = await acquireGeometryAsset(
        { ...asset, url: `${asset.url}?${index}` },
        signal(),
      );
      lease.release();
    }
    const oldestDispose = vi.spyOn(sources[0].geometry, "dispose");
    const recent = await acquireGeometryAsset(
      { ...asset, url: `${asset.url}?1` },
      signal(),
    );
    recent.release();
    const fourth = await acquireGeometryAsset(
      { ...asset, url: `${asset.url}?3` },
      signal(),
    );
    fourth.release();
    expect(oldestDispose).toHaveBeenCalledOnce();
    const retained = await acquireGeometryAsset(
      { ...asset, url: `${asset.url}?1` },
      signal(),
    );
    retained.release();
    expect(mocks.download).toHaveBeenCalledTimes(4);
    const reload = await acquireGeometryAsset(
      { ...asset, url: `${asset.url}?0` },
      signal(),
    );
    reload.release();
    expect(mocks.download).toHaveBeenCalledTimes(5);
  });

  it("reuses decoded points after transferred bytes and skips tile and volume assets", async () => {
    const input = new Float32Array([1, 2, 3, 4]).buffer;
    mocks.download.mockResolvedValue(input);
    await preloadSceneAssets(
      {
        range: [0, 10],
        assets: [pointAsset, { kind: "tiles" }, { kind: "volume" }],
      } as Scene,
      signal(),
    );
    expect(input.byteLength).toBe(0);
    const first = await acquirePointAsset(pointAsset, [0, 10], signal());
    const second = await acquirePointAsset(pointAsset, [0, 10], signal());
    expect([...first.data.positions]).toEqual([1, 2, 3]);
    expect([...first.data.values]).toEqual([4]);
    expect(second.data).toBe(first.data);
    expect(mocks.download).toHaveBeenCalledOnce();
    expect(mocks.workers).toHaveBeenCalledOnce();
    first.release();
    second.release();
  });
});
