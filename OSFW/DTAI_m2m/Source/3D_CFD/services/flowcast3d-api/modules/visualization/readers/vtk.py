import re
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np

from modules.domain.schemas.context import source_context

MAX_VTK_BYTES = 256 * 1024 * 1024
MAX_VTK_CELLS = 2_000_000


def checked_path(root, value):
    candidate = root / value
    if (
        candidate.is_symlink()
        or not candidate.resolve().is_relative_to(root.resolve())
        or not candidate.is_file()
    ):
        raise ValueError("VTK reference must identify a regular file within the uploaded bundle.")
    return candidate.resolve()


def validate_references(path, root, seen=None):
    seen = set() if seen is None else seen
    if path in seen:
        raise ValueError("VTK references contain a cycle.")
    if len(seen) > 512:
        raise ValueError("VTK reference count exceeds the 512-file limit.")
    seen.add(path)
    if path.stat().st_size > MAX_VTK_BYTES:
        raise MemoryError("VTK file exceeds the 256 MiB preparation limit. Partition the file first.")
    with path.open("rb") as stream:
        header = stream.read(4 * 1024 * 1024).split(b"<AppendedData", 1)[0]
    if b"<!DOCTYPE" in header.upper() or b"<!ENTITY" in header.upper():
        raise ValueError("XML declarations are forbidden in VTK inputs.")
    for match in re.finditer(rb'(?:WholeExtent|Extent)\s*=\s*"([0-9\s-]+)"', header):
        extent = [int(value) for value in match.group(1).split()]
        if len(extent) != 6:
            raise ValueError("VTK grid extent is invalid.")
        shape = [extent[index + 1] - extent[index] + 1 for index in (0, 2, 4)]
        if min(shape) < 1 or np.prod(shape, dtype=object) > 4_000_000:
            raise MemoryError("VTK grid exceeds the preparation point limit.")
    for attribute, limit in ((b"NumberOfPoints", 4_000_000), (b"NumberOfCells", MAX_VTK_CELLS)):
        counts = [int(value) for value in re.findall(attribute + rb'\s*=\s*"([0-9]+)"', header)]
        if sum(counts) > limit:
            raise MemoryError("VTK dataset exceeds the preparation cell or point limit.")
    if any(int(value) > 64 for value in re.findall(rb'NumberOfComponents\s*=\s*"([0-9]+)"', header)):
        raise MemoryError("VTK field exceeds the 64-component preparation limit.")
    if path.suffix.lower() not in {".pvd", ".vtm"}:
        return
    if path.stat().st_size > 1024 * 1024:
        raise ValueError("VTK collection metadata exceeds the 1 MiB limit.")
    content = path.read_bytes()
    if b"<!DOCTYPE" in content.upper() or b"<!ENTITY" in content.upper():
        raise ValueError("XML declarations are forbidden in VTK collections.")
    document = ET.fromstring(content)
    for item in document.iter("DataSet"):
        relative = item.attrib.get("file", "")
        target = checked_path(root, str(path.parent.relative_to(root) / relative))
        validate_references(target, root, seen.copy())


