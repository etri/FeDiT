
from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path

import numpy as np

from _common import ensure_outputs, rel
from mot20_io import TRAIN_SEQUENCES, load_sequences, read_mot_rows, validate_mot_result_file, write_mot_rows
from osnet_tracklet_linker import load_osnet_appearances, osnet_pair_features
from tracklet_linker import iter_candidate_pairs, load_tracklets


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply an OSNet-aware learned tracklet linker.")
    parser.add_argument("--tracker-dir", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--output-tracker-name", required=True)
    parser.add_argument("--data-root", default="data/MOT20/train")
    parser.add_argument("--sequence-names", nargs="+", default=None)
    parser.add_argument("--threshold", type=float, default=None)
    args = parser.parse_args()

    ensure_outputs()
    names = [str(value) for value in (args.sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be processed: {unknown}")
    with rel(args.model).open("rb") as handle:
        model = pickle.load(handle)
    if model.get("kind") != "histgb_osnet_tracklet_linker":
        raise AssertionError(f"Unexpected model kind: {model.get('kind')}")
    estimator = model["estimator"]
    metadata = model["metadata"]
    threshold = float(metadata["threshold"] if args.threshold is None else args.threshold)
    tracker_dir = rel(args.tracker_dir)
    detection_dir = Path(metadata["detection_dir"]).expanduser().resolve()
    embedding_dir = Path(metadata["embedding_dir"]).expanduser().resolve()
    output_dir = rel(Path("outputs/tracks") / str(args.output_tracker_name))
    output_dir.mkdir(parents=True, exist_ok=True)
    stats = {}

    for sequence in load_sequences(rel(args.data_root), names):
        tracklets = load_tracklets(tracker_dir, sequence, compute_hist=False)
        appearances, appearance_stats = load_osnet_appearances(
            tracklets,
            sequence,
            detection_dir=detection_dir,
            embedding_dir=embedding_dir,
            max_samples=int(metadata["max_samples"]),
            endpoint_samples=int(metadata["endpoint_samples"]),
            min_match_iou=float(metadata["min_match_iou"]),
        )
        candidate_pairs = list(
            iter_candidate_pairs(
                tracklets,
                max_gap=int(metadata["max_gap"]),
                max_center_dist_h=float(metadata["max_center_dist_h"]),
                max_pred_center_dist_h=metadata["max_pred_center_dist_h"],
            )
        )
        if candidate_pairs:
            features = np.stack(
                [
                    osnet_pair_features(first, second, appearances)
                    for first, second in candidate_pairs
                ]
            ).astype(np.float32)
            probabilities = estimator.predict_proba(features)[:, 1].astype(np.float32)
        else:
            probabilities = np.zeros((0,), dtype=np.float32)

        frame_sets = {
            int(track.track_id): set(int(frame) for frame in track.frames.tolist())
            for track in tracklets
        }
        parent = {int(track.track_id): int(track.track_id) for track in tracklets}

        def find(track_id: int) -> int:
            while parent[track_id] != track_id:
                parent[track_id] = parent[parent[track_id]]
                track_id = parent[track_id]
            return track_id

        def union(first_id: int, second_id: int) -> bool:
            first_root, second_root = find(first_id), find(second_id)
            if first_root == second_root or frame_sets[first_root] & frame_sets[second_root]:
                return False
            if len(frame_sets[first_root]) < len(frame_sets[second_root]):
                first_root, second_root = second_root, first_root
            parent[second_root] = first_root
            frame_sets[first_root].update(frame_sets[second_root])
            return True

        accepted = sorted(
            [
                (float(probability), int(first.track_id), int(second.track_id))
                for (first, second), probability in zip(
                    candidate_pairs, probabilities, strict=False
                )
                if float(probability) >= threshold
            ],
            reverse=True,
        )
        merged = sum(int(union(first_id, second_id)) for _, first_id, second_id in accepted)
        source_root = tracker_dir / "data" if (tracker_dir / "data").exists() else tracker_dir
        source_rows = read_mot_rows(source_root / f"{sequence.name}.txt")
        root_to_new: dict[int, int] = {}
        output_rows = []
        for row in source_rows:
            root = find(int(row[1]))
            if root not in root_to_new:
                root_to_new[root] = len(root_to_new) + 1
            output_rows.append(
                (
                    int(row[0]),
                    root_to_new[root],
                    float(row[2]),
                    float(row[3]),
                    float(row[4]),
                    float(row[5]),
                    float(row[6]),
                )
            )
        output_path = output_dir / f"{sequence.name}.txt"
        write_mot_rows(output_path, output_rows)
        validate_mot_result_file(output_path)
        stats[sequence.name] = {
            "candidate_pairs": len(candidate_pairs),
            "accepted_pairs": len(accepted),
            "merged_pairs": int(merged),
            "source_tracks": len(tracklets),
            "output_tracks": len(root_to_new),
            "threshold": threshold,
            "appearance": appearance_stats,
        }
        print(
            f"{sequence.name}: merged {merged}/{len(accepted)} accepted pairs; "
            f"tracks {len(tracklets)} -> {len(root_to_new)}"
        )

    (output_dir / "osnet_tracklet_linker_metadata.json").write_text(
        json.dumps(
            {
                "source_tracker": str(tracker_dir),
                "model": str(rel(args.model)),
                "threshold_override": args.threshold,
                "sequence_names": names,
                "stats": stats,
                "no_yolo_inference": True,
                "no_heldout_gt": True,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote OSNet-linked tracks: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
