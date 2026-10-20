from __future__ import annotations

import argparse
import contextlib
import importlib.util
import json
import logging
import math
import os
import shutil
import signal
import sys
import time
from pathlib import Path

from modules.metrics import loss_configuration
from modules.utils import (
    existing_run, create_run, load_config, load_run_config, timestamp,
    update_metrics, validate_config, save_run_config, directory_lock, openfoam_environment,
    environment_info,
)


def _pressure_mse_weight(value: str) -> float:
    try:
        return loss_configuration(float(value))["pressure_mse_weight"]
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from error


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OpenFOAM 기반 3D 도시 풍장 학습")
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("pipeline", "generate", "train", "evaluate", "predict", "validate", "check"):
        command = commands.add_parser(name)
        command.add_argument("--config", type=Path,
                             help="사용자 설정 경로, 기존 실행에서는 결과 경로 조회에만 사용")
        command.add_argument("--dry-run", action="store_true")
        if name in ("pipeline", "generate", "train", "evaluate", "predict"):
            command.add_argument("--run-id")
        if name in ("pipeline", "generate", "train"):
            command.add_argument("--resume", action="store_true")
        if name in ("pipeline", "generate"):
            command.add_argument("--source", type=Path)
            command.add_argument("--wait-for-source", action=argparse.BooleanOptionalAction, default=None)
            command.add_argument("--confirm-geometry", action=argparse.BooleanOptionalAction, default=None)
            command.add_argument("--up-axis", choices=("y", "z"))
            command.add_argument("--unit-scale", type=float)
        if name in ("pipeline", "train"):
            command.add_argument("--epochs", type=int)
            command.add_argument("--pressure-mse-weight", type=_pressure_mse_weight)
            command.add_argument("--case-weighting", choices=("none", "wind_direction", "relative_pressure"))
            command.add_argument("--refine-pressure", action="store_true")
            command.add_argument("--head-learning-rate", type=float)
            command.add_argument("--head-lr-patience", type=int)
            command.add_argument("--device", choices=("auto", "cpu", "cuda"))
        if name in ("evaluate", "predict"):
            command.add_argument("--checkpoint", type=Path)
        if name == "evaluate":
            command.add_argument("--split", choices=("train", "val", "test"), default="test")
        if name == "predict":
            command.add_argument("--input", type=Path, required=True)
            command.add_argument("--output", type=Path)
    return parser


def _geometry_overrides(config: dict, args: argparse.Namespace) -> None:
    """명시한 CLI와 환경 변수 순서로 원본 형상 설정 적용"""
    if args.command not in ("pipeline", "generate"):
        return

    # CLI에 없는 형상 설정만 환경 변수에서 조회
    for argument, key, variable in (
        ("confirm_geometry", "geometry_confirmed", "FLOWCAST_GEOMETRY_CONFIRMED"),
        ("up_axis", "up_axis", "FLOWCAST_GEOMETRY_UP_AXIS"),
        ("unit_scale", "unit_scale", "FLOWCAST_GEOMETRY_UNIT_SCALE"),
    ):
        value = getattr(args, argument, None)
        if value is None:
            value = os.getenv(variable, "").strip()
            if not value:
                continue
            if key == "geometry_confirmed":
                if value.lower() not in {"true", "false", "1", "0"}:
                    raise ValueError(f"{variable} must be true/false or 1/0.")
                value = value.lower() in {"true", "1"}
            elif key == "unit_scale":
                try:
                    value = float(value)
                except ValueError as error:
                    raise ValueError(f"{variable} must be a finite positive number.") from error
        if key == "up_axis" and value not in {"y", "z"}:
            raise ValueError(f"{variable} must be y/z.")
        if key == "unit_scale" and (not math.isfinite(value) or value <= 0):
            raise ValueError(f"{variable} must be a finite positive number.")
        config["generation"][key] = value


def _overrides(config: dict, args: argparse.Namespace) -> dict:
    if getattr(args, "source", None):
        source = args.source.expanduser().resolve()
        if source.suffix.lower() in (".zip", ".obj"):
            config["generation"]["source_path"] = str(source)
            config["paths"]["source"] = str(source.parent)
        else:
            config["paths"]["source"] = str(source)
            config["generation"]["source_path"] = None
    _geometry_overrides(config, args)
    if getattr(args, "wait_for_source", None) is not None:
        config["generation"]["wait_for_source"] = args.wait_for_source
    if getattr(args, "epochs", None) is not None:
        config["training"]["max_epochs"] = args.epochs
    if getattr(args, "pressure_mse_weight", None) is not None:
        config["training"]["pressure_mse_weight"] = args.pressure_mse_weight
    if getattr(args, "case_weighting", None) is not None:
        config["training"]["case_weighting"] = args.case_weighting
    if getattr(args, "device", None) is not None:
        config["training"]["device"] = args.device
    validate_config(config)
    return config


