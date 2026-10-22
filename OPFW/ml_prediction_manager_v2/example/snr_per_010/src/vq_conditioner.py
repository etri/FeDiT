from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Iterable

import numpy as np
from sklearn.cluster import MiniBatchKMeans
from sklearn.ensemble import HistGradientBoostingClassifier

from detection_embeddings import load_embedding_file
from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, gt_to_xyxy, load_gt
from nms import pairwise_iou_xyxy, standard_nms
from vlm_conditioner import _frame_features, _labels_for_frame, threshold_from_training_labels


def _embedding_stats(embeddings: np.ndarray, centroids: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    emb = embeddings.astype(np.float32)
    cent = centroids.astype(np.float32)
    emb_norm2 = np.sum(emb * emb, axis=1, keepdims=True)
    cent_norm2 = np.sum(cent * cent, axis=1)[None, :]
    dist2 = np.maximum(emb_norm2 + cent_norm2 - 2.0 * (emb @ cent.T), 0.0)
    order = np.argsort(dist2, axis=1)
    code = order[:, 0].astype(np.int32)
    d1 = np.sqrt(dist2[np.arange(len(emb)), order[:, 0]]).astype(np.float32)
    d2 = np.sqrt(dist2[np.arange(len(emb)), order[:, 1]]).astype(np.float32) if cent.shape[0] > 1 else d1.copy()
    margin = (d2 - d1).astype(np.float32)
    return code, d1, margin


def _collect(
    *,
    detection_dir: Path,
    embedding_dir: Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    max_samples_per_sequence: int,
    negative_ratio: float,
    seed: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    rng = np.random.default_rng(int(seed))
    seq_by_name = {seq.name: seq for seq in sequences}
    xs: list[np.ndarray] = []
    embs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    weights: list[np.ndarray] = []
    stats: dict[str, dict] = {}
    for seq_name in sequence_names:
        seq = seq_by_name[str(seq_name)]
        det = load_detections(detection_dir / f"{seq.name}.npz")
        emb, extracted = load_embedding_file(embedding_dir / f"{seq.name}.npz")
        if len(emb) != len(det):
            raise ValueError(f"Embedding/detection count mismatch for {seq.name}: {len(emb)} != {len(det)}")
        valid_gt, ignore_gt = load_gt(seq.gt_path)
        valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
        ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
        seq_x: list[np.ndarray] = []
        seq_e: list[np.ndarray] = []
        seq_y: list[np.ndarray] = []
        seq_w: list[np.ndarray] = []
        pos_total = neg_total = ignored_total = matched_gt = 0
        for frame_idx, indices in sorted(det.by_frame().items()):
            indices = indices[extracted[indices]]
            if len(indices) == 0:
                continue
            labels, ignored, matched = _labels_for_frame(
                detections=det,
                indices=indices,
                gt_frame=valid_by_frame.get(int(frame_idx), valid_gt.iloc[0:0]),
                ignore_frame=ignore_by_frame.get(int(frame_idx), ignore_gt.iloc[0:0]),
                iou_threshold=0.5,
                ignore_iou_threshold=0.5,
            )
            pos = np.flatnonzero((labels == 1) & (~ignored))
            neg = np.flatnonzero((labels == 0) & (~ignored))
            all_neg_count = len(neg)
            if len(neg) and len(pos):
                keep_neg = min(len(neg), max(1, int(np.ceil(len(pos) * float(negative_ratio)))))
                if len(neg) > keep_neg:
                    neg = rng.choice(neg, size=keep_neg, replace=False)
            elif len(neg) > 8:
                neg = rng.choice(neg, size=8, replace=False)
            keep = np.concatenate([pos, neg]).astype(np.int64) if len(pos) or len(neg) else np.zeros((0,), dtype=np.int64)
            if len(keep) == 0:
                continue
            source_indices = indices[keep]
            seq_x.append(_frame_features(det, source_indices, seq))
            seq_e.append(emb[source_indices])
            seq_y.append(labels[keep].astype(np.int8))
            neg_weight = float(all_neg_count / max(len(neg), 1)) if len(neg) else 1.0
            seq_w.append(np.where(labels[keep] == 1, 1.0, neg_weight).astype(np.float32))
            pos_total += int(len(pos))
            neg_total += int(len(neg))
            ignored_total += int(np.sum(ignored))
            matched_gt += int(matched)
        if not seq_y:
            continue
        x_seq = np.concatenate(seq_x, axis=0).astype(np.float32)
        e_seq = np.concatenate(seq_e, axis=0).astype(np.float32)
        y_seq = np.concatenate(seq_y, axis=0).astype(np.int8)
        w_seq = np.concatenate(seq_w, axis=0).astype(np.float32)
        if len(y_seq) > int(max_samples_per_sequence):
            pos_idx = np.flatnonzero(y_seq == 1)
            neg_idx = np.flatnonzero(y_seq == 0)
            pos_budget = min(len(pos_idx), max(1, int(max_samples_per_sequence * 0.45)))
            neg_budget = int(max_samples_per_sequence) - pos_budget
            chosen_pos = rng.choice(pos_idx, size=pos_budget, replace=False) if len(pos_idx) > pos_budget else pos_idx
            chosen_neg = rng.choice(neg_idx, size=min(len(neg_idx), neg_budget), replace=False) if len(neg_idx) else np.zeros((0,), dtype=np.int64)
            chosen = np.concatenate([chosen_pos, chosen_neg]).astype(np.int64)
            rng.shuffle(chosen)
            x_seq, e_seq, y_seq, w_seq = x_seq[chosen], e_seq[chosen], y_seq[chosen], w_seq[chosen]
        xs.append(x_seq)
        embs.append(e_seq)
        ys.append(y_seq)
        weights.append(w_seq)
        stats[seq.name] = {
            "sampled": int(len(y_seq)),
            "sampled_positive": int(np.sum(y_seq == 1)),
            "sampled_negative": int(np.sum(y_seq == 0)),
            "frame_positive_labels_before_cap": int(pos_total),
            "frame_negative_labels_before_cap": int(neg_total),
            "ignored_detections": int(ignored_total),
            "valid_gt": int(len(valid_gt)),
            "matched_gt_by_candidates": int(matched_gt),
            "candidate_recall_at_iou": float(matched_gt / max(len(valid_gt), 1)),
        }
    if not ys:
        raise RuntimeError("No labeled embedding samples collected.")
    return (
        np.concatenate(xs, axis=0).astype(np.float32),
        np.concatenate(embs, axis=0).astype(np.float32),
        np.concatenate(ys, axis=0).astype(np.int8),
        np.concatenate(weights, axis=0).astype(np.float32),
        stats,
    )


def train_vq_conditioner(
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    n_clusters: int = 96,
    max_samples_per_sequence: int = 120_000,
    negative_ratio: float = 10.0,
    min_recall: float = 0.82,
    seed: int = 20260427,
) -> dict:
    names = [str(v) for v in train_sequences]
    x, emb, y, sample_weight, stats = _collect(
        detection_dir=Path(detection_dir).expanduser().resolve(),
        embedding_dir=Path(embedding_dir).expanduser().resolve(),
        sequences=sequences,
        sequence_names=names,
        max_samples_per_sequence=int(max_samples_per_sequence),
        negative_ratio=float(negative_ratio),
        seed=int(seed),
    )
    cluster_count = min(int(n_clusters), max(8, len(y) // 200))
    kmeans = MiniBatchKMeans(
        n_clusters=cluster_count,
        batch_size=8192,
        random_state=int(seed),
        n_init="auto",
        max_iter=100,
    )
    kmeans.fit(emb)
    codes, d1, margin = _embedding_stats(emb, kmeans.cluster_centers_.astype(np.float32))
    code_pos = np.bincount(codes, weights=(y == 1).astype(np.float32) * sample_weight, minlength=cluster_count)
    code_tot = np.bincount(codes, weights=sample_weight, minlength=cluster_count)
    code_prob = ((code_pos + 2.0) / np.maximum(code_tot + 4.0, 1e-6)).astype(np.float32)
    vq_features = np.column_stack([code_prob[codes], d1, margin, codes.astype(np.float32) / max(cluster_count - 1, 1)]).astype(np.float32)
    train_x = np.concatenate([x, vq_features], axis=1).astype(np.float32)
    clf = HistGradientBoostingClassifier(
        learning_rate=0.06,
        max_iter=180,
        max_leaf_nodes=31,
        l2_regularization=0.02,
        early_stopping=True,
        random_state=int(seed),
    )
    clf.fit(train_x, y, sample_weight=sample_weight)
    prob = clf.predict_proba(train_x)[:, 1].astype(np.float32)
    threshold, threshold_stats = threshold_from_training_labels(
        y,
        prob,
        sample_weight,
        min_recall=float(min_recall),
        fp_weight=1.0,
        fn_weight=1.0,
    )
    metadata = {
        "kind": "vq_embedding_conditioner",
        "source_detections": str(Path(detection_dir).expanduser().resolve()),
        "source_embeddings": str(Path(embedding_dir).expanduser().resolve()),
        "train_sequences": names,
        "n_clusters": int(cluster_count),
        "threshold": float(threshold),
        "threshold_stats": threshold_stats,
        "training_samples": {
            "count": int(len(y)),
            "positive": int(np.sum(y == 1)),
            "negative": int(np.sum(y == 0)),
        },
        "sequence_stats": stats,
        "between_vlm_detector_and_tracker": True,
        "uses_feature_embedding": True,
        "uses_vector_quantized_embedding": True,
        "boxes_unchanged": True,
        "no_detector_finetuning": True,
        "no_external_dataset": True,
        "no_oracle_ids": True,
    }
    return {
        "classifier": clf,
        "centroids": kmeans.cluster_centers_.astype(np.float32),
        "code_prob": code_prob.astype(np.float32),
        "metadata": metadata,
    }


def save_model(path: str | Path, model: dict) -> Path:
    out = Path(path).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("wb") as handle:
        pickle.dump(model, handle)
    out.with_suffix(out.suffix + ".json").write_text(
        json.dumps(model["metadata"], indent=2, ensure_ascii=True, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return out


def load_model(path: str | Path) -> dict:
    with Path(path).expanduser().resolve().open("rb") as handle:
        model = pickle.load(handle)
    if model.get("metadata", {}).get("kind") != "vq_embedding_conditioner":
        raise AssertionError(f"Unexpected model kind: {model.get('metadata', {}).get('kind')}")
    return model


def _predict(model: dict, geom_features: np.ndarray, embeddings: np.ndarray) -> np.ndarray:
    codes, d1, margin = _embedding_stats(embeddings, model["centroids"])
    code_prob = np.asarray(model["code_prob"], dtype=np.float32)
    vq_features = np.column_stack(
        [
            code_prob[codes],
            d1,
            margin,
            codes.astype(np.float32) / max(len(code_prob) - 1, 1),
        ]
    ).astype(np.float32)
    x = np.concatenate([geom_features.astype(np.float32), vq_features], axis=1).astype(np.float32)
    return model["classifier"].predict_proba(x)[:, 1].astype(np.float32)


def apply_vq_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str] | None = None,
    threshold: float | None = None,
    blend_raw: float = 0.0,
    top_k: int | None = 900,
    nms_iou: float | None = 0.85,
    overwrite: bool = False,
) -> Path:
    model = load_model(model_path)
    metadata = dict(model["metadata"])
    names = [str(v) for v in (sequence_names or TRAIN_SEQUENCES)]
    seq_by_name = {seq.name: seq for seq in sequences}
    source = Path(detection_dir).expanduser().resolve()
    emb_root = Path(embedding_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    threshold_value = float(metadata.get("threshold", 0.05) if threshold is None else threshold)
    totals: dict[str, dict] = {}
    for seq_name in names:
        out_path = target / f"{seq_name}.npz"
        if out_path.exists() and not overwrite:
            continue
        seq = seq_by_name[seq_name]
        det = load_detections(source / f"{seq_name}.npz")
        emb, extracted = load_embedding_file(emb_root / f"{seq_name}.npz")
        if len(emb) != len(det):
            raise ValueError(f"Embedding/detection count mismatch for {seq_name}: {len(emb)} != {len(det)}")
        selected: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        before = 0
        for _frame_idx, indices in sorted(det.by_frame().items()):
            indices = indices[extracted[indices]]
            if len(indices) == 0:
                continue
            geom = _frame_features(det, indices, seq)
            prob = _predict(model, geom, emb[indices])
            if float(blend_raw) > 0:
                raw = det.calibrated_scores[indices].astype(np.float32)
                prob = (1.0 - float(blend_raw)) * prob + float(blend_raw) * raw
                prob = np.clip(prob, 0.0, 1.0).astype(np.float32)
            keep = prob >= threshold_value
            frame_indices = indices[keep]
            frame_scores = prob[keep]
            before += int(len(frame_indices))
            if len(frame_indices) and nms_iou is not None and float(nms_iou) < 1.0:
                local_keep = standard_nms(det.boxes[frame_indices], frame_scores, float(nms_iou))
                frame_indices = frame_indices[local_keep]
                frame_scores = frame_scores[local_keep]
            if top_k is not None and len(frame_indices) > int(top_k):
                order = np.argsort(-frame_scores)[: int(top_k)]
                frame_indices = frame_indices[order]
                frame_scores = frame_scores[order]
            if len(frame_indices):
                selected.append(frame_indices.astype(np.int64))
                selected_scores.append(frame_scores.astype(np.float32))
        keep_indices = np.concatenate(selected).astype(np.int64) if selected else np.zeros((0,), dtype=np.int64)
        keep_scores = np.concatenate(selected_scores).astype(np.float32) if selected_scores else np.zeros((0,), dtype=np.float32)
        out = DetectionSet(
            frames=det.frames[keep_indices],
            boxes=det.boxes[keep_indices],
            raw_scores=det.raw_scores[keep_indices],
            calibrated_scores=keep_scores,
            prompt_ids=det.prompt_ids[keep_indices],
            tile_ids=det.tile_ids[keep_indices],
            image_widths=det.image_widths[keep_indices],
            image_heights=det.image_heights[keep_indices],
            prompt_texts=det.prompt_texts[keep_indices],
        )
        save_detections(out_path, out)
        totals[seq_name] = {
            "source_detections": int(len(det)),
            "kept_before_nms": int(before),
            "kept_after_nms_topk": int(len(out)),
            "last_frame": int(out.frames.max()) if len(out) else 0,
        }
    write_run_metadata(
        target,
        {
            "kind": "vq_embedding_conditioned",
            "source": str(source),
            "embeddings": str(emb_root),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "threshold": threshold_value,
            "blend_raw": float(blend_raw),
            "top_k": None if top_k is None else int(top_k),
            "nms_iou": None if nms_iou is None else float(nms_iou),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "uses_feature_embedding": True,
            "uses_vector_quantized_embedding": True,
            "boxes_unchanged": True,
            "no_detector_finetuning": True,
            "no_external_dataset": True,
            "no_oracle_ids": True,
        },
    )
    return target
