import { describe, expect, it } from "vitest";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
} from "three";
import type { Bounds } from "../datasets/types";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { getSceneCrop } from "./sceneExportCrop";

const bounds: Bounds = [
  [-100, -100, -100],
  [100, 100, 100],
];
const options = { bounds, origin: [0, 0, 0] as [number, number, number] };

function cameraFixture() {
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function cityFixture(size: [number, number, number] = [4, 2, 2]) {
  const scene = new Scene(),
    group = new Group(),
    mesh = new Mesh(new BoxGeometry(...size), new MeshBasicMaterial());
  group.userData.sourcePickable = true;
  group.add(mesh);
  scene.add(group);
  return { scene, group, mesh };
}

function clipFixture(): PreparedPlaybackClip {
  return {
    key: "clip",
    range: [0, 1],
    times: [0, 60],
    bytes: 54,
    frames: [0, 60].map((time, index) => ({
      index,
      asset: {
        kind: "volume",
        format: "float32",
        url: "/volume.bin",
        dimensions: [10, 1, 1],
        spacing: [1, 1, 1],
        origin: [-5, 0, 0],
      },
      scene: {
        contextKey: String(time),
        bounds,
        origin: [0, 0, 0],
        time,
        assets: [],
      },
      values: new Float32Array(10),
      mask: new Uint8Array(10).fill(1),
    })),
  };
}

describe("getSceneCrop", () => {
  it("crops the actual city while preserving camera position and projection", () => {
    const { scene } = cityFixture();
    const camera = cameraFixture(),
      position = camera.position.clone(),
      projection = camera.projectionMatrix.clone(),
      quaternion = camera.quaternion.clone();
    expect(getSceneCrop(scene, camera, 1000, 1000, options)).toEqual({
      x: 388,
      y: 438,
      width: 224,
      height: 124,
    });
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(quaternion)).toBe(true);
    expect(camera.projectionMatrix.equals(projection)).toBe(true);
  });

  it("uses the actual viewing angle and clamps a partly offscreen city", () => {
    const { scene, mesh } = cityFixture([8, 2, 2]);
    const camera = cameraFixture();
    const front = getSceneCrop(scene, camera, 1000, 1000, options);
    camera.position.set(20, 0, 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const side = getSceneCrop(scene, camera, 1000, 1000, options);
    expect(side.width).toBeLessThan(front.width);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    mesh.position.x = 9;
    const edge = getSceneCrop(scene, camera, 1000, 1000, options);
    expect(edge.x + edge.width).toBe(1000);
    expect(edge.x).toBeGreaterThan(500);
  });

  it("excludes hidden meshes and unmarked background geometry", () => {
    const { scene, group } = cityFixture();
    const background = new Mesh(new BoxGeometry(1000, 1000, 1));
    scene.add(background);
    const hidden = new Mesh(new BoxGeometry(80, 80, 80));
    hidden.visible = false;
    group.add(hidden);
    expect(
      getSceneCrop(scene, cameraFixture(), 1000, 1000, options).width,
    ).toBe(224);
  });

  it("intersects translated geometry with the dataset domain in local coordinates", () => {
    const { scene, mesh } = cityFixture([100, 100, 2]);
    mesh.position.x = 30;
    const crop = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      bounds: [
        [98, 198, 299],
        [102, 202, 301],
      ],
      origin: [100, 200, 300],
    });
    expect(crop).toEqual({ x: 388, y: 388, width: 224, height: 224 });
  });

  it("handles point geometry under a source-pickable group", () => {
    const scene = new Scene(),
      group = new Group(),
      geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-2, -1, 0, 2, 1, 0]), 3),
    );
    group.userData.sourcePickable = true;
    group.add(new Points(geometry, new PointsMaterial()));
    scene.add(group);
    expect(getSceneCrop(scene, cameraFixture(), 1000, 1000, options)).toEqual({
      x: 388,
      y: 438,
      width: 224,
      height: 124,
    });
  });

  it("keeps the full viewport when the camera is inside or crosses the near plane", () => {
    const { scene } = cityFixture();
    const camera = new PerspectiveCamera(45, 1, 1, 100);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld(true);
    expect(getSceneCrop(scene, camera, 1000, 800, options)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    });
    camera.position.z = 1.5;
    camera.updateMatrixWorld(true);
    expect(getSceneCrop(scene, camera, 1000, 800, options).width).toBe(1000);
  });

  it("retains the viewport when all city content is behind or outside the view", () => {
    const { scene, mesh } = cityFixture();
    mesh.position.x = 50;
    expect(getSceneCrop(scene, cameraFixture(), 1000, 800, options)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    });
    mesh.position.set(0, 0, 30);
    expect(getSceneCrop(scene, cameraFixture(), 1000, 800, options).width).toBe(
      1000,
    );
  });

  it("includes future positive concentration and its trilinear neighbors", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.frames[0].values[5] = 1;
    clip.frames[1].values[9] = 0.001;
    const crop = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
    });
    expect(crop.x).toBeLessThanOrEqual(438);
    expect(crop.x + crop.width).toBeGreaterThanOrEqual(762);
    expect(crop.y).toBeLessThanOrEqual(438);
    expect(crop.y + crop.height).toBeGreaterThanOrEqual(537);
  });

  it("excludes zero, negative and masked concentrations from the crop", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.frames[0].values[0] = -1;
    clip.frames[0].values[5] = 1;
    clip.frames[1].values[9] = 1;
    clip.frames[1].mask[9] = 0;
    const crop = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
    });
    expect(crop.x).toBeGreaterThan(400);
    expect(crop.x + crop.width).toBeLessThan(650);
  });

  it("maps the complete normalized particle path using the volume transform", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.streamlines = {
      kind: "particle-paths",
      positions: new Float32Array([0.5, 0.5, 0.5, 1, 0.5, 0.5]),
      times: new Float32Array([0, 60]),
      particleIds: new Uint32Array([0]),
      source: [0, 0, 0],
      count: 1,
      bytes: 36,
    };
    const crop = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
    });
    expect(crop.x + crop.width).toBeGreaterThanOrEqual(762);
    expect(crop.x).toBeGreaterThan(450);
  });

  it("limits a still image to the exact frame or its two interpolation neighbors", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.times = [0, 30, 60];
    clip.frames.push({
      ...clip.frames[1],
      index: 2,
      values: new Float32Array(10),
    });
    clip.frames[0].values[4] = 1;
    clip.frames[1].values[6] = 1;
    clip.frames[2].values[9] = 1;
    const cropAt = (time: number) =>
      getSceneCrop(scene, cameraFixture(), 1000, 1000, {
        ...options,
        clip,
        time,
      });
    const first = cropAt(0),
      between = cropAt(15),
      exact = cropAt(30),
      final = cropAt(60);
    expect(first.x + first.width).toBeLessThan(600);
    expect(between.x).toBeLessThanOrEqual(first.x);
    expect(between.x + between.width).toBeGreaterThanOrEqual(
      exact.x + exact.width,
    );
    expect(exact.x + exact.width).toBeLessThan(700);
    expect(final.x + final.width).toBeGreaterThanOrEqual(762);
    expect(cropAt(-1)).toEqual(first);
    expect(cropAt(100)).toEqual(final);
    const animation = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
    });
    expect(animation.x).toBeLessThanOrEqual(first.x);
    expect(animation.x + animation.width).toBeGreaterThanOrEqual(
      final.x + final.width,
    );
  });

  it("excludes future paths and crops the current segment at its actual progress", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.streamlines = {
      kind: "particle-paths",
      positions: new Float32Array([
        0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.1, 0.5, 0.5, 0, 0.5, 0.5,
      ]),
      times: new Float32Array([0, 60, 45, 60]),
      particleIds: new Uint32Array([0, 1]),
      source: [0, 0, 0],
      count: 2,
      bytes: 72,
    };
    const cropAt = (time: number) =>
      getSceneCrop(scene, cameraFixture(), 1000, 1000, {
        ...options,
        clip,
        time,
      });
    const first = cropAt(0),
      midway = cropAt(30),
      later = cropAt(50),
      final = cropAt(60);
    expect(first.width).toBe(74);
    expect(midway.x).toBeGreaterThan(450);
    expect(midway.x + midway.width).toBe(637);
    expect(later.x).toBeLessThan(300);
    expect(final.x + final.width).toBeGreaterThanOrEqual(762);
    const animation = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
    });
    expect(animation).toEqual(final);
  });

  it("includes a zero-duration particle segment only once its time is reached", () => {
    const { scene } = cityFixture([1, 1, 1]);
    const clip = clipFixture();
    clip.streamlines = {
      kind: "particle-paths",
      positions: new Float32Array([0.5, 0.5, 0.5, 1, 0.5, 0.5]),
      times: new Float32Array([20, 20]),
      particleIds: new Uint32Array([0]),
      source: [0, 0, 0],
      count: 1,
      bytes: 36,
    };
    const before = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
      time: 19,
    });
    const at = getSceneCrop(scene, cameraFixture(), 1000, 1000, {
      ...options,
      clip,
      time: 20,
    });
    expect(before.width).toBe(74);
    expect(at.x + at.width).toBeGreaterThanOrEqual(762);
  });

  it.each([NaN, Infinity, -Infinity])(
    "rejects an invalid still-image time %s",
    (time) => {
      expect(() =>
        getSceneCrop(new Scene(), cameraFixture(), 1000, 1000, {
          ...options,
          time,
        }),
      ).toThrow("Export time must be finite.");
    },
  );

  it.each([0, -1, NaN, Infinity, 1.5])(
    "rejects invalid export size %s",
    (value) => {
      expect(() =>
        getSceneCrop(new Scene(), cameraFixture(), value, 1000, options),
      ).toThrow("Export dimensions must be positive integers.");
      expect(() =>
        getSceneCrop(new Scene(), cameraFixture(), 1000, value, options),
      ).toThrow("Export dimensions must be positive integers.");
    },
  );

  it("provides a domain fallback without mutating source bounds", () => {
    const smallBounds: Bounds = [
      [-2, -1, -1],
      [2, 1, 1],
    ];
    const original = structuredClone(smallBounds);
    const crop = getSceneCrop(new Scene(), cameraFixture(), 1000, 1000, {
      bounds: smallBounds,
      origin: [0, 0, 0],
    });
    expect(crop.width).toBe(224);
    expect(smallBounds).toEqual(original);
  });
});
