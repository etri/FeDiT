from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np

from mot20_io import TRAIN_SEQUENCES, assert_no_forbidden_dataset_path


@dataclass(slots=True)
class DetectionSet:
    frames: np.ndarray
    boxes: np.ndarray
    raw_scores: np.ndarray
    calibrated_scores: np.ndarray
    prompt_ids: np.ndarray
    tile_ids: np.ndarray
    image_widths: np.ndarray
    image_heights: np.ndarray
    prompt_texts: np.ndarray

    def __len__(self) -> int:
        return int(len(self.frames))

    def copy(self) -> "DetectionSet":
        return DetectionSet(
            frames=self.frames.copy(),
            boxes=self.boxes.copy(),
            raw_scores=self.raw_scores.copy(),
            calibrated_scores=self.calibrated_scores.copy(),
            prompt_ids=self.prompt_ids.copy(),
            tile_ids=self.tile_ids.copy(),
            image_widths=self.image_widths.copy(),
            image_heights=self.image_heights.copy(),
            prompt_texts=self.prompt_texts.copy(),
        )

    def by_frame(self) -> dict[int, np.ndarray]:
        mapping: dict[int, list[int]] = {}
        for idx, frame in enumerate(self.frames.astype(int).tolist()):
            mapping.setdefault(int(frame), []).append(int(idx))
        return {frame: np.asarray(indices, dtype=np.int64) for frame, indices in mapping.items()}


def empty_detection_set() -> DetectionSet:
    return DetectionSet(
        frames=np.zeros((0,), dtype=np.int32),
        boxes=np.zeros((0, 4), dtype=np.float32),
        raw_scores=np.zeros((0,), dtype=np.float32),
        calibrated_scores=np.zeros((0,), dtype=np.float32),
        prompt_ids=np.zeros((0,), dtype=np.int32),
        tile_ids=np.zeros((0,), dtype=np.int32),
        image_widths=np.zeros((0,), dtype=np.int32),
        image_heights=np.zeros((0,), dtype=np.int32),
        prompt_texts=np.asarray([], dtype=object),
    )


def make_detection_set(
    *,
    frames: Iterable[int],
    boxes: Iterable[Iterable[float]],
    raw_scores: Iterable[float],
    calibrated_scores: Iterable[float] | None = None,
    prompt_ids: Iterable[int] | None = None,
    tile_ids: Iterable[int] | None = None,
    image_widths: Iterable[int] | None = None,
    image_heights: Iterable[int] | None = None,
    prompt_texts: Iterable[str] | None = None,
) -> DetectionSet:
    frame_array = np.asarray(list(frames), dtype=np.int32)
    box_array = np.asarray(list(boxes), dtype=np.float32).reshape((-1, 4))
    raw_array = np.asarray(list(raw_scores), dtype=np.float32)
    count = len(frame_array)
    if calibrated_scores is None:
        cal_array = raw_array.copy()
    else:
        cal_array = np.asarray(list(calibrated_scores), dtype=np.float32)
    prompt_array = np.asarray(list(prompt_ids) if prompt_ids is not None else [0] * count, dtype=np.int32)
    tile_array = np.asarray(list(tile_ids) if tile_ids is not None else [0] * count, dtype=np.int32)
    width_array = np.asarray(list(image_widths) if image_widths is not None else [0] * count, dtype=np.int32)
    height_array = np.asarray(list(image_heights) if image_heights is not None else [0] * count, dtype=np.int32)
    text_array = np.asarray(list(prompt_texts) if prompt_texts is not None else [""] * count, dtype=object)
    arrays = [box_array, raw_array, cal_array, prompt_array, tile_array, width_array, height_array, text_array]
    if any(len(array) != count for array in arrays):
        lengths = [len(array) for array in [frame_array] + arrays]
        raise ValueError(f"Detection arrays have inconsistent lengths: {lengths}")
    return DetectionSet(
        frames=frame_array,
        boxes=box_array,
        raw_scores=raw_array,
        calibrated_scores=cal_array,
        prompt_ids=prompt_array,
        tile_ids=tile_array,
        image_widths=width_array,
        image_heights=height_array,
        prompt_texts=text_array,
    )


