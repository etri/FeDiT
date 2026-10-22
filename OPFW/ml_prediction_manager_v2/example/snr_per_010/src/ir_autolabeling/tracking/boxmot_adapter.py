from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.tracking.tracker_factory import build_tracker
from ir_autolabeling.tracking.postprocess import (
    clip_filter_mot_results,
    filter_short_tracks,
    interpolate_mot_results,
)
from ir_autolabeling.utils.io import iter_jsonl


@dataclass(slots=True)
class TrackingRunArtifact:
    tracker_name: str
    sequence_name: str
    result_path: Path
    frames_path: Path
    num_frames: int


def _tracks_to_rows(frame_idx: int, tracks: np.ndarray) -> list[str]:
    if tracks is None or len(tracks) == 0:
        return []
    rows: list[str] = []
    for track in tracks:
        x1, y1, x2, y2 = [float(v) for v in track[:4]]
        track_id = int(track[4])
        conf = float(track[5]) if len(track) > 5 else 1.0
        width = max(0.0, x2 - x1)
        height = max(0.0, y2 - y1)
        rows.append(
            f"{frame_idx},{track_id},{x1:.3f},{y1:.3f},{width:.3f},{height:.3f},{conf:.6f},-1,-1,-1"
        )
    return rows


def _maybe_emit_boosttrack_predictions(
    tracker: Any,
    *,
    already_emitted_ids: set[int],
    max_gap: int,
    min_score: float | None,
) -> np.ndarray:
    pass
    max_gap = int(max_gap)
    if max_gap <= 0:
        return np.empty((0, 6), dtype=np.float32)

    try:
        from boxmot.trackers.boosttrack.boosttrack import BoostTrack  
    except Exception:
        return np.empty((0, 6), dtype=np.float32)

    if not isinstance(tracker, BoostTrack):
        return np.empty((0, 6), dtype=np.float32)

    predictions: list[list[float]] = []
    for trk in getattr(tracker, "trackers", []) or []:
        track_id = int(getattr(trk, "id", -1))
        if track_id <= 0 or track_id in already_emitted_ids:
            continue
        time_since_update = int(getattr(trk, "time_since_update", 999999))
        if time_since_update <= 0 or time_since_update > max_gap:
            continue

        state = trk.get_state()[0]
        x1, y1, x2, y2 = [float(v) for v in state[:4]]
        last_conf = float(getattr(trk, "conf", 1.0))
        try:
            decay = float(trk.get_confidence())
        except Exception:
            decay = 1.0
        conf = max(0.0, min(1.0, last_conf * decay))
        if min_score is not None and conf < float(min_score):
            continue
        predictions.append([x1, y1, x2, y2, float(track_id), conf])

    if not predictions:
        return np.empty((0, 6), dtype=np.float32)
    return np.asarray(predictions, dtype=np.float32)


