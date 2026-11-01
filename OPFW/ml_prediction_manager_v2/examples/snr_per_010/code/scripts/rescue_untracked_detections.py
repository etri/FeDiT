
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from detection_io import load_detections
from mot20_io import TRAIN_SEQUENCES, load_sequences, read_mot_rows, validate_mot_result_file, validate_tracker_dir, write_mot_rows


@dataclass
class RescueTracklet:
    track_id: int
    rows: list[tuple[int, int, float, float, float, float, float]]
    last_frame: int
    last_box: np.ndarray


def _read_caps(items: list[str]) -> dict[str, int]:
    caps: dict[str, int] = {}
    for item in items:
        if "=" not in str(item):
            raise ValueError(f"--max-frame must be SEQ=FRAME, got: {item}")
        seq_name, value = str(item).split("=", 1)
        if seq_name not in TRAIN_SEQUENCES:
            raise AssertionError(f"Only MOT20 train sequences may be capped: {seq_name}")
        caps[seq_name] = int(value)
    return caps


def _tracker_data_dir(path: str | Path) -> Path:
    root = rel(path)
    if (root / "data").exists():
        return root / "data"
    return root


def _rows_to_xyxy(rows: list[list[float]]) -> np.ndarray:
    if not rows:
        return np.zeros((0, 4), dtype=np.float32)
    out = np.asarray([[r[2], r[3], r[2] + r[4], r[3] + r[5]] for r in rows], dtype=np.float32)
    return out


def _xyxy_to_row(frame: int, track_id: int, box: np.ndarray, score: float) -> tuple[int, int, float, float, float, float, float]:
    x1, y1, x2, y2 = [float(v) for v in box.tolist()]
    return (int(frame), int(track_id), x1, y1, max(0.0, x2 - x1), max(0.0, y2 - y1), float(score))


def _iou_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    if len(a) == 0 or len(b) == 0:
        return np.zeros((len(a), len(b)), dtype=np.float32)
    ix1 = np.maximum(a[:, None, 0], b[None, :, 0])
    iy1 = np.maximum(a[:, None, 1], b[None, :, 1])
    ix2 = np.minimum(a[:, None, 2], b[None, :, 2])
    iy2 = np.minimum(a[:, None, 3], b[None, :, 3])
    inter = np.maximum(0.0, ix2 - ix1) * np.maximum(0.0, iy2 - iy1)
    area_a = np.maximum(0.0, a[:, 2] - a[:, 0]) * np.maximum(0.0, a[:, 3] - a[:, 1])
    area_b = np.maximum(0.0, b[:, 2] - b[:, 0]) * np.maximum(0.0, b[:, 3] - b[:, 1])
    return (inter / np.maximum(area_a[:, None] + area_b[None, :] - inter, 1e-9)).astype(np.float32)


def _nms(boxes: np.ndarray, scores: np.ndarray, iou_thresh: float) -> np.ndarray:
    if len(boxes) == 0 or iou_thresh <= 0:
        return np.arange(len(boxes), dtype=np.int64)
    order = np.argsort(-scores)
    keep: list[int] = []
    while len(order) > 0:
        current = int(order[0])
        keep.append(current)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = _iou_matrix(boxes[[current]], boxes[rest]).reshape(-1)
        order = rest[ious < float(iou_thresh)]
    return np.asarray(keep, dtype=np.int64)


def _clip_boxes(boxes: np.ndarray, width: int, height: int) -> np.ndarray:
    clipped = boxes.astype(np.float32).copy()
    clipped[:, [0, 2]] = np.clip(clipped[:, [0, 2]], 0, float(width))
    clipped[:, [1, 3]] = np.clip(clipped[:, [1, 3]], 0, float(height))
    return clipped


def _expand_boxes(boxes: np.ndarray, width: int, height: int, expand_x: float, expand_top: float, expand_bottom: float) -> np.ndarray:
    if len(boxes) == 0 or (expand_x == 0 and expand_top == 0 and expand_bottom == 0):
        return boxes
    out = boxes.astype(np.float32).copy()
    bw = np.maximum(0.0, out[:, 2] - out[:, 0])
    bh = np.maximum(0.0, out[:, 3] - out[:, 1])
    out[:, 0] -= bw * float(expand_x)
    out[:, 2] += bw * float(expand_x)
    out[:, 1] -= bh * float(expand_top)
    out[:, 3] += bh * float(expand_bottom)
    return _clip_boxes(out, width, height)


def _group_rows_by_frame(rows: list[list[float]]) -> dict[int, list[list[float]]]:
    grouped: dict[int, list[list[float]]] = {}
    for row in rows:
        grouped.setdefault(int(row[0]), []).append(row)
    return grouped


