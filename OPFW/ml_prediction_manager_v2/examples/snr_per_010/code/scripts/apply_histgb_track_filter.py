
from __future__ import annotations

import argparse
import json
import pickle
import shutil
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from aux_detection_features import make_aux_feature_matrix
from mot20_io import TRAIN_SEQUENCES, load_sequences, read_mot_rows, validate_mot_result_file, validate_tracker_dir, write_mot_rows
from histgb_track_features import make_feature_matrix
from tracklet_linker import load_tracklets


def _read_caps(items: list[str]) -> dict[str, int]:
    caps: dict[str, int] = {}
    for item in items:
        if "=" not in str(item):
            raise ValueError(f"--max-frame must be SEQ=FRAME, got: {item}")
        seq_name, value = str(item).split("=", 1)
        if seq_name not in TRAIN_SEQUENCES:
            raise AssertionError(f"Only MOT20 train sequences may be capped: {seq_name}")
        caps[seq_name] = int(value)
    return caps


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply a train-tuned HistGradientBoosting track filter.")
    parser.add_argument("--tracker-dir", required=True)
    parser.add_argument(
        "--always-keep-tracker-dir",
        default=None,
        help="Optional tracker whose track IDs are retained regardless of the learned score.",
    )
    parser.add_argument(
        "--always-keep-exact-rows",
        action="store_true",
        help="Copy protected tracker rows exactly and append only newly selected source track IDs.",
    )
    parser.add_argument("--model", required=True)
    parser.add_argument(
        "--aux-detections",
        default=None,
        help="Auxiliary detection directory required by models trained with detector-support features.",
    )
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--max-frame", action="append", default=[])
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--keep-long-min-len", type=int, default=80)
    parser.add_argument("--keep-long-min-median-conf", type=float, default=0.45)
    parser.add_argument("--trackeval-root", default="external/TrackEval")
    parser.add_argument("--benchmark", default="MOT20COVERED")
    parser.add_argument("--split", default="train")
    parser.add_argument("--copy-to-trackeval", action="store_true")
    parser.add_argument("--overwrite-trackeval", action="store_true")
    args = parser.parse_args()

    if str(args.output_tracker_name).startswith("ORACLE_"):
        raise AssertionError("HistGB track filter cannot create ORACLE-named final candidates.")
    ensure_outputs()
    names = [str(v) for v in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be processed: {unknown}")
    caps = _read_caps(args.max_frame)
    with rel(args.model).open("rb") as handle:
        model = pickle.load(handle)
    if model.get("kind") != "histgb_track_filter":
        raise AssertionError(f"Unexpected model kind: {model.get('kind')}")
    estimator = model["estimator"]
    model_metadata = model.get("metadata", {})
    use_seq_features = bool(model_metadata.get("uses_sequence_id_features", True))
    feature_mode = str(model_metadata.get("feature_mode", "absolute"))
    uses_aux_features = bool(model_metadata.get("uses_aux_detector_features", False))
    aux_detection_arg = args.aux_detections or model_metadata.get("aux_detection_dir")
    if uses_aux_features and not aux_detection_arg:
        raise ValueError("This model requires --aux-detections.")
    aux_root = rel(aux_detection_arg) if uses_aux_features else None
    aux_score_thresholds = model_metadata.get("aux_score_thresholds", [0.10, 0.20, 0.35, 0.50])
    aux_iou_threshold = float(model_metadata.get("aux_iou_threshold", 0.30))
    threshold = float(model["metadata"].get("threshold", 0.5) if args.threshold is None else args.threshold)
    tracker_root = rel(args.tracker_dir)
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    always_keep_root = rel(args.always_keep_tracker_dir) if args.always_keep_tracker_dir else None
    if always_keep_root is not None and (always_keep_root / "data").exists():
        always_keep_root = always_keep_root / "data"
    out = rel(Path("outputs/tracks") / str(args.output_tracker_name))
    out.mkdir(parents=True, exist_ok=True)

    stats = {}
    for seq in load_sequences(rel(args.data_root), names):
        max_frame = int(caps.get(seq.name, seq.seq_length))
        tracklets = load_tracklets(tracker_root, seq, compute_hist=False)
        if tracklets:
            aux_features = (
                make_aux_feature_matrix(
                    tracklets,
                    aux_root / f"{seq.name}.npz",
                    score_thresholds=aux_score_thresholds,
                    iou_threshold=aux_iou_threshold,
                )
                if aux_root is not None
                else None
            )
            x = make_feature_matrix(
                tracklets,
                seq,
                use_seq_features=use_seq_features,
                feature_mode=feature_mode,
                aux_features=aux_features,
            )
            prob = estimator.predict_proba(x)[:, 1].astype(np.float32)
        else:
            prob = np.zeros((0,), dtype=np.float32)
        protected_rows = (
            read_mot_rows(always_keep_root / f"{seq.name}.txt")
            if always_keep_root is not None
            else []
        )
        protected_ids = {int(row[1]) for row in protected_rows}
        keep_ids: set[int] = set(protected_ids)
        protected_tracks = len(keep_ids)
        for track, p in zip(tracklets, prob, strict=False):
            long_keep = (
                int(args.keep_long_min_len) > 0
                and track.length >= int(args.keep_long_min_len)
                and float(np.median(track.scores)) >= float(args.keep_long_min_median_conf)
            )
            if float(p) >= threshold or long_keep:
                keep_ids.add(int(track.track_id))
        rows = read_mot_rows(tracker_root / f"{seq.name}.txt")
        if args.always_keep_exact_rows and always_keep_root is not None:
            out_rows = [
                (
                    int(row[0]),
                    int(row[1]),
                    float(row[2]),
                    float(row[3]),
                    float(row[4]),
                    float(row[5]),
                    float(row[6]),
                )
                for row in protected_rows
                if int(row[0]) <= max_frame
            ]
            out_rows.extend(
                [
                    (
                        int(row[0]),
                        int(row[1]),
                        float(row[2]),
                        float(row[3]),
                        float(row[4]),
                        float(row[5]),
                        float(row[6]),
                    )
                    for row in rows
                    if int(row[1]) in keep_ids
                    and int(row[1]) not in protected_ids
                    and int(row[0]) <= max_frame
                ]
            )
        else:
            out_rows = [
                (int(row[0]), int(row[1]), float(row[2]), float(row[3]), float(row[4]), float(row[5]), float(row[6]))
                for row in rows
                if int(row[1]) in keep_ids and int(row[0]) <= max_frame
            ]
        write_mot_rows(out / f"{seq.name}.txt", out_rows)
        stats[seq.name] = {
            "tracks": len(tracklets),
            "kept_tracks": len(keep_ids),
            "protected_tracks": protected_tracks,
            "source_rows": len(rows),
            "output_rows": len(out_rows),
            "threshold": threshold,
            "max_frame": max_frame,
        }
        print(f"{seq.name}: kept {len(keep_ids)}/{len(tracklets)} tracks at threshold {threshold:.4f}")
    for seq_name in names:
        validate_mot_result_file(out / f"{seq_name}.txt")
    if set(names) == set(TRAIN_SEQUENCES):
        validate_tracker_dir(out)

    if args.copy_to_trackeval:
        trackeval_data = (
            rel(args.trackeval_root)
            / "data"
            / "trackers"
            / "mot_challenge"
            / f"{args.benchmark}-{args.split}"
            / str(args.output_tracker_name)
            / "data"
        )
        if trackeval_data.exists() and args.overwrite_trackeval:
            shutil.rmtree(trackeval_data)
        trackeval_data.mkdir(parents=True, exist_ok=True)
        for seq_name in names:
            shutil.copy2(out / f"{seq_name}.txt", trackeval_data / f"{seq_name}.txt")
            validate_mot_result_file(trackeval_data / f"{seq_name}.txt")
        if set(names) == set(TRAIN_SEQUENCES):
            validate_tracker_dir(trackeval_data)

    (out / "histgb_track_filter_metadata.json").write_text(
        json.dumps(
            {
                "source_tracker_dir": str(tracker_root),
                "always_keep_tracker_dir": str(always_keep_root) if always_keep_root is not None else None,
                "always_keep_exact_rows": bool(args.always_keep_exact_rows),
                "model": str(rel(args.model)),
                "aux_detection_dir": str(aux_root) if aux_root is not None else None,
                "threshold_override": args.threshold,
                "stats": stats,
                "benchmark": str(args.benchmark),
                "split": str(args.split),
                "sequence_names": names,
                "frame_caps": caps,
                "learned_postprocess_only": True,
                "mot20_train_tuned": True,
                "no_detector_finetuning": True,
                "no_external_dataset": True,
                "no_oracle_ids": True,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote HistGB-filtered tracks: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
