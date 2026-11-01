
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment

from _common import ensure_outputs, rel
from detection_io import load_detections
from mot20_io import TRAIN_SEQUENCES, iter_frame_paths, load_sequences, validate_mot_result_file, validate_tracker_dir, write_mot_rows
from nms import pairwise_iou_xyxy


@dataclass(slots=True)
class _Track:
    track_id: int
    box: np.ndarray
    score: float
    age: int = 0
    hits: int = 1


class _FallbackByteTracker:
    pass

    def __init__(self, *, track_buffer: int, match_thresh: float, new_track_thresh: float, min_hits: int = 1):
        self.track_buffer = int(track_buffer)
        self.match_thresh = float(match_thresh)
        self.new_track_thresh = float(new_track_thresh)
        self.min_hits = int(min_hits)
        self.next_id = 1
        self.tracks: list[_Track] = []

    def update(self, detections: np.ndarray, _frame: np.ndarray | None = None) -> np.ndarray:
        boxes = detections[:, :4] if len(detections) else np.zeros((0, 4), dtype=np.float32)
        scores = detections[:, 4] if len(detections) else np.zeros((0,), dtype=np.float32)
        for track in self.tracks:
            track.age += 1
        if self.tracks and len(boxes):
            track_boxes = np.stack([track.box for track in self.tracks]).astype(np.float32)
            iou = pairwise_iou_xyxy(track_boxes, boxes)
            rows, cols = linear_sum_assignment(1.0 - iou)
            used_tracks: set[int] = set()
            used_dets: set[int] = set()
            for row, col in zip(rows, cols, strict=False):
                if float(iou[row, col]) < float(self.match_thresh):
                    continue
                track = self.tracks[int(row)]
                track.box = boxes[int(col)].astype(np.float32)
                track.score = float(scores[int(col)])
                track.age = 0
                track.hits += 1
                used_tracks.add(int(row))
                used_dets.add(int(col))
            for det_idx in range(len(boxes)):
                if det_idx in used_dets or float(scores[det_idx]) < self.new_track_thresh:
                    continue
                self.tracks.append(_Track(self.next_id, boxes[det_idx].astype(np.float32), float(scores[det_idx])))
                self.next_id += 1
        else:
            for det_idx in range(len(boxes)):
                if float(scores[det_idx]) < self.new_track_thresh:
                    continue
                self.tracks.append(_Track(self.next_id, boxes[det_idx].astype(np.float32), float(scores[det_idx])))
                self.next_id += 1
        self.tracks = [track for track in self.tracks if track.age <= self.track_buffer]
        output = []
        for track in self.tracks:
            if track.age == 0 and track.hits >= self.min_hits:
                output.append([*track.box.tolist(), float(track.track_id), float(track.score)])
        return np.asarray(output, dtype=np.float32).reshape((-1, 6))


def _normalize_tracker_params(
    tracker_type: str,
    params: dict[str, Any],
) -> tuple[dict[str, Any], float | None]:
    normalized = dict(params)
    new_track_thresh: float | None = None
    if str(tracker_type).lower() != "bytetrack":
        return normalized, new_track_thresh

    
    
    if "min_conf" not in normalized and "track_low_thresh" in normalized:
        normalized["min_conf"] = float(normalized["track_low_thresh"])
    if "track_thresh" not in normalized and "track_high_thresh" in normalized:
        normalized["track_thresh"] = float(normalized["track_high_thresh"])
    if "new_track_thresh" in normalized:
        new_track_thresh = float(normalized["new_track_thresh"])

    for key in (
        "track_low_thresh",
        "track_high_thresh",
        "new_track_thresh",
        "fuse_score",
        "tentative_low_score_init",
    ):
        normalized.pop(key, None)
    return normalized, new_track_thresh


def _build_tracker(
    tracker_type: str,
    params: dict[str, Any],
    seq,
    *,
    device: str,
    half: bool,
    reid_weights: str | None,
) -> Any:
    normalized_params, new_track_thresh = _normalize_tracker_params(
        tracker_type,
        params,
    )
    try:
        from ir_autolabeling.tracking.tracker_factory import build_tracker

        tracker = build_tracker(
            str(tracker_type),
            normalized_params,
            frame_rate=int(seq.frame_rate),
            image_width=int(seq.width),
            image_height=int(seq.height),
            device=str(device),
            half=bool(half),
            reid_weights=reid_weights,
        )
        if str(tracker_type).lower() == "bytetrack" and new_track_thresh is not None:
            tracker.det_thresh = float(new_track_thresh)
        return tracker
    except Exception as exc:
        raise RuntimeError('BoxMOT initialization failed') from exc


def _tracks_to_rows(frame_idx: int, tracks: np.ndarray) -> list[tuple[int, int, float, float, float, float, float]]:
    rows = []
    if tracks is None or len(tracks) == 0:
        return rows
    for track in tracks:
        x1, y1, x2, y2 = [float(v) for v in track[:4]]
        track_id = int(track[4])
        conf = float(track[5]) if len(track) > 5 else 1.0
        if track_id < 1 or x2 <= x1 or y2 <= y1:
            continue
        rows.append((int(frame_idx), track_id, x1, y1, x2 - x1, y2 - y1, conf))
    return rows