def check_environment(config: dict) -> dict:
    libraries = {name: importlib.util.find_spec(name) is not None
                 for name in ("numpy", "yaml", "torch", "pyvista")}
    environment = {}
    error = None
    try:
        environment = openfoam_environment()
        version = environment.get("WM_PROJECT_VERSION")
        if version not in {"v2606", "2606"}:
            error = f"OpenFOAM v2606 is required. Current version: {version}."
    except RuntimeError as exception:
        error = str(exception)
    commands = {name: shutil.which(name, path=environment.get("PATH", "")) for name in
                ("blockMesh", "surfaceCheck", "snappyHexMesh", "checkMesh", "simpleFoam", "mpirun")}
    result = {"libraries": libraries, "commands": commands,
              "openfoam": {"version": environment.get("WM_PROJECT_VERSION"), "error": error},
              "source": config["paths"]["source"],
              "source_exists": Path(config["paths"]["source"]).exists()}
    if libraries["torch"]:
        import torch

        result["cuda_available"] = torch.cuda.is_available()
        if result["cuda_available"]:
            result["gpu"] = torch.cuda.get_device_name(0)
    result["ready"] = (error is None and all(libraries.values())
                       and all(commands.values()) and result["source_exists"])
    return result


def _validate_data(config: dict) -> dict:
    from modules.dataset import load_case, validate_manifest
    from modules.generate import _case_split

    # 풍조건 목록 대조
    directory = Path(config["paths"]["data"]) / "preprocessed"
    options = config["generation"]
    manifest = validate_manifest(directory / options.get("manifest_name", "manifest.json"))
    counts = {"train": 0, "val": 0, "test": 0}
    expected = {
        f"wind_{int(direction):03d}_speed_{int(speed):02d}.npz": _case_split(direction, speed, options)
        for direction in options["wind_directions_deg"] for speed in options["wind_speeds_m_s"]
    }
    if {entry["file"] for entry in manifest["cases"]} != set(expected):
        raise ValueError("Dataset wind conditions do not match the configuration.")

    # 격자 크기와 분할 검사
    for item in manifest["cases"]:
        case = load_case(directory / item["file"])
        if list(case["target"].shape[1:]) != manifest["grid_shape_zyx"]:
            raise ValueError(f"Grid shape differs from the manifest: {item['file']}.")
        counts[item["split"]] += 1
        if item["split"] != expected[item["file"]]:
            raise ValueError(f"Dataset split differs from the configuration: {item['file']}.")
    return {"valid": True, "counts": counts, "grid_shape_zyx": manifest["grid_shape_zyx"],
            "manifest": options.get("manifest_name", "manifest.json")}


def _record_environment(run_dir: Path, command: str, config: dict) -> None:
    """최초 수집 환경을 보존하고 재개마다 실행 환경을 별도 기록"""
    environment = environment_info()
    if command != "generate":
        update_metrics(run_dir, "environment", environment)
        return

    # 기존 실행 이력 확인
    metrics_path = run_dir / "metrics.json"
    metrics = json.loads(metrics_path.read_text()) if metrics_path.exists() else {}
    entries = metrics.get("generation_invocations", {}).get("entries", [])
    if not isinstance(entries, list):
        raise ValueError("Collection invocation history must be a list.")

    # 최초 환경과 재개 환경을 별도 보존
    if not metrics.get("environment"):
        update_metrics(run_dir, "environment", environment)
    entry = {"invoked_at": timestamp(), "command": command, "environment": environment,
             "solver_recovery_cases": sorted(config.get("solver_recoveries", {}))}
    update_metrics(run_dir, "generation_invocations", {"entries": [*entries, entry]})


