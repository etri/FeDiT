from __future__ import annotations

import configparser
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


@dataclass(slots=True)
class MOT20Sequence:
    name: str
    root: Path
    img_dir: Path
    gt_path: Path
    frame_rate: int
    width: int
    height: int
    seq_length: int


def _read_seqinfo(path: Path) -> dict[str, str]:
    parser = configparser.ConfigParser()
    parser.read(path)
    return {key.lower(): value for key, value in parser["Sequence"].items()}


def load_mot20_sequences(
    dataset_root: str | Path,
    split: str = "train",
    sequence_names: list[str] | None = None,
) -> list[MOT20Sequence]:
    root = Path(dataset_root).expanduser().resolve() / split
    if not root.exists():
        raise FileNotFoundError(f"MOT20 split not found: {root}")
    if sequence_names:
        names = sorted(sequence_names)
    else:
        
        
        names = sorted(p.name for p in root.iterdir() if p.is_dir() and (p / "seqinfo.ini").exists())
    sequences: list[MOT20Sequence] = []
    for name in names:
        seq_root = root / name
        seqinfo = _read_seqinfo(seq_root / "seqinfo.ini")
        sequences.append(
            MOT20Sequence(
                name=name,
                root=seq_root,
                img_dir=seq_root / "img1",
                gt_path=seq_root / "gt" / "gt.txt",
                frame_rate=int(seqinfo.get("framerate", 25)),
                width=int(seqinfo["imwidth"]),
                height=int(seqinfo["imheight"]),
                seq_length=int(seqinfo["seqlength"]),
            )
        )
    return sequences


def iter_frame_paths(
    sequence: MOT20Sequence,
    frame_stride: int = 1,
    max_frames: int | None = None,
    *,
    start_frame_idx: int = 1,
) -> Iterator[tuple[int, Path]]:
    yielded = 0
    stride = max(1, int(frame_stride))
    start = max(1, int(start_frame_idx))
    offset = (start - 1) % stride
    if offset != 0:
        start += stride - offset

    for frame_idx in range(start, sequence.seq_length + 1, stride):
        frame_path = sequence.img_dir / f"{frame_idx:06d}.jpg"
        if not frame_path.exists():
            continue
        yield frame_idx, frame_path
        yielded += 1
        if max_frames is not None and yielded >= max_frames:
            return
