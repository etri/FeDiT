import math

import numpy as np

from modules.visualization.assets.codecs import cache_key, glb, scalar_colors, write_asset
from modules.visualization.readers.uniform import Uniform, open_numeric
from modules.visualization.scenes.analysis import field_descriptor, nonvolume_samples
from modules.visualization.scenes.geometry import city_geometry
from modules.visualization.scenes.sources import scene_origin


def _uniform_scene(reader, selection, asset_root, context):
    frame = selection.get("frame", 0)
    field = field_descriptor(reader, selection.get("fieldId"))
    mode = selection.get("mode", "slice")
    origin = scene_origin(reader, reader.source)
    region = list(reader.region(selection.get("roi")))
    limit = selection.get("maxCells", 100000)
    if mode == "slice":
        axis = "xyz".index(selection.get("axis", "z"))
        position = selection.get("position")
        if position is None:
            box = selection.get("roi") or reader.bounds
            position = (box[0][axis] + box[1][axis]) / 2
        singleton = reader.association == "point" and reader.shape[axis] == 1
        if (
            not (singleton and position == reader.origin[axis])
            and not reader.bounds[0][axis] <= position < reader.bounds[1][axis]
        ):
            raise ValueError("Slice position must be inside the dataset bounds.")
        index = int(math.floor((position - reader.origin[axis]) / reader.spacing[axis]))
        if not region[axis].start <= index < region[axis].stop:
            raise ValueError("Slice position must be inside the selected ROI.")
        region[axis] = slice(index, index + 1)
    sizes = np.asarray([max(0, item.stop - item.start) for item in region])
    if not sizes.min():
        raise ValueError("ROI contains no cell centres.")
    stride = max(1, math.ceil((int(np.prod(sizes)) / limit) ** (1 / max(1, int((sizes > 1).sum())))))
    step = np.where(sizes > 1, stride, 1)
    sampled = tuple(slice(item.start, item.stop, int(interval)) for item, interval in zip(region, step))
    values, valid = reader.scalar(frame, sampled, field["id"])
    if not valid.any():
        raise ValueError("Selected region contains no finite fluid cells.")
    data_range = [float(values[valid].min()), float(values[valid].max())]
    minimum, maximum = selection.get("colorRange") or data_range
    points = reader.centres(sampled) - origin
    assets = []
    if mode not in {"vectors", "streamlines", "volume", "iso"}:
        packed = np.column_stack([points[valid], values[valid]]).astype("<f4")
        filename = write_asset(asset_root, cache_key([context, "points"]), "bin", packed.tobytes())
        assets = [
            {
                "kind": "points",
                "format": "float32-xyzv",
                "filename": filename,
                "count": len(packed),
                "stride": 4,
            }
        ]
    warnings = ["Display is sampled; quantitative analysis uses original cells."] if stride > 1 else []
    display_spacing = reader.spacing * step
    display_origin = points[0, 0, 0] - display_spacing / 2
    if mode in {"vectors", "streamlines"}:
        assets = _flow_geometry(
            reader, selection, sampled, valid, origin, field, minimum, maximum, asset_root, context
        )
    elif mode == "volume":
        data = np.where(valid, values, 0).transpose(2, 1, 0).astype("<f4")
        mask = valid.transpose(2, 1, 0).astype("uint8")
        filename = write_asset(asset_root, cache_key([context, "volume"]), "bin", data.tobytes())
        mask_name = write_asset(asset_root, cache_key([context, "mask"]), "bin", mask.tobytes())
        assets = [
            {
                "kind": "volume",
                "format": "float32",
                "filename": filename,
                "maskFilename": mask_name,
                "dimensions": list(values.shape),
                "origin": display_origin.tolist(),
                "spacing": display_spacing.tolist(),
            }
        ]
    elif mode == "iso":
        import pyvista as pv

        if min(values.shape) < 2:
            raise ValueError("Iso-surfaces require at least two cells along every axis.")
        grid = pv.ImageData(
            dimensions=np.asarray(values.shape) + 1, spacing=display_spacing, origin=display_origin
        )
        grid.cell_data["scalar"] = values.ravel(order="F")
        point_grid = grid.extract_cells(valid.ravel(order="F")).cell_data_to_point_data()
        threshold = selection.get("threshold", (minimum + maximum) / 2)
        surface = point_grid.contour([threshold], scalars="scalar").triangulate()
        assets = []
        if surface.n_cells:
            filename = write_asset(
                asset_root,
                cache_key([context, "iso"]),
                "glb",
                glb(
                    surface.points,
                    surface.faces.reshape(-1, 4)[:, 1:],
                    scalar_colors(surface["scalar"], minimum, maximum),
                ),
            )
            assets.append({"kind": "geometry", "format": "glb", "filename": filename, "layer": "iso"})
    return {
        "origin": origin.tolist(),
        "bounds": reader.bounds,
        "field": field,
        "range": [minimum, maximum],
        "dataRange": data_range,
        "time": float(reader.times[frame]),
        "assets": assets,
        "warnings": warnings,
        "grid": {
            "origin": reader.origin.tolist(),
            "spacing": reader.spacing.tolist(),
            "dimensions": list(reader.shape),
        },
    }


