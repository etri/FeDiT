import type { PreparedPlaybackClip } from "./preparedPlayback";

type Levels = [number, number, number, number];
const levelsByClip = new WeakMap<PreparedPlaybackClip, Levels>();
const SAMPLE_LIMIT = 65_536;

export function getContourLevels(clip: PreparedPlaybackClip): Levels {
  const cached = levelsByClip.get(clip);
  if (cached) return cached;
  const count = clip.frames.reduce(
    (total, frame) => total + frame.values.length,
    0,
  );
  const stride = Math.max(1, Math.ceil(count / SAMPLE_LIMIT));
  const values: number[] = [];
  let offset = 0;
  // 전체 재생 구간의 유효 양수 농도 분포를 한 번만 표본 추출
  for (const frame of clip.frames) {
    for (
      let index = (stride - (offset % stride)) % stride;
      index < frame.values.length;
      index += stride
    ) {
      const value = frame.values[index];
      if (frame.mask[index] && Number.isFinite(value) && value > 0)
        values.push(value);
    }
    offset += frame.values.length;
  }
  values.sort((a, b) => a - b);
  const levels = (
    values.length
      ? [0.2, 0.5, 0.8, 0.95].map(
          (quantile) => values[Math.floor((values.length - 1) * quantile)],
        )
      : [0.03, 0.1, 0.3, 0.6].map(
          (fraction) =>
            Math.max(0, clip.range[0]) +
            fraction * (clip.range[1] - Math.max(0, clip.range[0])),
        )
  ) as Levels;
  levelsByClip.set(clip, levels);
  return levels;
}
