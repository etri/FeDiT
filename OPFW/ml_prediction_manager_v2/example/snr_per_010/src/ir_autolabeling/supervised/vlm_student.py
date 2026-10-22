from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch

from ir_autolabeling.data.mot20 import iter_frame_paths, load_mot20_sequences
from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.utils.config import ensure_dir
from ir_autolabeling.utils.io import append_jsonl, iter_jsonl


def _resolve_device(name: str) -> str:
    normalized = str(name or "auto").strip().lower()
    if normalized == "auto":
        if torch.cuda.is_available():
            return "cuda:0"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    return normalized


def _load_ultralytics_yolo(weights: str) -> Any:
    from ultralytics import YOLO

    original_load = torch.load

    def compatible_load(*args: Any, **kwargs: Any) -> Any:
        
        kwargs.setdefault("weights_only", False)
        return original_load(*args, **kwargs)

    torch.load = compatible_load
    try:
        return YOLO(weights)
    finally:
        torch.load = original_load


def _json_default(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value)
    raise TypeError(f"Object of type {type(value)!r} is not JSON serializable")


def _ensure_symlink(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_symlink():
        if target.resolve() == source.resolve():
            return
        target.unlink()
    elif target.exists():
        return
    target.symlink_to(source)


def _xyxy_to_xywh(boxes: np.ndarray) -> np.ndarray:
    converted = boxes.copy()
    converted[:, 2] = np.maximum(0.0, converted[:, 2] - converted[:, 0])
    converted[:, 3] = np.maximum(0.0, converted[:, 3] - converted[:, 1])
    return converted


def _xyxy_to_yolo(boxes: np.ndarray, width: int, height: int) -> np.ndarray:
    converted = _xyxy_to_xywh(boxes)
    converted[:, 0] = (converted[:, 0] + (converted[:, 2] / 2.0)) / max(float(width), 1.0)
    converted[:, 1] = (converted[:, 1] + (converted[:, 3] / 2.0)) / max(float(height), 1.0)
    converted[:, 2] = converted[:, 2] / max(float(width), 1.0)
    converted[:, 3] = converted[:, 3] / max(float(height), 1.0)
    return np.clip(converted, 0.0, 1.0)


def _pairwise_iou_xyxy(boxes_a: np.ndarray, boxes_b: np.ndarray) -> np.ndarray:
    if len(boxes_a) == 0 or len(boxes_b) == 0:
        return np.zeros((len(boxes_a), len(boxes_b)), dtype=np.float32)
    a = boxes_a.astype(np.float32, copy=False)
    b = boxes_b.astype(np.float32, copy=False)
    x1 = np.maximum(a[:, None, 0], b[None, :, 0])
    y1 = np.maximum(a[:, None, 1], b[None, :, 1])
    x2 = np.minimum(a[:, None, 2], b[None, :, 2])
    y2 = np.minimum(a[:, None, 3], b[None, :, 3])
    inter = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    area_a = np.maximum(0.0, a[:, 2] - a[:, 0]) * np.maximum(0.0, a[:, 3] - a[:, 1])
    area_b = np.maximum(0.0, b[:, 2] - b[:, 0]) * np.maximum(0.0, b[:, 3] - b[:, 1])
    union = np.maximum(area_a[:, None] + area_b[None, :] - inter, 1.0e-6)
    return inter / union


def _refine_teacher_detections_with_auxiliary(
    teacher_dets: np.ndarray,
    auxiliary_dets: np.ndarray,
    *,
    agreement_iou_threshold: float,
    keep_teacher_unmatched_above_score: float | None,
) -> tuple[np.ndarray, dict[str, int]]:
    if len(teacher_dets) == 0:
        return teacher_dets, {"teacher_boxes": 0, "matched_boxes": 0, "kept_boxes": 0, "dropped_boxes": 0}
    if len(auxiliary_dets) == 0:
        if keep_teacher_unmatched_above_score is None:
            return np.zeros((0, teacher_dets.shape[1]), dtype=teacher_dets.dtype), {
                "teacher_boxes": int(len(teacher_dets)),
                "matched_boxes": 0,
                "kept_boxes": 0,
                "dropped_boxes": int(len(teacher_dets)),
            }
        keep = teacher_dets[:, 4] >= float(keep_teacher_unmatched_above_score)
        refined = teacher_dets[keep]
        return refined, {
            "teacher_boxes": int(len(teacher_dets)),
            "matched_boxes": 0,
            "kept_boxes": int(len(refined)),
            "dropped_boxes": int(len(teacher_dets) - len(refined)),
        }

    ious = _pairwise_iou_xyxy(teacher_dets[:, :4], auxiliary_dets[:, :4])
    best_ious = np.max(ious, axis=1)
    keep = best_ious >= float(agreement_iou_threshold)
    if keep_teacher_unmatched_above_score is not None:
        keep |= teacher_dets[:, 4] >= float(keep_teacher_unmatched_above_score)
    refined = teacher_dets[keep]
    matched = int(np.sum(best_ious >= float(agreement_iou_threshold)))
    return refined, {
        "teacher_boxes": int(len(teacher_dets)),
        "matched_boxes": matched,
        "kept_boxes": int(len(refined)),
        "dropped_boxes": int(len(teacher_dets) - len(refined)),
    }


def _augment_teacher_detections_with_auxiliary(
    teacher_dets: np.ndarray,
    auxiliary_dets: np.ndarray,
    *,
    add_unmatched_above_score: float | None,
    add_unmatched_below_teacher_iou: float,
    max_added_per_frame: int | None,
) -> tuple[np.ndarray, dict[str, int]]:
    if add_unmatched_above_score is None or len(auxiliary_dets) == 0:
        return teacher_dets, {"candidate_boxes": 0, "added_boxes": 0}

    score_threshold = float(add_unmatched_above_score)
    iou_ceiling = float(add_unmatched_below_teacher_iou)
    candidates = auxiliary_dets[auxiliary_dets[:, 4] >= score_threshold]
    if len(candidates) == 0:
        return teacher_dets, {"candidate_boxes": 0, "added_boxes": 0}

    if len(teacher_dets) > 0:
        ious = _pairwise_iou_xyxy(candidates[:, :4], teacher_dets[:, :4])
        best_ious = np.max(ious, axis=1)
        candidates = candidates[best_ious < iou_ceiling]
    if len(candidates) == 0:
        return teacher_dets, {"candidate_boxes": 0, "added_boxes": 0}

    order = np.argsort(-candidates[:, 4], kind="stable")
    candidates = candidates[order]
    if max_added_per_frame is not None and int(max_added_per_frame) > 0:
        candidates = candidates[: int(max_added_per_frame)]
    if len(candidates) == 0:
        return teacher_dets, {"candidate_boxes": 0, "added_boxes": 0}

    if len(teacher_dets) == 0:
        merged = candidates.astype(np.float32, copy=False)
    else:
        merged = np.concatenate([teacher_dets, candidates], axis=0).astype(np.float32, copy=False)
    return merged, {
        "candidate_boxes": int(len(candidates)),
        "added_boxes": int(len(candidates)),
    }


def _write_json(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True, default=_json_default) + "\n", encoding="utf-8")
    return path


