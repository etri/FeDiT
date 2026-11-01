from __future__ import annotations
import json
import os
from pathlib import Path
import time

import numpy as np
try:
    import cv2  
except Exception:  
    cv2 = None  
from PIL import Image
from tqdm import tqdm

from ir_autolabeling.data.mot20 import iter_frame_paths, load_mot20_sequences
from ir_autolabeling.detectors.grounded_sam2_detector import GroundedSam2Config, GroundedSam2Detector
from ir_autolabeling.utils.config import ensure_dir
from ir_autolabeling.utils.io import append_jsonl, dedupe_jsonl_by_int_key, inspect_jsonl_frame_sequence, iter_jsonl


def _raise_if_stop_requested(artifact_root: Path) -> None:
    pass

    stop_file = os.environ.get("IR_STOP_FILE")
    if stop_file:
        stop_path = Path(stop_file).expanduser()
        if not stop_path.is_absolute():
            stop_path = artifact_root / stop_path
    else:
        stop_path = artifact_root / "STOP"
    if stop_path.exists():
        raise KeyboardInterrupt(f"Stop requested via {stop_path}")


def _count_jsonl_rows(path: Path) -> tuple[int, int | None]:
    stats = inspect_jsonl_frame_sequence(path, frame_key="frame_idx")
    return stats.row_count, stats.last_frame_idx


def _scan_existing_frame_idxs(path: Path) -> tuple[set[int], bool, list[int], int | None]:
    existing: set[int] = set()
    strictly_increasing = True
    previous_idx: int | None = None
    duplicates: list[int] = []
    last_frame_idx: int | None = None

    for payload in iter_jsonl(path):
        raw = payload.get("frame_idx")
        try:
            frame_idx = int(raw)
        except (TypeError, ValueError):
            strictly_increasing = False
            continue
        last_frame_idx = frame_idx
        if previous_idx is not None and frame_idx <= previous_idx:
            strictly_increasing = False
        previous_idx = frame_idx
        if frame_idx in existing:
            duplicates.append(frame_idx)
            continue
        existing.add(frame_idx)

    return existing, strictly_increasing, duplicates, last_frame_idx


def _load_cache_payloads_by_frame_idx(path: Path) -> tuple[dict[int, dict], bool, list[int]]:
    pass

    payloads: dict[int, dict] = {}
    strictly_increasing = True
    previous_idx: int | None = None
    duplicates: list[int] = []

    for payload in iter_jsonl(path):
        raw = payload.get("frame_idx")
        try:
            frame_idx = int(raw)
        except (TypeError, ValueError):
            strictly_increasing = False
            continue
        if previous_idx is not None and frame_idx <= previous_idx:
            strictly_increasing = False
        previous_idx = frame_idx
        if frame_idx in payloads:
            duplicates.append(frame_idx)
            continue
        payloads[frame_idx] = payload

    return payloads, strictly_increasing, duplicates


def _rewrite_cache_sorted(cache_path: Path, payloads: dict[int, dict]) -> None:
    tmp_path = cache_path.with_name(cache_path.name + ".normalized.tmp")
    tmp_path.parent.mkdir(parents=True, exist_ok=True)
    with tmp_path.open("wt", encoding="utf-8") as handle:
        for frame_idx in sorted(payloads.keys()):
            handle.write(json.dumps(payloads[frame_idx], ensure_ascii=True) + "\n")
    tmp_path.replace(cache_path)


def _try_parse_frame_idx_from_jsonl_line(line: bytes) -> int | None:
    pass
    needle = b'"frame_idx"'
    start = line.find(needle)
    if start < 0:
        return None
    colon = line.find(b":", start + len(needle))
    if colon < 0:
        return None
    i = colon + 1
    while i < len(line) and line[i] in b" \t\r\n":
        i += 1
    if i < len(line) and line[i] == ord('"'):
        i += 1
    j = i
    while j < len(line) and line[j] in b"0123456789":
        j += 1
    if j == i:
        return None
    try:
        return int(line[i:j].decode("ascii", errors="ignore"))
    except Exception:
        return None