class VTKReader:
    def __init__(self, source):
        import pyvista as pv

        self.pv = pv
        self.source = source
        self.mapping = source.get("mapping") or {}
        paths = [Path(name) for name in source["paths"]]
        first = next((path for path in paths if path.suffix.lower() == ".pvd"), None)
        if first is None:
            first = next(
                path
                for path in paths
                if path.suffix.lower() in {".vtk", ".vti", ".vtu", ".vtp", ".vtr", ".vts", ".vtm"}
            )
        root = Path(source.get("cache", first.parent / ".prepared")).parent.resolve()
        if not first.resolve().is_relative_to(root):
            root = first.parent.resolve()
        validate_references(first, root)
        self.frames = [first]
        self.times = np.asarray(self.mapping.get("times", [0.0]), dtype=np.float64)
        self.time_known = bool(self.mapping.get("times"))
        if first.suffix.lower() == ".pvd":
            datasets = ET.fromstring(first.read_bytes()).findall(".//DataSet")
            if not datasets or len(datasets) > 10000:
                raise ValueError("VTK collection frame count is invalid.")
            if any(item.attrib.get("part", "0") != "0" for item in datasets):
                raise ValueError("Multi-part PVD frames require a VTM bundle.")
            self.frames = [
                checked_path(root, str(first.parent.relative_to(root) / item.attrib["file"]))
                for item in datasets
            ]
            self.times = np.asarray([float(item.attrib["timestep"]) for item in datasets], dtype=np.float64)
            self.time_known = True
        if (
            len(self.frames) != len(self.times)
            or not np.isfinite(self.times).all()
            or len(self.times) > 1
            and np.any(np.diff(self.times) <= 0)
        ):
            raise ValueError("VTK physical time values are invalid.")
        self.current_frame = -1
        self.mesh = None
        self.cells = None
        self.warning = []
        self._load(0)
        self.field_info = []
        for association, data in (("cell", self.mesh.cell_data), ("point", self.mesh.point_data)):
            for name in data.keys():
                array = np.asarray(data[name])
                if array.dtype.kind not in "iuf" or name in {
                    "vtkGhostType",
                    "building_mask",
                    "fluid_mask",
                    "valid_mask",
                    "Volume",
                }:
                    continue
                components = 1 if array.ndim == 1 else array.shape[-1]
                if components not in {1, 3}:
                    continue
                field_id = (
                    f"{association}:{name}" if name in {field["id"] for field in self.field_info} else name
                )
                self.field_info.append(
                    {
                        "id": field_id,
                        "sourceName": name,
                        "label": name,
                        "association": association,
                        "components": components,
                        "unit": self.mapping.get("unit", ""),
                    }
                )
        self.channels = [field["id"] for field in self.field_info]
        self.bounds = [list(self.mesh.bounds[::2]), list(self.mesh.bounds[1::2])]
        self.origin = np.asarray(self.bounds[0])
        self.spacing = None
        self.shape = None
        metadata = source_context(source)
        self.analysis_kind = metadata.get("analysisKind") or (
            "surface"
            if isinstance(self.mesh, pv.PolyData) and self.mesh.n_faces
            else "points"
            if isinstance(self.mesh, pv.PolyData)
            else "volume"
        )
        self.volumetric = self.analysis_kind == "volume"
        self.support_modes = metadata.get("supportModes") or (
            ["points", "surface", "slice", "iso", "volume", "vectors", "streamlines"]
            if self.volumetric
            else ["points", "surface"]
            if self.analysis_kind == "surface"
            else ["points"]
        )
        for field in self.field_info:
            field.update(analysisKind=self.analysis_kind, supportModes=self.support_modes)

    def _load(self, frame):
        if not 0 <= frame < len(self.frames):
            raise ValueError("Frame is outside the completed time range.")
        if frame == self.current_frame:
            return
        mesh = self.pv.read(self.frames[frame])
        if isinstance(mesh, self.pv.MultiBlock):
            mesh = mesh.combine(merge_points=False)
        if mesh.n_cells > MAX_VTK_CELLS or mesh.n_points > 4_000_000:
            raise MemoryError("VTK dataset exceeds the preparation cell limit. Partition the file first.")
        if not mesh.n_cells or not np.isfinite(np.asarray(mesh.bounds)).all():
            raise ValueError("VTK dataset has no valid cells.")
        self.mesh, self.cells = mesh, None
        self.current_frame = frame

    def field(self, name):
        match = next(
            (field for field in self.field_info if field["id"] == (name or self.field_info[0]["id"])), None
        )
        if match is None:
            raise ValueError("Requested field is unavailable.")
        return match

    def valid_cells(self):
        if self.cells is None:
            masks = (
                ("vtkGhostType", True),
                ("building_mask", True),
                ("fluid_mask", False),
                ("valid_mask", False),
                ("vtkValidPointMask", False),
            )
            valid = np.ones(self.mesh.n_cells, dtype=bool)
            point_valid = np.ones(self.mesh.n_points, dtype=bool)
            has_point_mask = False
            for name, excluded in masks:
                if name in self.mesh.cell_data:
                    values = np.asarray(self.mesh.cell_data[name])
                    valid &= values == 0 if excluded else values != 0
                if name in self.mesh.point_data:
                    values = np.asarray(self.mesh.point_data[name])
                    point_valid &= values == 0 if excluded else values != 0
                    has_point_mask = True
            if has_point_mask:
                temporary = self.mesh.copy(deep=False)
                temporary.point_data["__workspace_valid"] = point_valid.astype(np.float32)
                averaged = temporary.point_data_to_cell_data()
                valid &= np.asarray(averaged.cell_data["__workspace_valid"]) == 1
            self.cells = valid
        return self.cells

    def descriptor(self):
        kind = "uniform" if isinstance(self.mesh, self.pv.ImageData) else "unstructured"
        return {
            "fields": [
                {key: value for key, value in field.items() if key != "sourceName"}
                for field in self.field_info
            ],
            "times": self.times.tolist(),
            "bounds": self.bounds,
            "gridKind": kind,
            "capabilities": {
                "geometry": not bool(self.field_info),
                "flow": bool(self.field_info),
                "concentration": any(
                    field["sourceName"].lower() == "concentration" for field in self.field_info
                ),
                "timeseries": self.time_known and len(self.times) > 1,
                "predict": False,
                "volumetric": self.volumetric,
            },
            "validation": [],
            "timeUnit": "s" if self.time_known else "frame",
            "analysisKind": self.analysis_kind,
            "supportModes": self.support_modes,
            "scenarioModes": [],
            **source_context(self.source),
        }

    def data(self, frame, field_id, roi=None):
        self._load(frame)
        field = self.field(field_id)
        name = field["sourceName"]
        mesh = self.mesh
        if field["association"] == "point":
            mesh = mesh.point_data_to_cell_data(pass_point_data=True)
        values = np.asarray(mesh.cell_data[name], dtype=np.float64)
        if values.ndim > 1:
            values = np.linalg.norm(values, axis=-1)
        centres = np.asarray(mesh.cell_centers().points)
        volumes = np.asarray(
            mesh.compute_cell_sizes(length=False, area=False, volume=True).cell_data["Volume"],
            dtype=np.float64,
        )
        valid = np.isfinite(values) & np.isfinite(volumes) & (volumes > 0)
        valid &= self.valid_cells()
        if roi:
            low, high = np.asarray(roi)
            valid &= ((centres >= low) & (centres <= high)).all(axis=1)
        return centres, values, valid, volumes

    def probe(self, field_id, point, frame):
        self._load(frame)
        index = int(self.mesh.find_containing_cell(np.asarray(point)))
        if index < 0:
            return None
        if not self.valid_cells()[index]:
            return None
        field = self.field(field_id)
        if field["association"] == "point":
            sampled = self.pv.PolyData(np.asarray([point])).sample(self.mesh)
            if not sampled["vtkValidPointMask"][0]:
                return None
            value = np.asarray(sampled[field["sourceName"]][0])
        else:
            value = np.asarray(self.mesh.cell_data[field["sourceName"]][index])
        result = float(np.linalg.norm(value)) if value.ndim else float(value)
        return result if np.isfinite(result) else None
