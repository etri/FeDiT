import { BufferGeometry, Material, Mesh, Object3D, Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { boundedAsset } from "./decode";
import type { PointBuffers, Scene, SceneAsset } from "./types";

const CACHE_BUDGET = 128 * 1024 * 1024;
type Progress = (received: number, total?: number) => void;
interface Resource {
  bytes: number;
  refs: number;
  retained: boolean;
  dispose: () => void;
  scene?: Object3D;
  points?: PointBuffers;
}
interface Pending {
  controller: AbortController;
  subscribers: Set<(value?: Resource, error?: unknown) => void>;
}
const cache = new Map<string, Resource>();
const pending = new Map<string, Pending>();
let cacheBytes = 0;

function aborted() {
  return new DOMException("Scene asset loading aborted", "AbortError");
}
function release(resource: Resource) {
  resource.refs--;
  if (!resource.refs && !resource.retained) resource.dispose();
}
function trimCache() {
  for (const [key, resource] of cache) {
    if (cacheBytes <= CACHE_BUDGET) break;
    cache.delete(key);
    cacheBytes -= resource.bytes;
    resource.retained = false;
    if (!resource.refs) resource.dispose();
  }
}

// 사용 중인 자원은 마지막 소비자가 반환한 뒤 정리
export function clearSceneAssetCache() {
  for (const operation of pending.values()) {
    operation.controller.abort();
    operation.subscribers.forEach((receive) => receive(undefined, aborted()));
    operation.subscribers.clear();
  }
  pending.clear();
  for (const resource of cache.values()) {
    resource.retained = false;
    if (!resource.refs) resource.dispose();
  }
  cache.clear();
  cacheBytes = 0;
}
function acquire(
  key: string,
  signal: AbortSignal,
  load: (signal: AbortSignal) => Promise<Resource>,
): Promise<Resource> {
  if (signal.aborted) return Promise.reject(aborted());
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    cached.refs++;
    return Promise.resolve(cached);
  }
  let operation = pending.get(key);
  if (!operation) {
    operation = { controller: new AbortController(), subscribers: new Set() };
    pending.set(key, operation);
    const current = operation;
    void load(current.controller.signal).then(
      (resource) => {
        if (current.controller.signal.aborted || pending.get(key) !== current) {
          resource.dispose();
          current.subscribers.forEach((receive) =>
            receive(undefined, aborted()),
          );
          return;
        }
        pending.delete(key);
        resource.refs = current.subscribers.size;
        resource.retained = resource.bytes <= CACHE_BUDGET;
        if (resource.retained) {
          cache.set(key, resource);
          cacheBytes += resource.bytes;
        }
        current.subscribers.forEach((receive) => receive(resource));
        if (!resource.refs && !resource.retained) resource.dispose();
        trimCache();
      },
      (error) => {
        if (pending.get(key) === current) pending.delete(key);
        current.subscribers.forEach((receive) => receive(undefined, error));
      },
    );
  }
  const current = operation;
  return new Promise((resolve, reject) => {
    const stop = () => {
      current.subscribers.delete(receive);
      if (!current.subscribers.size) {
        current.controller.abort();
        if (pending.get(key) === current) pending.delete(key);
      }
      reject(aborted());
    };
    const receive = (resource?: Resource, error?: unknown) => {
      signal.removeEventListener("abort", stop);
      if (resource) resolve(resource);
      else reject(error);
    };
    current.subscribers.add(receive);
    signal.addEventListener("abort", stop, { once: true });
  });
}

function geometryResource(scene: Object3D, bytes: number): Resource {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value);
    }
  });
  const arrays = new Set<ArrayBufferLike>();
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes))
      arrays.add(attribute.array.buffer);
    if (geometry.index) arrays.add(geometry.index.array.buffer);
  }
  for (const array of arrays) bytes += array.byteLength;
  for (const texture of textures) {
    const image = texture.image as
      { width?: number; height?: number } | undefined;
    bytes += (image?.width ?? 0) * (image?.height ?? 0) * 4;
  }
  return {
    scene,
    bytes,
    refs: 0,
    retained: false,
    dispose: () => {
      geometries.forEach((value) => value.dispose());
      materials.forEach((value) => value.dispose());
      textures.forEach((value) => value.dispose());
    },
  };
}

