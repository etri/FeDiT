import hashlib
import json
import os
import struct
from pathlib import Path

import numpy as np

CACHE_VERSION = "flowcast.workspace-assets/2"


def cache_key(value):
    return hashlib.sha256(
        (CACHE_VERSION + "\n" + json.dumps(value, sort_keys=True, separators=(",", ":"))).encode()
    ).hexdigest()


def write_asset(root, key, extension, content):
    path = Path(root) / f"{key}.{extension}"
    if not path.is_file():
        temporary = path.with_suffix(f".{os.getpid()}.partial")
        temporary.write_bytes(content)
        temporary.replace(path)
    return path.name


def glb(points, faces, colors=None, *, tcoords=None, jpeg=None):
    """Z축 기준의 로컬 삼각형 메시를 GLB로 기록"""
    points = np.asarray(points, dtype="<f4").reshape(-1, 3)
    faces = np.asarray(faces, dtype="<u4").reshape(-1, 3)
    if not len(points) or not len(faces) or faces.max() >= len(points) or not np.isfinite(points).all():
        raise ValueError("Geometry contains invalid vertices or triangle indices.")
    blocks = [points.tobytes(), faces.tobytes()]
    views = [
        {"buffer": 0, "byteOffset": 0, "byteLength": len(blocks[0]), "target": 34962},
        {"buffer": 0, "byteOffset": len(blocks[0]), "byteLength": len(blocks[1]), "target": 34963},
    ]
    accessors = [
        {
            "bufferView": 0,
            "componentType": 5126,
            "count": len(points),
            "type": "VEC3",
            "min": points.min(axis=0).tolist(),
            "max": points.max(axis=0).tolist(),
        },
        {"bufferView": 1, "componentType": 5125, "count": faces.size, "type": "SCALAR"},
    ]
    attributes = {"POSITION": 0}
    if colors is not None:
        colors = np.asarray(colors, dtype="<f4").reshape(-1, 3)
        if len(colors) != len(points):
            raise ValueError("Geometry color count does not match the vertices.")
        blocks.append(colors.tobytes())
        views.append(
            {
                "buffer": 0,
                "byteOffset": sum(len(block) for block in blocks[:-1]),
                "byteLength": len(blocks[-1]),
                "target": 34962,
            }
        )
        accessors.append({"bufferView": 2, "componentType": 5126, "count": len(points), "type": "VEC3"})
        attributes["COLOR_0"] = 2
    if (tcoords is None) != (jpeg is None):
        raise ValueError("Textured geometry requires UV coordinates and a JPEG image.")
    image_view = None
    if tcoords is not None:
        coordinates = np.asarray(tcoords, dtype="<f4")
        if coordinates.shape != (len(points), 2) or not np.isfinite(coordinates).all():
            raise ValueError("Geometry UV coordinates are invalid.")
        # VTK의 아래쪽 UV 원점을 glTF의 위쪽 원점으로 변환
        coordinates = coordinates.copy()
        coordinates[:, 1] = 1 - coordinates[:, 1]
        view = len(views)
        views.append(
            {
                "buffer": 0,
                "byteOffset": sum(len(block) for block in blocks),
                "byteLength": coordinates.nbytes,
                "target": 34962,
            }
        )
        blocks.append(coordinates.tobytes())
        accessor = len(accessors)
        accessors.append({"bufferView": view, "componentType": 5126, "count": len(points), "type": "VEC2"})
        attributes["TEXCOORD_0"] = accessor
        image_view = len(views)
        views.append(
            {"buffer": 0, "byteOffset": sum(len(block) for block in blocks), "byteLength": len(jpeg)}
        )
        blocks.append(jpeg)
    binary = b"".join(blocks)
    document = {
        "asset": {"version": "2.0", "generator": "FlowCast3D", "extras": {"upAxis": "Z"}},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": attributes, "indices": 1, "material": 0}]}],
        "materials": [
            {
                "doubleSided": True,
                "pbrMetallicRoughness": {
                    "baseColorFactor": [1, 1, 1, 1]
                    if colors is not None or jpeg is not None
                    else [0.55, 0.62, 0.67, 1],
                    "metallicFactor": 0,
                    "roughnessFactor": 0.95,
                },
            }
        ],
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": views,
        "accessors": accessors,
    }
    if image_view is not None:
        document.update(
            images=[{"bufferView": image_view, "mimeType": "image/jpeg"}],
            samplers=[{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
            textures=[{"sampler": 0, "source": 0}],
        )
        document["materials"][0]["pbrMetallicRoughness"]["baseColorTexture"] = {"index": 0, "texCoord": 0}
    metadata = json.dumps(document, separators=(",", ":")).encode()
    metadata += b" " * (-len(metadata) % 4)
    binary += b"\x00" * (-len(binary) % 4)
    total = 12 + 8 + len(metadata) + 8 + len(binary)
    return (
        struct.pack("<4sII", b"glTF", 2, total)
        + struct.pack("<II", len(metadata), 0x4E4F534A)
        + metadata
        + struct.pack("<II", len(binary), 0x004E4942)
        + binary
    )


def scalar_colors(values, minimum, maximum):
    position = np.clip((np.asarray(values, dtype=np.float64) - minimum) / max(maximum - minimum, 1e-12), 0, 1)
    return np.column_stack(
        [
            np.minimum(1, 2 * position),
            0.25 + 0.55 * (1 - np.abs(2 * position - 1)),
            np.minimum(1, 2 * (1 - position)),
        ]
    )


def bounding_box(bounds, origin):
    low, high = np.asarray(bounds) - origin
    centre, half = (low + high) / 2, (high - low) / 2
    return {"box": [*centre.tolist(), half[0], 0, 0, 0, half[1], 0, 0, 0, half[2]]}
