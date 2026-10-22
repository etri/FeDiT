
from __future__ import annotations

import argparse
import shutil
from collections import defaultdict
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences, read_mot_rows, validate_tracker_dir, write_mot_rows


def _rows_by_track(rows: list[list[float]]) -> dict[int, list[list[float]]]:
    grouped: dict[int, list[list[float]]] = defaultdict(list)
    for row in rows:
        grouped[int(row[1])].append(row)
    for track_rows in grouped.values():
        track_rows.sort(key=lambda r: int(r[0]))
    return grouped


def _iou_tlwh(a: list[float], b: list[float]) -> float:
    ax1, ay1, aw, ah = float(a[2]), float(a[3]), float(a[4]), float(a[5])
    bx1, by1, bw, bh = float(b[2]), float(b[3]), float(b[4]), float(b[5])
    ax2, ay2 = ax1 + aw, ay1 + ah
    bx2, by2 = bx1 + bw, by1 + bh
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if inter <= 0:
        return 0.0
    return float(inter / max(aw * ah + bw * bh - inter, 1e-9))


def _to_write_rows(rows: list[list[float]]) -> list[tuple[int, int, float, float, float, float, float]]:
    return [
        (int(r[0]), int(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[5]), float(r[6]))
        for r in rows
        if int(r[0]) >= 1 and int(r[1]) >= 1 and float(r[4]) > 0 and float(r[5]) > 0
    ]


def _short_track_suppression(rows: list[list[float]], min_len: int, min_median_conf: float) -> list[list[float]]:
    keep_ids: set[int] = set()
    for track_id, track_rows in _rows_by_track(rows).items():
        conf = np.asarray([float(r[6]) for r in track_rows], dtype=np.float32)
        if len(track_rows) >= int(min_len) or float(np.median(conf)) >= float(min_median_conf):
            keep_ids.add(int(track_id))
    return [row for row in rows if int(row[1]) in keep_ids]


def _duplicate_suppression(rows: list[list[float]], temporal_min: int, mean_iou_thresh: float) -> list[list[float]]:
    grouped = _rows_by_track(rows)
    remove: set[tuple[int, int]] = set()
    items = sorted(grouped.items())
    for i, (track_a, rows_a) in enumerate(items):
        frames_a = {int(row[0]): row for row in rows_a}
        for track_b, rows_b in items[i + 1 :]:
            frames_b = {int(row[0]): row for row in rows_b}
            overlap = sorted(set(frames_a) & set(frames_b))
            if len(overlap) < int(temporal_min):
                continue
            mean_iou = float(np.mean([_iou_tlwh(frames_a[f], frames_b[f]) for f in overlap]))
            if mean_iou < float(mean_iou_thresh):
                continue
            med_a = float(np.median([float(frames_a[f][6]) for f in overlap]))
            med_b = float(np.median([float(frames_b[f][6]) for f in overlap]))
            loser = track_a if med_a < med_b else track_b
            for frame in overlap:
                remove.add((frame, loser))
    return [row for row in rows if (int(row[0]), int(row[1])) not in remove]


def _smooth(rows: list[list[float]], window: int) -> list[list[float]]:
    window = int(window)
    if window <= 1:
        return rows
    half = window // 2
    smoothed: list[list[float]] = []
    for _track_id, track_rows in _rows_by_track(rows).items():
        values = np.asarray([[float(r[2]), float(r[3]), float(r[4]), float(r[5])] for r in track_rows], dtype=np.float32)
        for idx, row in enumerate(track_rows):
            start = max(0, idx - half)
            end = min(len(track_rows), idx + half + 1)
            box = values[start:end].mean(axis=0)
            new_row = list(row)
            new_row[2:6] = [float(v) for v in box.tolist()]
            smoothed.append(new_row)
    return smoothed


def _expand(rows: list[list[float]], width: int, height: int, expand_x: float, top: float, bottom: float) -> list[list[float]]:
    expanded = []
    for row in rows:
        x, y, w, h = float(row[2]), float(row[3]), float(row[4]), float(row[5])
        x1 = x - w * float(expand_x)
        x2 = x + w + w * float(expand_x)
        y1 = y - h * float(top)
        y2 = y + h + h * float(bottom)
        x1 = min(max(0.0, x1), float(width))
        x2 = min(max(0.0, x2), float(width))
        y1 = min(max(0.0, y1), float(height))
        y2 = min(max(0.0, y2), float(height))
        new_row = list(row)
        new_row[2], new_row[3], new_row[4], new_row[5] = x1, y1, max(0.0, x2 - x1), max(0.0, y2 - y1)
        expanded.append(new_row)
    return expanded


