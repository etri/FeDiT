from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Mapping, Sequence

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, log_loss, roc_auc_score

from calibration import _match_detection_labels
from detection_io import DetectionSet, load_detections
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, load_sequences


@dataclass(frozen=True, slots=True)
class FoldConfig:
    heldout: str
    source_dir: str
    score_dir: str
    box_dir: str | None = None

    @property
    def train_sequences(self) -> tuple[str, ...]:
        return tuple(name for name in TRAIN_SEQUENCES if name != self.heldout)


FOLD_CONFIGS: tuple[FoldConfig, ...] = (
    FoldConfig(
        heldout="MOT20-01",
        source_dir="outputs/detections/strictcv3315_yolo_f01_stride8_s_e2_all_imported",
        score_dir="outputs/detections/strictcv3315_yolo_temporal_neuralcond_f01_bal_inv_all_scores_s005",
        box_dir="outputs/detections/papers_temporal_box_f01_heldout",
    ),
    FoldConfig(
        heldout="MOT20-02",
        source_dir="outputs/detections/strictcv3315_yolo_f02_stride4_s_e1_all_nmstimefix_imported",
        score_dir="outputs/detections/strictcv3315_yolo_stride4_temporal_f02_pw1_all_s005",
        box_dir="outputs/detections/strictcv3315_yolo_stride4_temporal_box_f02_s1_all",
    ),
    FoldConfig(
        heldout="MOT20-03",
        source_dir="outputs/detections/strictcv3315_yolo_f03_stride4_s_e2best1_all_imported",
        score_dir="outputs/detections/strictcv3315_yolo_stride4_temporal_f03_pw1_all_s005",
        box_dir="outputs/detections/papers_temporal_box_f03_heldout",
    ),
    FoldConfig(
        heldout="MOT20-05",
        source_dir="outputs/detections/strictcv3315_yolo_f05_stride8_s_e2_all_imported",
        score_dir="outputs/detections/strictcv3315_yolo_temporal_neuralcond_f05_bal_inv_all_scores_s005",
        box_dir="outputs/detections/papers_temporal_box_f05_heldout",
    ),
)


def project_path(project_root: str | Path, value: str | Path) -> Path:
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (Path(project_root).resolve() / path).resolve()


def sequence_map(data_root: str | Path) -> dict[str, SequenceInfo]:
    return {sequence.name: sequence for sequence in load_sequences(data_root)}


def file_fingerprint(path: str | Path) -> str:
    resolved = Path(path).resolve()
    stat = resolved.stat()
    payload = f"{resolved}:{stat.st_size}:{stat.st_mtime_ns}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()[:16]


def load_or_compute_labels(
    *,
    detection_path: str | Path,
    gt_path: str | Path,
    cache_dir: str | Path,
    iou_threshold: float = 0.5,
) -> tuple[np.ndarray, np.ndarray]:
    detection_path = Path(detection_path).resolve()
    cache_root = Path(cache_dir).resolve()
    cache_root.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(
        (
            file_fingerprint(detection_path)
            + file_fingerprint(gt_path)
            + f":{float(iou_threshold):.6f}"
        ).encode("utf-8")
    ).hexdigest()[:20]
    cache_path = cache_root / f"labels_{detection_path.stem}_{key}.npz"
    if cache_path.exists():
        with np.load(cache_path) as values:
            return values["labels"].astype(np.int8), values["max_ious"].astype(np.float32)
    detections = load_detections(detection_path)
    labels, max_ious = _match_detection_labels(
        detections,
        Path(gt_path),
        iou_threshold=float(iou_threshold),
    )
    np.savez_compressed(cache_path, labels=labels, max_ious=max_ious)
    return labels, max_ious


