
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from _common import ensure_outputs, rel
from mot20_io import (
    TRAIN_SEQUENCES,
    load_sequences,
    validate_mot_result_file,
    validate_tracker_dir,
)
from track_filter import apply_track_filter, load_filter_model


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply a learned MOT20 train-only track-level FP suppressor.")
    parser.add_argument("--tracker-dir", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--keep-long-min-len", type=int, default=0)
    parser.add_argument("--keep-long-min-median-conf", type=float, default=1.1)
    parser.add_argument("--support-tracker-dir", default=None)
    parser.add_argument("--sequence-names", nargs="+", default=None)
    args = parser.parse_args()

    if str(args.output_tracker_name).startswith("ORACLE_"):
        raise AssertionError("Learned post-processing cannot create ORACLE-named final candidates.")
    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be filtered: {unknown}")
    sequences = load_sequences(rel(args.data_root), names)
    model = load_filter_model(rel(args.model))
    support_tracker_dir = (
        rel(args.support_tracker_dir)
        if args.support_tracker_dir is not None
        else (
            rel(model["support_tracker_dir"])
            if model.get("support_tracker_dir")
            else None
        )
    )
    output_dir = rel(Path("outputs/tracks") / str(args.output_tracker_name))
    apply_track_filter(
        tracker_dir=rel(args.tracker_dir),
        output_dir=output_dir,
        sequences=sequences,
        model=model,
        threshold=args.threshold,
        keep_long_min_len=int(args.keep_long_min_len),
        keep_long_min_median_conf=float(args.keep_long_min_median_conf),
        support_tracker_dir=support_tracker_dir,
    )
    if set(names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(output_dir)
    else:
        for name in names:
            validate_mot_result_file(output_dir / f"{name}.txt")

    trackeval_data = rel(args.trackeval_root) / "data" / "trackers" / "mot_challenge" / "MOT20-train" / str(args.output_tracker_name) / "data"
    trackeval_data.mkdir(parents=True, exist_ok=True)
    for seq_name in names:
        shutil.copy2(output_dir / f"{seq_name}.txt", trackeval_data / f"{seq_name}.txt")

    metadata = {
        "source_tracker_dir": str(rel(args.tracker_dir)),
        "model": str(rel(args.model)),
        "threshold_override": args.threshold,
        "model_split": model.get("split"),
        "support_tracker_dir": (
            str(support_tracker_dir)
            if support_tracker_dir is not None
            else None
        ),
        "sequence_names": names,
        "learned_postprocess_only": True,
        "no_detector_finetuning": True,
        "no_external_dataset": True,
    }
    (output_dir / "track_filter_metadata.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote filtered tracks: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
