from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment

from mot20_io import SequenceInfo, gt_to_xyxy, load_gt, read_mot_rows, write_mot_rows
from nms import pairwise_iou_xyxy


FEATURE_NAMES = [
    "gap",
    "log_gap",
    "center_dist_h",
    "pred_center_dist_h",
    "box_iou",
    "size_log_abs",
    "aspect_log_abs",
    "hist_cosine",
    "score_abs_diff",
    "end_score",
    "start_score",
    "min_len_log",
]


@dataclass(slots=True)
class Tracklet:
    track_id: int
    frames: np.ndarray
    boxes: np.ndarray
    scores: np.ndarray
    dominant_gt_id: int = -1
    purity: float = 0.0
    hist: np.ndarray | None = None

    @property
    def start_frame(self) -> int:
        return int(self.frames[0])

    @property
    def end_frame(self) -> int:
        return int(self.frames[-1])

    @property
    def length(self) -> int:
        return int(len(self.frames))

    @property
    def start_box(self) -> np.ndarray:
        return self.boxes[0]

    @property
    def end_box(self) -> np.ndarray:
        return self.boxes[-1]

    @property
    def start_score(self) -> float:
        return float(self.scores[0])

    @property
    def end_score(self) -> float:
        return float(self.scores[-1])


def _tlwh_to_xyxy(boxes: np.ndarray) -> np.ndarray:
    out = boxes.astype(np.float32).copy()
    out[:, 2] = out[:, 0] + out[:, 2]
    out[:, 3] = out[:, 1] + out[:, 3]
    return out


def _box_center_tlwh(box: np.ndarray) -> np.ndarray:
    return np.asarray([float(box[0] + 0.5 * box[2]), float(box[1] + 0.5 * box[3])], dtype=np.float32)


def _box_iou_tlwh(a: np.ndarray, b: np.ndarray) -> float:
    ax = np.asarray([[float(a[0]), float(a[1]), float(a[0] + a[2]), float(a[1] + a[3])]], dtype=np.float32)
    bx = np.asarray([[float(b[0]), float(b[1]), float(b[0] + b[2]), float(b[1] + b[3])]], dtype=np.float32)
    return float(pairwise_iou_xyxy(ax, bx)[0, 0])


@lru_cache(maxsize=64)
def _read_image(path: str) -> np.ndarray | None:
    return cv2.imread(path)


def _crop_hist(image: np.ndarray | None, box: np.ndarray) -> np.ndarray:
    hist = np.zeros((8 * 8 * 4,), dtype=np.float32)
    if image is None:
        return hist
    h, w = image.shape[:2]
    x1 = int(max(0, min(w - 1, math.floor(float(box[0])))))
    y1 = int(max(0, min(h - 1, math.floor(float(box[1])))))
    x2 = int(max(0, min(w, math.ceil(float(box[0] + box[2])))))
    y2 = int(max(0, min(h, math.ceil(float(box[1] + box[3])))))
    if x2 <= x1 or y2 <= y1:
        return hist
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return hist
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    values = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 4], [0, 180, 0, 256, 0, 256]).astype(np.float32).reshape(-1)
    norm = float(np.linalg.norm(values))
    if norm > 1e-8:
        hist = values / norm
    return hist


def assign_tracklet_gt_labels(tracklets: list[Tracklet], sequence: SequenceInfo, *, iou_threshold: float = 0.5) -> None:
    valid_gt, _ignore = load_gt(sequence.gt_path)
    track_by_id = {track.track_id: track for track in tracklets}
    rows_by_frame: dict[int, list[tuple[int, int, np.ndarray]]] = {}
    for track in tracklets:
        for local_idx, frame in enumerate(track.frames.astype(int).tolist()):
            rows_by_frame.setdefault(int(frame), []).append((track.track_id, local_idx, track.boxes[local_idx]))

    matches: dict[int, list[int]] = {track.track_id: [] for track in tracklets}
    for frame_idx, track_rows in rows_by_frame.items():
        gt_frame = valid_gt[valid_gt["frame"] == frame_idx]
        if len(gt_frame) == 0 or not track_rows:
            continue
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        det_boxes = _tlwh_to_xyxy(np.asarray([item[2] for item in track_rows], dtype=np.float32))
        iou = pairwise_iou_xyxy(gt_boxes, det_boxes)
        rows, cols = linear_sum_assignment(1.0 - iou)
        gt_ids = gt_frame["id"].to_numpy(dtype=np.int64)
        for row, col in zip(rows, cols, strict=False):
            if float(iou[row, col]) < float(iou_threshold):
                continue
            track_id = int(track_rows[int(col)][0])
            matches[track_id].append(int(gt_ids[int(row)]))

    for track_id, gt_ids in matches.items():
        track = track_by_id[int(track_id)]
        if not gt_ids:
            track.dominant_gt_id = -1
            track.purity = 0.0
            continue
        values, counts = np.unique(np.asarray(gt_ids, dtype=np.int64), return_counts=True)
        best = int(np.argmax(counts))
        track.dominant_gt_id = int(values[best])
        track.purity = float(counts[best] / max(1, len(gt_ids)))