def _build_jsonl_offsets_by_frame_idx(
    path: Path,
    *,
    max_frame_idx: int | None = None,
) -> tuple[dict[int, int], bool, list[int]]:
    pass
    offsets: dict[int, int] = {}
    strictly_increasing = True
    previous_idx: int | None = None
    duplicates: list[int] = []

    with path.open("rb") as handle:
        while True:
            offset = handle.tell()
            line = handle.readline()
            if not line:
                break
            frame_idx = _try_parse_frame_idx_from_jsonl_line(line)
            if frame_idx is None:
                strictly_increasing = False
                continue
            if previous_idx is not None and int(frame_idx) <= int(previous_idx):
                strictly_increasing = False
            previous_idx = int(frame_idx)
            if int(frame_idx) in offsets:
                duplicates.append(int(frame_idx))
                continue
            offsets[int(frame_idx)] = int(offset)
            if max_frame_idx is not None and int(frame_idx) >= int(max_frame_idx):
                break

    return offsets, strictly_increasing, duplicates


def cache_mot20_detections(
    project_cfg: dict,
    *,
    overwrite: bool,
    max_frames_override: int | None,
    max_new_frames_override: int | None,
) -> list[Path]:
    dataset_cfg = project_cfg["dataset"]
    detector_cfg = GroundedSam2Config.from_dict(project_cfg["detector"])

    artifact_root = ensure_dir(project_cfg["paths"]["artifact_root"])
    cache_dir = artifact_root / "detections" / project_cfg["detector"]["cache_tag"]
    cache_dir.mkdir(parents=True, exist_ok=True)

    sequences = load_mot20_sequences(
        project_cfg["paths"]["dataset_root"],
        split=dataset_cfg["split"],
        sequence_names=dataset_cfg.get("sequences"),
    )
    written: list[Path] = []
    pending: list[tuple] = []
    for sequence in sequences:
        cache_path = cache_dir / f"{sequence.name}.jsonl"
        if cache_path.exists() and overwrite:
            cache_path.unlink()

        max_frames = max_frames_override
        if max_frames is None:
            max_frames = dataset_cfg.get("max_frames_per_sequence")

        frame_stride = int(dataset_cfg.get("frame_stride", 1))
        expected_total = int(max_frames) if max_frames is not None else None

        
        
        
        expected_frame_idxs = [
            frame_idx
            for frame_idx, _ in iter_frame_paths(sequence, frame_stride=frame_stride, max_frames=expected_total)
        ]

        payloads: dict[int, dict] | None = None
        duplicates: list[int] = []
        strictly_increasing = True
        last_frame_idx: int | None = None

        if cache_path.exists() and not overwrite:
            cache_stats = inspect_jsonl_frame_sequence(cache_path, frame_key="frame_idx")
            if not cache_stats.is_valid:
                
                dedupe_jsonl_by_int_key(cache_path, key="frame_idx", sort_by_key=True)
            existing, strictly_increasing, duplicates, _ = _scan_existing_frame_idxs(cache_path)
            if existing:
                last_frame_idx = max(existing)
            missing = [frame_idx for frame_idx in expected_frame_idxs if frame_idx not in existing]
        else:
            
            missing = list(expected_frame_idxs)

        
        
        needs_rewrite = bool(duplicates) or not strictly_increasing
        if missing and last_frame_idx is not None and min(missing) <= last_frame_idx:
            needs_rewrite = True

        if not missing and not needs_rewrite:
            written.append(cache_path)
            continue

        if needs_rewrite:
            payloads, _, _ = _load_cache_payloads_by_frame_idx(cache_path) if cache_path.exists() else ({}, True, [])
        pending.append((sequence, cache_path, missing, payloads, needs_rewrite))

    
    if pending:
        detector = GroundedSam2Detector(detector_cfg)
        for sequence, cache_path, missing, payloads, needs_rewrite in pending:
            missing_to_compute = missing
            if max_new_frames_override is not None and missing_to_compute:
                missing_to_compute = missing_to_compute[: max(0, int(max_new_frames_override))]
            if missing_to_compute:
                frame_batch_size = max(1, int(project_cfg["detector"].get("frame_batch_size", 1)))
                progress = tqdm(total=len(missing_to_compute), desc=f"cache:{sequence.name}")
                for start in range(0, len(missing_to_compute), frame_batch_size):
                    _raise_if_stop_requested(artifact_root)
                    frame_indices = missing_to_compute[start : start + frame_batch_size]
                    batch = [
                        (int(frame_idx), sequence.img_dir / f"{int(frame_idx):06d}.jpg")
                        for frame_idx in frame_indices
                    ]
                    batch = [(frame_idx, frame_path) for frame_idx, frame_path in batch if frame_path.exists()]
                    raws = detector.detect_batch(
                        [frame_path for _, frame_path in batch],
                        [frame_idx for frame_idx, _ in batch],
                    )
                    for raw in raws:
                        payload = raw.to_json_dict()
                        
                        
                        append_jsonl(cache_path, payload)
                        if payloads is not None:
                            payloads[int(raw.frame_idx)] = payload
                    progress.update(len(frame_indices))
                progress.close()
            if needs_rewrite and payloads is not None:
                _rewrite_cache_sorted(cache_path, payloads)
            if missing_to_compute or needs_rewrite:
                final_stats = inspect_jsonl_frame_sequence(cache_path, frame_key="frame_idx")
                if not final_stats.is_valid:
                    
                    
                    
                    repaired = dedupe_jsonl_by_int_key(cache_path, key="frame_idx", sort_by_key=True)
                    if repaired:
                        for _ in range(10):
                            final_stats = inspect_jsonl_frame_sequence(cache_path, frame_key="frame_idx")
                            if final_stats.is_valid:
                                break
                            time.sleep(0.05)
                    if not final_stats.is_valid:
                        duplicate_preview = ",".join(str(frame) for frame in final_stats.duplicate_frames[:10])
                        raise RuntimeError(
                            f"Corrupted detection cache detected at {cache_path} after caching: "
                            f"row_count={final_stats.row_count}, unique_frames={final_stats.unique_frame_count}, "
                            f"duplicate_frames=[{duplicate_preview}]"
                        )
            written.append(cache_path)
    return written


