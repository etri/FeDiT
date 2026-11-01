
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import torch
from numpy.lib.format import open_memmap

from _common import ensure_outputs, rel
from detection_io import load_detections
from mot20_io import TRAIN_SEQUENCES, load_sequences
from neural_vlm_conditioner import _resolve_device
from osnet_quality_conditioner import OSNET_DIM


def _match_reuse_boxes(
    target_boxes: np.ndarray,
    reuse_boxes: np.ndarray,
    reuse_indices: np.ndarray,
) -> np.ndarray:
    matched = np.full((len(target_boxes),), -1, dtype=np.int64)
    if len(target_boxes) == 0 or len(reuse_indices) == 0:
        return matched
    lookup: dict[bytes, int] = {}
    for source_index, box in zip(reuse_indices, reuse_boxes, strict=True):
        lookup.setdefault(
            np.asarray(box, dtype=np.float32).tobytes(),
            int(source_index),
        )
    for target_index, box in enumerate(target_boxes):
        matched[target_index] = lookup.get(
            np.asarray(box, dtype=np.float32).tobytes(),
            -1,
        )
    return matched


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cache frozen OSNet pedestrian embeddings for GroundingDINO proposals."
    )
    parser.add_argument("--detections", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--weights", default="artifacts/reid/osnet_x0_25_msmt17.pt")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--device", default="mps")
    parser.add_argument("--crop-height", type=int, default=128)
    parser.add_argument("--crop-width", type=int, default=64)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument(
        "--reuse-detections",
        default=None,
        help="Optional source detections whose exact-box OSNet embeddings can be reused.",
    )
    parser.add_argument(
        "--reuse-embedding-dir",
        default=None,
        help="OSNet cache aligned with --reuse-detections.",
    )
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    from boxmot.reid.core.auto_backend import ReidAutoBackend

    if bool(args.reuse_detections) != bool(args.reuse_embedding_dir):
        raise ValueError(
            "--reuse-detections and --reuse-embedding-dir must be provided together."
        )
    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    source = rel(args.detections)
    reuse_source = rel(args.reuse_detections) if args.reuse_detections else None
    reuse_embedding_root = (
        rel(args.reuse_embedding_dir) if args.reuse_embedding_dir else None
    )
    output = rel(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    metadata_path = output / "metadata.json"
    existing_metadata = {}
    if metadata_path.exists():
        existing_metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    resolved_device = _resolve_device(args.device)
    backend = ReidAutoBackend(
        rel(args.weights),
        torch.device(resolved_device),
        False,
    ).model
    backend.input_shape = (int(args.crop_height), int(args.crop_width))
    sequences = load_sequences(rel(args.data_root), names)
    counts: dict[str, int] = {
        str(name): int(count)
        for name, count in dict(existing_metadata.get("counts") or {}).items()
    }
    reused_counts: dict[str, int] = {
        str(name): int(count)
        for name, count in dict(existing_metadata.get("reused_counts") or {}).items()
    }
    extracted_counts: dict[str, int] = {
        str(name): int(count)
        for name, count in dict(existing_metadata.get("extracted_counts") or {}).items()
    }

    for sequence in sequences:
        output_path = output / f"{sequence.name}.npy"
        partial_path = output / f"{sequence.name}.partial.npy"
        if output_path.exists() and not args.overwrite:
            cached = np.load(output_path, mmap_mode="r")
            counts[sequence.name] = int(cached.shape[0])
            print(f"Skipping existing OSNet cache: {output_path}")
            continue
        if partial_path.exists():
            partial_path.unlink()
        detections = load_detections(source / f"{sequence.name}.npz")
        reuse_detections = None
        reuse_embeddings = None
        reuse_by_frame: dict[int, np.ndarray] = {}
        if reuse_source is not None and reuse_embedding_root is not None:
            reuse_detections = load_detections(
                reuse_source / f"{sequence.name}.npz"
            )
            reuse_embeddings = np.load(
                reuse_embedding_root / f"{sequence.name}.npy",
                mmap_mode="r",
            )
            expected_shape = (len(reuse_detections), OSNET_DIM)
            if reuse_embeddings.shape != expected_shape:
                raise AssertionError(
                    f"Reuse cache shape mismatch for {sequence.name}: "
                    f"{reuse_embeddings.shape} != {expected_shape}"
                )
            reuse_by_frame = {
                int(frame): indices
                for frame, indices in reuse_detections.by_frame().items()
            }
        embeddings = open_memmap(
            partial_path,
            mode="w+",
            dtype=np.float16,
            shape=(len(detections), OSNET_DIM),
        )
        reused_count = 0
        extracted_count = 0
        for frame, indices in sorted(detections.by_frame().items()):
            unmatched_indices = indices
            if reuse_detections is not None and reuse_embeddings is not None:
                source_indices = reuse_by_frame.get(
                    int(frame),
                    np.zeros((0,), dtype=np.int64),
                )
                matched_indices = _match_reuse_boxes(
                    detections.boxes[indices],
                    reuse_detections.boxes[source_indices],
                    source_indices,
                )
                reusable = matched_indices >= 0
                if np.any(reusable):
                    embeddings[indices[reusable]] = reuse_embeddings[
                        matched_indices[reusable]
                    ]
                    reused_count += int(np.sum(reusable))
                unmatched_indices = indices[~reusable]
            if len(unmatched_indices) == 0:
                continue
            image_path = sequence.img_dir / f"{int(frame):06d}{sequence.image_ext}"
            image = cv2.imread(str(image_path))
            if image is None:
                raise FileNotFoundError(f"Could not decode frame: {image_path}")
            for start in range(0, len(unmatched_indices), int(args.batch_size)):
                batch_indices = unmatched_indices[
                    start : start + int(args.batch_size)
                ]
                features = backend.get_features(
                    detections.boxes[batch_indices].astype(np.float32),
                    image,
                )
                embeddings[batch_indices] = np.asarray(features, dtype=np.float16)
                extracted_count += int(len(batch_indices))
            if int(frame) % 250 == 0 or int(frame) == int(sequence.seq_length):
                print(
                    f"{sequence.name}: frame {int(frame)}/{int(sequence.seq_length)}",
                    flush=True,
                )
        embeddings.flush()
        del embeddings
        partial_path.replace(output_path)
        counts[sequence.name] = int(len(detections))
        reused_counts[sequence.name] = int(reused_count)
        extracted_counts[sequence.name] = int(extracted_count)
        print(
            f"{sequence.name}: cached {len(detections)} OSNet embeddings "
            f"(reused={reused_count}, extracted={extracted_count})"
        )

    metadata = {
        "kind": "osnet_crop_embedding_cache",
        "source_detections": str(source),
        "weights": str(rel(args.weights)),
        "backbone": "osnet_x0_25_msmt17",
        "embedding_dim": OSNET_DIM,
        "dtype": "float16",
        "device": resolved_device,
        "crop_height": int(args.crop_height),
        "crop_width": int(args.crop_width),
        "batch_size": int(args.batch_size),
        "counts": counts,
        "reuse_detections": str(reuse_source) if reuse_source else None,
        "reuse_embedding_dir": (
            str(reuse_embedding_root) if reuse_embedding_root else None
        ),
        "reuse_match": "exact_float32_frame_box",
        "reused_counts": reused_counts,
        "extracted_counts": extracted_counts,
        "frozen": True,
        "no_yolo_inference": True,
    }
    metadata_path.write_text(
        json.dumps(metadata, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote OSNet embedding cache: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
