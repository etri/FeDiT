import { Box3, Matrix4, Mesh, Points, Vector3, Vector4 } from "three";
import type { Camera, Object3D, Scene } from "three";
import type { Bounds } from "../datasets/types";
import type { PreparedPlaybackClip } from "./preparedPlayback";

export interface SceneCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOptions {
  bounds: Bounds;
  origin: [number, number, number];
  clip?: PreparedPlaybackClip;
  time?: number;
}

function pickable(object: Object3D) {
  let parent: Object3D | null = object;
  while (parent) {
    if (parent.userData.sourcePickable === true) return true;
    parent = parent.parent;
  }
  return false;
}

function finiteBox(box: Box3) {
  return (
    !box.isEmpty() &&
    [...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)
  );
}

function playbackFrames(clip: PreparedPlaybackClip, time?: number) {
  if (
    time === undefined ||
    !clip.frames.length ||
    clip.times.length !== clip.frames.length
  )
    return clip.frames;
  let lower = 0;
  while (lower + 1 < clip.times.length && clip.times[lower + 1] <= time)
    lower++;
  if (
    time <= clip.times[0] ||
    lower === clip.frames.length - 1 ||
    time === clip.times[lower]
  )
    return [clip.frames[lower]];
  return clip.frames.slice(lower, lower + 2);
}

function playbackBoxes(clip: PreparedPlaybackClip, time?: number) {
  const boxes: Box3[] = [];
  // 정지 화면은 현재 보간 시점만 사용하고 동영상은 모든 시점을 포함
  for (const frame of playbackFrames(clip, time)) {
    const dimensions = frame.asset.dimensions,
      spacing = frame.asset.spacing,
      origin = frame.asset.origin ?? frame.scene.origin;
    if (
      !dimensions ||
      !spacing ||
      dimensions.some((value) => !Number.isSafeInteger(value) || value <= 0) ||
      spacing.some((value) => !Number.isFinite(value) || value <= 0) ||
      !origin.every(Number.isFinite)
    )
      continue;
    const [nx, ny, nz] = dimensions;
    const count = nx * ny * nz;
    if (frame.values.length !== count || frame.mask.length !== count) continue;
    const low = [nx, ny, nz],
      high = [-1, -1, -1];
    for (let index = 0; index < count; index++) {
      if (!(
        frame.mask[index] > 0 &&
        Number.isFinite(frame.values[index]) &&
        frame.values[index] > 0
      ))
        continue;
      const z = Math.floor(index / (nx * ny)),
        y = Math.floor(index / nx) % ny,
        x = index % nx;
      low[0] = Math.min(low[0], x);
      low[1] = Math.min(low[1], y);
      low[2] = Math.min(low[2], z);
      high[0] = Math.max(high[0], x);
      high[1] = Math.max(high[1], y);
      high[2] = Math.max(high[2], z);
    }
    if (high[0] < 0) continue;
    const box = new Box3(
      new Vector3().fromArray(
        low.map(
          (value, axis) =>
            origin[axis] + Math.max(0, value - 1) * spacing[axis],
        ),
      ),
      new Vector3().fromArray(
        high.map(
          (value, axis) =>
            origin[axis] +
            Math.min(dimensions[axis], value + 2) * spacing[axis],
        ),
      ),
    );
    if (finiteBox(box)) boxes.push(box);
  }

  // 정규화된 입자 경로를 실제 볼륨과 같은 장면 좌표로 변환
  const first = clip.frames[0],
    positions = clip.streamlines?.positions,
    dimensions = first?.asset.dimensions,
    spacing = first?.asset.spacing,
    origin = first?.asset.origin ?? first?.scene.origin;
  if (positions?.length && dimensions && spacing && origin) {
    const box = new Box3(),
      point = new Vector3();
    const times = clip.streamlines!.times;
    for (let index = 0; index + 5 < positions.length; index += 6) {
      let fraction = 1;
      // 아직 시작하지 않은 경로를 제외하고 진행 중인 선분 끝만 보간
      if (time !== undefined && times.length === positions.length / 3) {
        const start = times[index / 3],
          end = times[index / 3 + 1],
          duration = end - start;
        if (duration > 0 ? time <= start : time < end) continue;
        if (duration > 0)
          fraction = Math.max(0, Math.min(1, (time - start) / duration));
      }
      for (const endpoint of [0, fraction]) {
        point.set(
          ...([0, 1, 2].map(
            (axis) =>
              origin[axis] +
              (positions[index + axis] +
                (positions[index + axis + 3] - positions[index + axis]) *
                  endpoint) *
                dimensions[axis] *
                spacing[axis],
          ) as [number, number, number]),
        );
        if (point.toArray().every(Number.isFinite)) box.expandByPoint(point);
      }
    }
    if (finiteBox(box)) boxes.push(box);
  }
  return boxes;
}

