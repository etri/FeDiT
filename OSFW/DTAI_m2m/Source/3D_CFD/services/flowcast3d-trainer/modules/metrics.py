from __future__ import annotations

import math
from typing import Any

import numpy as np


FIELD_NAMES = ("ux", "uy", "uz", "p")


class MetricAccumulator:
    """유효 셀 수를 분모로 물리 단위 오차 누적"""

    def __init__(self) -> None:
        self.count = 0
        self.absolute_error = np.zeros(4, dtype=np.float64)
        self.squared_error = np.zeros(4, dtype=np.float64)
        self.squared_target = np.zeros(4, dtype=np.float64)

    def update(
        self, prediction: np.ndarray, target: np.ndarray, mask: np.ndarray
    ) -> None:
        # 평가 배열 검사
        prediction = np.asarray(prediction)
        target = np.asarray(target)
        mask = np.asarray(mask, dtype=bool)
        if prediction.shape != target.shape or prediction.ndim != 4:
            raise ValueError("Prediction and target must have the same [4,Z,Y,X] shape.")
        if prediction.shape[0] != 4:
            raise ValueError("Flow field evaluation requires four channels.")
        if mask.shape == (1, *prediction.shape[1:]):
            mask = mask[0]
        if mask.shape != prediction.shape[1:]:
            raise ValueError("Evaluation mask and grid shapes do not match.")
        count = int(np.count_nonzero(mask))
        if not count:
            raise ValueError("No valid fluid cells are available for evaluation.")

        # 유효 셀 선택
        predicted = prediction[:, mask].astype(np.float64)
        expected = target[:, mask].astype(np.float64)
        if not np.isfinite(predicted).all() or not np.isfinite(expected).all():
            raise ValueError("Evaluation fields contain non-finite values.")

        # 채널별 오차 누적
        delta = predicted - expected
        self.count += count
        self.absolute_error += np.sum(np.abs(delta), axis=1)
        self.squared_error += np.sum(delta * delta, axis=1)
        self.squared_target += np.sum(expected * expected, axis=1)

    def compute(
        self, velocity_limit: float = 0.10, pressure_limit: float = 0.20
    ) -> dict[str, Any]:
        if not self.count:
            raise ValueError("No evaluation data has been accumulated.")
        if (
            not math.isfinite(velocity_limit) or not math.isfinite(pressure_limit)
            or velocity_limit <= 0 or pressure_limit <= 0
        ):
            raise ValueError("Evaluation criteria must be positive.")
        velocity = _relative_rmse(
            float(np.sum(self.squared_error[:3])),
            float(np.sum(self.squared_target[:3])),
        )
        pressure = _relative_rmse(
            float(self.squared_error[3]), float(self.squared_target[3])
        )
        return {
            "valid_cell_count": self.count,
            "fields": {
                name: {
                    "mae": float(self.absolute_error[index] / self.count),
                    "rmse": float(math.sqrt(self.squared_error[index] / self.count)),
                    "unit": "Pa" if name == "p" else "m/s",
                }
                for index, name in enumerate(FIELD_NAMES)
            },
            "velocity_vector_relative_rmse": velocity,
            "pressure_relative_rmse": pressure,
            "criteria": {
                "velocity_limit": velocity_limit,
                "pressure_limit": pressure_limit,
                "velocity_passed": velocity is not None and velocity <= velocity_limit,
                "pressure_passed": pressure is not None and pressure <= pressure_limit,
                "passed": (
                    velocity is not None
                    and pressure is not None
                    and velocity <= velocity_limit
                    and pressure <= pressure_limit
                ),
            },
        }


def _relative_rmse(squared_error: float, squared_target: float) -> float | None:
    """정답 에너지가 없으면 상대 오차를 None으로 처리"""
    if squared_target <= 1e-20:
        return None
    return float(math.sqrt(squared_error / squared_target))


def compute_metrics(
    prediction: np.ndarray, target: np.ndarray, mask: np.ndarray,
    velocity_limit: float = 0.10, pressure_limit: float = 0.20,
) -> dict[str, Any]:
    accumulator = MetricAccumulator()
    accumulator.update(prediction, target, mask)
    return accumulator.compute(velocity_limit, pressure_limit)


def validation_score(metrics: dict[str, Any]) -> float:
    velocity = metrics.get("velocity_vector_relative_rmse")
    pressure = metrics.get("pressure_relative_rmse")
    if velocity is None or pressure is None:
        return math.inf
    criteria = metrics.get("criteria", {})
    return max(
        float(velocity) / float(criteria.get("velocity_limit", 0.10)),
        float(pressure) / float(criteria.get("pressure_limit", 0.20)),
    )


def loss_configuration(pressure_mse_weight: float = 0.0) -> dict[str, Any]:
    if (
        isinstance(pressure_mse_weight, bool)
        or not isinstance(pressure_mse_weight, (int, float))
        or not math.isfinite(pressure_mse_weight)
        or pressure_mse_weight < 0
    ):
        raise ValueError("pressure_mse_weight must be a finite nonnegative number.")
    return {
        "name": "masked_l1_with_pressure_mse_v1",
        "pressure_mse_weight": float(pressure_mse_weight),
    }


def masked_l1_loss(
    prediction: Any, target: Any, mask: Any, *, pressure_mse_weight: float = 0.0,
    sample_weights: Any = None,
) -> Any:
    """유효 셀 평균 L1과 선택적 압력 MSE

    Args:
        prediction: 정규화 예측 [B,4,Z,Y,X]
        target: 정규화 정답 [B,4,Z,Y,X]
        mask: 유효 유체 셀 [B,1,Z,Y,X]
        sample_weights: 사례별 가중치로 분모의 유효 셀 수에는 미반영
    """
    import torch

    settings = loss_configuration(pressure_mse_weight)
    if prediction.shape != target.shape or prediction.shape[1] != 4:
        raise ValueError("Loss inputs must have the same [B,4,Z,Y,X] shape.")
    mask = mask.to(dtype=torch.float32)
    count = mask.sum()
    if count.item() <= 0:
        raise ValueError("No valid cells are available for loss calculation.")
    loss_mask = mask
    if sample_weights is not None:
        weights = torch.as_tensor(sample_weights, device=prediction.device)
        if (weights.dtype == torch.bool or weights.shape != (prediction.shape[0],)
                or (isinstance(sample_weights, (list, tuple))
                    and any(isinstance(value, bool) for value in sample_weights))):
            raise ValueError("sample_weights must be a batch-sized array of finite positive values.")
        weights = weights.detach().to(dtype=torch.float32)
        if not torch.isfinite(weights).all() or not (weights > 0).all():
            raise ValueError("sample_weights must be a batch-sized array of finite positive values.")
        loss_mask = mask * weights[:, None, None, None, None]
    difference = torch.abs(prediction.float() - target.float()) * loss_mask
    velocity = difference[:, :3].sum() / (count * 3)
    pressure = difference[:, 3:4].sum() / count
    base = (velocity + pressure) * 0.5
    weight = settings["pressure_mse_weight"]
    if weight == 0:
        return base
    pressure_error = (prediction.float() - target.float())[:, 3:4]
    pressure_error = torch.where(mask.bool(), pressure_error, torch.zeros_like(pressure_error))
    pressure_mse = (pressure_error.square() * loss_mask).sum() / count
    return base + weight * pressure_mse
