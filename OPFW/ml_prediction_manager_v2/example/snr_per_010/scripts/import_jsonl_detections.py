
from __future__ import annotations

import argparse
import json
from pathlib import Path

from tqdm import tqdm

from _common import ensure_outputs, rel
from detection_io import make_detection_set, save_detections, write_run_metadata
from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.utils.io import iter_jsonl
from mot20_io import TRAIN_SEQUENCES, load_sequences


def _boxes_for(raw: RawDetections, box_source: str) -> list[list[float]]:
    if box_source == "grounding" or raw.sam_boxes is None:
        return raw.grounding_boxes
    if box_source == "sam":
        return raw.sam_boxes
    if box_source == "union":
        out: list[list[float]] = []
        for grounding, sam in zip(raw.grounding_boxes, raw.sam_boxes, strict=False):
            out.append(
                [
                    min(float(grounding[0]), float(sam[0])),
                    min(float(grounding[1]), float(sam[1])),
                    max(float(grounding[2]), float(sam[2])),
                    max(float(grounding[3]), float(sam[3])),
                ]
            )
        return out
    raise ValueError(f"Unsupported box_source: {box_source}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import existing ir_autolabeling JSONL detection caches as NPZ files.")
    parser.add_argument("--jsonl-dir", required=True)
    parser.add_argument("--run-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--box-source", choices=["grounding", "sam", "union"], default="grounding")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    source = rel(args.jsonl_dir)
    target = rel(Path("outputs/detections") / args.run_name)
    target.mkdir(parents=True, exist_ok=True)
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be imported: {unknown}")
    seqs = load_sequences(rel(args.data_root), names)
    expected_lengths = {seq.name: int(seq.seq_length) for seq in seqs}
    coverage: dict[str, int] = {}

    for seq_name in names:
        src_path = source / f"{seq_name}.jsonl"
        if not src_path.exists():
            raise FileNotFoundError(src_path)
        dst_path = target / f"{seq_name}.npz"
        if dst_path.exists() and not args.overwrite:
            print(f"Skipping existing import: {dst_path}")
            continue
        frames: list[int] = []
        boxes: list[list[float]] = []
        scores: list[float] = []
        prompt_ids: list[int] = []
        tile_ids: list[int] = []
        widths: list[int] = []
        heights: list[int] = []
        prompt_texts: list[str] = []
        last_frame = 0
        for payload in tqdm(iter_jsonl(src_path), desc=f"import:{seq_name}"):
            raw = RawDetections.from_json_dict(payload)
            last_frame = max(last_frame, int(raw.frame_idx))
            selected_boxes = _boxes_for(raw, str(args.box_source))
            for box, score in zip(selected_boxes, raw.scores, strict=False):
                frames.append(int(raw.frame_idx))
                boxes.append([float(v) for v in box])
                scores.append(float(score))
                prompt_ids.append(0)
                tile_ids.append(0)
                widths.append(int(raw.image_width))
                heights.append(int(raw.image_height))
                prompt_texts.append(str(raw.prompt))
        coverage[seq_name] = int(last_frame)
        detections = make_detection_set(
            frames=frames,
            boxes=boxes,
            raw_scores=scores,
            calibrated_scores=scores,
            prompt_ids=prompt_ids,
            tile_ids=tile_ids,
            image_widths=widths,
            image_heights=heights,
            prompt_texts=prompt_texts,
        )
        save_detections(dst_path, detections)
        print(f"Wrote {len(detections)} detections from {src_path} -> {dst_path}")

    metadata = {
        "imported_from": str(source),
        "box_source": str(args.box_source),
        "sequences": names,
        "coverage_last_frame": coverage,
        "expected_seq_lengths": expected_lengths,
        "frozen_vlm_cache": True,
        "no_finetuning_in_import": True,
    }
    write_run_metadata(target, metadata)
    print(json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