// 객체와 재질만 복제하여 화면별 설정과 공유 자원 수명을 분리
export async function acquireGeometryAsset(
  asset: Pick<SceneAsset, "url">,
  signal: AbortSignal,
  progress?: Progress,
) {
  const resource = await acquire(
    `geometry:${asset.url}`,
    signal,
    async (loadingSignal) => {
      const buffer = await boundedAsset(
        asset.url,
        loadingSignal,
        256 * 1024 * 1024,
        progress,
      );
      const parsed = await new GLTFLoader().parseAsync(buffer, "");
      return geometryResource(parsed.scene, buffer.byteLength);
    },
  );
  if (signal.aborted) {
    release(resource);
    throw aborted();
  }
  const scene = clone(resource.scene!);
  const materials = new Set<Material>();
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const duplicate = (material: Material) => {
      const result = material.clone();
      materials.add(result);
      return result;
    };
    node.material = Array.isArray(node.material)
      ? node.material.map(duplicate)
      : duplicate(node.material);
  });
  let released = false;
  return {
    scene,
    release: () => {
      if (released) return;
      released = true;
      materials.forEach((material) => material.dispose());
      release(resource);
      trimCache();
    },
  };
}
function decodePointAsset(
  buffer: ArrayBuffer,
  range: [number, number],
  signal: AbortSignal,
) {
  return new Promise<PointBuffers>((resolve, reject) => {
    if (signal.aborted) {
      reject(aborted());
      return;
    }
    const worker = new Worker(new URL("./scene.worker.ts", import.meta.url), {
      type: "module",
    });
    const finish = () => {
      signal.removeEventListener("abort", stop);
      worker.terminate();
    };
    const stop = () => {
      finish();
      reject(aborted());
    };
    signal.addEventListener("abort", stop, { once: true });
    worker.onmessage = (
      event: MessageEvent<PointBuffers & { error?: string }>,
    ) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = () => {
      finish();
      reject(new Error("Scene decode failed"));
    };
    try {
      worker.postMessage({ contextKey: "asset-cache", buffer, range }, [
        buffer,
      ]);
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
export async function acquirePointAsset(
  asset: Pick<SceneAsset, "url">,
  range: [number, number],
  signal: AbortSignal,
  progress?: Progress,
) {
  const resource = await acquire(
    `points:${asset.url}:${range.join(":")}`,
    signal,
    async (loadingSignal) => {
      const buffer = await boundedAsset(
        asset.url,
        loadingSignal,
        undefined,
        progress,
      );
      const points = await decodePointAsset(buffer, range, loadingSignal);
      return {
        points,
        bytes:
          points.positions.byteLength +
          points.colors.byteLength +
          points.values.byteLength,
        refs: 0,
        retained: false,
        dispose: () => {},
      };
    },
  );
  if (signal.aborted) {
    release(resource);
    throw aborted();
  }
  let released = false;
  return {
    data: resource.points!,
    release: () => {
      if (released) return;
      released = true;
      release(resource);
      trimCache();
    },
  };
}
export async function preloadSceneAssets(
  scene: Scene,
  signal: AbortSignal,
): Promise<void> {
  await Promise.all(
    scene.assets.map(async (asset) => {
      if (asset.kind === "geometry" && scene.field) {
        const lease = await acquireGeometryAsset(asset, signal);
        lease.release();
      } else if (asset.kind === "points") {
        const lease = await acquirePointAsset(
          asset,
          scene.range ?? [0, 1],
          signal,
        );
        lease.release();
      }
    }),
  );
}
