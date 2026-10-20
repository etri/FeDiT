import { describe, expect, it, vi } from "vitest";
import {
  BoxGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  Texture,
  Vector3,
} from "three";
import type { Intersection } from "three";
import type { Bounds } from "../datasets/types";
import {
  applyGeometryClipping,
  domainClippingPlanes,
  visibleGeometryIntersection,
} from "./clipping";

function intersection(
  mesh: Mesh,
  position: [number, number, number],
  materialIndex = 0,
): Intersection {
  return {
    distance: 1,
    object: mesh,
    point: new Vector3(...position),
    face: { a: 0, b: 1, c: 2, normal: new Vector3(0, 0, 1), materialIndex },
  };
}

describe("domain clipping", () => {
  it("keeps geometry unrestricted when calculation bounds are unavailable", () => {
    expect(domainClippingPlanes(undefined, [1000, 2000, 30])).toBeNull();
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const version = mesh.material.version;
    applyGeometryClipping(mesh, null);
    expect(mesh.material.clippingPlanes).toBeNull();
    expect(mesh.material.version).toBe(version);
    expect(
      visibleGeometryIntersection(intersection(mesh, [100, -50, 900])),
    ).toBe(true);
  });

  it("rebases all six inward planes and rejects protrusions at every domain face", () => {
    const bounds: Bounds = [
      [1002, 2004, 36],
      [1010, 2020, 60],
    ];
    const origin: [number, number, number] = [1000, 2000, 30];
    const before = JSON.stringify({ bounds, origin });
    const planes = domainClippingPlanes(bounds, origin)!;
    expect(planes.map((plane) => plane.normal.toArray())).toEqual([
      [1, 0, 0],
      [-1, -0, -0],
      [0, 1, 0],
      [-0, -1, -0],
      [0, 0, 1],
      [-0, -0, -1],
    ]);
    const tolerance = 24e-6;
    [-2, 10, -4, 20, -6, 30].forEach((constant, index) =>
      expect(planes[index].constant).toBeCloseTo(constant + tolerance, 12),
    );
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    applyGeometryClipping(mesh, planes);
    expect(visibleGeometryIntersection(intersection(mesh, [6, 12, 18]))).toBe(
      true,
    );
    for (const point of [
      [1, 12, 18],
      [11, 12, 18],
      [6, 3, 18],
      [6, 21, 18],
      [6, 12, 5],
      [6, 12, 31],
    ] as [number, number, number][])
      expect(visibleGeometryIntersection(intersection(mesh, point))).toBe(
        false,
      );
    expect(JSON.stringify({ bounds, origin })).toBe(before);
  });

  it("preserves Float32 boundary points without accepting meaningful exterior geometry", () => {
    const bounds: Bounds = [
      [1000000.123456, 2000000.234567, 0.345678],
      [1000130.123456, 2000116.234567, 104.345678],
    ];
    const origin: [number, number, number] = [1000050, 2000050, 50];
    const planes = domainClippingPlanes(bounds, origin)!;
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    applyGeometryClipping(mesh, planes);
    for (const corner of bounds) {
      const point = corner.map((value, axis) =>
        Math.fround(value - origin[axis]),
      ) as [number, number, number];
      expect(visibleGeometryIntersection(intersection(mesh, point))).toBe(true);
    }
    const outside = bounds[0].map((value, axis) => value - origin[axis]) as [
      number,
      number,
      number,
    ];
    outside[0] -= 0.001;
    expect(visibleGeometryIntersection(intersection(mesh, outside))).toBe(
      false,
    );
    const flat = domainClippingPlanes(
      [
        [0, 0, 0],
        [0, 0, 0],
      ],
      [0, 0, 0],
    )!;
    expect(flat.every((plane) => plane.constant === 1e-9)).toBe(true);
  });

  it("clips every mesh material while preserving raw geometry, textures and non-mesh helpers", () => {
    const root = new Group();
    const geometry = new BoxGeometry();
    const texture = new Texture();
    const textured = new MeshStandardMaterial({ map: texture });
    const plain = new MeshBasicMaterial();
    const helper = new LineBasicMaterial();
    const first = new Mesh(geometry, [textured, plain]);
    const second = new Mesh(geometry, textured);
    root.add(first, second, new LineSegments(geometry, helper));
    const positions = geometry.attributes.position.array;
    const indices = geometry.index!.array;
    const positionsBefore = [...positions];
    const indicesBefore = [...indices];
    const textureVersion = texture.version;
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const textureDispose = vi.spyOn(texture, "dispose");
    const planes = domainClippingPlanes(
      [
        [0, 0, 0],
        [1, 1, 1],
      ],
      [0, 0, 0],
    )!;
    applyGeometryClipping(root, planes);
    for (const material of [textured, plain]) {
      expect(material.clippingPlanes).toBe(planes);
      expect(material.clipIntersection).toBe(false);
      expect(material.clipShadows).toBe(true);
      expect(material.version).toBe(1);
    }
    expect(helper.clippingPlanes).toBeNull();
    expect(helper.version).toBe(0);
    expect(first.geometry).toBe(geometry);
    expect(geometry.attributes.position.array).toBe(positions);
    expect(geometry.index!.array).toBe(indices);
    expect([...positions]).toEqual(positionsBefore);
    expect([...indices]).toEqual(indicesBefore);
    expect(textured.map).toBe(texture);
    expect(texture.version).toBe(textureVersion);
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(textureDispose).not.toHaveBeenCalled();
  });

  it("updates material versions only when clipping changes and clears old planes", () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const planes = [new Plane(new Vector3(1, 0, 0), 1)];
    applyGeometryClipping(mesh, planes);
    const initial = mesh.material.version;
    applyGeometryClipping(mesh, planes);
    applyGeometryClipping(
      mesh,
      planes.map((plane) => plane.clone()),
    );
    expect(mesh.material.version).toBe(initial);
    const changed = [new Plane(new Vector3(1, 0, 0), 2)];
    applyGeometryClipping(mesh, changed);
    expect(mesh.material.version).toBe(initial + 1);
    applyGeometryClipping(mesh, null);
    expect(mesh.material.clippingPlanes).toBeNull();
    expect(mesh.material.version).toBe(initial + 2);
    applyGeometryClipping(mesh, null);
    expect(mesh.material.version).toBe(initial + 2);
  });

  it("matches union and intersection clipping for CPU ray hits", () => {
    const material = new MeshBasicMaterial();
    material.clippingPlanes = [
      new Plane(new Vector3(1, 0, 0), 0),
      new Plane(new Vector3(0, 1, 0), 0),
    ];
    const mesh = new Mesh(new BoxGeometry(), material);
    expect(visibleGeometryIntersection(intersection(mesh, [-1, 1, 0]))).toBe(
      false,
    );
    expect(visibleGeometryIntersection(intersection(mesh, [0, 0, 0]))).toBe(
      true,
    );
    material.clipIntersection = true;
    expect(visibleGeometryIntersection(intersection(mesh, [-1, 1, 0]))).toBe(
      true,
    );
    expect(visibleGeometryIntersection(intersection(mesh, [-1, -1, 0]))).toBe(
      false,
    );
  });

  it("uses the hit face material and skips hidden materials and ancestors", () => {
    const clipped = new MeshBasicMaterial();
    clipped.clippingPlanes = [new Plane(new Vector3(1, 0, 0), 0)];
    const clear = new MeshBasicMaterial();
    const mesh = new Mesh(new BoxGeometry(), [clipped, clear]);
    expect(visibleGeometryIntersection(intersection(mesh, [-1, 0, 0], 0))).toBe(
      false,
    );
    expect(visibleGeometryIntersection(intersection(mesh, [-1, 0, 0], 1))).toBe(
      true,
    );
    clear.visible = false;
    expect(visibleGeometryIntersection(intersection(mesh, [-1, 0, 0], 1))).toBe(
      false,
    );
    clear.visible = true;
    const parent = new Group();
    parent.add(mesh);
    parent.visible = false;
    expect(visibleGeometryIntersection(intersection(mesh, [1, 1, 1], 1))).toBe(
      false,
    );
  });
});