def _flow_geometry(reader, selection, sampled, valid, origin, field, minimum, maximum, asset_root, context):
    from modules.visualization.readers.adapter import Sample
    from modules.visualization.rendering import flow_paths, layers

    if any(f"velocity_{axis}" not in reader.channels for axis in "xyz"):
        raise ValueError("Vector and streamline views require velocity_x, velocity_y, and velocity_z.")
    if len({reader.units.get(f"velocity_{axis}", "") for axis in "xyz"}) != 1:
        raise ValueError("Velocity component units must match for vector and streamline views.")
    columns, finite = [], valid.copy()
    for channel in reader.channels:
        values, usable = reader.scalar(selection.get("frame", 0), sampled, channel)
        columns.append(values.astype(np.float32))
        finite &= usable
    values = np.stack(columns, axis=-1)
    indices = [np.arange(item.start, item.stop, item.step or 1) for item in sampled]
    edges = [
        reader.origin[axis]
        + np.minimum(item.start + np.arange(len(index) + 1) * (item.step or 1), item.stop)
        * reader.spacing[axis]
        for axis, (item, index) in enumerate(zip(sampled, indices))
    ]
    centres = [
        reader.origin[axis] + (index + 0.5) * reader.spacing[axis] for axis, index in enumerate(indices)
    ]
    sample = Sample(
        frame=selection.get("frame", 0),
        time=float(reader.times[selection.get("frame", 0)]),
        predicted=True,
        stride=max(item.step or 1 for item in sampled),
        values=values,
        solid=~finite,
        edges=edges,
        centres=centres,
    )
    mode = selection["mode"]
    if mode == "vectors":
        speed = np.sqrt(
            sum(
                np.square(values[..., reader.channels.index(f"velocity_{axis}")], dtype=np.float64)
                for axis in "xyz"
            )
        )
        reference = max(0.1, float(np.percentile(speed[finite], 95))) if finite.any() else 1.0
        surface = layers.volume_arrows(
            sample, reader.channels, field["id"], 1000, reference, origin
        ).triangulate()
    else:
        positions = flow_paths.seeds(sample, None, 2000, count=64)
        paths = flow_paths.trace(sample, reader.channels, positions, origin, field["id"], 0.01, steps=128)
        if not paths.n_lines:
            return []
        radius = float(min(reader.spacing)) * max(item.step or 1 for item in sampled) * 0.035
        surface = paths.tube(radius=radius, n_sides=6, capping=True).triangulate()
    if not surface.n_cells:
        return []
    filename = write_asset(
        asset_root,
        cache_key([context, mode]),
        "glb",
        glb(
            surface.points,
            surface.faces.reshape(-1, 4)[:, 1:],
            scalar_colors(surface.point_data[layers.VALUE], minimum, maximum),
        ),
    )
    return [{"kind": "geometry", "format": "glb", "filename": filename, "layer": mode}]


def scene(source, selection, asset_root, context):
    reader = open_numeric(source) if source.get("path") or source.get("paths") else None
    if selection.get("mode") == "geometry" or reader is None:
        return city_geometry(source, reader, selection, asset_root, context)
    if isinstance(reader, Uniform):
        if (
            selection.get("mode") == "streamlines"
            and "concentration" in reader.channels
            and reader.field(selection.get("fieldId"))["id"] == "concentration"
        ):
            from modules.visualization.scenes.particle_paths import scene as particle_scene

            return particle_scene(reader, selection, asset_root, context)
        if not reader.volumetric and selection.get("mode") in {"iso", "volume"}:
            raise ValueError("Volume and iso-surface views require a three-dimensional field.")
        if not reader.volumetric:
            return _nonvolume_scene(reader, selection, asset_root, context)
        return _uniform_scene(reader, selection, asset_root, context)
    if not reader.volumetric:
        return _nonvolume_scene(reader, selection, asset_root, context)
    frame = selection.get("frame", 0)
    field = field_descriptor(reader, selection.get("fieldId"))
    points, values, valid, volumes = reader.data(frame, field["id"], selection.get("roi"))
    if not valid.any():
        raise ValueError("Selected region contains no valid volume cells.")
    mode = selection.get("mode", "slice")
    if mode in {"vectors", "streamlines"}:
        from modules.visualization.scenes.vtk_flow import flow_geometry

        assets = flow_geometry(reader, selection, valid, field, values[valid], asset_root, context)
    elif mode in {"iso", "slice"}:
        mesh = reader.mesh.extract_cells(np.flatnonzero(valid))
        name = reader.field(field["id"])["sourceName"]
        if selection.get("roi"):
            low, high = selection["roi"]
            mesh = mesh.clip_box([low[0], high[0], low[1], high[1], low[2], high[2]], invert=False)
        if field["association"] == "cell":
            mesh = mesh.cell_data_to_point_data()
        if field["components"] > 1:
            mesh.point_data["__scalar"] = np.linalg.norm(mesh.point_data[name], axis=-1)
            name = "__scalar"
        if mode == "slice":
            axis = "xyz".index(selection.get("axis", "z"))
            anchor = np.mean(np.asarray(reader.bounds), axis=0)
            anchor[axis] = selection.get("position", anchor[axis])
            normal = np.eye(3)[axis]
            surface = mesh.slice(normal=normal, origin=anchor).triangulate()
        else:
            threshold = selection.get("threshold", float(np.mean([values[valid].min(), values[valid].max()])))
            surface = mesh.contour([threshold], scalars=name).triangulate()
        assets = []
        if surface.n_cells:
            filename = write_asset(
                asset_root,
                cache_key([context, mode]),
                "glb",
                glb(
                    surface.points - reader.origin,
                    surface.faces.reshape(-1, 4)[:, 1:],
                    scalar_colors(
                        surface.point_data[name],
                        *(
                            selection.get("colorRange")
                            or [float(values[valid].min()), float(values[valid].max())]
                        ),
                    ),
                ),
            )
            assets.append({"kind": "geometry", "format": "glb", "filename": filename, "layer": mode})
    else:
        indices = np.flatnonzero(valid)
        indices = indices[:: max(1, math.ceil(len(indices) / selection.get("maxCells", 100000)))]
        packed = np.column_stack([points[indices] - reader.origin, values[indices]]).astype("<f4")
        filename = write_asset(asset_root, cache_key([context, "points"]), "bin", packed.tobytes())
        assets = [
            {
                "kind": "points",
                "format": "float32-xyzv",
                "filename": filename,
                "count": len(packed),
                "stride": 4,
            }
        ]
    return {
        "origin": reader.origin.tolist(),
        "bounds": reader.bounds,
        "field": field,
        "range": selection.get("colorRange") or [float(values[valid].min()), float(values[valid].max())],
        "dataRange": [float(values[valid].min()), float(values[valid].max())],
        "time": float(reader.times[frame]),
        "assets": assets,
        "warnings": ["VTK volume is displayed as sampled cell centres."] if mode == "volume" else [],
    }


