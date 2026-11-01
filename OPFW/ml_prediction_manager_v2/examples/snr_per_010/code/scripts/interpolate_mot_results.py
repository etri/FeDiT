
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply ByteTrack-style disconnected track interpolation.")
    parser.add_argument("--input-dir", type=Path, required=True, help="Directory with MOT result txt files.")
    parser.add_argument("--output-dir", type=Path, required=True, help="Directory to write interpolated txt files.")
    parser.add_argument("--n-min", type=int, default=5, help="Minimum track length to interpolate.")
    parser.add_argument("--n-dti", type=int, default=20, help="Maximum gap size to fill.")
    return parser.parse_args()


def load_results(path: Path) -> np.ndarray:
    rows: list[list[float]] = []
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue
            parts = text.split(",")
            if len(parts) < 6:
                continue
            if len(parts) < 10:
                parts = parts + ["-1"] * (10 - len(parts))
            try:
                rows.append([float(part) for part in parts[:10]])
            except ValueError:
                continue
    if not rows:
        return np.zeros((0, 10), dtype=np.float64)
    return np.asarray(rows, dtype=np.float64)


def write_results(path: Path, rows: np.ndarray) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            frame = int(row[0])
            track_id = int(row[1])
            x, y, w, h = row[2:6]
            score = row[6]
            handle.write(f"{frame},{track_id},{x},{y},{w},{h},{score},-1,-1,-1\n")


def interpolate_tracklet(tracklet: np.ndarray, track_id: int, n_min: int, n_dti: int) -> np.ndarray:
    if len(tracklet) == 0 or len(tracklet) <= n_min:
        return tracklet
    frames = tracklet[:, 0]
    synthesized: list[np.ndarray] = []
    for idx in range(1, len(tracklet)):
        left_frame = frames[idx - 1]
        right_frame = frames[idx]
        gap = int(right_frame - left_frame - 1)
        if gap <= 0 or gap >= n_dti:
            continue
        left_bbox = tracklet[idx - 1, 2:6]
        right_bbox = tracklet[idx, 2:6]
        for step in range(1, gap + 1):
            current_frame = left_frame + step
            current_bbox = (current_frame - left_frame) * (right_bbox - left_bbox) / (right_frame - left_frame) + left_bbox
            row = np.zeros(10, dtype=np.float64)
            row[0] = current_frame
            row[1] = track_id
            row[2:6] = current_bbox
            row[6:] = [1, -1, -1, -1]
            synthesized.append(row)
    if not synthesized:
        return tracklet
    return np.vstack([tracklet, np.asarray(synthesized, dtype=np.float64)])


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for txt_path in sorted(args.input_dir.glob("*.txt")):
        seq_data = load_results(txt_path)
        if len(seq_data) == 0:
            write_results(args.output_dir / txt_path.name, seq_data)
            continue
        min_id = int(seq_data[:, 1].min())
        max_id = int(seq_data[:, 1].max())
        chunks: list[np.ndarray] = []
        for track_id in range(min_id, max_id + 1):
            tracklet = seq_data[seq_data[:, 1] == track_id]
            if len(tracklet) == 0:
                continue
            chunks.append(interpolate_tracklet(tracklet, track_id, args.n_min, args.n_dti))
        if chunks:
            merged = np.vstack(chunks)
            merged = merged[np.argsort(merged[:, 0], kind="mergesort")]
        else:
            merged = np.zeros((0, 10), dtype=np.float64)
        write_results(args.output_dir / txt_path.name, merged)


if __name__ == "__main__":
    main()
