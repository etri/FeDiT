
from __future__ import annotations

import argparse
from pathlib import Path

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences
from osnet_quality_conditioner import apply_osnet_quality_conditioner


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply a fold-safe OSNet IoU-quality head before tracking."
    )
    parser.add_argument("--model", required=True)
    parser.add_argument("--detections", required=True)
    parser.add_argument("--embedding-dir", required=True)
    parser.add_argument("--run-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--device", default="mps")
    parser.add_argument("--threshold", type=float, default=0.01)
    parser.add_argument("--top-k", type=int, default=0)
    parser.add_argument("--blend-input", type=float, default=0.0)
    parser.add_argument("--box-delta-scale", type=float, default=0.0)
    parser.add_argument("--batch-size", type=int, default=4096)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    output = apply_osnet_quality_conditioner(
        model_path=rel(args.model),
        detection_dir=rel(args.detections),
        embedding_dir=rel(args.embedding_dir),
        target_dir=rel(Path("outputs/detections") / args.run_name),
        sequences=load_sequences(rel(args.data_root), names),
        sequence_names=names,
        device=args.device,
        threshold=float(args.threshold),
        top_k=int(args.top_k) if int(args.top_k) > 0 else None,
        blend_input=float(args.blend_input),
        box_delta_scale=float(args.box_delta_scale),
        batch_size=int(args.batch_size),
        overwrite=bool(args.overwrite),
    )
    print(f"Wrote OSNet quality-conditioned detections: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
