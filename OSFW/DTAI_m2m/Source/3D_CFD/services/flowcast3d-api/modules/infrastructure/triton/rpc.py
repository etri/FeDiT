import io
import zipfile

import numpy as np


def dump_arrays(**arrays: np.ndarray) -> bytes:
    buffer = io.BytesIO()
    np.savez(buffer, **arrays)
    return buffer.getvalue()


def load_arrays(data: bytes, names: set[str]) -> dict[str, np.ndarray]:
    """pickle 없이 필수 배열만 메모리에서 복원"""
    if not isinstance(data, bytes) or not data:
        raise ValueError("Array PAYLOAD must contain non-empty NPZ bytes.")
    try:
        with np.load(io.BytesIO(data), allow_pickle=False) as archive:
            if len(archive.files) != len(names) or set(archive.files) != names:
                raise ValueError(f"NPZ array names must be {sorted(names)}.")
            return {name: np.array(archive[name], copy=True) for name in names}
    except (
        OSError,
        EOFError,
        AttributeError,
        TypeError,
        RuntimeError,
        NotImplementedError,
        zipfile.BadZipFile,
    ) as error:
        raise ValueError("Array PAYLOAD is not a valid NPZ archive.") from error
