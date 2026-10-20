from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch.utils.data import DataLoader

from .dataset import FlowDataset
from .inference import load_prediction_model, restore_physical_prediction, select_device
from .metrics import MetricAccumulator, compute_metrics, masked_l1_loss
from .utils import update_metrics


def evaluate_model(
    model: torch.nn.Module,
    dataset: FlowDataset,
    device: torch.device,
    batch_size: int = 1,
    num_workers: int = 0,
    amp: bool = True,
    velocity_limit: float = 0.10,
    pressure_limit: float = 0.20,
) -> dict[str, Any]:
    # 평가 데이터와 지표 준비
    if not len(dataset):
        raise ValueError("No evaluation data is available.")
    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=device.type == "cuda",
    )
    was_training = model.training
    model.eval()
    accumulator = MetricAccumulator()
    per_case = []
    loss_sum = 0.0
    cell_sum = 0
    amp = amp and device.type == "cuda"
    with torch.inference_mode():
        for batch in loader:
            # 추론과 유효 셀 손실 집계
            spatial = batch["spatial"].to(device, non_blocking=True)
            conditions = batch["conditions"].to(device, non_blocking=True)
            target = batch["target"].to(device, non_blocking=True)
            mask = batch["mask"].to(device, non_blocking=True)
            with torch.autocast(device_type=device.type, enabled=amp):
                prediction = model(spatial, conditions)
                loss = masked_l1_loss(prediction, target, mask)
            cells = int(mask.sum().item())
            loss_sum += float(loss.item()) * cells
            cell_sum += cells

            # 물리 단위 오차 집계
            predictions = prediction.float().cpu().numpy()
            indices = batch["index"]
            for position in range(len(predictions)):
                index = int(indices[position])
                case = dataset.case(index)
                physical = restore_physical_prediction(
                    predictions[position], case, dataset.normalization
                )
                valid = np.asarray(case["fluid_mask"], dtype=bool) & np.asarray(
                    case["valid_mask"], dtype=bool
                )
                accumulator.update(physical, case["target"], valid)
                per_case.append(
                    {
                        "file": str(dataset.files[index]),
                        **compute_metrics(
                            physical, case["target"], valid, velocity_limit, pressure_limit
                        ),
                    }
                )

    # 모델 모드 복원과 결과 구성
    if was_training:
        model.train()
    result = accumulator.compute(velocity_limit, pressure_limit)
    result["normalized_loss"] = loss_sum / cell_sum
    result["case_count"] = len(per_case)
    result["per_case"] = per_case
    return result


def evaluate(
    config: dict[str, Any],
    run_dir: str | Path,
    checkpoint: str | Path | None = None,
    split: str = "test",
) -> dict[str, Any]:
    # 평가 분할과 데이터 준비
    if split not in {"train", "val", "test"}:
        raise ValueError("Evaluation split must be train, val or test.")
    started = time.monotonic()
    run_dir = Path(run_dir)
    checkpoint = Path(checkpoint) if checkpoint else run_dir / "best.pt"
    data_dir = Path(config["paths"]["data"]) / "preprocessed"
    manifest_path = data_dir / config.get("generation", {}).get("manifest_name", "manifest.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    training = config.get("training", {})
    device = select_device(training.get("device", "auto"))
    model, payload = load_prediction_model(checkpoint, device)

    # 학습 통계로 정규화 후 평가
    dataset = FlowDataset(
        data_dir, manifest, split, payload["normalization"], require_target=True
    )
    result = evaluate_model(
        model,
        dataset,
        device,
        batch_size=int(training.get("batch_size", 1)),
        num_workers=int(training.get("num_workers", 0)),
        amp=bool(training.get("amp", True)),
        velocity_limit=float(config.get("evaluation", {}).get("velocity_relative_rmse_limit", 0.10)),
        pressure_limit=float(config.get("evaluation", {}).get("pressure_relative_rmse_limit", 0.20)),
    )

    # 평가 결과 기록
    result.update(
        {
            "status": "finished",
            "reason": None,
            "split": split,
            "checkpoint": str(checkpoint.resolve()),
            "checkpoint_epoch": int(payload.get("epoch", 0)),
            "device": str(device),
            "elapsed_seconds": time.monotonic() - started,
            "success_criteria_met": bool(result["criteria"]["passed"]),
        }
    )
    metrics_path = run_dir / "metrics.json"
    existing = json.loads(metrics_path.read_text(encoding="utf-8")) if metrics_path.exists() else {}
    evaluations = existing.get("evaluation", {})
    evaluations[split] = result
    update_metrics(run_dir, "evaluation", evaluations)
    return result