/** 현재 시점의 도시와 선택한 확산 범위를 포함하는 화면 자르기 영역 계산 */
export function getSceneCrop(
  scene: Scene,
  camera: Camera,
  width: number,
  height: number,
  options: CropOptions,
): SceneCrop {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("Export dimensions must be positive integers.");
  if (options.time !== undefined && !Number.isFinite(options.time))
    throw new Error("Export time must be finite.");
  const full = { x: 0, y: 0, width, height };
  const domain = new Box3(
    new Vector3(...options.bounds[0]).sub(new Vector3(...options.origin)),
    new Vector3(...options.bounds[1]).sub(new Vector3(...options.origin)),
  );
  if (!finiteBox(domain)) return full;
  const boxes: Box3[] = [];
  scene.updateMatrixWorld(true);
  // 배경 격자와 화면 도구를 제외하고 실제로 표시되는 도시 메시만 수집
  scene.traverseVisible((object) => {
    if (
      !(object instanceof Mesh || object instanceof Points) ||
      !pickable(object)
    )
      return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    if (!materials.some((material) => material.visible && material.opacity > 0))
      return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox
      ?.clone()
      .applyMatrix4(object.matrixWorld)
      .intersect(domain);
    if (box && finiteBox(box)) boxes.push(box);
  });
  if (options.clip) boxes.push(...playbackBoxes(options.clip, options.time));
  if (!boxes.length) boxes.push(domain);

  const viewProjection = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const cameraPosition = new Vector3().setFromMatrixPosition(
    camera.matrixWorld,
  );
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  // 카메라나 근평면을 가로지르는 상자는 화면 전체를 유지하여 잘림 방지
  for (const box of boxes) {
    if (box.containsPoint(cameraPosition)) return full;
    const corners = Array.from({ length: 8 }, (_, index) =>
      new Vector4(
        index & 1 ? box.max.x : box.min.x,
        index & 2 ? box.max.y : box.min.y,
        index & 4 ? box.max.z : box.min.z,
        1,
      ).applyMatrix4(viewProjection),
    );
    if (corners.some((point) => !point.toArray().every(Number.isFinite)))
      return full;
    if (
      corners.every((point) => point.x < -point.w) ||
      corners.every((point) => point.x > point.w) ||
      corners.every((point) => point.y < -point.w) ||
      corners.every((point) => point.y > point.w) ||
      corners.every((point) => point.z < -point.w) ||
      corners.every((point) => point.z > point.w)
    )
      continue;
    if (corners.some((point) => point.w <= 1e-8 || point.z <= -point.w + 1e-8))
      return full;
    for (const point of corners) {
      const x = ((point.x / point.w + 1) * width) / 2,
        y = ((1 - point.y / point.w) * height) / 2;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return full;
  const padding = Math.max(12, Math.max(maxX - minX, maxY - minY) * 0.03);
  const x = Math.max(0, Math.floor(minX - padding)),
    y = Math.max(0, Math.floor(minY - padding)),
    right = Math.min(width, Math.ceil(maxX + padding)),
    bottom = Math.min(height, Math.ceil(maxY + padding));
  return right > x && bottom > y
    ? { x, y, width: right - x, height: bottom - y }
    : full;
}