def main(argv: list[str] | None = None) -> int:
    # 실행 인자 검사
    parser = build_parser()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = parser.parse_args(argv)
    if args.command == "generate" and args.run_id is None:
        args.run_id = os.getenv("FLOWCAST_COLLECTION_RUN_ID", "").strip() or None
    if getattr(args, "refine_pressure", False) and not getattr(args, "resume", False):
        parser.error("--refine-pressure requires --run-id and --resume.")
    if not getattr(args, "refine_pressure", False) and (
        getattr(args, "head_learning_rate", None) is not None or getattr(args, "head_lr_patience", None) is not None
    ):
        parser.error("Head settings require --refine-pressure.")
    run_dir = None
    locks = contextlib.ExitStack()
    started = time.monotonic()
    try:
        # 실행 설정 복원
        config = load_config(args.config)
        run_id = getattr(args, "run_id", None)
        reuse = (run_id is not None and existing_run(config, run_id, required=False).is_dir())
        if args.command in ("evaluate", "predict") or getattr(args, "resume", False) or reuse:
            if not args.run_id:
                parser.error("Existing runs require --run-id.")
            run_dir = existing_run(config, args.run_id)
            config = load_run_config(run_dir)
        config = _overrides(config, args)

        # 조회와 검사 명령 처리
        if args.dry_run:
            print(json.dumps({"command": args.command, "config": config,
                              "run": str(run_dir) if run_dir else "new"}, ensure_ascii=False, indent=2))
            return 0
        if args.command == "check":
            report = check_environment(config)
            print(json.dumps(report, ensure_ascii=False, indent=2))
            return 0 if report["ready"] else 1
        if args.command == "validate":
            print(json.dumps(_validate_data(config), ensure_ascii=False, indent=2))
            return 0

        # 실행 디렉터리 잠금
        if run_dir is None:
            run_dir = create_run(config, args.run_id)
        try:
            locks.enter_context(directory_lock(run_dir))
        except RuntimeError:
            run_dir = None
            raise

        # 압력 보완 학습 준비
        if getattr(args, "refine_pressure", False):
            from modules.trainer import refine_pressure

            with directory_lock(Path(config["paths"]["data"]) / "raw"):
                config = refine_pressure(
                    config, run_dir, max_epochs=args.epochs if args.epochs is not None else 4500,
                    head_learning_rate=args.head_learning_rate if args.head_learning_rate is not None else 0.001,
                    head_lr_patience=args.head_lr_patience if args.head_lr_patience is not None else 60,
                )
        if reuse or getattr(args, "resume", False):
            save_run_config(run_dir, config)
            update_metrics(run_dir, "run", {"last_invoked_at": timestamp()})
            if getattr(args, "resume", False):
                update_metrics(run_dir, "run", {"resumed_at": timestamp()})

        # 실행 환경 기록
        print(f"Run-ID: {run_dir.name}", flush=True)
        _record_environment(run_dir, args.command, config)
        update_metrics(run_dir, "execution", {"command": args.command, "status": "running",
                                              "error": None, "finished_at": None,
                                              "elapsed_seconds": 0})

        # 생성과 학습 및 검증
        if args.command in ("generate", "pipeline"):
            from modules.generate import generate

            generate(config, run_dir)
            _validate_data(config)
        success = True
        if args.command in ("train", "pipeline"):
            from modules.trainer import train

            _validate_data(config)
            resume_training = getattr(args, "resume", False)
            if args.command == "pipeline":
                resume_training = resume_training and (run_dir / "last.pt").is_file()
            training_report = train(config, run_dir, resume=resume_training)
            if args.command == "pipeline" or getattr(args, "refine_pressure", False):
                success = bool(training_report.get("validation_criteria_met", False))
                if not success:
                    update_metrics(run_dir, "evaluation", {
                        "test": {"status": "withheld",
                                 "reason": "validation_criteria_not_met"},
                    })

        # 평가와 개별 추론
        if args.command == "evaluate" or (args.command == "pipeline" and success):
            from modules.evaluate import evaluate

            report = evaluate(config, run_dir, checkpoint=getattr(args, "checkpoint", None),
                              split=getattr(args, "split", "test"))
            success = report.get("success_criteria_met", False)
        if args.command == "predict":
            from modules.inference import predict

            predict(config, run_dir, args.input, args.output, args.checkpoint)

        # 상태 저장과 실행 자원 정리
        update_metrics(run_dir, "execution", {"status": "complete" if success else "quality_failed",
                                              "finished_at": timestamp(),
                                              "elapsed_seconds": time.monotonic() - started})
        print(f"결과: {run_dir}", flush=True)
        return 0 if success else 2
    except (Exception, KeyboardInterrupt) as error:
        if run_dir is not None:
            update_metrics(run_dir, "execution", {
                "status": "interrupted" if isinstance(error, KeyboardInterrupt) else "failed",
                "error": str(error), "finished_at": timestamp(),
                "elapsed_seconds": time.monotonic() - started,
            })
        print(f"Execution failed: {error}", file=sys.stderr, flush=True)
        return 130 if isinstance(error, KeyboardInterrupt) else 1
    finally:
        locks.close()


if __name__ == "__main__":
    def interrupt(signum: int, frame: object) -> None:
        raise KeyboardInterrupt(f"Termination signal received: {signum}.")

    signal.signal(signal.SIGTERM, interrupt)
    raise SystemExit(main())
