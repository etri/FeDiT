"""요청 자료만 사용하는 공개 예측 흐름"""

import json
import secrets
from datetime import datetime, timezone

import numpy as np

from modules.application.ports.public import PredictionDecoder, PublicServices
from modules.application.request_operation import RequestOperation
from modules.application.visualization import visualize_prediction
from modules.domain.errors import ApiError
from modules.domain.schemas.prediction import SCHEMA, UNITS


class StatelessWorkflow:
    """공개 입력으로 실행하는 예측과 시각화의 요청 작업 생성"""

    def __init__(
        self, settings, services: PublicServices | None, *, decoder: PredictionDecoder | None = None
    ):
        self.settings, self.services = settings, services
        self.decoder = decoder

    def operation(self, deadline=None):
        return PublicOperation(self, deadline)


class PublicOperation(RequestOperation):
    """독립 입력의 전처리와 추론 및 공통 결과 직렬화"""

    def predict_json(self, body):
        source = self.directory / "request.json"
        with source.open("w", encoding="utf-8") as stream:
            json.dump(
                body.model_dump(mode="json", exclude_unset=True),
                stream,
                allow_nan=False,
                separators=(",", ":"),
            )
        return self.predict(source, "json", body.wind.model_dump(), None)

    def predict(self, source, input_kind, wind, options=None):
        # 요청 형상을 작은 모델 입력으로 정규화
        self.check_cancelled()
        if self.services is None:
            raise ApiError(503, "Application startup is incomplete.")
        self.phase = "prepare"
        prepared_path = self.directory / "input.npz"
        prepared = self.services.prepare_public_prediction(source, prepared_path, input_kind, wind, options)
        self.check_cancelled()
        if (
            not isinstance(prepared, dict)
            or prepared.get("input_file") != "input.npz"
            or prepared_path.is_symlink()
            or not prepared_path.is_file()
        ):
            raise ApiError(502, "Geometry preparation did not return the requested input file.")
        maximum = self.settings.max_prediction_bytes
        if not 0 < prepared_path.stat().st_size <= maximum:
            raise ApiError(413, "Prepared prediction input exceeds the size limit.")

        # 모델 서버에 메모리 NPZ를 보내고 동일한 물리 결과 복원
        self.phase = "model"
        self.check_cancelled()
        run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_") + secrets.token_hex(3)
        payload, metadata = self.services.predict_payload(
            run_id, prepared_path.read_bytes(), "prediction.npz"
        )
        self.check_cancelled()
        self.phase = "serialize"
        try:
            if self.decoder is None:
                raise ApiError(503, "Prediction decoder is unavailable.")
            arrays = self.decoder(payload)
        except (ValueError, TypeError, OSError, KeyError) as error:
            raise ApiError(502, "Model returned an invalid prediction array contract.") from error
        if not isinstance(metadata, dict):
            raise ApiError(502, "Model returned invalid prediction metadata.")
        return self.write_result(arrays, wind)

    def write_result(self, arrays, wind):
        values, solid, valid = arrays["prediction"], ~arrays["fluid_mask"][0], arrays["valid_mask"][0]
        valid = valid & ~solid
        values = values.copy()
        values[:, ~valid] = 0
        metadata = {
            "schema": SCHEMA,
            "axis_order": "ZYX",
            "grid": {
                "shape": list(values.shape[:0:-1]),
                "origin": arrays["origin"].tolist(),
                "spacing": arrays["spacing"].tolist(),
            },
            "wind": wind,
            "units": UNITS,
        }
        fields = {
            "velocity": np.moveaxis(values[:3], 0, -1),
            "pressure": values[3],
            "building_mask": solid,
            "valid_mask": valid,
        }
        path = self.directory / "result.json"
        maximum = getattr(self.settings, "max_json_bytes", 128 * 1024**2)
        size = 0
        with path.open("wb") as stream:

            def write(value):
                nonlocal size
                self.check_cancelled()
                data = value.encode("utf-8")
                size += len(data)
                if size > maximum:
                    raise ApiError(413, "Prediction JSON exceeds the size limit. Reduce grid_shape.")
                stream.write(data)

            write(json.dumps(metadata, allow_nan=False, separators=(",", ":"))[:-1])
            for name, array in fields.items():
                write("," + json.dumps(name) + ":[")
                for index, slab in enumerate(array):
                    if index:
                        write(",")
                    write(json.dumps(slab.tolist(), allow_nan=False, separators=(",", ":")))
                write("]")
            write("}")
        return path

    def visualize(self, body):
        return visualize_prediction(self, body)
