from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import motmetrics as mm
import numpy as np
import pandas as pd
from scipy.optimize import linear_sum_assignment

from ir_autolabeling.utils.geometry import pairwise_iou_xyxy, xyxy_to_tlwh

if not hasattr(np, "asfarray"):
    np.asfarray = lambda values, dtype=float: np.asarray(values, dtype=dtype)  


TARGET_CLASS_IDS = {1}




IGNORE_CLASS_IDS = {2, 6, 7, 8, 11, 12, 13}


@dataclass(slots=True)
class SequenceEvalInput:
    name: str
    gt_path: Path
    result_path: Path
    evaluated_frames_path: Path | None = None


@dataclass(slots=True)
class MOTSummary:
    mota: float
    idf1: float
    precision: float
    recall: float
    num_switches: int
    num_false_positives: int
    num_misses: int
    num_frames: int
    per_sequence: dict[str, dict[str, float | int]]


def count_mot_gt_objects(gt_path: Path, evaluated_frames: list[int] | None = None) -> int:
    valid, _ignore = _load_gt(gt_path)
    if evaluated_frames is not None:
        valid = valid[valid["frame"].isin(set(evaluated_frames))]
    return int(len(valid))


def _load_gt(gt_path: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    frame = pd.read_csv(gt_path, header=None)
    frame.columns = list(range(frame.shape[1]))
    if frame.shape[1] < 9:
        for missing in range(frame.shape[1], 9):
            frame[missing] = 1
    frame.columns = [
        "frame",
        "id",
        "x",
        "y",
        "w",
        "h",
        "mark",
        "class_id",
        "visibility",
    ]
    valid = frame[(frame["mark"] == 1) & (frame["class_id"].isin(TARGET_CLASS_IDS))].copy()
    ignore = frame[(frame["mark"] == 0) | (frame["class_id"].isin(IGNORE_CLASS_IDS))].copy()
    return valid, ignore


def _load_results(result_path: Path) -> pd.DataFrame:
    if not result_path.exists():
        raise FileNotFoundError(f"Result file not found: {result_path}")
    if result_path.stat().st_size == 0:
        return pd.DataFrame(columns=["frame", "id", "x", "y", "w", "h", "score"])
    
    
    rows: list[list[float]] = []
    with result_path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue
            parts = text.split(",")
            if len(parts) < 6:
                continue
            if len(parts) < 7:
                parts = parts + ["-1"] * (7 - len(parts))
            parts = parts[:7]
            try:
                rows.append(
                    [
                        float(parts[0]),
                        float(parts[1]),
                        float(parts[2]),
                        float(parts[3]),
                        float(parts[4]),
                        float(parts[5]),
                        float(parts[6]),
                    ]
                )
            except Exception:
                continue
    if not rows:
        return pd.DataFrame(columns=["frame", "id", "x", "y", "w", "h", "score"])
    frame = pd.DataFrame(rows, columns=["frame", "id", "x", "y", "w", "h", "score"])
    return frame


def _load_evaluated_frames(path: Path | None) -> list[int] | None:
    if path is None or not path.exists():
        return None
    values = [
        int(line.strip())
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return sorted(set(values))


def _to_xyxy(df: pd.DataFrame) -> np.ndarray:
    if len(df) == 0:
        return np.zeros((0, 4), dtype=np.float64)
    x1 = df["x"].to_numpy(dtype=np.float64)
    y1 = df["y"].to_numpy(dtype=np.float64)
    x2 = x1 + df["w"].to_numpy(dtype=np.float64)
    y2 = y1 + df["h"].to_numpy(dtype=np.float64)
    return np.stack([x1, y1, x2, y2], axis=1)


def _remove_ignore_matched_predictions(
    pred_frame: pd.DataFrame,
    gt_frame: pd.DataFrame,
    ignore_frame: pd.DataFrame,
    iou_threshold: float = 0.5,
) -> pd.DataFrame:
    pass
    if len(pred_frame) == 0 or len(ignore_frame) == 0:
        return pred_frame

    pred_boxes = _to_xyxy(pred_frame)
    if len(gt_frame) == 0:
        all_gt_frame = ignore_frame.copy()
        ignore_start = 0
    else:
        all_gt_frame = pd.concat([gt_frame, ignore_frame], ignore_index=True)
        ignore_start = len(gt_frame)
    all_gt_boxes = _to_xyxy(all_gt_frame)
    if all_gt_boxes.size == 0 or pred_boxes.size == 0:
        return pred_frame

    matching_scores = pairwise_iou_xyxy(all_gt_boxes, pred_boxes)
    matching_scores[matching_scores < float(iou_threshold) - np.finfo("float").eps] = 0.0
    if matching_scores.size == 0 or not np.any(matching_scores > 0.0):
        return pred_frame

    match_rows, match_cols = linear_sum_assignment(-matching_scores)
    matched_scores = matching_scores[match_rows, match_cols]
    valid_matches = matched_scores > 0.0 + np.finfo("float").eps
    if not np.any(valid_matches):
        return pred_frame

    match_rows = match_rows[valid_matches]
    match_cols = match_cols[valid_matches]
    ignore_match_cols = match_cols[match_rows >= ignore_start]
    if len(ignore_match_cols) == 0:
        return pred_frame

    keep_mask = np.ones(len(pred_frame), dtype=bool)
    keep_mask[ignore_match_cols.astype(int)] = False
    return pred_frame.loc[pred_frame.index[keep_mask]].copy()


def _build_sequence_accumulator(input_item: SequenceEvalInput) -> mm.MOTAccumulator:
    gt_df, ignore_df = _load_gt(input_item.gt_path)
    pred_df = _load_results(input_item.result_path)
    evaluated_frames = _load_evaluated_frames(input_item.evaluated_frames_path)
    if evaluated_frames is not None:
        gt_df = gt_df[gt_df["frame"].isin(evaluated_frames)].copy()
        ignore_df = ignore_df[ignore_df["frame"].isin(evaluated_frames)].copy()
        pred_df = pred_df[pred_df["frame"].isin(evaluated_frames)].copy()
    accumulator = mm.MOTAccumulator(auto_id=True)

    if evaluated_frames is not None:
        frame_indices = evaluated_frames
    else:
        max_frame = int(
            max(
                gt_df["frame"].max() if len(gt_df) else 0,
                pred_df["frame"].max() if len(pred_df) else 0,
            )
        )
        frame_indices = list(range(1, max_frame + 1))

    for frame_idx in frame_indices:
        gt_frame = gt_df[gt_df["frame"] == frame_idx]
        pred_frame = pred_df[pred_df["frame"] == frame_idx]
        ignore_frame = ignore_df[ignore_df["frame"] == frame_idx]
        pred_frame = _remove_ignore_matched_predictions(pred_frame, gt_frame, ignore_frame)

        gt_ids = gt_frame["id"].to_numpy(dtype=int).tolist()
        pred_ids = pred_frame["id"].to_numpy(dtype=int).tolist()
        gt_boxes = gt_frame[["x", "y", "w", "h"]].to_numpy(dtype=np.float64)
        pred_boxes = pred_frame[["x", "y", "w", "h"]].to_numpy(dtype=np.float64)
        distance = mm.distances.iou_matrix(gt_boxes, pred_boxes, max_iou=0.5)
        accumulator.update(gt_ids, pred_ids, distance)

    return accumulator


def _evaluate_sequence(input_item: SequenceEvalInput) -> tuple[mm.MOTAccumulator, dict[str, float | int]]:
    accumulator = _build_sequence_accumulator(input_item)
    metrics_host = mm.metrics.create()
    summary = metrics_host.compute(
        accumulator,
        metrics=[
            "num_frames",
            "mota",
            "idf1",
            "precision",
            "recall",
            "num_switches",
            "num_false_positives",
            "num_misses",
        ],
        name=input_item.name,
    )
    row = summary.loc[input_item.name]
    return accumulator, {
        "num_frames": int(row["num_frames"]),
        "mota": float(row["mota"]),
        "idf1": float(row["idf1"]),
        "precision": float(row["precision"]),
        "recall": float(row["recall"]),
        "num_switches": int(row["num_switches"]),
        "num_false_positives": int(row["num_false_positives"]),
        "num_misses": int(row["num_misses"]),
    }


def evaluate_motchallenge(inputs: list[SequenceEvalInput]) -> MOTSummary:
    sequence_results = []
    for item in inputs:
        accumulator, summary = _evaluate_sequence(item)
        sequence_results.append((item.name, accumulator, summary))
    per_sequence = {name: summary for name, _, summary in sequence_results}
    accumulators = [acc for _, acc, _ in sequence_results]
    names = [name for name, _, _ in sequence_results]

    metrics_host = mm.metrics.create()
    overall_summary = metrics_host.compute_many(
        accumulators,
        names=names,
        metrics=[
            "num_frames",
            "mota",
            "idf1",
            "precision",
            "recall",
            "num_switches",
            "num_false_positives",
            "num_misses",
        ],
        generate_overall=True,
    )
    overall = overall_summary.loc["OVERALL"]

    return MOTSummary(
        mota=float(overall["mota"]),
        idf1=float(overall["idf1"]),
        precision=float(overall["precision"]),
        recall=float(overall["recall"]),
        num_switches=int(overall["num_switches"]),
        num_false_positives=int(overall["num_false_positives"]),
        num_misses=int(overall["num_misses"]),
        num_frames=int(overall["num_frames"]),
        per_sequence=per_sequence,
    )