def save_detections(path: str | Path, detections: DetectionSet) -> Path:
    resolved = Path(path).expanduser().resolve()
    assert_no_forbidden_dataset_path(resolved)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        resolved,
        frames=detections.frames.astype(np.int32),
        boxes=detections.boxes.astype(np.float32),
        raw_scores=detections.raw_scores.astype(np.float32),
        calibrated_scores=detections.calibrated_scores.astype(np.float32),
        prompt_ids=detections.prompt_ids.astype(np.int32),
        tile_ids=detections.tile_ids.astype(np.int32),
        image_widths=detections.image_widths.astype(np.int32),
        image_heights=detections.image_heights.astype(np.int32),
        prompt_texts=detections.prompt_texts.astype(str),
    )
    return resolved


def load_detections(path: str | Path) -> DetectionSet:
    resolved = Path(path).expanduser().resolve()
    assert_no_forbidden_dataset_path(resolved)
    with np.load(resolved, allow_pickle=True) as data:
        raw_scores = data["raw_scores"].astype(np.float32)
        calibrated = data["calibrated_scores"].astype(np.float32) if "calibrated_scores" in data else raw_scores.copy()
        return DetectionSet(
            frames=data["frames"].astype(np.int32),
            boxes=data["boxes"].astype(np.float32).reshape((-1, 4)),
            raw_scores=raw_scores,
            calibrated_scores=calibrated,
            prompt_ids=data["prompt_ids"].astype(np.int32) if "prompt_ids" in data else np.zeros_like(raw_scores, dtype=np.int32),
            tile_ids=data["tile_ids"].astype(np.int32) if "tile_ids" in data else np.zeros_like(raw_scores, dtype=np.int32),
            image_widths=data["image_widths"].astype(np.int32) if "image_widths" in data else np.zeros_like(raw_scores, dtype=np.int32),
            image_heights=data["image_heights"].astype(np.int32) if "image_heights" in data else np.zeros_like(raw_scores, dtype=np.int32),
            prompt_texts=data["prompt_texts"].astype(str) if "prompt_texts" in data else np.asarray([""] * len(raw_scores)),
        )


def detection_dir_sequences(detection_dir: str | Path) -> dict[str, Path]:
    root = Path(detection_dir).expanduser().resolve()
    assert_no_forbidden_dataset_path(root)
    return {seq: root / f"{seq}.npz" for seq in TRAIN_SEQUENCES if (root / f"{seq}.npz").exists()}


def require_detection_dir(detection_dir: str | Path) -> dict[str, Path]:
    root = Path(detection_dir).expanduser().resolve()
    paths = {seq: root / f"{seq}.npz" for seq in TRAIN_SEQUENCES}
    missing = [str(path) for path in paths.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing detection files:\n" + "\n".join(missing))
    return paths


def write_run_metadata(detection_dir: str | Path, payload: dict) -> Path:
    root = Path(detection_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    path = root / "metadata.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True, sort_keys=True) + "\n", encoding="utf-8")
    return path


def read_run_metadata(detection_dir: str | Path) -> dict:
    path = Path(detection_dir).expanduser().resolve() / "metadata.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def copy_detection_dir(src: str | Path, dst: str | Path, *, overwrite: bool = False) -> Path:
    source = Path(src).expanduser().resolve()
    target = Path(dst).expanduser().resolve()
    if target.exists() and overwrite:
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)
    for path in source.glob("*.npz"):
        shutil.copy2(path, target / path.name)
    metadata = source / "metadata.json"
    if metadata.exists():
        shutil.copy2(metadata, target / metadata.name)
    return target
