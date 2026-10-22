
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, assert_no_forbidden_dataset_path
from nms import apply_nms_to_set


def _subset(detections: DetectionSet, indices: np.ndarray) -> DetectionSet:
    return DetectionSet(
        frames=detections.frames[indices].astype(np.int32),
        boxes=detections.boxes[indices].astype(np.float32),
        raw_scores=detections.raw_scores[indices].astype(np.float32),
        calibrated_scores=detections.calibrated_scores[indices].astype(np.float32),
        prompt_ids=detections.prompt_ids[indices].astype(np.int32),
        tile_ids=detections.tile_ids[indices].astype(np.int32),
        image_widths=detections.image_widths[indices].astype(np.int32),
        image_heights=detections.image_heights[indices].astype(np.int32),
        prompt_texts=detections.prompt_texts[indices].astype(str),
    )


def _concat(parts: list[DetectionSet], source_tags: list[str]) -> DetectionSet:
    if not parts:
        raise ValueError("No detection parts to fuse.")
    frames: list[np.ndarray] = []
    boxes: list[np.ndarray] = []
    raw_scores: list[np.ndarray] = []
    calibrated_scores: list[np.ndarray] = []
    prompt_ids: list[np.ndarray] = []
    tile_ids: list[np.ndarray] = []
    image_widths: list[np.ndarray] = []
    image_heights: list[np.ndarray] = []
    prompt_texts: list[np.ndarray] = []
    for source_index, (part, tag) in enumerate(zip(parts, source_tags, strict=True)):
        frames.append(part.frames.astype(np.int32))
        boxes.append(part.boxes.astype(np.float32))
        raw_scores.append(part.raw_scores.astype(np.float32))
        calibrated_scores.append(part.calibrated_scores.astype(np.float32))
        prompt_ids.append(part.prompt_ids.astype(np.int32) + int(source_index) * 10000)
        tile_ids.append(part.tile_ids.astype(np.int32) + int(source_index) * 10000)
        image_widths.append(part.image_widths.astype(np.int32))
        image_heights.append(part.image_heights.astype(np.int32))
        prompt_texts.append(np.asarray([f"{tag}:{text}" for text in part.prompt_texts.astype(str)], dtype=object))
    return DetectionSet(
        frames=np.concatenate(frames).astype(np.int32),
        boxes=np.concatenate(boxes).astype(np.float32),
        raw_scores=np.concatenate(raw_scores).astype(np.float32),
        calibrated_scores=np.concatenate(calibrated_scores).astype(np.float32),
        prompt_ids=np.concatenate(prompt_ids).astype(np.int32),
        tile_ids=np.concatenate(tile_ids).astype(np.int32),
        image_widths=np.concatenate(image_widths).astype(np.int32),
        image_heights=np.concatenate(image_heights).astype(np.int32),
        prompt_texts=np.concatenate(prompt_texts).astype(str),
    )


def _valid_indices(detections: DetectionSet) -> np.ndarray:
    boxes = detections.boxes.astype(np.float32)
    finite = np.isfinite(boxes).all(axis=1)
    finite &= np.isfinite(detections.raw_scores.astype(np.float32))
    finite &= np.isfinite(detections.calibrated_scores.astype(np.float32))
    widths = boxes[:, 2] - boxes[:, 0]
    heights = boxes[:, 3] - boxes[:, 1]
    finite &= widths > 0
    finite &= heights > 0
    finite &= detections.frames.astype(np.int32) >= 1
    return np.flatnonzero(finite).astype(np.int64)


def _topk_per_frame(detections: DetectionSet, top_k: int | None) -> DetectionSet:
    if top_k is None or int(top_k) <= 0:
        return detections
    selected: list[np.ndarray] = []
    for frame, indices in sorted(detections.by_frame().items()):
        scores = detections.calibrated_scores[indices].astype(np.float32)
        if len(indices) > int(top_k):
            order = np.argsort(-scores)[: int(top_k)]
            indices = indices[order]
        selected.append(indices.astype(np.int64))
    if not selected:
        return _subset(detections, np.zeros((0,), dtype=np.int64))
    keep = np.concatenate(selected).astype(np.int64)
    return _subset(detections, keep)