def _load_params(args: argparse.Namespace) -> dict[str, Any]:
    if args.tracker_params_json:
        return json.loads(Path(args.tracker_params_json).read_text(encoding="utf-8"))
    params = {
        "track_high_thresh": float(args.track_high_thresh),
        "track_low_thresh": float(args.track_low_thresh),
        "new_track_thresh": float(args.new_track_thresh),
        "track_buffer": int(args.track_buffer),
        "match_thresh": float(args.match_thresh),
        "fuse_score": str(args.fuse_score).lower() == "true",
    }
    if args.tentative:
        params["tentative_low_score_init"] = {
            "enabled": True,
            "tentative_init_score": float(args.tentative_init_score),
            "min_hits": int(args.min_hits),
            "max_tentative_age": int(args.max_tentative_age),
        }
    return params


def _adapt_params_to_reference_count(
    params: dict[str, Any],
    *,
    detections,
    reference_detections,
    sequence_length: int,
    reference_score_threshold: float,
    target_ratio: float,
    high_floor: float,
    low_ratio: float,
) -> tuple[dict[str, Any], dict[str, float]]:
    adapted = dict(params)
    base_high = float(params.get("track_high_thresh", params.get("track_thresh", 0.4)))
    base_low = float(params.get("track_low_thresh", params.get("min_conf", 0.1)))
    base_new = float(params.get("new_track_thresh", base_high))

    reference_count = float(
        np.count_nonzero(reference_detections.calibrated_scores >= float(reference_score_threshold))
    ) / max(int(sequence_length), 1)
    target_count = max(0.0, float(target_ratio) * reference_count)
    target_total = min(
        len(detections.calibrated_scores),
        int(np.ceil(target_count * max(int(sequence_length), 1))),
    )
    if target_total > 0:
        threshold_index = max(0, len(detections.calibrated_scores) - target_total)
        count_threshold = float(
            np.partition(detections.calibrated_scores, threshold_index)[threshold_index]
        )
    else:
        count_threshold = base_high

    adaptive_high = max(float(high_floor), min(base_high, count_threshold))
    adaptive_low = min(base_low, adaptive_high * float(low_ratio))
    adaptive_new = max(adaptive_high, min(1.0, adaptive_high + (base_new - base_high)))
    adapted["track_high_thresh"] = adaptive_high
    adapted["track_low_thresh"] = adaptive_low
    adapted["new_track_thresh"] = adaptive_new
    diagnostics = {
        "reference_count_per_frame": reference_count,
        "target_count_per_frame": target_count,
        "count_threshold": count_threshold,
        "track_high_thresh": adaptive_high,
        "track_low_thresh": adaptive_low,
        "new_track_thresh": adaptive_new,
    }
    return adapted, diagnostics