def expected_calibration_error(
    labels: np.ndarray,
    probabilities: np.ndarray,
    *,
    bins: int = 15,
) -> float:
    y = np.asarray(labels, dtype=np.int8)
    p = np.clip(np.asarray(probabilities, dtype=np.float64), 0.0, 1.0)
    if len(y) == 0:
        return float("nan")
    edges = np.linspace(0.0, 1.0, int(bins) + 1)
    ids = np.clip(np.searchsorted(edges, p, side="right") - 1, 0, int(bins) - 1)
    ece = 0.0
    for bin_id in range(int(bins)):
        mask = ids == bin_id
        if not np.any(mask):
            continue
        ece += float(np.mean(mask)) * abs(float(np.mean(y[mask])) - float(np.mean(p[mask])))
    return float(ece)


def score_metrics(
    labels: np.ndarray,
    probabilities: np.ndarray,
    *,
    ece_bins: int = 15,
) -> dict[str, float]:
    y = np.asarray(labels, dtype=np.int8)
    p = np.clip(np.asarray(probabilities, dtype=np.float64), 1e-6, 1.0 - 1e-6)
    if len(y) != len(p):
        raise ValueError(f"Label/score length mismatch: {len(y)} != {len(p)}")
    if len(y) == 0 or len(np.unique(y)) < 2:
        raise ValueError("Score metrics require non-empty binary labels containing both classes")
    return {
        "samples": int(len(y)),
        "positive_rate": float(np.mean(y)),
        "ece": expected_calibration_error(y, p, bins=ece_bins),
        "brier": float(np.mean(np.square(p - y))),
        "nll": float(log_loss(y, p, labels=[0, 1])),
        "auprc": float(average_precision_score(y, p)),
        "roc_auc": float(roc_auc_score(y, p)),
    }


def reliability_points(
    labels: np.ndarray,
    probabilities: np.ndarray,
    *,
    bins: int = 15,
) -> pd.DataFrame:
    y = np.asarray(labels, dtype=np.int8)
    p = np.clip(np.asarray(probabilities, dtype=np.float64), 0.0, 1.0)
    edges = np.linspace(0.0, 1.0, int(bins) + 1)
    ids = np.clip(np.searchsorted(edges, p, side="right") - 1, 0, int(bins) - 1)
    rows: list[dict[str, float | int]] = []
    for bin_id in range(int(bins)):
        mask = ids == bin_id
        if not np.any(mask):
            continue
        rows.append(
            {
                "bin": bin_id,
                "lower": float(edges[bin_id]),
                "upper": float(edges[bin_id + 1]),
                "count": int(np.sum(mask)),
                "mean_confidence": float(np.mean(p[mask])),
                "empirical_precision": float(np.mean(y[mask])),
            }
        )
    return pd.DataFrame(rows)


def assert_candidate_alignment(
    reference: DetectionSet,
    candidate: DetectionSet,
    *,
    box_tolerance: float | None = 1e-4,
) -> None:
    if len(reference) != len(candidate):
        raise AssertionError(f"Candidate count differs: {len(reference)} != {len(candidate)}")
    if not np.array_equal(reference.frames, candidate.frames):
        raise AssertionError("Candidate frames are not aligned")
    if box_tolerance is not None:
        max_delta = float(np.max(np.abs(reference.boxes - candidate.boxes))) if len(reference) else 0.0
        if max_delta > float(box_tolerance):
            raise AssertionError(f"Candidate boxes differ by up to {max_delta:.6f} pixels")


def deterministic_subsample(
    arrays: Sequence[np.ndarray],
    *,
    max_samples: int,
    seed: int,
) -> tuple[np.ndarray, ...]:
    if not arrays:
        return tuple()
    count = len(arrays[0])
    if any(len(array) != count for array in arrays):
        raise ValueError("Subsample arrays must have the same first dimension")
    if count <= int(max_samples):
        return tuple(np.asarray(array) for array in arrays)
    rng = np.random.default_rng(int(seed))
    indices = np.sort(rng.choice(count, size=int(max_samples), replace=False))
    return tuple(np.asarray(array)[indices] for array in arrays)


