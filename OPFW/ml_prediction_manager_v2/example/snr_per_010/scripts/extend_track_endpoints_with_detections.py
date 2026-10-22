
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.optimize import linear_sum_assignment

from _common import ensure_outputs, rel
from detection_io import load_detections
from mot20_io import (
    TRAIN_SEQUENCES,
    load_sequences,
    read_mot_rows,
    validate_mot_result_file,
    validate_tracker_dir,
    write_mot_rows,
)
from nms import pairwise_iou_xyxy


@dataclass
class EndpointState:
    track_id: int
    next_frame: int
    last_box: np.ndarray
    velocity: np.ndarray
    misses: int = 0
    added: int = 0


def _tracker_data_dir(path: str | Path) -> Path:
    root = rel(path)
    return root / "data" if (root / "data").exists() else root


def _row_box(row) -> np.ndarray:
    x, y, w, h = [float(value) for value in row[2:6]]
    return np.asarray([x, y, x + w, y + h], dtype=np.float32)


def _to_row(
    frame: int,
    track_id: int,
    box: np.ndarray,
    score: float,
) -> tuple[int, int, float, float, float, float, float]:
    x1, y1, x2, y2 = [float(value) for value in box]
    return (
        int(frame),
        int(track_id),
        x1,
        y1,
        max(x2 - x1, 0.0),
        max(y2 - y1, 0.0),
        float(score),
    )


def _center_distance(predicted: np.ndarray, candidates: np.ndarray) -> np.ndarray:
    predicted_center = np.column_stack(
        [
            (predicted[:, 0] + predicted[:, 2]) * 0.5,
            (predicted[:, 1] + predicted[:, 3]) * 0.5,
        ]
    )
    candidate_center = np.column_stack(
        [
            (candidates[:, 0] + candidates[:, 2]) * 0.5,
            (candidates[:, 1] + candidates[:, 3]) * 0.5,
        ]
    )
    scale = np.maximum(predicted[:, 3] - predicted[:, 1], 1.0)
    delta = predicted_center[:, None, :] - candidate_center[None, :, :]
    return np.linalg.norm(delta, axis=2) / scale[:, None]


def _clip(box: np.ndarray, width: int, height: int) -> np.ndarray:
    result = box.astype(np.float32).copy()
    result[[0, 2]] = np.clip(result[[0, 2]], 0.0, float(width))
    result[[1, 3]] = np.clip(result[[1, 3]], 0.0, float(height))
    return result


def _track_rows(rows) -> dict[int, list]:
    grouped: dict[int, list] = {}
    for row in rows:
        grouped.setdefault(int(row[1]), []).append(row)
    for values in grouped.values():
        values.sort(key=lambda row: int(row[0]))
    return grouped


def _frame_boxes(rows) -> dict[int, list[np.ndarray]]:
    grouped: dict[int, list[np.ndarray]] = {}
    for row in rows:
        grouped.setdefault(int(row[0]), []).append(_row_box(row))
    return grouped


def _endpoint_states(
    grouped: dict[int, list],
    *,
    direction: int,
    sequence_length: int,
    velocity_weight: float,
) -> list[EndpointState]:
    states: list[EndpointState] = []
    for track_id, rows in grouped.items():
        ordered = list(reversed(rows)) if direction > 0 else rows
        endpoint = ordered[0]
        next_frame = int(endpoint[0]) + int(direction)
        if next_frame < 1 or next_frame > int(sequence_length):
            continue
        last_box = _row_box(endpoint)
        velocity = np.zeros((4,), dtype=np.float32)
        if len(ordered) >= 2:
            previous = ordered[1]
            frame_delta = abs(int(endpoint[0]) - int(previous[0]))
            if frame_delta > 0:
                velocity = (
                    (_row_box(endpoint) - _row_box(previous))
                    / float(frame_delta)
                    * float(velocity_weight)
                ).astype(np.float32)
        states.append(
            EndpointState(
                track_id=int(track_id),
                next_frame=next_frame,
                last_box=last_box,
                velocity=velocity,
            )
        )
    return states


