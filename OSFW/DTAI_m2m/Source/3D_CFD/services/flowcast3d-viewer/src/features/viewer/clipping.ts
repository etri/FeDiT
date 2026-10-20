import { Mesh, Plane, Vector3 } from "three";
import type { Intersection, Object3D } from "three";
import type { Bounds } from "../datasets/types";

/** 계산영역을 장면 원점 기준의 안쪽 클리핑 평면으로 변환 */
export function domainClippingPlanes(
  bounds: Bounds | undefined,
  origin: [number, number, number],
): Plane[] | null {
  if (!bounds) return null;

  // Float32 경계 좌표의 반올림으로 표면이 사라지지 않도록 미세한 여유 적용
  const span = Math.max(
    ...bounds[1].map((value, axis) => value - bounds[0][axis]),
  );
  const tolerance = Math.max(span * 1e-6, 1e-9);
  return [0, 1, 2].flatMap((axis) => {
    const normal = new Vector3().setComponent(axis, 1);
    return [
      new Plane(normal, -(bounds[0][axis] - origin[axis]) + tolerance),
      new Plane(
        normal.clone().negate(),
        bounds[1][axis] - origin[axis] + tolerance,
      ),
    ];
  });
}

function samePlanes(current: Plane[] | null, next: Plane[] | null) {
  return (
    current === next ||
    ((current?.length ?? 0) === (next?.length ?? 0) &&
      (current ?? []).every(
        (plane, index) =>
          plane.constant === next![index].constant &&
          plane.normal.equals(next![index].normal),
      ))
  );
}

/** 원본 정점과 텍스처를 유지하며 메시 재질에 표시 경계 적용 */
export function applyGeometryClipping(
  root: Object3D,
  planes: Plane[] | null,
): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      const changed =
        !samePlanes(material.clippingPlanes, planes) ||
        (Boolean(planes?.length) &&
          (material.clipIntersection || !material.clipShadows));
      material.clippingPlanes = planes;
      material.clipIntersection = false;
      material.clipShadows = true;
      if (changed) material.needsUpdate = true;
    }
  });
}

/** GPU에서 남는 재질과 평면 영역에 해당하는 교차점만 허용 */
export function visibleGeometryIntersection(hit: Intersection): boolean {
  if (!(hit.object instanceof Mesh)) return false;
  let object: Object3D | null = hit.object;
  while (object) {
    if (!object.visible) return false;
    object = object.parent;
  }

  const material = Array.isArray(hit.object.material)
    ? hit.object.material[hit.face?.materialIndex ?? 0]
    : hit.object.material;
  if (!material?.visible) return false;
  const planes: Plane[] | null = material.clippingPlanes;
  if (!planes?.length) return true;
  const inside = (plane: Plane) => plane.distanceToPoint(hit.point) >= 0;
  return material.clipIntersection ? planes.some(inside) : planes.every(inside);
}