def load_tracklets(
    tracker_dir: str | Path,
    sequence: SequenceInfo,
    *,
    compute_hist: bool = True,
    max_hist_samples: int = 6,
) -> list[Tracklet]:
    tracker_root = Path(tracker_dir).expanduser().resolve()
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
    grouped: dict[int, list[list[float]]] = {}
    for row in rows:
        grouped.setdefault(int(row[1]), []).append(row)

    image_paths = {idx: str(sequence.img_dir / f"{idx:06d}{sequence.image_ext}") for idx in range(1, int(sequence.seq_length) + 1)}
    tracklets: list[Tracklet] = []
    for track_id, track_rows in grouped.items():
        track_rows.sort(key=lambda r: int(r[0]))
        frames = np.asarray([int(r[0]) for r in track_rows], dtype=np.int32)
        boxes = np.asarray([[float(r[2]), float(r[3]), float(r[4]), float(r[5])] for r in track_rows], dtype=np.float32)
        scores = np.asarray([float(r[6]) for r in track_rows], dtype=np.float32)
        track = Tracklet(int(track_id), frames, boxes, scores)
        if compute_hist and len(frames):
            sample_count = max(1, min(int(max_hist_samples), len(frames)))
            sample_positions = np.linspace(0, len(frames) - 1, sample_count).round().astype(int)
            hists = []
            for pos in sample_positions.tolist():
                image = _read_image(image_paths.get(int(frames[pos]), ""))
                hists.append(_crop_hist(image, boxes[pos]))
            hist = np.mean(np.stack(hists, axis=0), axis=0).astype(np.float32)
            norm = float(np.linalg.norm(hist))
            track.hist = hist / norm if norm > 1e-8 else hist
        tracklets.append(track)
    return tracklets


def pair_features(first: Tracklet, second: Tracklet) -> np.ndarray:
    gap = max(0, int(second.start_frame - first.end_frame))
    end_center = _box_center_tlwh(first.end_box)
    start_center = _box_center_tlwh(second.start_box)
    mean_h = max(float(first.end_box[3] + second.start_box[3]) * 0.5, 1.0)
    center_dist_h = float(np.linalg.norm(start_center - end_center) / mean_h)
    velocity = np.zeros((2,), dtype=np.float32)
    if first.length >= 2:
        dt = max(1, int(first.frames[-1] - first.frames[-2]))
        velocity = (_box_center_tlwh(first.boxes[-1]) - _box_center_tlwh(first.boxes[-2])) / float(dt)
    pred_center = end_center + velocity * float(gap)
    pred_center_dist_h = float(np.linalg.norm(start_center - pred_center) / mean_h)
    size_log_abs = abs(float(math.log(max(first.end_box[2] * first.end_box[3], 1.0) / max(second.start_box[2] * second.start_box[3], 1.0))))
    aspect_a = max(float(first.end_box[3] / max(first.end_box[2], 1e-6)), 1e-6)
    aspect_b = max(float(second.start_box[3] / max(second.start_box[2], 1e-6)), 1e-6)
    aspect_log_abs = abs(float(math.log(aspect_a / aspect_b)))
    if first.hist is not None and second.hist is not None:
        hist_cosine = float(np.dot(first.hist, second.hist))
    else:
        hist_cosine = 0.0
    return np.asarray(
        [
            float(gap),
            math.log1p(float(gap)),
            center_dist_h,
            pred_center_dist_h,
            _box_iou_tlwh(first.end_box, second.start_box),
            size_log_abs,
            aspect_log_abs,
            hist_cosine,
            abs(float(first.end_score - second.start_score)),
            float(first.end_score),
            float(second.start_score),
            math.log1p(float(min(first.length, second.length))),
        ],
        dtype=np.float32,
    )


