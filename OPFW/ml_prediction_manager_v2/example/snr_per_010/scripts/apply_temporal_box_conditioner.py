
from __future__ import annotations

import argparse
from pathlib import Path

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences
from temporal_box_conditioner import apply_temporal_box_conditioner


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply temporal objectness and box conditioning before tracking."
    )
    parser.add_argument("--model", required=True)
    parser.add_argument(
        "--secondary-model",
        default=None,
        help="Optional compatible temporal model for score/box ensembling.",
    )
    parser.add_argument("--detections", required=True)
    parser.add_argument("--run-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--threshold", type=float, default=0.05)
    parser.add_argument("--top-k", type=int, default=700)
    parser.add_argument("--blend-input", type=float, default=0.0)
    parser.add_argument("--box-delta-scale", type=float, default=1.0)
    parser.add_argument("--secondary-weight", type=float, default=0.0)
    parser.add_argument("--secondary-box-weight", type=float, default=0.0)
    parser.add_argument("--batch-size", type=int, default=4096)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    output = apply_temporal_box_conditioner(
        model_path=rel(args.model),
        secondary_model_path=(
            None
            if args.secondary_model is None
            else rel(args.secondary_model)
        ),
        detection_dir=rel(args.detections),
        target_dir=rel(Path("outputs/detections") / args.run_name),
        sequences=load_sequences(rel(args.data_root), names),
        sequence_names=names,
        device=args.device,
        threshold=float(args.threshold),
        top_k=int(args.top_k) if int(args.top_k) > 0 else None,
        blend_input=float(args.blend_input),
        box_delta_scale=float(args.box_delta_scale),
        secondary_weight=float(args.secondary_weight),
        secondary_box_weight=float(args.secondary_box_weight),
        batch_size=int(args.batch_size),
        overwrite=bool(args.overwrite),
    )
    print(f"Wrote temporal box-conditioned detections: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
