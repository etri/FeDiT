import numpy as np
from mot20_io import TRAIN_SEQUENCES
from track_filter import TRACK_FEATURE_NAMES,track_features
SEQ_FEATURE_NAMES=[f"seq_{name}" for name in TRAIN_SEQUENCES]

def _seq_onehot(seq_name: str) -> np.ndarray:
    out = np.zeros((len(TRAIN_SEQUENCES),), dtype=np.float32)
    out[list(TRAIN_SEQUENCES).index(seq_name)] = 1.0
    return out

def _relative_features(base: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if len(base) == 0:
        shape = (0, int(base.shape[1]))
        return np.zeros(shape, dtype=np.float32), np.zeros(shape, dtype=np.float32)
    rank = np.zeros_like(base, dtype=np.float32)
    robust = np.zeros_like(base, dtype=np.float32)
    for column in range(base.shape[1]):
        values = base[:, column].astype(np.float64)
        unique, inverse, counts = np.unique(values, return_inverse=True, return_counts=True)
        del unique
        cumulative = np.cumsum(counts)
        starts = cumulative - counts
        average_positions = (starts + cumulative - 1) * 0.5
        rank[:, column] = (
            average_positions[inverse] / max(len(values) - 1, 1)
        ).astype(np.float32)
        median = float(np.median(values))
        q25, q75 = np.quantile(values, [0.25, 0.75])
        scale = max(float(q75 - q25), 1.0e-6)
        robust[:, column] = np.clip((values - median) / scale, -10.0, 10.0)
    return rank, robust

def make_feature_matrix(
    tracklets,
    sequence,
    *,
    use_seq_features: bool = True,
    feature_mode: str = "absolute",
    aux_features: np.ndarray | None = None,
) -> np.ndarray:
    if not tracklets:
        base_width = len(TRACK_FEATURE_NAMES)
        width = base_width if feature_mode == "absolute" else base_width * 3
        if aux_features is not None:
            width += int(aux_features.shape[1])
        if use_seq_features:
            width += len(SEQ_FEATURE_NAMES)
        return np.zeros((0, width), dtype=np.float32)
    base = np.stack([track_features(track, sequence) for track in tracklets]).astype(np.float32)
    if feature_mode == "absolute":
        features = base
    elif feature_mode == "absolute_relative":
        rank, robust = _relative_features(base)
        features = np.concatenate([base, rank, robust], axis=1)
    else:
        raise ValueError(f"Unsupported feature_mode: {feature_mode}")
    if aux_features is not None:
        if len(aux_features) != len(tracklets):
            raise ValueError(
                f"Auxiliary feature rows ({len(aux_features)}) do not match tracks ({len(tracklets)})."
            )
        features = np.concatenate([features, aux_features.astype(np.float32)], axis=1)
    if use_seq_features:
        seq_features = np.repeat(_seq_onehot(sequence.name)[None, :], len(tracklets), axis=0)
        features = np.concatenate([features, seq_features], axis=1)
    return features.astype(np.float32)
