from __future__ import annotations

import configparser
import csv
import math
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


TRAIN_SEQUENCES = ("MOT20-01", "MOT20-02", "MOT20-03", "MOT20-05")
TEST_SEQUENCES = ("MOT20-04", "MOT20-06", "MOT20-07", "MOT20-08")
TARGET_CLASS_IDS = {1}
IGNORE_CLASS_IDS = {2, 6, 7, 8, 11, 12, 13}
FORBIDDEN_DATASET_TOKENS = (
    "MOT17",
    "CrowdHuman",
    "CityPersons",
    "ETHZ",
    "HiEve",
    "DanceTrack",
)


@dataclass(frozen=True, slots=True)
class SequenceInfo:
    name: str
    root: Path
    img_dir: Path
    gt_path: Path
    seqinfo_path: Path
    frame_rate: int
    width: int
    height: int
    seq_length: int
    image_ext: str


@dataclass(frozen=True, slots=True)
class DataSummary:
    sequence: str
    frames: int
    gt_rows: int
    valid_gt: int
    ignored_gt: int


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def assert_no_forbidden_dataset_path(path: str | Path) -> None:
    text = str(Path(path).expanduser())
    normalized = text.replace("\\", "/")
    if "MOT20/test" in normalized or "MOT20_IGNORED_test_do_not_use" in normalized:
        raise AssertionError(f"Forbidden MOT20 test path opened by train-only script: {path}")
    for token in FORBIDDEN_DATASET_TOKENS:
        if token in normalized:
            raise AssertionError(f"Forbidden external dataset token '{token}' in path: {path}")


def resolve_train_root(data_root: str | Path) -> Path:
    root = Path(data_root).expanduser().resolve()
    assert_no_forbidden_dataset_path(root)
    if root.name == "train":
        train_root = root
    else:
        train_root = root / "train"
    train_root = train_root.resolve()
    assert_no_forbidden_dataset_path(train_root)
    if train_root.name != "train" or train_root.parent.name != "MOT20":
        
        if not all((train_root / seq).exists() for seq in TRAIN_SEQUENCES):
            raise FileNotFoundError(
                f"Expected MOT20 train root or MOT20 root, got: {root}. "
                f"Missing required train sequences under: {train_root}"
            )
    return train_root


def mot20_root_from_train(train_root: str | Path) -> Path:
    train = resolve_train_root(train_root)
    return train.parent


def _read_seqinfo(path: Path) -> dict[str, str]:
    if not path.exists():
        raise FileNotFoundError(f"Missing seqinfo.ini: {path}")
    parser = configparser.ConfigParser()
    parser.read(path)
    if "Sequence" not in parser:
        raise ValueError(f"Invalid seqinfo.ini, missing [Sequence]: {path}")
    return {key.lower(): value for key, value in parser["Sequence"].items()}


def load_sequences(
    data_root: str | Path,
    sequence_names: Iterable[str] | None = None,
) -> list[SequenceInfo]:
    train_root = resolve_train_root(data_root)
    names = tuple(sequence_names or TRAIN_SEQUENCES)
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences are allowed; got: {unknown}")

    sequences: list[SequenceInfo] = []
    for name in names:
        seq_root = (train_root / name).resolve()
        assert_no_forbidden_dataset_path(seq_root)
        seqinfo_path = seq_root / "seqinfo.ini"
        img_dir = seq_root / "img1"
        gt_path = seq_root / "gt" / "gt.txt"
        if not img_dir.exists():
            raise FileNotFoundError(f"Missing image directory: {img_dir}")
        if not gt_path.exists():
            raise FileNotFoundError(f"Missing train GT file: {gt_path}")
        info = _read_seqinfo(seqinfo_path)
        sequences.append(
            SequenceInfo(
                name=name,
                root=seq_root,
                img_dir=img_dir,
                gt_path=gt_path,
                seqinfo_path=seqinfo_path,
                frame_rate=int(info.get("framerate", 25)),
                width=int(info["imwidth"]),
                height=int(info["imheight"]),
                seq_length=int(info["seqlength"]),
                image_ext=str(info.get("imext", ".jpg")),
            )
        )
    return sequences


def iter_frame_paths(sequence: SequenceInfo) -> Iterable[tuple[int, Path]]:
    for frame_idx in range(1, int(sequence.seq_length) + 1):
        path = sequence.img_dir / f"{frame_idx:06d}{sequence.image_ext}"
        if not path.exists() and sequence.image_ext.lower() != ".jpg":
            path = sequence.img_dir / f"{frame_idx:06d}.jpg"
        yield frame_idx, path