def _nonvolume_scene(reader, selection, asset_root, context):
    """실측점과 지표면 표본을 실제 좌표에 표시"""
    if selection.get("mode") in {"iso", "volume", "vectors", "streamlines"}:
        raise ValueError("Requested view requires a three-dimensional field.")
    frame, field = selection.get("frame", 0), field_descriptor(reader, selection.get("fieldId"))
    chunks = list(nonvolume_samples(reader, frame, field["id"], selection.get("roi")))
    points = np.concatenate([item[0] for item in chunks])
    values = np.concatenate([item[1] for item in chunks])
    if not values.size:
        raise ValueError("Selected region contains no finite samples.")
    data_range = [float(values.min()), float(values.max())]
    limits = selection.get("colorRange") or data_range
    stride = max(1, math.ceil(len(values) / selection.get("maxCells", 100000)))
    packed = np.column_stack([points[::stride] - reader.origin, values[::stride]]).astype("<f4")
    filename = write_asset(asset_root, cache_key([context, "points"]), "bin", packed.tobytes())
    assets = [
        {"kind": "points", "format": "float32-xyzv", "filename": filename, "count": len(packed), "stride": 4}
    ]
    if selection.get("mode") == "surface":
        if isinstance(reader, Uniform):
            import pyvista as pv

            step = max(1, math.ceil((math.prod(reader.shape) / selection.get("maxCells", 100000)) ** 0.5))
            slices = tuple(slice(0, size, step if size > 1 else 1) for size in reader.shape)
            sample = reader._point_values(frame, slices, field["id"])
            grid = pv.ImageData(dimensions=sample.shape, origin=reader.origin, spacing=reader.spacing * step)
            grid.point_data["scalar"] = sample.ravel(order="F")
            grid.point_data["valid"] = np.isfinite(sample).ravel(order="F").astype(np.uint8)
            surface = (
                grid.threshold(0.5, scalars="valid", preference="point", all_scalars=True)
                .extract_surface(algorithm="dataset_surface")
                .triangulate()
            )
            name = "scalar"
        else:
            surface = reader.mesh
            if field["association"] == "cell":
                surface = surface.cell_data_to_point_data()
            surface = surface.extract_surface(algorithm="dataset_surface").triangulate()
            name = reader.field(field["id"])["sourceName"]
        if surface.n_cells and surface.n_faces:
            color_values = np.asarray(surface.point_data[name])
            if color_values.ndim > 1:
                color_values = np.linalg.norm(color_values, axis=-1)
            filename = write_asset(
                asset_root,
                cache_key([context, "surface"]),
                "glb",
                glb(
                    surface.points - reader.origin,
                    surface.faces.reshape(-1, 4)[:, 1:],
                    scalar_colors(color_values, *limits),
                ),
            )
            assets = [{"kind": "geometry", "format": "glb", "filename": filename, "layer": "surface"}]
    return {
        "origin": reader.origin.tolist(),
        "bounds": reader.bounds,
        "field": field,
        "range": limits,
        "dataRange": data_range,
        "time": float(reader.times[frame]),
        "assets": assets,
        "warnings": [],
    }