def _extend_direction(
    *,
    direction: int,
    grouped_tracks: dict[int, list],
    existing_by_frame: dict[int, list[np.ndarray]],
    detections,
    sequence,
    score_threshold: float,
    match_iou: float,
    center_distance: float,
    duplicate_iou: float,
    max_extension: int,
    max_misses: int,
    velocity_weight: float,
    used_detection_indices: set[int],
) -> list[tuple[int, int, float, float, float, float, float]]:
    states = _endpoint_states(
        grouped_tracks,
        direction=direction,
        sequence_length=int(sequence.seq_length),
        velocity_weight=float(velocity_weight),
    )
    by_frame = detections.by_frame()
    added_rows: list[tuple[int, int, float, float, float, float, float]] = []
    frame_order = (
        range(1, int(sequence.seq_length) + 1)
        if direction > 0
        else range(int(sequence.seq_length), 0, -1)
    )

    for frame in frame_order:
        active = [
            state
            for state in states
            if state.next_frame == int(frame)
            and state.added < int(max_extension)
            and state.misses <= int(max_misses)
        ]
        if not active:
            continue
        indices = by_frame.get(int(frame), np.zeros((0,), dtype=np.int64))
        if len(indices):
            keep = np.asarray(
                [
                    int(index) not in used_detection_indices
                    and float(detections.calibrated_scores[int(index)])
                    >= float(score_threshold)
                    for index in indices
                ],
                dtype=bool,
            )
            indices = indices[keep]
        if len(indices):
            boxes = detections.boxes[indices].astype(np.float32)
            occupied = existing_by_frame.get(int(frame), [])
            if occupied:
                occupied_boxes = np.stack(occupied).astype(np.float32)
                keep = (
                    pairwise_iou_xyxy(boxes, occupied_boxes).max(axis=1)
                    < float(duplicate_iou)
                )
                indices = indices[keep]
                boxes = boxes[keep]
        else:
            boxes = np.zeros((0, 4), dtype=np.float32)

        matched_states: set[int] = set()
        if len(boxes):
            predicted = np.stack(
                [
                    _clip(
                        state.last_box
                        + state.velocity * float(state.misses + 1),
                        int(sequence.width),
                        int(sequence.height),
                    )
                    for state in active
                ]
            )
            iou = pairwise_iou_xyxy(predicted, boxes)
            distance = _center_distance(predicted, boxes)
            valid = (iou >= float(match_iou)) & (
                distance <= float(center_distance)
            )
            cost = 1.0 - iou + 0.10 * distance
            cost[~valid] = 1.0e6
            state_rows, candidate_columns = linear_sum_assignment(cost)
            for state_row, candidate_column in zip(
                state_rows,
                candidate_columns,
                strict=False,
            ):
                if not valid[int(state_row), int(candidate_column)]:
                    continue
                state = active[int(state_row)]
                box = boxes[int(candidate_column)]
                index = int(indices[int(candidate_column)])
                score = float(detections.calibrated_scores[index])
                row = _to_row(int(frame), state.track_id, box, score)
                added_rows.append(row)
                existing_by_frame.setdefault(int(frame), []).append(box)
                used_detection_indices.add(index)
                state.velocity = (
                    0.5 * state.velocity
                    + 0.5
                    * (box - state.last_box)
                    / float(state.misses + 1)
                ).astype(np.float32)
                state.last_box = box.astype(np.float32)
                state.next_frame += int(direction)
                state.misses = 0
                state.added += 1
                matched_states.add(id(state))

        for state in active:
            if id(state) in matched_states:
                continue
            state.misses += 1
            state.next_frame += int(direction)
    return added_rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extend trusted track endpoints with one-to-one frozen-VLM detections."
    )
    parser.add_argument("--input-tracker-dir", required=True)
    parser.add_argument("--detections", required=True)
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--score-threshold", type=float, default=0.50)
    parser.add_argument("--match-iou", type=float, default=0.30)
    parser.add_argument("--center-distance", type=float, default=0.75)
    parser.add_argument("--duplicate-iou", type=float, default=0.50)
    parser.add_argument("--max-extension", type=int, default=10)
    parser.add_argument("--max-misses", type=int, default=1)
    parser.add_argument("--velocity-weight", type=float, default=0.50)
    parser.add_argument(
        "--directions",
        nargs="+",
        choices=["forward", "backward"],
        default=["forward", "backward"],
    )
    parser.add_argument("--copy-to-trackeval", action="store_true")
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--benchmark", default="MOT20")
    parser.add_argument("--split", default="train")
    parser.add_argument("--overwrite-trackeval", action="store_true")
    args = parser.parse_args()

    if str(args.output_tracker_name).startswith("ORACLE_"):
        raise AssertionError("Endpoint extension outputs cannot use ORACLE_ names.")
    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be processed: {unknown}")

    input_root = _tracker_data_dir(args.input_tracker_dir)
    detection_root = rel(args.detections)
    output_root = rel(Path("outputs/tracks") / str(args.output_tracker_name))
    output_root.mkdir(parents=True, exist_ok=True)
    metadata = {
        "input_tracker_dir": str(input_root),
        "detections": str(detection_root),
        "parameters": vars(args),
        "sequence_counts": {},
        "note": "No GT is used; only trusted tracks and frozen-VLM detections are used.",
    }

    for sequence in load_sequences(rel(args.data_root), names):
        rows = read_mot_rows(input_root / f"{sequence.name}.txt")
        grouped = _track_rows(rows)
        existing_by_frame = _frame_boxes(rows)
        detections = load_detections(detection_root / f"{sequence.name}.npz")
        used_indices: set[int] = set()
        forward = (
            _extend_direction(
                direction=1,
                grouped_tracks=grouped,
                existing_by_frame=existing_by_frame,
                detections=detections,
                sequence=sequence,
                score_threshold=float(args.score_threshold),
                match_iou=float(args.match_iou),
                center_distance=float(args.center_distance),
                duplicate_iou=float(args.duplicate_iou),
                max_extension=int(args.max_extension),
                max_misses=int(args.max_misses),
                velocity_weight=float(args.velocity_weight),
                used_detection_indices=used_indices,
            )
            if "forward" in args.directions
            else []
        )
        backward = (
            _extend_direction(
                direction=-1,
                grouped_tracks=grouped,
                existing_by_frame=existing_by_frame,
                detections=detections,
                sequence=sequence,
                score_threshold=float(args.score_threshold),
                match_iou=float(args.match_iou),
                center_distance=float(args.center_distance),
                duplicate_iou=float(args.duplicate_iou),
                max_extension=int(args.max_extension),
                max_misses=int(args.max_misses),
                velocity_weight=float(args.velocity_weight),
                used_detection_indices=used_indices,
            )
            if "backward" in args.directions
            else []
        )
        output_rows = [
            (
                int(row[0]),
                int(row[1]),
                float(row[2]),
                float(row[3]),
                float(row[4]),
                float(row[5]),
                float(row[6]),
            )
            for row in rows
        ]
        output_rows.extend(forward)
        output_rows.extend(backward)
        output_path = output_root / f"{sequence.name}.txt"
        write_mot_rows(output_path, output_rows)
        validate_mot_result_file(output_path)
        metadata["sequence_counts"][sequence.name] = {
            "base_rows": int(len(rows)),
            "forward_rows": int(len(forward)),
            "backward_rows": int(len(backward)),
            "total_rows": int(len(output_rows)),
        }

    if set(names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(output_root)
    (output_root / "endpoint_extension_metadata.json").write_text(
        json.dumps(metadata, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    if args.copy_to_trackeval:
        destination = (
            rel(args.trackeval_root)
            / "data"
            / "trackers"
            / "mot_challenge"
            / f"{args.benchmark}-{args.split}"
            / str(args.output_tracker_name)
            / "data"
        )
        if destination.exists() and args.overwrite_trackeval:
            shutil.rmtree(destination)
        destination.mkdir(parents=True, exist_ok=True)
        for name in names:
            shutil.copy2(output_root / f"{name}.txt", destination / f"{name}.txt")
        print(f"Copied endpoint-extended tracker to TrackEval: {destination}")

    print(json.dumps(metadata["sequence_counts"], indent=2, sort_keys=True))
    print(f"Wrote endpoint-extended tracks: {output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