def _group_rows_by_track(rows: list[list[float]]) -> dict[int, list[list[float]]]:
    grouped: dict[int, list[list[float]]] = {}
    for row in rows:
        grouped.setdefault(int(row[1]), []).append(row)
    for track_rows in grouped.values():
        track_rows.sort(key=lambda r: int(r[0]))
    return grouped


def _predict_endpoint(track_rows: list[list[float]], target_frame: int, *, from_end: bool) -> np.ndarray:
    rows = track_rows[-2:] if from_end else track_rows[:2]
    if len(rows) == 1:
        return _rows_to_xyxy(rows)[0]
    first, second = rows[0], rows[1]
    if from_end:
        prev, curr = first, second
        dt = max(1, int(curr[0]) - int(prev[0]))
        step = (_rows_to_xyxy([curr])[0] - _rows_to_xyxy([prev])[0]) / float(dt)
        return _rows_to_xyxy([curr])[0] + step * float(int(target_frame) - int(curr[0]))
    curr, nxt = first, second
    dt = max(1, int(nxt[0]) - int(curr[0]))
    step = (_rows_to_xyxy([nxt])[0] - _rows_to_xyxy([curr])[0]) / float(dt)
    return _rows_to_xyxy([curr])[0] + step * float(int(target_frame) - int(curr[0]))


def _attach_id(
    rescue_rows: list[tuple[int, int, float, float, float, float, float]],
    base_tracks: dict[int, list[list[float]]],
    attach_max_gap: int,
    attach_iou_thresh: float,
) -> int | None:
    if attach_max_gap <= 0 or not rescue_rows:
        return None
    start_frame = int(rescue_rows[0][0])
    end_frame = int(rescue_rows[-1][0])
    first_box = _rows_to_xyxy([list(rescue_rows[0])])[0]
    last_box = _rows_to_xyxy([list(rescue_rows[-1])])[0]
    best_id: int | None = None
    best_iou = float(attach_iou_thresh)
    for track_id, rows in base_tracks.items():
        end_row = rows[-1]
        gap_before = start_frame - int(end_row[0])
        if 0 < gap_before <= int(attach_max_gap):
            pred = _predict_endpoint(rows, start_frame, from_end=True)
            iou = float(_iou_matrix(first_box[None, :], pred[None, :])[0, 0])
            if iou > best_iou:
                best_iou = iou
                best_id = int(track_id)
        start_row = rows[0]
        gap_after = int(start_row[0]) - end_frame
        if 0 < gap_after <= int(attach_max_gap):
            pred = _predict_endpoint(rows, end_frame, from_end=False)
            iou = float(_iou_matrix(last_box[None, :], pred[None, :])[0, 0])
            if iou > best_iou:
                best_iou = iou
                best_id = int(track_id)
    return best_id


def _build_rescue_tracklets(
    *,
    frame_candidates: dict[int, tuple[np.ndarray, np.ndarray]],
    start_track_id: int,
    min_track_len: int,
    min_median_score: float,
    max_link_gap: int,
    link_iou_thresh: float,
) -> tuple[list[RescueTracklet], int]:
    active: list[RescueTracklet] = []
    finished: list[RescueTracklet] = []
    next_track_id = int(start_track_id)
    for frame in sorted(frame_candidates):
        boxes, scores = frame_candidates[frame]
        still_active: list[RescueTracklet] = []
        for tracklet in active:
            if int(frame) - int(tracklet.last_frame) <= int(max_link_gap):
                still_active.append(tracklet)
            else:
                finished.append(tracklet)
        active = still_active

        matched_candidates: set[int] = set()
        matched_tracks: set[int] = set()
        if len(boxes) and active:
            active_boxes = np.asarray([tracklet.last_box for tracklet in active], dtype=np.float32)
            ious = _iou_matrix(boxes, active_boxes)
            pairs = [
                (float(ious[candidate_idx, active_idx]), int(candidate_idx), int(active_idx))
                for candidate_idx in range(len(boxes))
                for active_idx in range(len(active))
                if float(ious[candidate_idx, active_idx]) >= float(link_iou_thresh)
            ]
            pairs.sort(reverse=True)
            for _iou, candidate_idx, active_idx in pairs:
                if candidate_idx in matched_candidates or active_idx in matched_tracks:
                    continue
                tracklet = active[active_idx]
                row = _xyxy_to_row(frame, tracklet.track_id, boxes[candidate_idx], float(scores[candidate_idx]))
                tracklet.rows.append(row)
                tracklet.last_frame = int(frame)
                tracklet.last_box = boxes[candidate_idx].astype(np.float32)
                matched_candidates.add(candidate_idx)
                matched_tracks.add(active_idx)

        for candidate_idx in range(len(boxes)):
            if candidate_idx in matched_candidates:
                continue
            track_id = next_track_id
            next_track_id += 1
            row = _xyxy_to_row(frame, track_id, boxes[candidate_idx], float(scores[candidate_idx]))
            active.append(
                RescueTracklet(
                    track_id=track_id,
                    rows=[row],
                    last_frame=int(frame),
                    last_box=boxes[candidate_idx].astype(np.float32),
                )
            )

    finished.extend(active)
    kept: list[RescueTracklet] = []
    for tracklet in finished:
        scores = np.asarray([row[6] for row in tracklet.rows], dtype=np.float32)
        if len(tracklet.rows) >= int(min_track_len) and float(np.median(scores)) >= float(min_median_score):
            kept.append(tracklet)
    return kept, next_track_id


