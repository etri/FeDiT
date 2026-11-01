from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np

from detection_io import load_detections
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, assert_no_forbidden_dataset_path


EMBEDDING_DIM = 288


def crop_hsv_grad_embedding(image: np.ndarray | None, box_xyxy: np.ndarray) -> np.ndarray:
    embedding = np.zeros((EMBEDDING_DIM,), dtype=np.float32)
    if image is None:
        return embedding
    h, w = image.shape[:2]
    x1 = int(max(0, min(w - 1, math.floor(float(box_xyxy[0])))))
    y1 = int(max(0, min(h - 1, math.floor(float(box_xyxy[1])))))
    x2 = int(max(0, min(w, math.ceil(float(box_xyxy[2])))))
    y2 = int(max(0, min(h, math.ceil(float(box_xyxy[3])))))
    if x2 <= x1 or y2 <= y1:
        return embedding
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return embedding

    resized = cv2.resize(crop, (64, 128), interpolation=cv2.INTER_LINEAR)
    hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
    color = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 4], [0, 180, 0, 256, 0, 256]).reshape(-1).astype(np.float32)
    color /= max(float(np.linalg.norm(color)), 1e-8)

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx * gx + gy * gy)
    angle = (np.arctan2(gy, gx) + np.pi) * (8.0 / (2.0 * np.pi))
    bins = np.floor(angle).astype(np.int32) % 8
    grad_parts: list[np.ndarray] = []
    for stripe in np.array_split(np.arange(gray.shape[0]), 4):
        hist = np.bincount(bins[stripe, :].reshape(-1), weights=mag[stripe, :].reshape(-1), minlength=8).astype(np.float32)
        hist /= max(float(np.linalg.norm(hist)), 1e-8)
        grad_parts.append(hist)
    grad = np.concatenate(grad_parts).astype(np.float32)
    embedding[:256] = color
    embedding[256:] = grad
    embedding /= max(float(np.linalg.norm(embedding)), 1e-8)
    return embedding


