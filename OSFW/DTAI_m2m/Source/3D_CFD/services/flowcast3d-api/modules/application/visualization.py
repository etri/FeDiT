"""독립 예측 배열을 시각화 작업으로 전달하는 처리 흐름"""

import json

import numpy as np

from modules.domain.errors import ApiError


def visualize_prediction(operation, body):
    # 공통 결과를 작은 내부 배열 파일로 전달
    operation.check_cancelled()
    if operation.services is None:
        raise ApiError(503, "Application startup is incomplete.")
    result = body.prediction
    values = np.concatenate(
        (
            np.asarray(result.velocity, dtype=np.float32).transpose(3, 0, 1, 2),
            np.asarray(result.pressure, dtype=np.float32)[None],
        ),
        axis=0,
    )
    path = operation.directory / "prediction.npz"
    solid = np.asarray(result.building_mask, dtype=bool)
    np.savez(
        path,
        prediction=values,
        origin=np.asarray(result.grid.origin, dtype=np.float64),
        spacing=np.asarray(result.grid.spacing, dtype=np.float64),
        fluid_mask=(~solid)[None],
        valid_mask=np.asarray(result.valid_mask, dtype=bool)[None],
        metadata=np.asarray(json.dumps({"axis_order": "ZYX", "units": ["m/s", "m/s", "m/s", "Pa"]})),
    )
    options = body.model_dump(exclude={"prediction"}, exclude_none=True)
    operation.phase = "render"
    operation.check_cancelled()
    image = operation.services.render_public_prediction(path, {**options, "animation": "orbit"})
    operation.check_cancelled()
    return image
