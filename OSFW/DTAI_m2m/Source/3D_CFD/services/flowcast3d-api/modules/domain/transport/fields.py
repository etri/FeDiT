import numpy as np

AXES = ("x", "y", "z")


def velocity(values, channels):
    """채널 배열 [..., C]에서 XYZ 속도 추출하며 없는 성분은 0"""
    out = np.zeros((*values.shape[:-1], 3), dtype=np.float32)
    for i, axis in enumerate(AXES):
        if f"velocity_{axis}" in channels:
            out[..., i] = values[..., channels.index(f"velocity_{axis}")]
    return out
