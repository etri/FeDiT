"""공개 예측과 렌더링 처리에 필요한 외부 기능 계약"""

from pathlib import Path
from threading import Event
from typing import Any, Callable, Protocol

import numpy as np

PredictionDecoder = Callable[[bytes], dict[str, np.ndarray]]


class PublicServices(Protocol):
    owns_client: bool

    def fork(self, cancel_event: Event, deadline: float) -> "PublicServices": ...

    def close(self) -> None: ...

    def predict_payload(self, run_id: str, payload: bytes, output_file: str) -> tuple[bytes, dict]: ...

    def prepare_public_prediction(
        self,
        input_path: Path,
        output_path: Path,
        input_kind: str,
        wind: dict[str, float] | None = None,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]: ...

    def render_public_prediction(self, input_path: Path, options: dict[str, Any]) -> bytes: ...