def load_gt(gt_path: str | Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    path = Path(gt_path).expanduser().resolve()
    assert_no_forbidden_dataset_path(path)
    frame = pd.read_csv(path, header=None)
    while frame.shape[1] < 9:
        frame[frame.shape[1]] = 1
    frame = frame.iloc[:, :9].copy()
    frame.columns = ["frame", "id", "x", "y", "w", "h", "mark", "class_id", "visibility"]
    valid = frame[(frame["mark"] == 1) & (frame["class_id"].isin(TARGET_CLASS_IDS))].copy()
    ignore = frame[(frame["mark"] == 0) | (frame["class_id"].isin(IGNORE_CLASS_IDS))].copy()
    return valid, ignore


def gt_to_xyxy(frame: pd.DataFrame) -> np.ndarray:
    if len(frame) == 0:
        return np.zeros((0, 4), dtype=np.float64)
    values = frame[["x", "y", "w", "h"]].to_numpy(dtype=np.float64)
    values[:, 2] = values[:, 0] + values[:, 2]
    values[:, 3] = values[:, 1] + values[:, 3]
    return values


def summarize_train(data_root: str | Path) -> list[DataSummary]:
    summaries: list[DataSummary] = []
    for seq in load_sequences(data_root):
        valid, ignore = load_gt(seq.gt_path)
        gt_rows = int(len(pd.read_csv(seq.gt_path, header=None)))
        summaries.append(
            DataSummary(
                sequence=seq.name,
                frames=seq.seq_length,
                gt_rows=gt_rows,
                valid_gt=int(len(valid)),
                ignored_gt=int(len(ignore)),
            )
        )
    return summaries


def print_train_summary(data_root: str | Path) -> None:
    summaries = summarize_train(data_root)
    total_frames = sum(item.frames for item in summaries)
    total_valid = sum(item.valid_gt for item in summaries)
    total_rows = sum(item.gt_rows for item in summaries)
    print("MOT20 train summary")
    for item in summaries:
        density = item.valid_gt / max(item.frames, 1)
        print(
            f"  {item.sequence}: frames={item.frames} gt_rows={item.gt_rows} "
            f"valid_ped={item.valid_gt} ignored={item.ignored_gt} density={density:.2f}"
        )
    print(
        f"  TOTAL: frames={total_frames} gt_rows={total_rows} "
        f"valid_ped={total_valid} density={total_valid / max(total_frames, 1):.2f}"
    )


def move_test_split_if_present(mot20_root: str | Path) -> Path | None:
    root = Path(mot20_root).expanduser().resolve()
    test_root = root / "test"
    if not test_root.exists():
        return None
    destination = root.parent / "MOT20_IGNORED_test_do_not_use"
    if destination.exists():
        suffix = 1
        while (root.parent / f"MOT20_IGNORED_test_do_not_use_{suffix}").exists():
            suffix += 1
        destination = root.parent / f"MOT20_IGNORED_test_do_not_use_{suffix}"
    shutil.move(str(test_root), str(destination))
    return destination


def write_seqmap(trackeval_root: str | Path) -> Path:
    root = Path(trackeval_root).expanduser().resolve()
    seqmap_dir = root / "data" / "gt" / "mot_challenge" / "seqmaps"
    seqmap_dir.mkdir(parents=True, exist_ok=True)
    seqmap_path = seqmap_dir / "MOT20-train.txt"
    seqmap_path.write_text("name\n" + "\n".join(TRAIN_SEQUENCES) + "\n", encoding="utf-8")
    return seqmap_path


def read_mot_rows(path: str | Path) -> list[list[float]]:
    resolved = Path(path).expanduser().resolve()
    rows: list[list[float]] = []
    if not resolved.exists() or resolved.stat().st_size == 0:
        return rows
    with resolved.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue
            parts = text.split(",")
            if len(parts) != 10:
                raise ValueError(f"MOT result rows must have exactly 10 fields: {resolved}: {text[:120]}")
            try:
                values = [float(part) for part in parts]
            except ValueError as exc:
                raise ValueError(f"Non-numeric MOT row in {resolved}: {text[:120]}") from exc
            rows.append(values)
    return rows


def validate_mot_result_file(path: str | Path) -> None:
    rows = read_mot_rows(path)
    for index, row in enumerate(rows, start=1):
        if not all(math.isfinite(value) for value in row):
            raise ValueError(f"NaN/inf in MOT row {index}: {path}")
        if int(row[0]) < 1:
            raise ValueError(f"Frame ids must be >= 1 in row {index}: {path}")
        if int(row[1]) < 1:
            raise ValueError(f"Track ids must be positive in row {index}: {path}")
        if row[4] <= 0 or row[5] <= 0:
            raise ValueError(f"MOT boxes must have positive width/height in row {index}: {path}")


def validate_tracker_dir(tracker_data_dir: str | Path) -> None:
    data_dir = Path(tracker_data_dir).expanduser().resolve()
    for seq in TRAIN_SEQUENCES:
        validate_mot_result_file(data_dir / f"{seq}.txt")
    for seq in TEST_SEQUENCES:
        if (data_dir / f"{seq}.txt").exists():
            raise AssertionError(f"Test sequence result must not be generated: {data_dir / f'{seq}.txt'}")


def write_mot_rows(path: str | Path, rows: Iterable[tuple[int, int, float, float, float, float, float]]) -> Path:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        for frame, track_id, x, y, w, h, conf in sorted(rows, key=lambda r: (r[0], r[1], r[2], r[3])):
            if frame < 1 or track_id < 1 or w <= 0 or h <= 0:
                continue
            writer.writerow(
                [
                    int(frame),
                    int(track_id),
                    f"{float(x):.3f}",
                    f"{float(y):.3f}",
                    f"{float(w):.3f}",
                    f"{float(h):.3f}",
                    f"{float(conf):.6f}",
                    -1,
                    -1,
                    -1,
                ]
            )
    validate_mot_result_file(resolved)
    return resolved