def percentile_interval(
    values: np.ndarray,
    *,
    confidence: float = 0.95,
) -> tuple[float, float]:
    alpha = (1.0 - float(confidence)) / 2.0
    return (
        float(np.quantile(values, alpha)),
        float(np.quantile(values, 1.0 - alpha)),
    )


def paired_frame_bootstrap(
    frame_ids: np.ndarray,
    values_a: np.ndarray,
    values_b: np.ndarray,
    *,
    repeats: int = 1000,
    seed: int = 20260805,
) -> dict[str, float]:
    frame_ids = np.asarray(frame_ids, dtype=np.int32)
    values_a = np.asarray(values_a, dtype=np.float64)
    values_b = np.asarray(values_b, dtype=np.float64)
    if not (len(frame_ids) == len(values_a) == len(values_b)):
        raise ValueError("Bootstrap arrays must have equal lengths")
    unique_frames = np.unique(frame_ids)
    frame_deltas = np.asarray(
        [np.mean(values_b[frame_ids == frame]) - np.mean(values_a[frame_ids == frame]) for frame in unique_frames],
        dtype=np.float64,
    )
    rng = np.random.default_rng(int(seed))
    draws = np.empty(int(repeats), dtype=np.float64)
    for repeat in range(int(repeats)):
        sample = rng.choice(frame_deltas, size=len(frame_deltas), replace=True)
        draws[repeat] = float(np.mean(sample))
    lower, upper = percentile_interval(draws)
    return {
        "mean_delta": float(np.mean(frame_deltas)),
        "ci95_lower": lower,
        "ci95_upper": upper,
        "bootstrap_repeats": int(repeats),
        "frames": int(len(unique_frames)),
    }


def dataframe_to_markdown(frame: pd.DataFrame, *, digits: int = 6) -> str:
    display = frame.copy()
    for column in display.select_dtypes(include=[np.number]).columns:
        display[column] = display[column].map(
            lambda value: "" if pd.isna(value) else f"{float(value):.{digits}f}"
        )
    columns = [str(column) for column in display.columns]

    def escape(value: object) -> str:
        if pd.isna(value):
            return ""
        return str(value).replace("|", "\\|").replace("\n", " ")

    lines = [
        "| " + " | ".join(escape(column) for column in columns) + " |",
        "| " + " | ".join("---" for _ in columns) + " |",
    ]
    for values in display.itertuples(index=False, name=None):
        lines.append("| " + " | ".join(escape(value) for value in values) + " |")
    return "\n".join(lines)


def save_table_bundle(
    frame: pd.DataFrame,
    output_stem: str | Path,
    *,
    digits: int = 6,
) -> dict[str, str]:
    stem = Path(output_stem).resolve()
    stem.parent.mkdir(parents=True, exist_ok=True)
    csv_path = stem.with_suffix(".csv")
    md_path = stem.with_suffix(".md")
    tex_path = stem.with_suffix(".tex")
    frame.to_csv(csv_path, index=False)
    md_path.write_text(dataframe_to_markdown(frame, digits=digits) + "\n", encoding="utf-8")
    tex_path.write_text(
        frame.to_latex(index=False, float_format=lambda value: f"{value:.{digits}f}"),
        encoding="utf-8",
    )
    return {"csv": str(csv_path), "markdown": str(md_path), "latex": str(tex_path)}


def write_manifest(path: str | Path, payload: Mapping) -> Path:
    resolved = Path(path).resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return resolved


def fold_manifest(project_root: str | Path) -> list[dict]:
    root = Path(project_root).resolve()
    rows: list[dict] = []
    for fold in FOLD_CONFIGS:
        row = asdict(fold)
        row["train_sequences"] = list(fold.train_sequences)
        for key in ("source_dir", "score_dir", "box_dir"):
            if row[key] is not None:
                row[key] = str(project_path(root, row[key]))
        rows.append(row)
    return rows


def finite_mean(values: Iterable[float]) -> float:
    array = np.asarray(list(values), dtype=np.float64)
    array = array[np.isfinite(array)]
    return float(np.mean(array)) if len(array) else math.nan
