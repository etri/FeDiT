from __future__ import annotations

import copy
import json
import shutil
import tempfile
import math
import random
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch.utils.data import DataLoader

from .dataset import FlowDataset, fit_normalization, validate_manifest
from .evaluate import evaluate_model
from .inference import select_device
from .metrics import loss_configuration, masked_l1_loss, validation_score
from .model import build_model
from .utils import (
    _atomic_write, atomic_json, atomic_torch_save, load_run_config, save_run_config,
    update_metrics,
)


def _seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def _rng_state() -> dict[str, Any]:
    return {
        "python": random.getstate(),
        "numpy": np.random.get_state(),
        "torch": torch.get_rng_state(),
        "cuda": torch.cuda.get_rng_state_all() if torch.cuda.is_available() else [],
    }


def _restore_rng(state: dict[str, Any]) -> None:
    random.setstate(state["python"])
    np.random.set_state(state["numpy"])
    torch.set_rng_state(state["torch"].cpu())
    if torch.cuda.is_available() and state.get("cuda"):
        torch.cuda.set_rng_state_all([value.cpu() for value in state["cuda"]])


def _finite_score(value: float) -> float | None:
    return value if math.isfinite(value) else None



def _case_weights(
    dataset: FlowDataset, mode: str = "none",
) -> tuple[dict[str, Any], list[float] | None]:
    """학습 분할의 풍향 건수와 선택적 압력 에너지로 사례별 손실 가중치 계산"""
    if not isinstance(mode, str) or mode not in {"none", "wind_direction", "relative_pressure"}:
        raise ValueError("case_weighting must be none/wind_direction/relative_pressure.")
    settings = {"name": "train_case_weighting_v1", "mode": mode}
    if mode == "none":
        return settings, None
    if not dataset.entries or any(entry.get("split") != "train" for entry in dataset.entries):
        raise ValueError("case_weighting only supports the train split.")
    angles = []
    for entry in dataset.entries:
        angle = entry.get("wind_direction_deg")
        if (isinstance(angle, bool) or not isinstance(angle, (int, float))
                or not math.isfinite(angle)):
            raise ValueError("Training wind directions must be finite numbers.")
        angles.append(float(angle) % 360.0)
    counts = {angle: angles.count(angle) for angle in sorted(set(angles))}
    rows = []
    for index, (entry, angle) in enumerate(zip(dataset.entries, angles)):
        row = {"file": entry["file"], "wind_direction_deg": angle,
               "direction_case_count": counts[angle]}
        weight = len(angles) / (len(counts) * counts[angle])
        if mode == "relative_pressure":
            case = dataset.case(index)
            mask = (np.asarray(case["fluid_mask"], dtype=bool)
                    & np.asarray(case["valid_mask"], dtype=bool))[0]
            scale = float(case["conditions"][0]) * float(case["conditions"][5]) ** 2
            if not math.isfinite(scale) or scale <= 0:
                raise ValueError("relative_pressure density and wind speed must be finite and positive.")
            cp = np.asarray(case["target"][3][mask], dtype=np.float64) / scale
            energy = float(np.mean(cp * cp)) if cp.size else 0.0
            if not math.isfinite(energy) or energy <= 0.0:
                raise ValueError("relative_pressure requires positive Cp energy in valid fluid cells.")
            row["mean_cp_squared"] = energy
            weight = 1.0 / (counts[angle] * energy)
        if not math.isfinite(weight) or weight <= 0:
            raise ValueError("Computed case_weighting weights must be finite and positive.")
        row["weight"] = weight
        rows.append(row)
    scale = len(rows) / math.fsum(row["weight"] for row in rows)
    for row in rows:
        row["weight"] *= scale
    settings.update(train_case_count=len(rows), direction_count=len(counts), cases=rows,
                    normalization="train_case_mean_one", denominator="unweighted_valid_cell_count")
    return settings, [row["weight"] for row in rows]



