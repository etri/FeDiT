
from __future__ import annotations

import argparse

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences
from neural_gap_selector import apply_neural_gap_selector


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply a trained neural gap selector to MOT tracks."
    )
    parser.add_argument("--model", required=True)
    parser.add_argument("--tracker-dir", required=True)
    parser.add_argument("--detections", required=True)
    parser.add_argument("--tracker-name", required=True)
    parser.add_argument("--sequence-names", nargs="+", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--device", default="mps")
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--batch-size", type=int, default=4096)
    parser.add_argument("--duplicate-iou", type=float, default=0.5)
    parser.add_argument(
        "--snap-iou",
        type=float,
        default=0.0,
        help="Snap accepted gaps to the best GroundingDINO box above this IoU.",
    )
    parser.add_argument(
        "--max-added-fraction",
        type=float,
        default=None,
        help="Cap accepted gap rows as a fraction of existing tracker rows.",
    )
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    names = [str(value) for value in args.sequence_names]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be used: {unknown}")
    output = apply_neural_gap_selector(
        model_path=rel(args.model),
        tracker_dir=rel(args.tracker_dir),
        detection_dir=rel(args.detections),
        target_dir=rel(f"outputs/tracks/{args.tracker_name}"),
        sequences=load_sequences(rel(args.data_root)),
        sequence_names=names,
        device=str(args.device),
        threshold=args.threshold,
        batch_size=int(args.batch_size),
        duplicate_iou=float(args.duplicate_iou),
        snap_iou=float(args.snap_iou),
        max_added_fraction=args.max_added_fraction,
        overwrite=bool(args.overwrite),
    )
    print(f"Wrote neural gap tracks: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