def _iter_sequence_cache_rows(cache_path: Path, max_frames: int | None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row_idx, payload in enumerate(iter_jsonl(cache_path), start=1):
        if max_frames is not None and row_idx > max_frames:
            break
        rows.append(payload)
    return rows


def _load_student_summary(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Student summary not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


@dataclass(slots=True)
class PseudoLabelExportConfig:
    source_cache_tag: str
    output_tag: str
    source_artifact_root: str | None = None
    box_source: str = "grounding"
    score_threshold: float = 0.35
    nms_iou_threshold: float = 0.7
    min_box_area: float = 64.0
    min_height: float = 8.0
    min_width: float = 4.0
    min_height_width_ratio: float = 0.3
    max_height_width_ratio: float = 12.0
    top_k: int | None = 300
    auxiliary_cache_tag: str | None = None
    auxiliary_source_artifact_root: str | None = None
    auxiliary_box_source: str = "grounding"
    auxiliary_score_threshold: float = 0.25
    auxiliary_nms_iou_threshold: float = 0.6
    auxiliary_min_box_area: float = 16.0
    auxiliary_min_height: float = 1.0
    auxiliary_min_width: float = 1.0
    auxiliary_min_height_width_ratio: float = 0.0
    auxiliary_max_height_width_ratio: float = 99.0
    auxiliary_top_k: int | None = 300
    agreement_iou_threshold: float | None = None
    keep_teacher_unmatched_above_score: float | None = None
    auxiliary_add_unmatched_above_score: float | None = None
    auxiliary_add_unmatched_below_teacher_iou: float = 0.10
    auxiliary_max_added_per_frame: int | None = None
    rescue_score_threshold: float | None = None
    rescue_max_area: float | None = None
    rescue_min_height: float | None = None
    rescue_min_width: float | None = None
    rescue_min_height_width_ratio: float | None = None
    upper_zone_y_limit: float | None = None
    upper_zone_score_threshold: float | None = None
    upper_zone_min_box_area: float | None = None
    upper_zone_min_height: float | None = None
    upper_zone_min_width: float | None = None
    upper_zone_min_height_width_ratio: float | None = None
    min_prompt_votes: int | None = None
    prompt_support_weight: float | None = None
    aspect_ratio_target: float | None = None
    aspect_ratio_tolerance: float | None = None
    aspect_ratio_score_bonus: float | None = None
    small_box_area_threshold: float | None = None
    small_box_score_bonus: float | None = None
    upper_zone_small_box_bonus: float | None = None
    val_every_nth_frame: int = 10
    val_offset: int = 0
    max_frames_per_sequence: int | None = None
    include_empty_labels: bool = True
    canonical_label: str = "person"

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "PseudoLabelExportConfig":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


@dataclass(slots=True)
class UltralyticsStudentTrainConfig:
    output_tag: str
    model: str = "yolov8n.pt"
    imgsz: int = 1280
    epochs: int = 30
    batch: int = 8
    device: str = "auto"
    workers: int = 4
    patience: int = 20
    pretrained: bool = True
    optimizer: str = "auto"
    lr0: float | None = None
    lrf: float | None = None
    cos_lr: bool = False
    cache: bool | str = False
    project_name: str = "ultralytics_person_student"
    run_name: str = "mot20_vlm_person"

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "UltralyticsStudentTrainConfig":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


@dataclass(slots=True)
class StudentCacheConfig:
    output_tag: str
    cache_tag: str
    weights_path: str | None = None
    class_ids: list[int] | None = None
    conf_threshold: float = 0.001
    iou_threshold: float = 0.7
    imgsz: int = 1280
    device: str = "auto"
    batch_size: int = 4
    max_det: int = 1000
    nms_max_time_img: float = 10.0
    use_slice_inference: bool = False
    slice_width: int = 960
    slice_height: int = 960
    slice_overlap: float = 0.2
    sahi_postprocess_type: str = "GREEDYNMM"
    sahi_postprocess_match_metric: str = "IOU"
    sahi_postprocess_match_threshold: float = 0.5
    canonical_label: str = "person"
    max_frames_per_sequence: int | None = None

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "StudentCacheConfig":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


def export_vlm_pseudo_labels(project_cfg: dict[str, Any]) -> dict[str, Any]:
    pseudo_cfg = PseudoLabelExportConfig.from_dict(project_cfg["vlm_supervised_detector"]["pseudo_labels"])
    artifact_root = Path(project_cfg["paths"]["artifact_root"]).expanduser().resolve()
    output_root = ensure_dir(artifact_root / "supervised" / pseudo_cfg.output_tag)
    images_root = ensure_dir(output_root / "images")
    labels_root = ensure_dir(output_root / "labels")
    annotations_root = ensure_dir(output_root / "annotations")
    manifests_root = ensure_dir(output_root / "manifests")
    summary_path = output_root / "pseudo_labels_summary.json"

    sequences = load_mot20_sequences(
        project_cfg["paths"]["dataset_root"],
        split=project_cfg["dataset"]["split"],
        sequence_names=project_cfg["dataset"].get("sequences"),
    )
    source_artifact_root = (
        Path(pseudo_cfg.source_artifact_root).expanduser().resolve()
        if pseudo_cfg.source_artifact_root
        else artifact_root
    )
    cache_dir = source_artifact_root / "detections" / pseudo_cfg.source_cache_tag
    auxiliary_cache_dir: Path | None = None
    if pseudo_cfg.auxiliary_cache_tag:
        auxiliary_artifact_root = (
            Path(pseudo_cfg.auxiliary_source_artifact_root).expanduser().resolve()
            if pseudo_cfg.auxiliary_source_artifact_root
            else artifact_root
        )
        auxiliary_cache_dir = auxiliary_artifact_root / "detections" / pseudo_cfg.auxiliary_cache_tag

    category_name = "pedestrian"
    video_ids: dict[str, int] = {sequence.name: index for index, sequence in enumerate(sequences, start=1)}
    subsets: dict[str, dict[str, Any]] = {}
    for subset in ("train", "val"):
        subsets[subset] = {
            "images": [],
            "annotations": [],
            "videos": [{"id": video_ids[sequence.name], "file_name": sequence.name} for sequence in sequences],
            "categories": [{"id": 1, "name": category_name}],
        }

    stats: dict[str, Any] = {
        "output_root": str(output_root),
        "source_cache_tag": pseudo_cfg.source_cache_tag,
        "subsets": {
            "train": {"images": 0, "boxes": 0},
            "val": {"images": 0, "boxes": 0},
        },
        "per_sequence": {},
    }
    annotation_id = 1
    image_id = 1
    train_manifest_lines: list[str] = []
    val_manifest_lines: list[str] = []

    for sequence in sequences:
        cache_path = cache_dir / f"{sequence.name}.jsonl"
        if not cache_path.exists():
            raise FileNotFoundError(f"Teacher cache not found for sequence {sequence.name}: {cache_path}")
        rows = _iter_sequence_cache_rows(cache_path, pseudo_cfg.max_frames_per_sequence)
        sequence_stats = {
            "frames": len(rows),
            "train_frames": 0,
            "val_frames": 0,
            "train_boxes": 0,
            "val_boxes": 0,
            "auxiliary_matched_boxes": 0,
            "auxiliary_dropped_boxes": 0,
            "auxiliary_added_boxes": 0,
        }
        auxiliary_rows_by_frame: dict[int, RawDetections] = {}
        if auxiliary_cache_dir is not None:
            auxiliary_cache_path = auxiliary_cache_dir / f"{sequence.name}.jsonl"
            if not auxiliary_cache_path.exists():
                raise FileNotFoundError(f"Auxiliary cache not found for sequence {sequence.name}: {auxiliary_cache_path}")
            for auxiliary_payload in _iter_sequence_cache_rows(auxiliary_cache_path, pseudo_cfg.max_frames_per_sequence):
                auxiliary_raw = RawDetections.from_json_dict(auxiliary_payload)
                auxiliary_rows_by_frame[int(auxiliary_raw.frame_idx)] = auxiliary_raw

        for payload in rows:
            raw = RawDetections.from_json_dict(payload)
            dets = raw.to_tracker_detections(
                box_source=pseudo_cfg.box_source,
                score_threshold=float(pseudo_cfg.score_threshold),
                nms_iou_threshold=float(pseudo_cfg.nms_iou_threshold),
                min_box_area=float(pseudo_cfg.min_box_area),
                min_height=float(pseudo_cfg.min_height),
                min_width=float(pseudo_cfg.min_width),
                min_height_width_ratio=float(pseudo_cfg.min_height_width_ratio),
                max_height_width_ratio=float(pseudo_cfg.max_height_width_ratio),
                top_k=pseudo_cfg.top_k,
                rescue_score_threshold=pseudo_cfg.rescue_score_threshold,
                rescue_max_area=pseudo_cfg.rescue_max_area,
                rescue_min_height=pseudo_cfg.rescue_min_height,
                rescue_min_width=pseudo_cfg.rescue_min_width,
                rescue_min_height_width_ratio=pseudo_cfg.rescue_min_height_width_ratio,
                upper_zone_y_limit=pseudo_cfg.upper_zone_y_limit,
                upper_zone_score_threshold=pseudo_cfg.upper_zone_score_threshold,
                upper_zone_min_box_area=pseudo_cfg.upper_zone_min_box_area,
                upper_zone_min_height=pseudo_cfg.upper_zone_min_height,
                upper_zone_min_width=pseudo_cfg.upper_zone_min_width,
                upper_zone_min_height_width_ratio=pseudo_cfg.upper_zone_min_height_width_ratio,
                min_prompt_votes=pseudo_cfg.min_prompt_votes,
                prompt_support_weight=pseudo_cfg.prompt_support_weight,
                aspect_ratio_target=pseudo_cfg.aspect_ratio_target,
                aspect_ratio_tolerance=pseudo_cfg.aspect_ratio_tolerance,
                aspect_ratio_score_bonus=pseudo_cfg.aspect_ratio_score_bonus,
                small_box_area_threshold=pseudo_cfg.small_box_area_threshold,
                small_box_score_bonus=pseudo_cfg.small_box_score_bonus,
                upper_zone_small_box_bonus=pseudo_cfg.upper_zone_small_box_bonus,
            )
            if auxiliary_cache_dir is not None and pseudo_cfg.agreement_iou_threshold is not None:
                auxiliary_raw = auxiliary_rows_by_frame.get(int(raw.frame_idx))
                auxiliary_dets = np.zeros((0, 6), dtype=np.float32)
                if auxiliary_raw is not None:
                    auxiliary_dets = auxiliary_raw.to_tracker_detections(
                        box_source=pseudo_cfg.auxiliary_box_source,
                        score_threshold=float(pseudo_cfg.auxiliary_score_threshold),
                        nms_iou_threshold=float(pseudo_cfg.auxiliary_nms_iou_threshold),
                        min_box_area=float(pseudo_cfg.auxiliary_min_box_area),
                        min_height=float(pseudo_cfg.auxiliary_min_height),
                        min_width=float(pseudo_cfg.auxiliary_min_width),
                        min_height_width_ratio=float(pseudo_cfg.auxiliary_min_height_width_ratio),
                        max_height_width_ratio=float(pseudo_cfg.auxiliary_max_height_width_ratio),
                        top_k=pseudo_cfg.auxiliary_top_k,
                    )
                dets, refine_stats = _refine_teacher_detections_with_auxiliary(
                    dets,
                    auxiliary_dets,
                    agreement_iou_threshold=float(pseudo_cfg.agreement_iou_threshold),
                    keep_teacher_unmatched_above_score=pseudo_cfg.keep_teacher_unmatched_above_score,
                )
                sequence_stats["auxiliary_matched_boxes"] += int(refine_stats["matched_boxes"])
                sequence_stats["auxiliary_dropped_boxes"] += int(refine_stats["dropped_boxes"])
                dets, augment_stats = _augment_teacher_detections_with_auxiliary(
                    dets,
                    auxiliary_dets,
                    add_unmatched_above_score=pseudo_cfg.auxiliary_add_unmatched_above_score,
                    add_unmatched_below_teacher_iou=float(pseudo_cfg.auxiliary_add_unmatched_below_teacher_iou),
                    max_added_per_frame=pseudo_cfg.auxiliary_max_added_per_frame,
                )
                sequence_stats["auxiliary_added_boxes"] += int(augment_stats["added_boxes"])

            frame_mod = max(1, int(pseudo_cfg.val_every_nth_frame))
            is_val = ((int(raw.frame_idx) - int(pseudo_cfg.val_offset)) % frame_mod) == 0
            subset = "val" if is_val else "train"

            image_source = Path(raw.image_path).expanduser().resolve()
            relative_path = Path(subset) / sequence.name / image_source.name
            image_target = images_root / relative_path
            _ensure_symlink(image_source, image_target)

            label_target = labels_root / relative_path.with_suffix(".txt")
            label_target.parent.mkdir(parents=True, exist_ok=True)
            yolo_lines: list[str] = []
            if len(dets):
                yolo_boxes = _xyxy_to_yolo(dets[:, :4].astype(np.float32), raw.image_width, raw.image_height)
                for box in yolo_boxes:
                    yolo_lines.append(
                        f"0 {box[0]:.6f} {box[1]:.6f} {box[2]:.6f} {box[3]:.6f}"
                    )
            if yolo_lines or pseudo_cfg.include_empty_labels:
                label_target.write_text("\n".join(yolo_lines) + ("\n" if yolo_lines else ""), encoding="utf-8")

            image_payload = {
                "file_name": str(Path("images") / relative_path),
                "id": image_id,
                "frame_id": int(raw.frame_idx),
                "prev_image_id": -1,
                "next_image_id": -1,
                "video_id": video_ids[sequence.name],
                "height": int(raw.image_height),
                "width": int(raw.image_width),
            }
            subsets[subset]["images"].append(image_payload)

            xywh_boxes = _xyxy_to_xywh(dets[:, :4].astype(np.float32)) if len(dets) else np.zeros((0, 4), dtype=np.float32)
            for box_idx, box in enumerate(xywh_boxes):
                annotation = {
                    "id": annotation_id,
                    "category_id": 1,
                    "image_id": image_id,
                    "track_id": annotation_id,
                    "bbox": [float(value) for value in box],
                    "conf": float(dets[box_idx, 4]),
                    "iscrowd": 0,
                    "area": float(max(0.0, box[2] * box[3])),
                }
                subsets[subset]["annotations"].append(annotation)
                annotation_id += 1

            manifest_line = str(image_target)
            if subset == "train":
                train_manifest_lines.append(manifest_line)
                sequence_stats["train_frames"] += 1
                sequence_stats["train_boxes"] += int(len(dets))
            else:
                val_manifest_lines.append(manifest_line)
                sequence_stats["val_frames"] += 1
                sequence_stats["val_boxes"] += int(len(dets))
            stats["subsets"][subset]["images"] += 1
            stats["subsets"][subset]["boxes"] += int(len(dets))
            image_id += 1

        stats["per_sequence"][sequence.name] = sequence_stats

    train_json = _write_json(annotations_root / "train.json", subsets["train"])
    val_json = _write_json(annotations_root / "val.json", subsets["val"])
    train_manifest = manifests_root / "train.txt"
    val_manifest = manifests_root / "val.txt"
    train_manifest.write_text("\n".join(train_manifest_lines) + ("\n" if train_manifest_lines else ""), encoding="utf-8")
    val_manifest.write_text("\n".join(val_manifest_lines) + ("\n" if val_manifest_lines else ""), encoding="utf-8")
    dataset_yaml = output_root / "dataset.yaml"
    dataset_yaml.write_text(
        "\n".join(
            [
                f"path: {output_root}",
                "train: images/train",
                "val: images/val",
                "names:",
                f"  0: {pseudo_cfg.canonical_label}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    summary_payload = {
        "pseudo_label_export": stats,
        "artifacts": {
            "train_json": str(train_json),
            "val_json": str(val_json),
            "dataset_yaml": str(dataset_yaml),
            "train_manifest": str(train_manifest),
            "val_manifest": str(val_manifest),
        },
        "config": {
            key: value for key, value in asdict(pseudo_cfg).items()
        },
    }
    _write_json(summary_path, summary_payload)
    return summary_payload


def train_vlm_student_detector(project_cfg: dict[str, Any]) -> dict[str, Any]:
    from ultralytics.utils.callbacks import wb

    train_cfg = UltralyticsStudentTrainConfig.from_dict(project_cfg["vlm_supervised_detector"]["student"])
    artifact_root = Path(project_cfg["paths"]["artifact_root"]).expanduser().resolve()
    pseudo_root = artifact_root / "supervised" / train_cfg.output_tag
    data_yaml = pseudo_root / "dataset.yaml"
    if not data_yaml.exists():
        raise FileNotFoundError(f"Pseudo-label dataset yaml not found: {data_yaml}")

    device = _resolve_device(train_cfg.device)
    project_dir = ensure_dir(artifact_root / "supervised" / train_cfg.project_name)
    run_name = train_cfg.run_name
    run_dir = project_dir / run_name
    wb.callbacks.clear()
    model = _load_ultralytics_yolo(train_cfg.model)
    train_kwargs: dict[str, Any] = {
        "data": str(data_yaml),
        "imgsz": int(train_cfg.imgsz),
        "epochs": int(train_cfg.epochs),
        "batch": int(train_cfg.batch),
        "device": device,
        "workers": int(train_cfg.workers),
        "project": str(project_dir),
        "name": run_name,
        "pretrained": bool(train_cfg.pretrained),
        "patience": int(train_cfg.patience),
        "optimizer": str(train_cfg.optimizer),
        "cos_lr": bool(train_cfg.cos_lr),
        "cache": train_cfg.cache,
        "exist_ok": True,
        "verbose": True,
    }
    if train_cfg.lr0 is not None:
        train_kwargs["lr0"] = float(train_cfg.lr0)
    if train_cfg.lrf is not None:
        train_kwargs["lrf"] = float(train_cfg.lrf)
    model.train(**train_kwargs)

    weights_dir = run_dir / "weights"
    best_path = weights_dir / "best.pt"
    last_path = weights_dir / "last.pt"
    chosen_weights = best_path if best_path.exists() else last_path
    if not chosen_weights.exists():
        raise FileNotFoundError(f"Student detector weights were not produced under {weights_dir}")

    summary_payload = {
        "pseudo_dataset_root": str(pseudo_root),
        "data_yaml": str(data_yaml),
        "device": device,
        "model": train_cfg.model,
        "train_kwargs": train_kwargs,
        "run_dir": str(run_dir),
        "weights": {
            "best": str(best_path) if best_path.exists() else None,
            "last": str(last_path) if last_path.exists() else None,
            "selected": str(chosen_weights),
        },
    }
    summary_path = pseudo_root / "student_summary.json"
    _write_json(summary_path, summary_payload)
    return summary_payload


def _predict_direct(model: Any, image_path: Path, cache_cfg: StudentCacheConfig, device: str) -> tuple[np.ndarray, np.ndarray]:
    return _predict_direct_batch(model, [image_path], cache_cfg, device)[0]


def _predict_direct_batch(
    model: Any,
    image_paths: list[Path],
    cache_cfg: StudentCacheConfig,
    device: str,
) -> list[tuple[np.ndarray, np.ndarray]]:
    from ultralytics.utils import ops as ultralytics_ops

    original_nms = ultralytics_ops.non_max_suppression

    def nms_without_batch_truncation(*args: Any, **kwargs: Any) -> Any:
        kwargs["max_time_img"] = max(
            float(kwargs.get("max_time_img", 0.05)),
            float(cache_cfg.nms_max_time_img),
        )
        return original_nms(*args, **kwargs)

    ultralytics_ops.non_max_suppression = nms_without_batch_truncation
    try:
        results = model.predict(
            source=[str(path) for path in image_paths],
            conf=float(cache_cfg.conf_threshold),
            iou=float(cache_cfg.iou_threshold),
            imgsz=int(cache_cfg.imgsz),
            device=device,
            batch=max(1, int(cache_cfg.batch_size)),
            max_det=max(1, int(cache_cfg.max_det)),
            verbose=False,
        )
    finally:
        ultralytics_ops.non_max_suppression = original_nms
    outputs: list[tuple[np.ndarray, np.ndarray]] = []
    for result in results:
        boxes = result.boxes
        if boxes is None or boxes.xyxy is None or len(boxes) == 0:
            outputs.append(
                (
                    np.zeros((0, 4), dtype=np.float32),
                    np.zeros((0,), dtype=np.float32),
                )
            )
            continue
        xyxy = boxes.xyxy.detach().cpu().numpy().astype(np.float32)
        conf = boxes.conf.detach().cpu().numpy().astype(np.float32)
        if cache_cfg.class_ids is not None and getattr(boxes, "cls", None) is not None:
            cls = boxes.cls.detach().cpu().numpy().astype(np.int32)
            keep = np.isin(cls, np.asarray(cache_cfg.class_ids, dtype=np.int32))
            xyxy = xyxy[keep]
            conf = conf[keep]
        outputs.append((xyxy, conf))
    if len(outputs) != len(image_paths):
        raise AssertionError(
            f"Ultralytics returned {len(outputs)} results for {len(image_paths)} images."
        )
    return outputs


def _predict_sliced(image_path: Path, weights_path: Path, cache_cfg: StudentCacheConfig, device: str) -> tuple[np.ndarray, np.ndarray]:
    from sahi import AutoDetectionModel
    from sahi.predict import get_sliced_prediction

    detection_model = AutoDetectionModel.from_pretrained(
        model_type="ultralytics",
        model_path=str(weights_path),
        confidence_threshold=float(cache_cfg.conf_threshold),
        device=device,
    )
    prediction = get_sliced_prediction(
        str(image_path),
        detection_model,
        slice_height=int(cache_cfg.slice_height),
        slice_width=int(cache_cfg.slice_width),
        overlap_height_ratio=float(cache_cfg.slice_overlap),
        overlap_width_ratio=float(cache_cfg.slice_overlap),
        perform_standard_pred=True,
        postprocess_type=str(cache_cfg.sahi_postprocess_type),
        postprocess_match_metric=str(cache_cfg.sahi_postprocess_match_metric),
        postprocess_match_threshold=float(cache_cfg.sahi_postprocess_match_threshold),
    )
    boxes: list[list[float]] = []
    scores: list[float] = []
    class_ids = None
    if cache_cfg.class_ids is not None:
        try:
            class_ids = {int(v) for v in cache_cfg.class_ids}
        except Exception:
            class_ids = None
    for obj in prediction.object_prediction_list:
        if class_ids is not None:
            category = getattr(obj, "category", None)
            category_id = getattr(category, "id", None) if category is not None else None
            try:
                if category_id is None or int(category_id) not in class_ids:
                    continue
            except Exception:
                
                
                class_ids = None
        bbox = obj.bbox
        boxes.append([float(bbox.minx), float(bbox.miny), float(bbox.maxx), float(bbox.maxy)])
        scores.append(float(obj.score.value))
    if not boxes:
        return np.zeros((0, 4), dtype=np.float32), np.zeros((0,), dtype=np.float32)
    return np.asarray(boxes, dtype=np.float32), np.asarray(scores, dtype=np.float32)


def cache_student_detections(project_cfg: dict[str, Any]) -> dict[str, Any]:
    cache_cfg = StudentCacheConfig.from_dict(project_cfg["vlm_supervised_detector"]["student_cache"])
    artifact_root = Path(project_cfg["paths"]["artifact_root"]).expanduser().resolve()
    if cache_cfg.weights_path:
        weights_path = Path(cache_cfg.weights_path).expanduser().resolve()
    else:
        pseudo_root = artifact_root / "supervised" / cache_cfg.output_tag
        summary_path = pseudo_root / "student_summary.json"
        summary = _load_student_summary(summary_path)
        weights_path = Path(summary["weights"]["selected"]).expanduser().resolve()
    if not weights_path.exists():
        raise FileNotFoundError(f"Student weights not found: {weights_path}")

    sequences = load_mot20_sequences(
        project_cfg["paths"]["dataset_root"],
        split=project_cfg["dataset"]["split"],
        sequence_names=project_cfg["dataset"].get("sequences"),
    )
    cache_dir = ensure_dir(artifact_root / "detections" / cache_cfg.cache_tag)
    device = _resolve_device(cache_cfg.device)
    model = None if cache_cfg.use_slice_inference else _load_ultralytics_yolo(str(weights_path))

    written: list[str] = []
    for sequence in sequences:
        cache_path = cache_dir / f"{sequence.name}.jsonl"
        if cache_path.exists():
            cache_path.unlink()
        max_frames = cache_cfg.max_frames_per_sequence
        if max_frames is None:
            max_frames = project_cfg["dataset"].get("max_frames_per_sequence")
        frame_stride = int(project_cfg["dataset"].get("frame_stride", 1) or 1)
        frame_items = list(iter_frame_paths(
            sequence,
            frame_stride=frame_stride,
            max_frames=max_frames,
        ))
        if cache_cfg.use_slice_inference:
            prediction_batches = [
                [(frame_idx, frame_path, *_predict_sliced(frame_path, weights_path, cache_cfg, device))]
                for frame_idx, frame_path in frame_items
            ]
        else:
            assert model is not None
            prediction_batches = []
            batch_size = max(1, int(cache_cfg.batch_size))
            for start in range(0, len(frame_items), batch_size):
                batch_items = frame_items[start : start + batch_size]
                batch_predictions = _predict_direct_batch(
                    model,
                    [frame_path for _, frame_path in batch_items],
                    cache_cfg,
                    device,
                )
                prediction_batches.append(
                    [
                        (frame_idx, frame_path, boxes, scores)
                        for (frame_idx, frame_path), (boxes, scores) in zip(
                            batch_items, batch_predictions, strict=True
                        )
                    ]
                )
        for prediction_batch in prediction_batches:
            for frame_idx, frame_path, boxes, scores in prediction_batch:
                raw = RawDetections(
                    frame_idx=frame_idx,
                    image_path=str(frame_path),
                    image_height=int(sequence.height),
                    image_width=int(sequence.width),
                    prompt=f"student:{weights_path.name}",
                    grounding_boxes=boxes.astype(float).tolist(),
                    scores=scores.astype(float).tolist(),
                    labels=[cache_cfg.canonical_label for _ in range(len(scores))],
                    prompt_support_counts=[1 for _ in range(len(scores))],
                    sam_boxes=None,
                    mask_areas=None,
                )
                append_jsonl(cache_path, raw.to_json_dict())
        written.append(str(cache_path))

    summary_payload = {
        "weights_path": str(weights_path),
        "device": device,
        "cache_tag": cache_cfg.cache_tag,
        "cache_paths": written,
        "config": {key: value for key, value in asdict(cache_cfg).items()},
    }
    _write_json(cache_dir / "student_cache_summary.json", summary_payload)
    return summary_payload