def _has_frozen_model_revision(checkpoint: dict[str, Any], model_config: dict[str, Any]) -> bool:
    """기존 head 이관과 명시적인 폭 확장 기록의 연결 검사"""
    epoch = int(checkpoint.get("epoch", 0))
    revisions = checkpoint.get("model_revisions", [])
    origins = [revision for revision in revisions
               if revision.get("type") == "zero_initialized_pressure_refinement_v1"
               and 0 < int(revision.get("from_epoch", 0)) <= epoch + 1]
    if any(origin.get("current_model_config") == model_config for origin in origins):
        return True
    for revision in revisions:
        previous = revision.get("previous_model_config", {})
        if (revision.get("type") == "pressure_refinement_width_expansion_v1"
                and revision.get("current_model_config") == model_config
                and previous.get("pressure_refinement_channels", previous.get("base_channels", 16)) == 16
                and model_config.get("pressure_refinement_channels") == 32
                and {**previous, "pressure_refinement_channels": 32} == model_config
                and 0 < int(revision.get("from_epoch", 0)) <= epoch + 1
                and any(origin.get("current_model_config") == previous
                        and int(origin["from_epoch"]) < int(revision["from_epoch"]) for origin in origins)):
            return True
    return False


def train(
    config: dict[str, Any], run_dir: str | Path, resume: bool = False
) -> dict[str, Any]:
    """마지막 완료 epoch의 모델, 최적화기, 난수 상태로 재개"""
    # 실행 경로와 난수 시드 준비
    started = time.monotonic()
    run_dir = Path(run_dir)
    run_dir.mkdir(parents=True, exist_ok=True)
    last_path = run_dir / "last.pt"
    best_path = run_dir / "best.pt"
    if not resume and (last_path.exists() or best_path.exists()):
        raise FileExistsError("Runs with an existing model require resume.")
    if resume and not last_path.is_file():
        raise FileNotFoundError("last.pt checkpoint is missing for resume.")
    training = config.get("training", {})
    seed = int(training.get("seed", 42))
    _seed_everything(seed)
    device = select_device(training.get("device", "auto"))

    # 데이터 형식 확인과 정규화 준비
    data_dir = Path(config["paths"]["data"]) / "preprocessed"
    manifest_path = data_dir / config.get("generation", {}).get("manifest_name", "manifest.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    model_config = config.get("model", {})
    checkpoint = (
        torch.load(last_path, map_location="cpu", weights_only=False) if resume else None
    )
    if model_config.get("frozen_backbone", False) and (
        not checkpoint or int(checkpoint.get("epoch", 0)) < 1
        or not _has_frozen_model_revision(checkpoint, model_config)
    ):
        raise ValueError("Frozen models require an explicit pressure head migration record from the trained source model.")
    if checkpoint:
        if checkpoint["model_config"] != model_config:
            raise ValueError("Model configuration has changed for the resumed training run.")
        normalization = checkpoint["normalization"]
    else:
        normalization = fit_normalization(data_dir, manifest)
    model_revisions = list(checkpoint.get("model_revisions", [])) if checkpoint else []
    previous_loss_config = (
        checkpoint.get("loss_config", loss_configuration()) if checkpoint else loss_configuration()
    )
    loss_config = loss_configuration(
        training.get("pressure_mse_weight", previous_loss_config["pressure_mse_weight"])
    )
    loss_revisions = list(checkpoint.get("loss_revisions", [])) if checkpoint else []

    # 데이터셋과 사례별 손실 가중치 구성
    train_data = FlowDataset(data_dir, manifest, "train", normalization)
    val_data = FlowDataset(data_dir, manifest, "val", normalization)
    if not len(train_data) or not len(val_data):
        raise ValueError("Training and validation splits require data.")
    previous_case_weighting_config = (
        checkpoint.get("case_weighting_config", {"name": "train_case_weighting_v1", "mode": "none"})
        if checkpoint else {"name": "train_case_weighting_v1", "mode": "none"}
    )
    case_weighting_config, case_weights = _case_weights(
        train_data, training.get("case_weighting", previous_case_weighting_config["mode"])
    )
    case_weighting_revisions = list(checkpoint.get("case_weighting_revisions", [])) if checkpoint else []

    # 모델과 최적화기 준비
    model = build_model(model_config).to(device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(training.get("learning_rate", 1e-3)),
        weight_decay=float(training.get("weight_decay", 1e-4)),
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="min",
        factor=float(training.get("lr_factor", 0.5)),
        patience=int(training.get("lr_patience", 20)),
        min_lr=float(training.get("min_learning_rate", 1e-5)),
    )
    amp = bool(training.get("amp", True)) and device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda", enabled=amp)
    generator = torch.Generator().manual_seed(seed)
    batch_size = int(training.get("batch_size", 1))
    workers = int(training.get("num_workers", 0))
    train_loader = DataLoader(
        train_data,
        batch_size=batch_size,
        shuffle=True,
        generator=generator,
        num_workers=workers,
        pin_memory=device.type == "cuda",
    )
    max_epochs = int(training.get("max_epochs", 400))
    if max_epochs < 1:
        raise ValueError("max_epochs must be at least 1.")
    start_epoch = 1
    best_epoch = 0
    best_score = math.inf
    best_loss = math.inf
    best_validation: dict[str, Any] = {}
    no_improvement = 0
    history: list[dict[str, Any]] = []
    prior_elapsed = 0.0

    # 학습 상태와 난수 상태를 함께 복원
    if checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        for state in optimizer.state.values():
            for key, value in state.items():
                if isinstance(value, torch.Tensor):
                    state[key] = value.to(device)
        scheduler.load_state_dict(checkpoint["scheduler_state_dict"])
        scaler.load_state_dict(checkpoint["scaler_state_dict"])
        start_epoch = int(checkpoint["epoch"]) + 1
        best_epoch = int(checkpoint["best_epoch"])
        best_score = checkpoint["best_score"]
        best_score = math.inf if best_score is None else float(best_score)
        best_loss = float(checkpoint["best_loss"])
        best_validation = checkpoint.get("best_validation", {})
        if best_validation:
            best_validation.setdefault("loss_config", loss_configuration())
        no_improvement = int(checkpoint.get("no_improvement", 0))
        history = checkpoint.get("history", [])
        prior_elapsed = float(checkpoint.get("elapsed_seconds", 0))
        generator.set_state(checkpoint["loader_generator_state"].cpu())
        _restore_rng(checkpoint["rng_state"])
    if checkpoint and previous_loss_config != loss_config:
        loss_revisions.append({
            "from_epoch": start_epoch,
            "previous": previous_loss_config,
            "current": dict(loss_config),
        })
    if checkpoint and previous_case_weighting_config != case_weighting_config:
        case_weighting_revisions.append({
            "from_epoch": start_epoch,
            "previous": copy.deepcopy(previous_case_weighting_config),
            "current": copy.deepcopy(case_weighting_config),
        })
    completed_epoch = start_epoch - 1
    training_status = "running"
    step_seconds: list[float] = []
    sampled_steps = 0
    min_epochs = min(int(training.get("min_epochs", 100)), max_epochs)
    patience = int(training.get("early_stopping_patience", 60))
    checkpoint_every = int(training.get("checkpoint_every", 1))
    if checkpoint_every < 1:
        raise ValueError("checkpoint_every must be at least 1.")

    def summary(status: str) -> dict[str, Any]:
        return {
            "status": status,
            "error": None,
            "device": str(device),
            "amp": amp,
            "train_case_count": len(train_data),
            "val_case_count": len(val_data),
            "completed_epochs": completed_epoch,
            "best_epoch": best_epoch,
            "best_score": _finite_score(best_score),
            "best_validation": best_validation,
            "validation_criteria_met": bool(
                best_validation.get("criteria", {}).get("passed", False)
            ),
            "history": history,
            "elapsed_seconds": prior_elapsed + time.monotonic() - started,
            "measured_step_seconds": (
                float(np.mean(step_seconds)) if step_seconds else None
            ),
            "estimated_total_training_seconds": (
                float(np.mean([entry["elapsed_seconds"] for entry in history]))
                * max_epochs * 1.2 if history else None
            ),
            "timing_method": "epoch_mean_with_20_percent_margin",
            "normalization": normalization,
            "model_config": dict(model_config),
            "loss_config": dict(loss_config),
            "validation_loss_config": loss_configuration(),
            "loss_revisions": list(loss_revisions),
            "model_revisions": list(model_revisions),
            "case_weighting_config": copy.deepcopy(case_weighting_config),
            "case_weighting_revisions": copy.deepcopy(case_weighting_revisions),
        }

    def snapshot(epoch: int, include_training_state: bool) -> dict[str, Any]:
        state = {
            "format_version": 1,
            "model_state_dict": model.state_dict(),
            "model_config": model_config,
            "normalization": normalization,
            "epoch": epoch,
            "best_epoch": best_epoch,
            "best_score": _finite_score(best_score),
            "best_loss": best_loss,
            "best_validation": best_validation,
            "loss_config": dict(loss_config),
            "validation_loss_config": loss_configuration(),
            "loss_revisions": list(loss_revisions),
            "model_revisions": list(model_revisions),
            "case_weighting_config": copy.deepcopy(case_weighting_config),
            "case_weighting_revisions": copy.deepcopy(case_weighting_revisions),
        }
        if include_training_state:
            state.update(
                {
                    "optimizer_state_dict": optimizer.state_dict(),
                    "scheduler_state_dict": scheduler.state_dict(),
                    "scaler_state_dict": scaler.state_dict(),
                    "rng_state": _rng_state(),
                    "loader_generator_state": generator.get_state(),
                    "no_improvement": no_improvement,
                    "history": history,
                    "elapsed_seconds": prior_elapsed + time.monotonic() - started,
                }
            )
        return state

    # 초기 상태 저장과 epoch 반복
    update_metrics(run_dir, "training", summary(training_status))
    if not resume:
        atomic_torch_save(last_path, snapshot(0, True))
    try:
        for epoch in range(start_epoch, max_epochs + 1):
            epoch_started = time.monotonic()
            model.train()
            loss_sum = 0.0
            cells_sum = 0
            for batch in train_loader:
                # 배치 추론과 손실 계산
                if device.type == "cuda" and sampled_steps < 60:
                    torch.cuda.synchronize(device)
                step_started = time.monotonic()
                spatial = batch["spatial"].to(device, non_blocking=True)
                conditions = batch["conditions"].to(device, non_blocking=True)
                target = batch["target"].to(device, non_blocking=True)
                mask = batch["mask"].to(device, non_blocking=True)
                optimizer.zero_grad(set_to_none=True)
                with torch.autocast(device_type=device.type, enabled=amp):
                    prediction = model(spatial, conditions)
                    loss = masked_l1_loss(
                        prediction, target, mask,
                        pressure_mse_weight=loss_config["pressure_mse_weight"],
                        sample_weights=(
                            [case_weights[int(index)] for index in batch["index"]]
                            if case_weights is not None else None
                        ),
                    )
                if not torch.isfinite(loss):
                    raise FloatingPointError("Training loss is non-finite.")

                # 기울기 제한과 가중치 갱신
                scaler.scale(loss).backward()
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(
                    model.parameters(), float(training.get("gradient_clip", 1.0))
                )
                scaler.step(optimizer)
                scaler.update()
                cells = int(mask.sum().item())
                loss_sum += float(loss.item()) * cells
                cells_sum += cells
                if device.type == "cuda" and sampled_steps < 60:
                    torch.cuda.synchronize(device)
                if 10 <= sampled_steps < 60:
                    step_seconds.append(time.monotonic() - step_started)
                sampled_steps += 1

            # 검증과 학습률 조정
            validation = evaluate_model(
                model, val_data, device, batch_size=batch_size, num_workers=workers, amp=amp,
                velocity_limit=float(config.get("evaluation", {}).get("velocity_relative_rmse_limit", 0.10)),
                pressure_limit=float(config.get("evaluation", {}).get("pressure_relative_rmse_limit", 0.20)),
            )
            validation["loss_config"] = loss_configuration()
            score = validation_score(validation)
            val_loss = float(validation["normalized_loss"])
            if not math.isfinite(val_loss):
                raise FloatingPointError("Validation loss is non-finite.")
            improved = best_epoch == 0 or (score, val_loss) < (best_score, best_loss)
            if improved:
                best_epoch, best_score, best_loss = epoch, score, val_loss
                best_validation = validation
                no_improvement = 0
            else:
                no_improvement += 1
            scheduler.step(score if math.isfinite(score) else val_loss)
            completed_epoch = epoch
            history.append(
                {
                    "epoch": epoch,
                    "case_weighting_config": copy.deepcopy(case_weighting_config),
                    "loss_config": dict(loss_config),
                    "validation_loss_config": loss_configuration(),
                    "train_loss": loss_sum / cells_sum,
                    "val_loss": val_loss,
                    "velocity_vector_relative_rmse": validation[
                        "velocity_vector_relative_rmse"
                    ],
                    "pressure_relative_rmse": validation["pressure_relative_rmse"],
                    "validation_score": _finite_score(score),
                    "learning_rate": float(optimizer.param_groups[0]["lr"]),
                    "elapsed_seconds": time.monotonic() - epoch_started,
                }
            )

            # 체크포인트 저장과 조기 종료
            if improved:
                atomic_torch_save(best_path, snapshot(epoch, False))
            should_stop = (
                epoch >= min_epochs
                and no_improvement >= patience
                and best_validation["criteria"]["passed"]
            )
            if epoch % checkpoint_every == 0 or epoch == max_epochs or should_stop:
                atomic_torch_save(last_path, snapshot(epoch, True))
            update_metrics(run_dir, "training", summary("running"))
            if epoch == 1 or epoch % 10 == 0 or epoch == max_epochs:
                print(
                    f"epoch={epoch}/{max_epochs} train={loss_sum / cells_sum:.6f} "
                    f"val={val_loss:.6f} score={score:.4f}",
                    flush=True,
                )
            if should_stop:
                training_status = "early_stopped"
                break
        else:
            training_status = "finished"
    except BaseException as error:
        training_status = "interrupted" if isinstance(error, KeyboardInterrupt) else "failed"
        result = summary(training_status)
        result["error"] = str(error)
        update_metrics(run_dir, "training", result)
        raise
    result = summary(training_status)
    update_metrics(run_dir, "training", result)
    return result


def refine_pressure(
    config: dict[str, Any], run_dir: str | Path, *, max_epochs: int = 4500,
    head_learning_rate: float = 0.001, head_lr_patience: int = 60,
) -> dict[str, Any]:
    """원본을 보존하며 같은 Run-ID에 압력 head 학습 준비, 호출자가 run과 raw 잠금 보유"""
    run_dir = Path(run_dir)
    required = ("config.yaml", "metrics.json", "best.pt", "last.pt")
    if set(path.name for path in run_dir.iterdir()) != set(required):
        raise ValueError("Pressure refinement requires an existing run containing only the four required result files.")
    previous = load_run_config(run_dir)
    metrics = json.loads((run_dir / "metrics.json").read_text())
    training = metrics.get("training", {})
    criteria = training.get("best_validation", {}).get("criteria", {})
    if (metrics.get("execution", {}).get("status") != "quality_failed"
            or training.get("status") != "finished" or not criteria.get("velocity_passed", False)
            or criteria.get("pressure_passed", False) or criteria.get("passed", False)
            or metrics.get("evaluation", {}).get("test") != {
                "status": "withheld", "reason": "validation_criteria_not_met"}):
        raise ValueError("A completed run with only pressure failing validation and withheld tests is required.")
    if previous["model"].get("pressure_refinement", False) or previous["model"].get("frozen_backbone", False):
        raise ValueError("Model has already been refined. Use resume without refine-pressure.")
    if previous["model"] != config["model"]:
        raise ValueError("Model configuration cannot be changed before pressure refinement.")
    if (isinstance(head_learning_rate, bool) or not isinstance(head_learning_rate, (int, float))
            or not math.isfinite(head_learning_rate)
            or head_learning_rate <= 0 or type(head_lr_patience) is not int or head_lr_patience < 0):
        raise ValueError("Head learning rate must be finite and positive, and patience must be a nonnegative integer.")
    payloads = {name: torch.load(run_dir / name, map_location="cpu", weights_only=False)
                for name in ("best.pt", "last.pt")}
    last = payloads["last.pt"]
    epoch = int(last["epoch"])
    manifest = (Path(config["paths"]["data"]) / "preprocessed"
                / config.get("generation", {}).get("manifest_name", "manifest.json"))
    validate_manifest(manifest)
    if (epoch < 1 or epoch != training["completed_epochs"] or type(max_epochs) is not int
            or max_epochs <= epoch):
        raise ValueError("A trained source epoch and increased maximum epoch count are required.")
    new_config = copy.deepcopy(config)
    new_config["model"].update(pressure_refinement=True, frozen_backbone=True)
    new_config["training"].update(max_epochs=max_epochs, learning_rate=float(head_learning_rate), lr_patience=head_lr_patience)
    with torch.random.fork_rng(devices=[]):
        torch.default_generator.manual_seed(int(config["training"].get("seed", 42)))
        old_model = build_model(previous["model"])
        new_model = build_model(new_config["model"])
    old_names = [name for name, _ in old_model.named_parameters()]
    new_names = [name for name, _ in new_model.named_parameters()]
    if new_names[:len(old_names)] != old_names or any(not name.startswith("pressure_refinement.") for name in new_names[len(old_names):]):
        raise ValueError("Parameter order outside the pressure head cannot be changed.")
    revision = {
        "type": "zero_initialized_pressure_refinement_v1", "from_epoch": epoch + 1,
        "previous_model_config": previous["model"], "current_model_config": new_config["model"],
        "head_condition_indices": [6, 7], "frozen_backbone": True,
        "previous_head_learning_rate": last["optimizer_state_dict"]["param_groups"][0]["lr"],
        "head_learning_rate": float(head_learning_rate), "head_lr_patience": head_lr_patience,
        "previous_max_epochs": previous["training"]["max_epochs"], "max_epochs": max_epochs,
        "explicit_optimizer_scheduler_overrides": ["param_groups[0].lr", "_last_lr", "num_bad_epochs", "patience"],
    }
    converted = {}
    for name, old in payloads.items():
        if (old["model_config"] != previous["model"]
                or old["normalization"] != last["normalization"]):
            raise ValueError("Model configuration or normalization differs between existing best and last checkpoints.")
        old_model.load_state_dict(old["model_state_dict"], strict=True)
        new = copy.deepcopy(old)
        new.pop("manifest_sha256", None)
        state = copy.deepcopy(new_model.state_dict())
        state.update(new["model_state_dict"])
        new_model.load_state_dict(state, strict=True)
        new["model_state_dict"] = state
        new["model_config"] = copy.deepcopy(new_config["model"])
        new["model_revisions"] = [*old.get("model_revisions", []), copy.deepcopy(revision)]
        if name == "last.pt":
            group = new["optimizer_state_dict"]["param_groups"]
            if len(group) != 1 or len(group[0]["params"]) != len(old_names):
                raise ValueError("Model parameter order differs from the existing single AdamW group.")
            next_id = max(group[0]["params"], default=-1) + 1
            group[0]["params"].extend(range(next_id, next_id + len(new_names) - len(old_names)))
            group[0]["lr"] = float(head_learning_rate)
            scheduler = new["scheduler_state_dict"]
            scheduler.update(_last_lr=[float(head_learning_rate)], num_bad_epochs=0, patience=head_lr_patience)
            optimizer = torch.optim.AdamW(new_model.parameters())
            optimizer.load_state_dict(new["optimizer_state_dict"])
        converted[name] = new
    backup = Path(tempfile.mkdtemp(prefix="flowcast3d-pressure-refinement-"))
    original, staged = backup / "original", backup / "converted"
    original.mkdir()
    staged.mkdir()
    for name in required:
        shutil.copy2(run_dir / name, original / name)
    revision["backup_directory"] = str(backup)
    for name, new in converted.items():
        new["model_revisions"][-1]["backup_directory"] = str(backup)
        atomic_torch_save(staged / name, new)
    save_run_config(staged, new_config)
    new_metrics = copy.deepcopy(metrics)
    new_metrics["training"]["model_config"] = copy.deepcopy(new_config["model"])
    new_metrics["training"]["model_revisions"] = converted["last.pt"]["model_revisions"]
    atomic_json(staged / "metrics.json", new_metrics)
    try:
        for name in required:
            _atomic_write(run_dir / name, lambda stream, filename=name: stream.write((staged / filename).read_bytes()))
    except BaseException:
        for name in required:
            _atomic_write(run_dir / name, lambda stream, filename=name: stream.write((original / filename).read_bytes()))
        raise
    return new_config
