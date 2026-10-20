from pathlib import Path

import numpy as np


def scene_origin(reader, source):
    if reader is not None:
        return np.asarray(reader.bounds[0], dtype=np.float64)
    city, matrix = city_mesh(source)
    return np.asarray(city.world_bounds(matrix)[0])


def city_mesh(source):
    from modules.visualization.geometry.citymesh import CityMesh, MeshNotPrepared, prepare

    directory, case, matrix = city_source(source)
    try:
        city = CityMesh.open(directory, case)
    except MeshNotPrepared:
        # 대형 메시 준비는 디스크 기반 파서와 단일 작업자를 사용
        prepare(directory, case, workers=1)
        city = CityMesh.open(directory, case)
    return city, matrix


def city_source(source):
    from modules.domain.coordinates import mesh_matrix
    from modules.domain.schemas import Case

    if source.get("geometrySource"):
        return city_source(source["geometrySource"])
    if source.get("case"):
        case = Case.model_validate(source["case"])
        directory = Path(source["caseRoot"])
        if case.mesh and not all((directory / relative).is_file() for relative in case.mesh.files):
            from modules.infrastructure.mongo.assets import case_directory
            from modules.settings.rendering import RenderSettings as Settings

            directory = case_directory(Settings.from_env(), case)
    else:
        from modules.domain.schemas.case import Attribution, MeshSpec

        paths = [
            Path(path) for path in source.get("paths", []) if Path(path).suffix.lower() in {".obj", ".stl"}
        ]
        if not paths:
            raise ValueError("Dataset contains no city geometry.")
        directory = Path(source.get("cache", paths[0].parent / ".prepared")).parent
        mapping = source.get("mapping", {})
        case = Case(
            schema="flowcast.case/1",
            id="uploaded",
            name="Uploaded geometry",
            attribution=Attribution(
                source="Uploaded data",
                license="Unspecified",
            ),
            mesh=MeshSpec(
                files=[str(path.relative_to(directory)) for path in paths],
                up_axis=mapping.get("upAxis", "z"),
                to_world={"scale": mapping.get("scale", 1.0)},
            ),
        )
    if not case.mesh:
        raise ValueError("Dataset contains no city geometry.")
    matrix = mesh_matrix(case.mesh.up_axis, **case.mesh.to_world.model_dump())
    return directory, case, matrix
