import io
import json
import zipfile

import numpy as np


def dump_arrays(**arrays: np.ndarray) -> bytes:
    """이름이 지정된 배열을 메모리 NPZ 바이트로 직렬화"""
    buffer = io.BytesIO()
    np.savez(buffer, **arrays)
    return buffer.getvalue()


def load_arrays(data: bytes, names: set[str]) -> dict[str, np.ndarray]:
    """객체 배열 복원 없이 필수 NPZ 배열만 메모리에서 읽음"""
    if not isinstance(data, bytes) or not data:
        raise ValueError("Array PAYLOAD must contain nonempty NPZ bytes.")
    try:
        with np.load(io.BytesIO(data), allow_pickle=False) as archive:
            if len(archive.files) != len(names) or set(archive.files) != names:
                raise ValueError(f"NPZ array names must be {sorted(names)}.")
            return {name: np.array(archive[name], copy=True) for name in names}
    except (OSError, EOFError, AttributeError, TypeError, RuntimeError, NotImplementedError, zipfile.BadZipFile) as error:
        raise ValueError("Array PAYLOAD is not valid NPZ data.") from error


def pack_context(context: dict) -> bytes:
    """배열과 JSON으로 구성된 단계 문맥을 NPZ 바이트로 직렬화"""
    arrays = {}

    def encode(value):
        if isinstance(value, np.ndarray):
            name = f"array_{len(arrays)}"
            arrays[name] = value
            return {"__array__": name}
        if isinstance(value, dict):
            return {key: encode(item) for key, item in value.items()}
        if isinstance(value, (tuple, list)):
            return [encode(item) for item in value]
        if isinstance(value, np.generic):
            return value.item()
        return value

    document = json.dumps(encode(context), ensure_ascii=False, allow_nan=False)
    buffer = io.BytesIO()
    np.savez(buffer, **arrays, document=np.asarray(document))
    return buffer.getvalue()


def unpack_context(data: bytes) -> dict:
    """NPZ 바이트에서 배열을 포함한 단계 문맥 복원"""
    with np.load(io.BytesIO(data), allow_pickle=False) as archive:
        document = json.loads(str(archive["document"].item()))

        def decode(value):
            if isinstance(value, dict):
                if set(value) == {"__array__"}:
                    return np.array(archive[value["__array__"]], copy=True)
                return {key: decode(item) for key, item in value.items()}
            if isinstance(value, list):
                return [decode(item) for item in value]
            return value

        return decode(document)
