
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES
from nms import standard_nms


def _filter_sequence(detections: DetectionSet, params: dict) -> DetectionSet:
    boxes = detections.boxes.astype(np.float32)
    scores = detections.calibrated_scores.astype(np.float32).copy()
    widths = np.maximum(0.0, boxes[:, 2] - boxes[:, 0])
    heights = np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
    areas = widths * heights
    ratios = heights / np.maximum(widths, 1e-6)

    if params.get("score_power") is not None:
        power = float(params["score_power"])
        if power > 0 and power != 1.0:
            scores = np.power(np.clip(scores, 0.0, 1.0), power)
    if params.get("score_bias") is not None:
        scores = scores + float(params["score_bias"])
    scores = np.clip(scores, 0.0, 1.0)

    keep = scores >= float(params.get("score_threshold", 0.0))
    keep &= areas >= float(params.get("min_box_area", 0.0))
    keep &= heights >= float(params.get("min_height", 0.0))
    keep &= widths >= float(params.get("min_width", 0.0))
    keep &= ratios >= float(params.get("min_height_width_ratio", 0.0))
    keep &= ratios <= float(params.get("max_height_width_ratio", 1e9))

    indices = np.flatnonzero(keep).astype(np.int64)
    top_k = params.get("top_k")
    pre_nms_top_k = params.get("pre_nms_top_k")
    nms_iou = params.get("nms_iou_threshold")
    final_indices: list[np.ndarray] = []
    final_scores: list[np.ndarray] = []
    if len(indices):
        frames = detections.frames[indices]
        for frame in sorted(set(frames.astype(int).tolist())):
            frame_indices = indices[frames == int(frame)]
            frame_scores = scores[frame_indices]
            if pre_nms_top_k is not None and len(frame_indices) > int(pre_nms_top_k):
                order = np.argsort(-frame_scores)[: int(pre_nms_top_k)]
                frame_indices = frame_indices[order]
                frame_scores = frame_scores[order]
            if nms_iou is not None and float(nms_iou) < 1.0:
                local_keep = standard_nms(detections.boxes[frame_indices], frame_scores, float(nms_iou))
                frame_indices = frame_indices[local_keep]
                frame_scores = scores[frame_indices]
            if top_k is not None and len(frame_indices) > int(top_k):
                order = np.argsort(-frame_scores)[: int(top_k)]
                frame_indices = frame_indices[order]
                frame_scores = frame_scores[order]
            final_indices.append(frame_indices.astype(np.int64))
            final_scores.append(frame_scores.astype(np.float32))

    if final_indices:
        selected = np.concatenate(final_indices).astype(np.int64)
        selected_scores = np.concatenate(final_scores).astype(np.float32)
    else:
        selected = np.zeros((0,), dtype=np.int64)
        selected_scores = np.zeros((0,), dtype=np.float32)

    out = DetectionSet(
        frames=detections.frames[selected],
        boxes=detections.boxes[selected],
        raw_scores=detections.raw_scores[selected],
        calibrated_scores=selected_scores,
        prompt_ids=detections.prompt_ids[selected],
        tile_ids=detections.tile_ids[selected],
        image_widths=detections.image_widths[selected],
        image_heights=detections.image_heights[selected],
        prompt_texts=detections.prompt_texts[selected],
    )
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Filter imported NPZ detections for tracker experiments.")
    parser.add_argument("--detections", required=True)
    parser.add_argument("--run-name", required=True)
    parser.add_argument("--params-json", default=None)
    parser.add_argument("--score-threshold", type=float, default=None)
    parser.add_argument("--nms-iou-threshold", type=float, default=None)
    parser.add_argument("--min-box-area", type=float, default=None)
    parser.add_argument("--min-height", type=float, default=None)
    parser.add_argument("--min-width", type=float, default=None)
    parser.add_argument("--min-height-width-ratio", type=float, default=None)
    parser.add_argument("--max-height-width-ratio", type=float, default=None)
    parser.add_argument("--top-k", type=int, default=None)
    parser.add_argument("--pre-nms-top-k", type=int, default=None)
    parser.add_argument("--score-power", type=float, default=None)
    parser.add_argument("--score-bias", type=float, default=None)
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    params: dict = {}
    if args.params_json:
        params.update(json.loads(Path(args.params_json).read_text(encoding="utf-8")))
    for key in [
        "score_threshold",
        "nms_iou_threshold",
        "min_box_area",
        "min_height",
        "min_width",
        "min_height_width_ratio",
        "max_height_width_ratio",
        "top_k",
        "pre_nms_top_k",
        "score_power",
        "score_bias",
    ]:
        value = getattr(args, key)
        if value is not None:
            params[key] = value

    src = rel(args.detections)
    dst = rel(Path("outputs/detections") / args.run_name)
    dst.mkdir(parents=True, exist_ok=True)
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be filtered: {unknown}")
    totals: dict[str, int] = {}
    for seq in names:
        out_path = dst / f"{seq}.npz"
        if out_path.exists() and not args.overwrite:
            print(f"Skipping existing filtered detections: {out_path}")
            continue
        det = load_detections(src / f"{seq}.npz")
        filtered = _filter_sequence(det, params)
        save_detections(out_path, filtered)
        totals[seq] = len(filtered)
        print(f"{seq}: {len(det)} -> {len(filtered)}")
    write_run_metadata(
        dst,
        {
            "source": str(src),
            "params": params,
            "counts": totals,
            "no_finetuning": True,
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