def _sort_detection_set(detections: DetectionSet) -> DetectionSet:
    order = np.lexsort((-detections.calibrated_scores.astype(np.float32), detections.frames.astype(np.int32)))
    return _subset(detections, order.astype(np.int64))


def main() -> int:
    parser = argparse.ArgumentParser(description="Fuse multiple frozen-VLM detection directories into one MOT20-train candidate set.")
    parser.add_argument("--sources", nargs="+", required=True, help="Detection directories to fuse. Missing source/sequence files are skipped.")
    parser.add_argument("--output", required=True, help="Output detection directory or run name under outputs/detections.")
    parser.add_argument("--sequence-names", nargs="+", default=list(TRAIN_SEQUENCES))
    parser.add_argument("--nms-type", default="standard", choices=["none", "standard", "soft_nms", "soft_nms_gaussian", "wbf"])
    parser.add_argument("--nms-iou", type=float, default=0.93)
    parser.add_argument("--sigma", type=float, default=0.5)
    parser.add_argument("--top-k-per-frame", type=int, default=0)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    sequence_names = tuple(str(v) for v in args.sequence_names)
    unknown = sorted(set(sequence_names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be fused; got: {unknown}")

    sources = [rel(source) for source in args.sources]
    for source in sources:
        assert_no_forbidden_dataset_path(source)
    output = rel(args.output)
    if output.name == str(args.output):
        output = rel(Path("outputs") / "detections" / str(args.output))
    assert_no_forbidden_dataset_path(output)
    if output.exists() and not args.overwrite:
        raise FileExistsError(f"Output already exists, pass --overwrite: {output}")
    output.mkdir(parents=True, exist_ok=True)

    counts: dict[str, dict[str, int]] = {}
    for seq_name in sequence_names:
        parts: list[DetectionSet] = []
        tags: list[str] = []
        for source_index, source in enumerate(sources):
            path = source / f"{seq_name}.npz"
            if not path.exists():
                continue
            part = load_detections(path)
            if len(part) == 0:
                continue
            parts.append(part)
            tags.append(f"s{source_index}_{source.name}")
        if not parts:
            raise FileNotFoundError(f"No source detections found for {seq_name}")

        fused = _concat(parts, tags)
        fused = _subset(fused, _valid_indices(fused))
        before_nms = len(fused)
        if args.nms_type != "none":
            fused = apply_nms_to_set(
                fused,
                nms_type=str(args.nms_type),
                iou_threshold=float(args.nms_iou),
                sigma=float(args.sigma),
            )
        after_nms = len(fused)
        fused = _topk_per_frame(fused, int(args.top_k_per_frame) if int(args.top_k_per_frame) > 0 else None)
        fused = _sort_detection_set(fused)
        save_detections(output / f"{seq_name}.npz", fused)
        counts[seq_name] = {
            "sources": len(parts),
            "before_nms": int(before_nms),
            "after_nms": int(after_nms),
            "final": int(len(fused)),
        }
        print(
            f"{seq_name}: sources={len(parts)} before_nms={before_nms} "
            f"after_nms={after_nms} final={len(fused)}"
        )

    write_run_metadata(
        output,
        {
            "run_name": output.name,
            "sources": [str(source) for source in sources],
            "sequences": list(sequence_names),
            "detector": "fused frozen VLM candidates",
            "canonical_label": "person",
            "prompt_mapping": "all source prompts are mapped to person candidates",
            "no_finetuning": True,
            "no_gt_boxes_or_ids_used": True,
            "nms_type": str(args.nms_type),
            "nms_iou": float(args.nms_iou),
            "sigma": float(args.sigma),
            "top_k_per_frame": int(args.top_k_per_frame),
            "counts": counts,
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