def refine_mot20_detections_from_cache(
    project_cfg: dict,
    *,
    source_cache_tag: str,
    overwrite: bool,
    max_frames_override: int | None,
    max_new_frames_override: int | None,
) -> list[Path]:
    dataset_cfg = project_cfg["dataset"]
    detector_cfg = GroundedSam2Config.from_dict(project_cfg["detector"])

    artifact_root = ensure_dir(project_cfg["paths"]["artifact_root"])
    target_cache_dir = artifact_root / "detections" / project_cfg["detector"]["cache_tag"]
    target_cache_dir.mkdir(parents=True, exist_ok=True)

    source_cache_dir = artifact_root / "detections" / str(source_cache_tag)
    if not source_cache_dir.exists():
        shared_full_dir = artifact_root.parent / "full" / "detections" / str(source_cache_tag)
        if shared_full_dir.exists():
            source_cache_dir = shared_full_dir
        else:
            raise FileNotFoundError(f"Source cache directory does not exist: {source_cache_dir}")

    sequences = load_mot20_sequences(
        project_cfg["paths"]["dataset_root"],
        split=dataset_cfg["split"],
        sequence_names=dataset_cfg.get("sequences"),
    )

    max_frames = max_frames_override
    if max_frames is None:
        max_frames = dataset_cfg.get("max_frames_per_sequence")

    written: list[Path] = []
    detector = GroundedSam2Detector(detector_cfg)
    
    
    try:
        load_sam2 = getattr(detector, "_load_sam2", None)
        if callable(load_sam2):
            load_sam2()
    except Exception:
        
        pass
    refinement_limit = detector_cfg.sam2_max_refinement_boxes
    if getattr(detector, "config", None) is not None:
        refinement_limit = detector.config.sam2_max_refinement_boxes
    sam2_available = getattr(detector, "sam_predictor", None) is not None and (
        refinement_limit is None or int(refinement_limit) > 0
    )

    for sequence in sequences:
        source_path = source_cache_dir / f"{sequence.name}.jsonl"
        if not source_path.exists():
            raise FileNotFoundError(f"Source cache file missing for sequence {sequence.name}: {source_path}")
        source_stats = inspect_jsonl_frame_sequence(source_path, frame_key="frame_idx")
        if not source_stats.is_valid:
            repaired = dedupe_jsonl_by_int_key(source_path, key="frame_idx", sort_by_key=True)
            if repaired:
                for _ in range(10):
                    source_stats = inspect_jsonl_frame_sequence(source_path, frame_key="frame_idx")
                    if source_stats.is_valid:
                        break
                    time.sleep(0.05)
        if not source_stats.is_valid:
            duplicate_preview = ",".join(str(frame) for frame in source_stats.duplicate_frames[:10])
            raise RuntimeError(
                f"Corrupted source detection cache detected at {source_path}: "
                f"row_count={source_stats.row_count}, unique_frames={source_stats.unique_frame_count}, "
                f"duplicate_frames=[{duplicate_preview}]"
            )

        expected_total = None
        if max_frames is not None:
            expected_total = int(max_frames)
        else:
            stride = max(1, int(dataset_cfg.get("frame_stride", 1)))
            expected_total = (sequence.seq_length + stride - 1) // stride

        stride = max(1, int(dataset_cfg.get("frame_stride", 1)))
        expected_frame_idxs = [
            frame_idx
            for frame_idx, _ in iter_frame_paths(sequence, frame_stride=stride, max_frames=expected_total, start_frame_idx=1)
        ]
        expected_set = set(expected_frame_idxs)
        if expected_set and max_new_frames_override is None and source_stats.unique_frame_count < len(expected_set):
            raise RuntimeError(
                f"Source cache {source_path} has only {source_stats.unique_frame_count} unique frames, "
                f"but {len(expected_set)} are required."
            )

        target_path = target_cache_dir / f"{sequence.name}.jsonl"
        if target_path.exists() and overwrite:
            target_path.unlink()

        target_stats = inspect_jsonl_frame_sequence(target_path, frame_key="frame_idx")
        if target_path.exists() and not overwrite and not target_stats.is_valid:
            repaired = dedupe_jsonl_by_int_key(target_path, key="frame_idx", sort_by_key=True)
            if repaired:
                for _ in range(10):
                    target_stats = inspect_jsonl_frame_sequence(target_path, frame_key="frame_idx")
                    if target_stats.is_valid:
                        break
                    time.sleep(0.05)
        if target_path.exists() and not overwrite and not target_stats.is_valid:
            duplicate_preview = ",".join(str(frame) for frame in target_stats.duplicate_frames[:10])
            raise RuntimeError(
                f"Corrupted target detection cache detected at {target_path}: "
                f"row_count={target_stats.row_count}, unique_frames={target_stats.unique_frame_count}, "
                f"duplicate_frames=[{duplicate_preview}]"
            )

        if not expected_frame_idxs:
            written.append(target_path)
            continue

        source_max_frame = max(expected_frame_idxs)
        if max_new_frames_override is not None and source_stats.last_frame_idx is not None:
            source_max_frame = min(int(source_max_frame), int(source_stats.last_frame_idx))

        source_offsets, _, _ = _build_jsonl_offsets_by_frame_idx(
            source_path,
            max_frame_idx=int(source_max_frame) if expected_frame_idxs else None,
        )
        missing_source = [frame_idx for frame_idx in expected_frame_idxs if frame_idx not in source_offsets]
        if missing_source:
            if max_new_frames_override is None:
                missing_preview = ",".join(str(frame) for frame in missing_source[:10])
                raise RuntimeError(
                    f"Source cache {source_path} is missing required frames: [{missing_preview}] "
                    f"(missing={len(missing_source)})"
                )
            
            
            available_max = max(source_offsets) if source_offsets else None
            if available_max is not None:
                missing_within_available = [frame for frame in missing_source if int(frame) <= int(available_max)]
                if missing_within_available:
                    missing_preview = ",".join(str(frame) for frame in missing_within_available[:10])
                    raise RuntimeError(
                        f"Source cache {source_path} is missing required frames within available coverage: "
                        f"[{missing_preview}] (missing={len(missing_within_available)})"
                    )
                expected_frame_idxs = [frame for frame in expected_frame_idxs if int(frame) <= int(available_max)]
            else:
                expected_frame_idxs = []

        if target_path.exists() and overwrite:
            target_path.unlink()

        if overwrite or not target_path.exists():
            target_offsets: dict[int, int] = {}
            target_strict = True
            target_dupes: list[int] = []
        else:
            target_offsets, target_strict, target_dupes = _build_jsonl_offsets_by_frame_idx(
                target_path,
                max_frame_idx=max(expected_frame_idxs) if expected_frame_idxs else None,
            )

        missing_target = [frame_idx for frame_idx in expected_frame_idxs if frame_idx not in target_offsets]
        needs_normalize = bool(target_dupes) or not bool(target_strict)

        frames_to_refine = expected_frame_idxs if overwrite or not target_path.exists() else missing_target
        if max_new_frames_override is not None and frames_to_refine:
            frames_to_refine = frames_to_refine[: max(0, int(max_new_frames_override))]
        if not frames_to_refine and not needs_normalize:
            written.append(target_path)
            continue

        write_mode = "wt" if overwrite or not target_path.exists() else "at"
        source_handle = source_path.open("rb")
        try:
            with target_path.open(write_mode, encoding="utf-8") as out:
                for frame_idx in frames_to_refine:
                    _raise_if_stop_requested(artifact_root)
                    source_handle.seek(source_offsets[int(frame_idx)])
                    raw_line = source_handle.readline()
                    payload = json.loads(raw_line)
                    boxes = np.asarray(payload.get("grounding_boxes") or [], dtype=np.float32)
                    scores = np.asarray(payload.get("scores") or [], dtype=np.float32)
                    initial_sam = payload.get("sam_boxes")
                    initial_sam_boxes = None
                    if initial_sam is not None:
                        initial_sam_boxes = np.asarray(initial_sam, dtype=np.float32)
                    if len(boxes) == 0 or not sam2_available:
                        fallback = initial_sam_boxes if initial_sam_boxes is not None else boxes
                        payload["sam_boxes"] = fallback.astype(float).tolist()
                        payload["mask_areas"] = np.zeros((len(boxes),), dtype=np.float32).astype(float).tolist()
                    else:
                        image_path = str(payload["image_path"])
                        image_rgb: np.ndarray
                        if cv2 is not None:
                            image_bgr = cv2.imread(image_path, cv2.IMREAD_COLOR)
                            if image_bgr is None:
                                raise FileNotFoundError(f"Failed to read frame: {image_path}")
                            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
                        else:
                            image = Image.open(image_path).convert("RGB")
                            image_rgb = np.array(image)
                        refined_boxes, mask_areas = detector.refine_boxes(
                            image_rgb,
                            boxes,
                            scores,
                            refinement_limit=detector_cfg.sam2_max_refinement_boxes,
                            initial_sam_boxes=initial_sam_boxes,
                        )
                        payload["sam_boxes"] = refined_boxes.astype(float).tolist()
                        payload["mask_areas"] = mask_areas.astype(float).tolist()
                    out.write(json.dumps(payload, ensure_ascii=True) + "\n")
        finally:
            try:
                source_handle.close()
            except Exception:
                pass

        
        
        should_normalize = needs_normalize
        if not should_normalize and write_mode == "at" and frames_to_refine and target_offsets:
            try:
                should_normalize = int(min(frames_to_refine)) <= int(max(target_offsets))
            except Exception:
                should_normalize = True
        if should_normalize:
            dedupe_jsonl_by_int_key(target_path, key="frame_idx", sort_by_key=True)

        
        final_offsets, _, _ = _build_jsonl_offsets_by_frame_idx(
            target_path,
            max_frame_idx=max(expected_frame_idxs) if expected_frame_idxs else None,
        )
        if max_new_frames_override is None:
            missing_after = [frame_idx for frame_idx in expected_frame_idxs if frame_idx not in final_offsets]
            if missing_after:
                missing_preview = ",".join(str(frame) for frame in missing_after[:10])
                raise RuntimeError(
                    f"Refined cache {target_path} is missing required frames after refinement: "
                    f"[{missing_preview}] (missing={len(missing_after)})"
                )

        final_stats = inspect_jsonl_frame_sequence(target_path, frame_key="frame_idx")
        if target_path.exists() and not final_stats.is_valid:
            repaired = dedupe_jsonl_by_int_key(target_path, key="frame_idx", sort_by_key=True)
            if repaired:
                for _ in range(10):
                    final_stats = inspect_jsonl_frame_sequence(target_path, frame_key="frame_idx")
                    if final_stats.is_valid:
                        break
                    time.sleep(0.05)
            if not final_stats.is_valid:
                duplicate_preview = ",".join(str(frame) for frame in final_stats.duplicate_frames[:10])
                raise RuntimeError(
                    f"Corrupted refined detection cache detected at {target_path}: "
                    f"row_count={final_stats.row_count}, unique_frames={final_stats.unique_frame_count}, "
                    f"duplicate_frames=[{duplicate_preview}]"
                )

        written.append(target_path)

    return written
