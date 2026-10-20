import { BufferAttribute, BufferGeometry } from "three";

export function updateStreamlineRibbon(
  geometry: BufferGeometry,
  segments: Float32Array,
  times: Float32Array,
) {
  if (segments.length % 6 || times.length !== segments.length / 3)
    throw new Error(
      "Particle path positions and times have incompatible shapes.",
    );
  const count = segments.length / 6;
  if (count > 200000)
    throw new Error("Particle path ribbons exceed the 200000-segment limit.");
  if (!segments.every(Number.isFinite) || !times.every(Number.isFinite))
    throw new Error("Particle path positions and times must be finite.");
  for (let segment = 0; segment < count; segment++)
    if (times[segment * 2 + 1] < times[segment * 2])
      throw new Error("Particle path segment times must be ordered.");
  const positions = new Float32Array(count * 18);
  const starts = new Float32Array(count * 18);
  const ends = new Float32Array(count * 18);
  const sides = new Float32Array(count * 6);
  const endpoints = new Float32Array(count * 6);
  const segmentTimes = new Float32Array(count * 12);
  const corner = [0, 1, 2, 2, 1, 3];
  // 실제 입자 선분과 시각을 화면 폭이 일정한 두 삼각형으로 확장
  for (let segment = 0; segment < count; segment++) {
    const source = segment * 6;
    for (let vertex = 0; vertex < 6; vertex++) {
      const target = segment * 6 + vertex;
      const end = corner[vertex] >= 2;
      const side = corner[vertex] % 2 === 0 ? -1 : 1;
      for (let axis = 0; axis < 3; axis++) {
        positions[target * 3 + axis] = segments[source + (end ? 3 : 0) + axis];
        starts[target * 3 + axis] = segments[source + axis];
        ends[target * 3 + axis] = segments[source + 3 + axis];
      }
      sides[target] = side;
      endpoints[target] = end ? 1 : -1;
      segmentTimes[target * 2] = times[segment * 2];
      segmentTimes[target * 2 + 1] = times[segment * 2 + 1];
    }
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("segmentStart", new BufferAttribute(starts, 3));
  geometry.setAttribute("segmentEnd", new BufferAttribute(ends, 3));
  geometry.setAttribute("ribbonSide", new BufferAttribute(sides, 1));
  geometry.setAttribute("ribbonEndpoint", new BufferAttribute(endpoints, 1));
  geometry.setAttribute("segmentTimes", new BufferAttribute(segmentTimes, 2));
}
