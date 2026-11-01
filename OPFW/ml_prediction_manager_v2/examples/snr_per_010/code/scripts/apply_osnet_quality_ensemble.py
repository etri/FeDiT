
from __future__ import annotations

import argparse
from pathlib import Path

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences
from osnet_quality_ensemble import apply_osnet_quality_ensemble


def _parse_model_map(values: list[str]) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for value in values:
        if "=" not in value:
            raise ValueError(
                f"Expected SEQUENCE=MODEL for --adapted-model, got {value!r}"
            )
        sequence, path = value.split("=", 1)
        if not sequence or not path:
            raise ValueError(f"Invalid --adapted-model value: {value!r}")
        result[str(sequence)] = rel(path)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Blend a fold-safe GT-trained OSNet quality model with "
            "sequence-specific pseudo-adapted models."
        )
    )
    parser.add_argument("--primary-model", required=True)
    parser.add_argument(
        "--adapted-model",
        action="append",
        required=True,
        metavar="SEQUENCE=MODEL",
    )
    parser.add_argument("--detections", required=True)
    parser.add_argument("--embedding-dir", required=True)
    parser.add_argument("--run-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--adapted-weight", type=float, required=True)
    parser.add_argument("--delta-adapted-weight", type=float, default=None)
    parser.add_argument("--device", default="mps")
    parser.add_argument("--threshold", type=float, default=0.001)
    parser.add_argument("--top-k", type=int, default=1000)
    parser.add_argument("--blend-input", type=float, default=0.0)
    parser.add_argument("--box-delta-scale", type=float, default=1.0)
    parser.add_argument("--batch-size", type=int, default=4096)
    parser.add_argument("--chunk-rows", type=int, default=65536)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    output = apply_osnet_quality_ensemble(
        primary_model_path=rel(args.primary_model),
        adapted_model_paths=_parse_model_map(args.adapted_model),
        detection_dir=rel(args.detections),
        embedding_dir=rel(args.embedding_dir),
        target_dir=rel(Path("outputs/detections") / args.run_name),
        sequences=load_sequences(rel(args.data_root), names),
        sequence_names=names,
        adapted_weight=float(args.adapted_weight),
        delta_adapted_weight=args.delta_adapted_weight,
        device=str(args.device),
        threshold=float(args.threshold),
        top_k=int(args.top_k) if int(args.top_k) > 0 else None,
        blend_input=float(args.blend_input),
        box_delta_scale=float(args.box_delta_scale),
        batch_size=int(args.batch_size),
        chunk_rows=int(args.chunk_rows),
        overwrite=bool(args.overwrite),
    )
    print(f"Wrote OSNet quality ensemble detections: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