def _merge_tracklets(rows: list[list[float]], max_gap: int, iou_thresh: float) -> list[list[float]]:
    grouped = _rows_by_track(rows)
    changed = True
    while changed:
        changed = False
        ids = sorted(grouped)
        for a in ids:
            if a not in grouped:
                continue
            end_a = grouped[a][-1]
            for b in ids:
                if a == b or b not in grouped:
                    continue
                start_b = grouped[b][0]
                gap = int(start_b[0] - end_a[0])
                if gap <= 0 or gap > int(max_gap):
                    continue
                if _iou_tlwh(end_a, start_b) < float(iou_thresh):
                    continue
                for row in grouped[b]:
                    row[1] = float(a)
                grouped[a].extend(grouped.pop(b))
                grouped[a].sort(key=lambda r: int(r[0]))
                changed = True
                break
            if changed:
                break
    return [row for rows_ in grouped.values() for row in rows_]


def main() -> int:
    parser = argparse.ArgumentParser(description="Post-process MOTChallenge track files without using GT.")
    parser.add_argument("--input-tracker-dir", required=True)
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--min-len", type=int, default=1)
    parser.add_argument("--min-median-conf", type=float, default=0.01)
    parser.add_argument("--max-gap", type=int, default=0)
    parser.add_argument("--duplicate-temporal-overlap-min", type=int, default=0)
    parser.add_argument("--duplicate-mean-iou-thresh", type=float, default=0.85)
    parser.add_argument("--tracklet-merge-max-gap", type=int, default=0)
    parser.add_argument("--tracklet-merge-iou-thresh", type=float, default=0.5)
    parser.add_argument("--smoothing-window", type=int, default=0)
    parser.add_argument("--expand-x", type=float, default=0.0)
    parser.add_argument("--expand-y-top", type=float, default=0.0)
    parser.add_argument("--expand-y-bottom", type=float, default=0.0)
    args = parser.parse_args()

    if str(args.output_tracker_name).startswith("ORACLE_"):
        raise AssertionError("Post-processing cannot create ORACLE-named final candidates.")
    ensure_outputs()
    names = [str(v) for v in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be processed: {unknown}")
    input_dir = rel(args.input_tracker_dir)
    if (input_dir / "data").exists():
        input_dir = input_dir / "data"
    output_dir = rel(Path("outputs/tracks") / args.output_tracker_name)
    output_dir.mkdir(parents=True, exist_ok=True)
    seqs = {seq.name: seq for seq in load_sequences(rel(args.data_root), names)}

    for seq_name in names:
        seq = seqs[seq_name]
        rows = read_mot_rows(input_dir / f"{seq_name}.txt")
        rows = _short_track_suppression(rows, int(args.min_len), float(args.min_median_conf))
        if int(args.duplicate_temporal_overlap_min) > 0:
            rows = _duplicate_suppression(rows, int(args.duplicate_temporal_overlap_min), float(args.duplicate_mean_iou_thresh))
        if int(args.tracklet_merge_max_gap) > 0:
            rows = _merge_tracklets(rows, int(args.tracklet_merge_max_gap), float(args.tracklet_merge_iou_thresh))
        if int(args.smoothing_window) > 1:
            rows = _smooth(rows, int(args.smoothing_window))
        if any(abs(float(v)) > 0.0 for v in [args.expand_x, args.expand_y_top, args.expand_y_bottom]):
            rows = _expand(rows, int(seq.width), int(seq.height), float(args.expand_x), float(args.expand_y_top), float(args.expand_y_bottom))
        write_mot_rows(output_dir / f"{seq_name}.txt", _to_write_rows(rows))
        if int(args.max_gap) > 0:
            from ir_autolabeling.tracking.postprocess import interpolate_mot_results

            interpolate_mot_results(output_dir / f"{seq_name}.txt", max_gap=int(args.max_gap))

    if set(names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(output_dir)
    trackeval_data = rel(args.trackeval_root) / "data" / "trackers" / "mot_challenge" / "MOT20-train" / str(args.output_tracker_name) / "data"
    trackeval_data.mkdir(parents=True, exist_ok=True)
    for seq_name in names:
        shutil.copy2(output_dir / f"{seq_name}.txt", trackeval_data / f"{seq_name}.txt")
    print(f"Wrote post-processed tracks: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