def run_tracker_on_sequence(
    *,
    sequence_name: str,
    detection_cache_path: str | Path,
    max_frames: int | None,
    frame_stride: int = 1,
    start_frame: int = 1,
    tracker_name: str,
    tracker_params: dict[str, Any],
    detector_postprocess: dict[str, Any],
    frame_rate: int,
    image_width: int,
    image_height: int,
    tracker_device: str,
    tracker_half: bool,
    reid_weights: str | None,
    output_dir: str | Path,
    interpolate_max_gap: int = 0,
    interpolate_min_endpoint_score: float | None = None,
    interpolate_min_endpoint_iou: float | None = None,
    emit_predicted_max_gap: int = 0,
    emit_predicted_min_score: float | None = None,
    clip_boxes: bool = False,
    postprocess_min_score: float | None = None,
    postprocess_min_box_area: float | None = None,
    postprocess_min_height: float | None = None,
    postprocess_min_width: float | None = None,
    postprocess_min_height_width_ratio: float | None = None,
    postprocess_max_height_width_ratio: float | None = None,
    postprocess_max_box_area_fraction: float | None = None,
    postprocess_min_track_length: int | None = None,
    postprocess_min_track_avg_score: float | None = None,
    postprocess_min_track_total_score: float | None = None,
) -> TrackingRunArtifact:
    output_path = Path(output_dir).expanduser().resolve()
    output_path.mkdir(parents=True, exist_ok=True)
    result_path = output_path / f"{sequence_name}.txt"
    frames_path = output_path / f"{sequence_name}.frames.txt"

    try:
        frame_stride = max(1, int(frame_stride or 1))
    except Exception:
        frame_stride = 1
    try:
        start_frame = max(1, int(start_frame or 1))
    except Exception:
        start_frame = 1

    tracker = build_tracker(
        tracker_name,
        tracker_params,
        frame_rate=frame_rate,
        image_width=image_width,
        image_height=image_height,
        device=tracker_device,
        half=tracker_half,
        reid_weights=reid_weights,
    )

    allow_dummy_frame = False
    dummy_frame: np.ndarray | None = None
    if str(tracker_name).lower() == "boosttrack":
        try:
            use_ecc = bool(tracker_params.get("use_ecc", True))
            with_reid = bool(tracker_params.get("with_reid", False))
        except Exception:
            use_ecc = True
            with_reid = False
        if not use_ecc and not with_reid:
            allow_dummy_frame = True
            dummy_frame = np.zeros((int(image_height), int(image_width), 3), dtype=np.uint8)

    num_frames = 0
    frame_indices: list[int] = []
    previous_frame_idx: int | None = None
    with result_path.open("w", encoding="utf-8") as handle:
        for payload in iter_jsonl(detection_cache_path):
            raw = RawDetections.from_json_dict(payload)
            if previous_frame_idx is not None and int(raw.frame_idx) <= previous_frame_idx:
                raise RuntimeError(
                    f"Detection cache frame order is not strictly increasing for {sequence_name}: "
                    f"previous={previous_frame_idx}, current={raw.frame_idx}, path={detection_cache_path}"
                )
            previous_frame_idx = int(raw.frame_idx)
            if int(raw.frame_idx) < start_frame:
                continue
            if ((int(raw.frame_idx) - start_frame) % frame_stride) != 0:
                continue
            if max_frames is not None and num_frames >= int(max_frames):
                break
            num_frames += 1
            frame_indices.append(int(raw.frame_idx))
            if allow_dummy_frame and dummy_frame is not None:
                frame = dummy_frame
            else:
                frame = cv2.imread(raw.image_path)
                if frame is None:
                    raise FileNotFoundError(f"Failed to read frame: {raw.image_path}")
            detections = raw.to_tracker_detections(**detector_postprocess)
            if len(detections) > 0:
                
                detections[:, 5] = 0.0
            tracks = tracker.update(detections, frame)
            emitted_ids: set[int] = set()
            if tracks is not None and len(tracks) > 0:
                for track in tracks:
                    if len(track) > 4:
                        try:
                            emitted_ids.add(int(track[4]))
                        except Exception:
                            continue

            rows = _tracks_to_rows(raw.frame_idx, tracks)
            if rows:
                handle.write("\n".join(rows) + "\n")
            predicted = _maybe_emit_boosttrack_predictions(
                tracker,
                already_emitted_ids=emitted_ids,
                max_gap=int(emit_predicted_max_gap),
                min_score=emit_predicted_min_score,
            )
            pred_rows = _tracks_to_rows(raw.frame_idx, predicted)
            if pred_rows:
                handle.write("\n".join(pred_rows) + "\n")

    frames_path.write_text(
        "\n".join(str(frame_idx) for frame_idx in frame_indices) + ("\n" if frame_indices else ""),
        encoding="utf-8",
    )

    if int(interpolate_max_gap) > 0:
        interpolate_mot_results(
            result_path,
            max_gap=int(interpolate_max_gap),
            min_endpoint_score=(
                float(interpolate_min_endpoint_score)
                if interpolate_min_endpoint_score is not None
                else None
            ),
            min_endpoint_iou=(
                float(interpolate_min_endpoint_iou) if interpolate_min_endpoint_iou is not None else None
            ),
        )

    if (
        bool(clip_boxes)
        or postprocess_min_score is not None
        or postprocess_min_box_area is not None
        or postprocess_min_height is not None
        or postprocess_min_width is not None
        or postprocess_min_height_width_ratio is not None
        or postprocess_max_height_width_ratio is not None
        or postprocess_max_box_area_fraction is not None
    ):
        clip_filter_mot_results(
            result_path,
            image_width=image_width,
            image_height=image_height,
            clip_boxes=bool(clip_boxes),
            min_score=postprocess_min_score,
            min_box_area=postprocess_min_box_area,
            min_height=postprocess_min_height,
            min_width=postprocess_min_width,
            min_height_width_ratio=postprocess_min_height_width_ratio,
            max_height_width_ratio=postprocess_max_height_width_ratio,
            max_box_area_fraction=postprocess_max_box_area_fraction,
        )

    try:
        min_track_length_value = int(postprocess_min_track_length) if postprocess_min_track_length is not None else 0
    except Exception:
        min_track_length_value = 0

    if (
        min_track_length_value > 1
        or postprocess_min_track_avg_score is not None
        or postprocess_min_track_total_score is not None
    ):
        filter_short_tracks(
            result_path,
            min_track_length=max(1, min_track_length_value),
            min_avg_score=(
                float(postprocess_min_track_avg_score) if postprocess_min_track_avg_score is not None else None
            ),
            min_total_score=(
                float(postprocess_min_track_total_score) if postprocess_min_track_total_score is not None else None
            ),
        )

    return TrackingRunArtifact(
        tracker_name=tracker_name,
        sequence_name=sequence_name,
        result_path=result_path,
        frames_path=frames_path,
        num_frames=num_frames,
    )