def iter_candidate_pairs(
    tracklets: Iterable[Tracklet],
    *,
    max_gap: int,
    max_center_dist_h: float,
    max_pred_center_dist_h: float | None = None,
    min_purity: float | None = None,
) -> Iterable[tuple[Tracklet, Tracklet]]:
    tracks = sorted(tracklets, key=lambda t: (t.start_frame, t.end_frame, t.track_id))
    for first in tracks:
        if min_purity is not None and first.purity < float(min_purity):
            continue
        for second in tracks:
            gap = int(second.start_frame - first.end_frame)
            if gap <= 0:
                continue
            if gap > int(max_gap):
                break
            if min_purity is not None and second.purity < float(min_purity):
                continue
            mean_h = max(float(first.end_box[3] + second.start_box[3]) * 0.5, 1.0)
            dist = float(np.linalg.norm(_box_center_tlwh(second.start_box) - _box_center_tlwh(first.end_box)) / mean_h)
            if dist > float(max_center_dist_h):
                continue
            if max_pred_center_dist_h is not None and first.length >= 2:
                dt = max(1, int(first.frames[-1] - first.frames[-2]))
                velocity = (_box_center_tlwh(first.boxes[-1]) - _box_center_tlwh(first.boxes[-2])) / float(dt)
                pred_center = _box_center_tlwh(first.end_box) + velocity * float(gap)
                pred_dist = float(np.linalg.norm(_box_center_tlwh(second.start_box) - pred_center) / mean_h)
                if pred_dist > float(max_pred_center_dist_h):
                    continue
            if dist <= float(max_center_dist_h):
                yield first, second


def load_model(path: str | Path) -> dict:
    return json.loads(Path(path).expanduser().resolve().read_text(encoding="utf-8"))


def predict_probability(model: dict, features: np.ndarray) -> np.ndarray:
    x = np.asarray(features, dtype=np.float32)
    mean = np.asarray(model["feature_mean"], dtype=np.float32)
    std = np.asarray(model["feature_std"], dtype=np.float32)
    coef = np.asarray(model["coef"], dtype=np.float32)
    intercept = float(model["intercept"])
    z = ((x - mean) / np.maximum(std, 1e-6)) @ coef + intercept
    return 1.0 / (1.0 + np.exp(-np.clip(z, -60.0, 60.0)))


def apply_linking(
    *,
    tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    model: dict,
    threshold: float | None = None,
) -> None:
    threshold_value = float(model.get("threshold", 0.9) if threshold is None else threshold)
    max_gap = int(model.get("max_gap", 90))
    max_center_dist_h = float(model.get("max_center_dist_h", 6.0))
    max_pred_center_dist_h = model.get("max_pred_center_dist_h")
    out_root = Path(output_dir).expanduser().resolve()
    out_root.mkdir(parents=True, exist_ok=True)

    for sequence in sequences:
        tracklets = load_tracklets(tracker_dir, sequence, compute_hist=True, max_hist_samples=int(model.get("max_hist_samples", 6)))
        frame_sets = {track.track_id: set(int(v) for v in track.frames.tolist()) for track in tracklets}
        parent = {track.track_id: track.track_id for track in tracklets}

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a: int, b: int) -> bool:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False
            if frame_sets[ra] & frame_sets[rb]:
                return False
            if len(frame_sets[ra]) < len(frame_sets[rb]):
                ra, rb = rb, ra
            parent[rb] = ra
            frame_sets[ra].update(frame_sets[rb])
            return True

        pairs: list[tuple[float, int, int]] = []
        for first, second in iter_candidate_pairs(
            tracklets,
            max_gap=max_gap,
            max_center_dist_h=max_center_dist_h,
            max_pred_center_dist_h=None if max_pred_center_dist_h is None else float(max_pred_center_dist_h),
        ):
            features = pair_features(first, second)[None, :]
            prob = float(predict_probability(model, features)[0])
            if prob >= threshold_value:
                pairs.append((prob, first.track_id, second.track_id))
        pairs.sort(reverse=True)
        merge_count = 0
        for _prob, a, b in pairs:
            merge_count += int(union(int(a), int(b)))

        root_to_new: dict[int, int] = {}
        next_id = 1
        rows_out = []
        tracker_root = Path(tracker_dir).expanduser().resolve()
        if (tracker_root / "data").exists():
            tracker_root = tracker_root / "data"
        source_rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
        for row in source_rows:
            old_id = int(row[1])
            root = find(old_id)
            if root not in root_to_new:
                root_to_new[root] = next_id
                next_id += 1
            rows_out.append((int(row[0]), root_to_new[root], float(row[2]), float(row[3]), float(row[4]), float(row[5]), float(row[6])))
        write_mot_rows(out_root / f"{sequence.name}.txt", rows_out)
        print(f"{sequence.name}: linked {merge_count} pairs, tracks {len(tracklets)} -> {len(root_to_new)}")
