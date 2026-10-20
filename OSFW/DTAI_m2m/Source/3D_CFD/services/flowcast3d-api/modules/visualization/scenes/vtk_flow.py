import numpy as np


def flow_geometry(reader, selection, valid, field, cell_values, asset_root, context):
    """원본 VTK 유효 셀에서 제한된 수의 벡터와 유선을 생성"""
    from modules.visualization.assets.codecs import cache_key, glb, scalar_colors, write_asset

    candidates = [item for item in reader.field_info if item["components"] == 3]
    preferred = next((item for item in candidates if item["id"] == field["id"]), None)
    if preferred is None:
        preferred = next(
            (item for item in candidates if item["sourceName"].lower() in {"u", "velocity"}), None
        )
    vector = preferred or (candidates[0] if len(candidates) == 1 else None)
    if vector is None:
        raise ValueError("Select a three-component velocity field for vector or streamline display.")
    mesh = reader.mesh.extract_cells(np.flatnonzero(valid))
    converted = None

    def point_values(item):
        nonlocal converted
        if item["association"] == "point":
            return np.asarray(mesh.point_data[item["sourceName"]])
        if converted is None:
            converted = mesh.cell_data_to_point_data()
        return np.asarray(converted.point_data[item["sourceName"]])

    vectors = np.asarray(point_values(vector), dtype=np.float64)
    scalar = np.asarray(point_values(reader.field(field["id"])), dtype=np.float64)
    mesh.point_data["__flow_vector"] = vectors
    mesh.point_data["__display_scalar"] = np.linalg.norm(scalar, axis=-1) if scalar.ndim > 1 else scalar
    finite = np.isfinite(vectors).all(axis=1)
    mesh.point_data["__vector_valid"] = finite.astype(np.uint8)
    mesh = mesh.threshold(0.5, scalars="__vector_valid", preference="point", all_scalars=True)
    if not mesh.n_cells:
        raise ValueError("Velocity field contains no finite fluid cells.")
    diagonal = max(float(np.linalg.norm(np.subtract(*reader.bounds))), 1e-9)
    mode = selection["mode"]
    if mode == "vectors":
        indices = np.arange(mesh.n_points)[:: max(1, int(np.ceil(mesh.n_points / 1000)))]
        arrows = reader.pv.PolyData(np.asarray(mesh.points)[indices])
        values = np.asarray(mesh.point_data["__flow_vector"])[indices]
        speed = np.linalg.norm(values, axis=-1)
        reference = max(float(np.percentile(speed, 95)), 1e-12)
        arrows.point_data["__vectors"] = values / reference
        arrows.point_data["__display_scalar"] = np.asarray(mesh.point_data["__display_scalar"])[indices]
        surface = arrows.glyph(orient="__vectors", scale="__vectors", factor=diagonal / 35).triangulate()
    else:
        centres = np.asarray(mesh.cell_centers().points)
        seeds = centres[:: max(1, int(np.ceil(len(centres) / 64)))]
        paths = mesh.streamlines_from_source(
            reader.pv.PolyData(seeds),
            vectors="__flow_vector",
            max_steps=256,
            max_length=diagonal * 2,
            initial_step_length=0.1,
            terminal_speed=1e-12,
            integration_direction="both",
            interpolator_type="cell",
        )
        if not paths.n_lines:
            return []
        surface = paths.tube(radius=diagonal / 800, n_sides=6, capping=True).triangulate()
    if not surface.n_cells:
        return []
    limits = selection.get("colorRange") or [float(cell_values.min()), float(cell_values.max())]
    colors = scalar_colors(surface.point_data["__display_scalar"], *limits)
    filename = write_asset(
        asset_root,
        cache_key([context, mode]),
        "glb",
        glb(surface.points - reader.origin, surface.faces.reshape(-1, 4)[:, 1:], colors),
    )
    return [{"kind": "geometry", "format": "glb", "filename": filename, "layer": mode}]