def main() -> int:
    parser = argparse.ArgumentParser(description="Add high-confidence frozen-VLM detections that are not covered by existing tracks.")
    parser.add_argument("--base-output-tracker-dir", required=True, help="Tracker rows to keep in the final output.")
    parser.add_argument("--base-gate-tracker-dir", default=None, help="Tracker rows used only for overlap gating. Defaults to base output.")
    parser.add_argument("--detections", required=True, help="Detection directory containing per-sequence .npz files.")
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--max-frame", action="append", default=[])
    parser.add_argument("--score-threshold", type=float, default=0.90)
    parser.add_argument("--base-overlap-iou-max", type=float, default=0.30)
    parser.add_argument("--candidate-nms-iou", type=float, default=0.70)
    parser.add_argument("--max-candidates-per-frame", type=int, default=120)
    parser.add_argument("--min-width", type=float, default=2.0)
    parser.add_argument("--min-height", type=float, default=8.0)
    parser.add_argument("--min-track-len", type=int, default=5)
    parser.add_argument("--min-median-score", type=float, default=0.0)
    parser.add_argument("--max-link-gap", type=int, default=2)
    parser.add_argument("--link-iou-thresh", type=float, default=0.30)
    parser.add_argument("--expand-rescue-x", type=float, default=0.0)
    parser.add_argument("--expand-rescue-y-top", type=float, default=0.0)
    parser.add_argument("--expand-rescue-y-bottom", type=float, default=0.0)
    parser.add_argument("--attach-to-base", action="store_true")
    parser.add_argument("--attach-max-gap", type=int, default=30)
    parser.add_argument("--attach-iou-thresh", type=float, default=0.30)
    parser.add_argument("--copy-to-trackeval", action="store_true")
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--benchmark", default="MOT20COVERED")
    parser.add_argument("--split", default="train")
    parser.add_argument("--overwrite-trackeval", action="store_true")
    args = parser.parse_args()

    if str(args.output_tracker_name).startswith("ORACLE_"):
        raise AssertionError("Rescue outputs are legitimate candidates and must not use ORACLE_ names.")

    ensure_outputs()
    names = [str(v) for v in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be processed: {unknown}")
    caps = _read_caps(args.max_frame)
    seqs = {seq.name: seq for seq in load_sequences(rel(args.data_root), names)}

    base_output_dir = _tracker_data_dir(args.base_output_tracker_dir)
    base_gate_dir = _tracker_data_dir(args.base_gate_tracker_dir or args.base_output_tracker_dir)
    detection_dir = rel(args.detections)
    output_dir = rel(Path("outputs/tracks") / str(args.output_tracker_name))
    output_dir.mkdir(parents=True, exist_ok=True)

    meta = {
        "base_output_tracker_dir": str(base_output_dir),
        "base_gate_tracker_dir": str(base_gate_dir),
        "detections": str(detection_dir),
        "parameters": vars(args),
        "sequence_counts": {},
        "note": "No GT coordinates or GT IDs are used by this post-processing module.",
    }

    for seq_name in names:
        seq = seqs[seq_name]
        max_frame = int(caps.get(seq_name, seq.seq_length))
        base_rows = [row for row in read_mot_rows(base_output_dir / f"{seq_name}.txt") if int(row[0]) <= max_frame]
        gate_rows = [row for row in read_mot_rows(base_gate_dir / f"{seq_name}.txt") if int(row[0]) <= max_frame]
        base_by_frame = _group_rows_by_frame(base_rows)
        gate_by_frame = _group_rows_by_frame(gate_rows)
        base_tracks = _group_rows_by_track(base_rows)
        used_frame_track = {(int(row[0]), int(row[1])) for row in base_rows}
        next_id = max([int(row[1]) for row in base_rows] + [0]) + 1

        detections = load_detections(detection_dir / f"{seq_name}.npz")
        det_by_frame = detections.by_frame()
        frame_candidates: dict[int, tuple[np.ndarray, np.ndarray]] = {}
        for frame, indices in det_by_frame.items():
            frame = int(frame)
            if frame < 1 or frame > max_frame:
                continue
            scores = detections.calibrated_scores[indices].astype(np.float32)
            keep = scores >= float(args.score_threshold)
            boxes = detections.boxes[indices][keep].astype(np.float32)
            scores = scores[keep]
            if len(boxes) == 0:
                continue
            boxes = _clip_boxes(boxes, int(seq.width), int(seq.height))
            sizes_keep = (boxes[:, 2] - boxes[:, 0] >= float(args.min_width)) & (
                boxes[:, 3] - boxes[:, 1] >= float(args.min_height)
            )
            boxes = boxes[sizes_keep]
            scores = scores[sizes_keep]
            if len(boxes) == 0:
                continue

            gate_boxes = _rows_to_xyxy(gate_by_frame.get(frame, []))
            if len(gate_boxes) > 0:
                max_iou = _iou_matrix(boxes, gate_boxes).max(axis=1)
                keep = max_iou < float(args.base_overlap_iou_max)
                boxes = boxes[keep]
                scores = scores[keep]
            if len(boxes) == 0:
                continue
            if int(args.max_candidates_per_frame) > 0 and len(boxes) > int(args.max_candidates_per_frame):
                order = np.argsort(-scores)[: int(args.max_candidates_per_frame)]
                boxes = boxes[order]
                scores = scores[order]
            keep_idx = _nms(boxes, scores, float(args.candidate_nms_iou))
            boxes = boxes[keep_idx]
            scores = scores[keep_idx]
            boxes = _expand_boxes(
                boxes,
                int(seq.width),
                int(seq.height),
                float(args.expand_rescue_x),
                float(args.expand_rescue_y_top),
                float(args.expand_rescue_y_bottom),
            )
            frame_candidates[frame] = (boxes, scores)

        rescue_tracklets, _ = _build_rescue_tracklets(
            frame_candidates=frame_candidates,
            start_track_id=next_id,
            min_track_len=int(args.min_track_len),
            min_median_score=float(args.min_median_score),
            max_link_gap=int(args.max_link_gap),
            link_iou_thresh=float(args.link_iou_thresh),
        )

        rescue_rows: list[tuple[int, int, float, float, float, float, float]] = []
        attached = 0
        for tracklet in rescue_tracklets:
            rows = tracklet.rows
            attach_id = (
                _attach_id(rows, base_tracks, int(args.attach_max_gap), float(args.attach_iou_thresh))
                if args.attach_to_base
                else None
            )
            if attach_id is not None:
                attached += 1
                for row in rows:
                    if (int(row[0]), int(attach_id)) in used_frame_track:
                        continue
                    rescue_rows.append((row[0], int(attach_id), row[2], row[3], row[4], row[5], row[6]))
                    used_frame_track.add((int(row[0]), int(attach_id)))
            else:
                rescue_rows.extend(rows)

        write_rows = [
            (int(r[0]), int(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[5]), float(r[6]))
            for r in base_rows
        ]
        write_rows.extend(rescue_rows)
        write_mot_rows(output_dir / f"{seq_name}.txt", write_rows)
        meta["sequence_counts"][seq_name] = {
            "base_rows": len(base_rows),
            "candidate_frames": len(frame_candidates),
            "rescue_tracklets": len(rescue_tracklets),
            "attached_tracklets": attached,
            "rescue_rows": len(rescue_rows),
            "total_rows": len(write_rows),
            "max_frame": max_frame,
        }

    if set(names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(output_dir)
    else:
        for seq_name in names:
            validate_mot_result_file(output_dir / f"{seq_name}.txt")
    (output_dir / "rescue_metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=True, sort_keys=True) + "\n")

    if args.copy_to_trackeval:
        trackeval_data = (
            rel(args.trackeval_root)
            / "data"
            / "trackers"
            / "mot_challenge"
            / f"{args.benchmark}-{args.split}"
            / str(args.output_tracker_name)
            / "data"
        )
        if trackeval_data.exists() and args.overwrite_trackeval:
            shutil.rmtree(trackeval_data)
        trackeval_data.mkdir(parents=True, exist_ok=True)
        for seq_name in names:
            shutil.copy2(output_dir / f"{seq_name}.txt", trackeval_data / f"{seq_name}.txt")
        if set(names) == set(TRAIN_SEQUENCES):
            validate_tracker_dir(trackeval_data)
        else:
            for seq_name in names:
                validate_mot_result_file(trackeval_data / f"{seq_name}.txt")
        print(f"Copied rescue tracker to TrackEval: {trackeval_data}")

    print(json.dumps(meta["sequence_counts"], indent=2, ensure_ascii=True, sort_keys=True))
    print(f"Wrote rescue tracks: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