def main() -> int:
    parser = argparse.ArgumentParser(description="Run ByteTrack/BoT-SORT-compatible tracker on external VLM detections.")
    parser.add_argument("--detections", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--tracker-name", required=True)
    parser.add_argument("--tracker-type", default="bytetrack")
    parser.add_argument("--tracker-params-json", default=None)
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--half", action="store_true")
    parser.add_argument("--reid-weights", default=None)
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--track-high-thresh", type=float, default=0.08)
    parser.add_argument("--track-low-thresh", type=float, default=0.01)
    parser.add_argument("--new-track-thresh", type=float, default=0.15)
    parser.add_argument("--track-buffer", type=int, default=90)
    parser.add_argument("--match-thresh", type=float, default=0.75)
    parser.add_argument("--fuse-score", default="false")
    parser.add_argument("--tentative", action="store_true")
    parser.add_argument("--tentative-init-score", type=float, default=0.02)
    parser.add_argument("--min-hits", type=int, default=3)
    parser.add_argument("--max-tentative-age", type=int, default=3)
    parser.add_argument("--max-dets-per-frame", type=int, default=None)
    parser.add_argument("--adaptive-score-reference", default=None)
    parser.add_argument("--adaptive-reference-score-threshold", type=float, default=0.25)
    parser.add_argument("--adaptive-target-ratio", type=float, default=0.8)
    parser.add_argument("--adaptive-high-floor", type=float, default=0.05)
    parser.add_argument("--adaptive-low-ratio", type=float, default=0.25)
    parser.add_argument("--skip-trackeval-copy", action="store_true")
    args = parser.parse_args()

    if str(args.tracker_name).startswith("ORACLE_"):
        raise AssertionError("ORACLE tracker names cannot be produced by run_tracker.py")
    ensure_outputs()
    det_root = rel(args.detections)
    data_root = rel(args.data_root)
    output_dir = rel(Path("outputs/tracks") / args.tracker_name)
    output_dir.mkdir(parents=True, exist_ok=True)
    params = _load_params(args)
    effective_params, effective_new_track_thresh = _normalize_tracker_params(
        str(args.tracker_type),
        params,
    )
    sequence_names = [str(v) for v in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(sequence_names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be tracked: {unknown}")
    sequences = load_sequences(data_root, sequence_names)
    adaptive_reference_root = rel(args.adaptive_score_reference) if args.adaptive_score_reference else None
    per_sequence_params: dict[str, Any] = {}

    for seq in sequences:
        detections = load_detections(det_root / f"{seq.name}.npz")
        seq_params = dict(params)
        if adaptive_reference_root is not None:
            reference_detections = load_detections(adaptive_reference_root / f"{seq.name}.npz")
            seq_params, diagnostics = _adapt_params_to_reference_count(
                seq_params,
                detections=detections,
                reference_detections=reference_detections,
                sequence_length=int(seq.seq_length),
                reference_score_threshold=float(args.adaptive_reference_score_threshold),
                target_ratio=float(args.adaptive_target_ratio),
                high_floor=float(args.adaptive_high_floor),
                low_ratio=float(args.adaptive_low_ratio),
            )
            per_sequence_params[seq.name] = diagnostics
            print(
                f"{seq.name}: adaptive count={diagnostics['reference_count_per_frame']:.2f}/frame "
                f"target={diagnostics['target_count_per_frame']:.2f}/frame "
                f"high={diagnostics['track_high_thresh']:.4f} "
                f"low={diagnostics['track_low_thresh']:.4f} "
                f"new={diagnostics['new_track_thresh']:.4f}"
            )
        by_frame = detections.by_frame()
        tracker = _build_tracker(
            str(args.tracker_type),
            seq_params,
            seq,
            device=str(args.device),
            half=bool(args.half),
            reid_weights=args.reid_weights,
        )
        frame_paths = dict(iter_frame_paths(seq))
        tracker_type_lower = str(args.tracker_type).lower()
        use_dummy_frame = tracker_type_lower in {"bytetrack", "ocsort", "sfsort"} or (
            tracker_type_lower == "boosttrack"
            and not bool(seq_params.get("use_ecc", True))
            and not bool(seq_params.get("with_reid", False))
        )
        dummy_frame = np.zeros((int(seq.height), int(seq.width), 3), dtype=np.uint8)
        rows: list[tuple[int, int, float, float, float, float, float]] = []
        for frame_idx in range(1, seq.seq_length + 1):
            indices = by_frame.get(frame_idx, np.zeros((0,), dtype=np.int64))
            if len(indices):
                scores = detections.calibrated_scores[indices]
                low_score_floor = seq_params.get(
                    "track_low_thresh",
                    seq_params.get("min_conf", seq_params.get("det_thresh", 0.0)),
                )
                keep = scores >= float(low_score_floor)
                indices = indices[keep]
                if args.max_dets_per_frame is not None and len(indices) > int(args.max_dets_per_frame):
                    order = np.argsort(-detections.calibrated_scores[indices])[: int(args.max_dets_per_frame)]
                    indices = indices[order]
            if len(indices):
                boxes = detections.boxes[indices].astype(np.float32)
                scores = detections.calibrated_scores[indices].astype(np.float32)
                classes = np.zeros((len(indices),), dtype=np.float32)
                dets = np.concatenate([boxes, scores[:, None], classes[:, None]], axis=1).astype(np.float32)
            else:
                dets = np.zeros((0, 6), dtype=np.float32)
            if use_dummy_frame:
                image = dummy_frame
            else:
                image = cv2.imread(str(frame_paths[frame_idx]))
                if image is None:
                    image = dummy_frame
            tracks = tracker.update(dets, image)
            rows.extend(_tracks_to_rows(frame_idx, tracks))
        write_mot_rows(output_dir / f"{seq.name}.txt", rows)

    if set(sequence_names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(output_dir)
    else:
        for seq_name in sequence_names:
            validate_mot_result_file(output_dir / f"{seq_name}.txt")
    (output_dir / "tracker_config.json").write_text(
        json.dumps(
            {
                "tracker_type": args.tracker_type,
                "device": args.device,
                "half": bool(args.half),
                "reid_weights": args.reid_weights,
                "params": params,
                "effective_boxmot_params": effective_params,
                "effective_new_track_thresh": effective_new_track_thresh,
                "detections": str(det_root),
                "adaptive_score_reference": str(adaptive_reference_root) if adaptive_reference_root else None,
                "adaptive_reference_score_threshold": float(args.adaptive_reference_score_threshold),
                "adaptive_target_ratio": float(args.adaptive_target_ratio),
                "adaptive_high_floor": float(args.adaptive_high_floor),
                "adaptive_low_ratio": float(args.adaptive_low_ratio),
                "adaptive_per_sequence": per_sequence_params,
            },
            indent=2,
            ensure_ascii=True,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )

    if not args.skip_trackeval_copy:
        trackeval_data = rel(args.trackeval_root) / "data" / "trackers" / "mot_challenge" / "MOT20-train" / str(args.tracker_name) / "data"
        trackeval_data.mkdir(parents=True, exist_ok=True)
        for seq in sequence_names:
            shutil.copy2(output_dir / f"{seq}.txt", trackeval_data / f"{seq}.txt")
    print(f"Wrote tracker results: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