def extract_sequence_embeddings(
    *,
    detection_dir: str | Path,
    sequence: SequenceInfo,
    max_dets_per_frame: int | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    det_root = Path(detection_dir).expanduser().resolve()
    assert_no_forbidden_dataset_path(det_root)
    detections = load_detections(det_root / f"{sequence.name}.npz")
    embeddings = np.zeros((len(detections), EMBEDDING_DIM), dtype=np.float16)
    extracted = np.zeros((len(detections),), dtype=bool)
    by_frame = detections.by_frame()
    for frame_idx, indices in sorted(by_frame.items()):
        frame_indices = indices
        if max_dets_per_frame is not None and len(frame_indices) > int(max_dets_per_frame):
            scores = detections.calibrated_scores[frame_indices]
            order = np.argsort(-scores)[: int(max_dets_per_frame)]
            frame_indices = frame_indices[order]
        image_path = sequence.img_dir / f"{int(frame_idx):06d}{sequence.image_ext}"
        if not image_path.exists() and sequence.image_ext.lower() != ".jpg":
            image_path = sequence.img_dir / f"{int(frame_idx):06d}.jpg"
        image = cv2.imread(str(image_path))
        for idx in frame_indices.astype(int).tolist():
            embeddings[idx] = crop_hsv_grad_embedding(image, detections.boxes[idx]).astype(np.float16)
            extracted[idx] = True
    return embeddings, extracted


def transfer_and_extract_sequence_embeddings(
    *,
    detection_dir: str | Path,
    sequence: SequenceInfo,
    reuse_detection_dir: str | Path,
    reuse_embedding_dir: str | Path,
    max_dets_per_frame: int | None = None,
) -> tuple[np.ndarray, np.ndarray, dict[str, int]]:
    det_root = Path(detection_dir).expanduser().resolve()
    reuse_det_root = Path(reuse_detection_dir).expanduser().resolve()
    reuse_emb_root = Path(reuse_embedding_dir).expanduser().resolve()
    for path in (det_root, reuse_det_root, reuse_emb_root):
        assert_no_forbidden_dataset_path(path)

    detections = load_detections(det_root / f"{sequence.name}.npz")
    reuse_detections = load_detections(reuse_det_root / f"{sequence.name}.npz")
    reuse_embeddings, reuse_extracted = load_embedding_file(reuse_emb_root / f"{sequence.name}.npz")
    if len(reuse_embeddings) != len(reuse_detections):
        raise ValueError(
            f"Embedding/detection count mismatch for {sequence.name}: "
            f"{len(reuse_embeddings)} != {len(reuse_detections)}"
        )

    def crop_key(frame: int, box: np.ndarray) -> tuple[int, int, int, int, int]:
        return (
            int(frame),
            int(max(0, min(sequence.width - 1, math.floor(float(box[0]))))),
            int(max(0, min(sequence.height - 1, math.floor(float(box[1]))))),
            int(max(0, min(sequence.width, math.ceil(float(box[2]))))),
            int(max(0, min(sequence.height, math.ceil(float(box[3]))))),
        )

    reusable: dict[tuple[int, int, int, int, int], int] = {}
    for idx in np.flatnonzero(reuse_extracted).astype(int).tolist():
        reusable.setdefault(crop_key(int(reuse_detections.frames[idx]), reuse_detections.boxes[idx]), idx)

    embeddings = np.zeros((len(detections), EMBEDDING_DIM), dtype=np.float16)
    extracted = np.zeros((len(detections),), dtype=bool)
    transferred = 0
    for idx, (frame, box) in enumerate(zip(detections.frames, detections.boxes, strict=True)):
        reuse_idx = reusable.get(crop_key(int(frame), box))
        if reuse_idx is None:
            continue
        embeddings[idx] = reuse_embeddings[reuse_idx].astype(np.float16)
        extracted[idx] = True
        transferred += 1

    newly_extracted = 0
    by_frame = detections.by_frame()
    for frame_idx, indices in sorted(by_frame.items()):
        frame_indices = indices[~extracted[indices]]
        if max_dets_per_frame is not None and len(frame_indices) > int(max_dets_per_frame):
            scores = detections.calibrated_scores[frame_indices]
            order = np.argsort(-scores)[: int(max_dets_per_frame)]
            frame_indices = frame_indices[order]
        if len(frame_indices) == 0:
            continue
        image_path = sequence.img_dir / f"{int(frame_idx):06d}{sequence.image_ext}"
        if not image_path.exists() and sequence.image_ext.lower() != ".jpg":
            image_path = sequence.img_dir / f"{int(frame_idx):06d}.jpg"
        image = cv2.imread(str(image_path))
        for idx in frame_indices.astype(int).tolist():
            embeddings[idx] = crop_hsv_grad_embedding(image, detections.boxes[idx]).astype(np.float16)
            extracted[idx] = True
            newly_extracted += 1

    return embeddings, extracted, {
        "detections": int(len(detections)),
        "transferred": int(transferred),
        "newly_extracted": int(newly_extracted),
        "unextracted": int(len(detections) - int(extracted.sum())),
    }


def save_embedding_file(path: str | Path, *, embeddings: np.ndarray, extracted: np.ndarray, metadata: dict) -> Path:
    out = Path(path).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        out,
        embeddings=embeddings.astype(np.float16),
        extracted=extracted.astype(bool),
    )
    meta_path = out.with_suffix(out.suffix + ".json")
    meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True) + "\n", encoding="utf-8")
    return out


def load_embedding_file(path: str | Path) -> tuple[np.ndarray, np.ndarray]:
    resolved = Path(path).expanduser().resolve()
    assert_no_forbidden_dataset_path(resolved)
    with np.load(resolved) as data:
        return data["embeddings"].astype(np.float32), data["extracted"].astype(bool)


def require_embedding_dir(embedding_dir: str | Path, sequence_names: Iterable[str] | None = None) -> dict[str, Path]:
    root = Path(embedding_dir).expanduser().resolve()
    assert_no_forbidden_dataset_path(root)
    names = [str(v) for v in (sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequence embeddings are allowed: {unknown}")
    paths = {seq: root / f"{seq}.npz" for seq in names}
    missing = [str(path) for path in paths.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing embedding files:\n" + "\n".join(missing))
    return paths
