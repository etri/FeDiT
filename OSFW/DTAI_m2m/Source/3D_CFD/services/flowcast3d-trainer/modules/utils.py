from __future__ import annotations

import contextlib
import fcntl
from functools import lru_cache
import importlib.metadata
import json
import math
import os
import platform
import re
import subprocess
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml

SERVICE_DIR = Path(__file__).resolve().parents[1]
RUN_PATTERN = re.compile(r"^\d{8}_\d{6}_[0-9a-f]{6}$")
KST = timezone(timedelta(hours=9))


@lru_cache(maxsize=1)
def _read_openfoam_environment(script: str) -> dict[str, str]:
    if not Path(script).is_file():
        raise RuntimeError(f"OpenFOAM bashrc was not found: {script}.")
    try:
        result = subprocess.run(
            ["bash", "--noprofile", "--norc", "-c",
             'openfoam_bashrc=$1; shift; source "$openfoam_bashrc" >/dev/null && /usr/bin/env -0',
             "openfoam", script],
            env=os.environ.copy(), capture_output=True, check=True, timeout=30,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise RuntimeError(f"OpenFOAM environment could not be prepared: {script}.") from error
    environment = {}
    for entry in result.stdout.split(b"\0"):
        if not entry:
            continue
        key, separator, value = entry.partition(b"=")
        if not key or not separator:
            raise RuntimeError("OpenFOAM environment variable format is invalid.")
        environment[os.fsdecode(key)] = os.fsdecode(value)
    if not environment.get("PATH"):
        raise RuntimeError("OpenFOAM environment is missing PATH.")
    return environment


def openfoam_environment() -> dict[str, str]:
    """부모 환경을 바꾸지 않고 캐시한 OpenFOAM 환경의 복사본 반환"""
    script = os.getenv("FLOWCAST_OPENFOAM_BASHRC", "/usr/lib/openfoam/openfoam2606/etc/bashrc")
    environment = _read_openfoam_environment(str(Path(script).expanduser().resolve())).copy()
    if Path("/.dockerenv").is_file():
        environment.setdefault("OMPI_MCA_btl_vader_single_copy_mechanism", "none")
    return environment


def timestamp() -> str:
    """한국 시간 기준 ISO 실행 시각"""
    return datetime.now(KST).isoformat(timespec="seconds")


def _jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(item) for item in value]
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if hasattr(value, "tolist"):
        return _jsonable(value.tolist())
    return value


def _atomic_write(path: Path, writer: Any) -> None:
    """원자적 교체를 위해 대상과 같은 파일 시스템에 임시 파일 생성"""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            writer(stream)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def atomic_json(path: Path, value: dict) -> None:
    encoded = json.dumps(_jsonable(value), ensure_ascii=False, indent=2, allow_nan=False)
    _atomic_write(Path(path), lambda stream: stream.write((encoded + "\n").encode()))


def atomic_npz(path: Path, **arrays: Any) -> None:
    import numpy as np

    _atomic_write(Path(path), lambda stream: np.savez_compressed(stream, **arrays))


def atomic_torch_save(path: Path, value: Any) -> None:
    import torch

    _atomic_write(Path(path), lambda stream: torch.save(value, stream))


def _merge(base: dict, changes: dict) -> dict:
    result = dict(base)
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _merge(result[key], value)
        else:
            result[key] = value
    return result


def update_metrics(run_dir: Path, section: str, values: dict) -> dict:
    path = Path(run_dir) / "metrics.json"
    current = json.loads(path.read_text()) if path.exists() else {}
    current[section] = _merge(current.get(section, {}), _jsonable(values))
    if section == "execution" and "status" in values:
        current["status"] = values["status"]
    current["updated_at"] = timestamp()
    atomic_json(path, current)
    return current


def load_config(path: Path | None = None) -> dict:
    default_path = SERVICE_DIR / "configs/default.yaml"
    config = yaml.safe_load(default_path.read_text())
    if path is not None and Path(path).resolve() != default_path:
        override = yaml.safe_load(Path(path).read_text())
        if not isinstance(override, dict):
            raise ValueError("Configuration file must be a YAML object.")
        config = _merge(config, override)
    for key, value in config["paths"].items():
        environment = os.getenv(f"FLOWCAST_{key.upper()}")
        resolved = Path(environment or value).expanduser()
        config["paths"][key] = str((SERVICE_DIR / resolved).resolve())
    if config["generation"].get("source_path"):
        source_path = Path(config["generation"]["source_path"]).expanduser()
        config["generation"]["source_path"] = str((SERVICE_DIR / source_path).resolve())
    validate_config(config)
    return config


def validate_generation_conditions(generation: dict) -> None:
    for key in ("wind_directions_deg", "wind_speeds_m_s"):
        values = generation.get(key)
        if not isinstance(values, list) or not values:
            raise ValueError(f"{key} must be a nonempty list.")
        for value in values:
            if (isinstance(value, bool) or not isinstance(value, (int, float))
                    or not math.isfinite(value) or int(value) != value):
                raise ValueError(f"{key} conditions must be finite integers.")
            if key == "wind_directions_deg" and not 0 <= value < 360:
                raise ValueError("Wind direction must be at least 0 and less than 360.")
            if key == "wind_speeds_m_s" and value <= 0:
                raise ValueError("Wind speed must be positive.")
        if len(set(values)) != len(values):
            raise ValueError(f"{key} contains duplicate conditions.")
    for key in ("manifest_name", "seed_manifest_name"):
        name = generation.get(key)
        if name is not None and (not isinstance(name, str)
                                 or re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*\.json", name) is None):
            raise ValueError(f"{key} must be a JSON file name without a path.")
    if generation.get("seed_manifest_name") == generation.get("manifest_name", "manifest.json"):
        raise ValueError("Source and collection manifests must be different files.")
    groups = []
    for key in ("validation_wind_directions_deg", "test_wind_directions_deg"):
        values = generation.get(key, [])
        if (not isinstance(values, list) or any(isinstance(value, bool) for value in values)
                or any(value not in generation["wind_directions_deg"] for value in values)
                or len(set(values)) != len(values)):
            raise ValueError(f"{key} must be a duplicate-free subset of generated wind directions.")
        groups.append(set(values))
    if groups[0] & groups[1]:
        raise ValueError("Validation and test wind directions must not overlap.")


def validate_config(config: dict) -> None:
    pressure_mse_weight = config["training"].get("pressure_mse_weight", 0.0)
    if (isinstance(pressure_mse_weight, bool) or not isinstance(pressure_mse_weight, (int, float))
            or not math.isfinite(pressure_mse_weight) or pressure_mse_weight < 0):
        raise ValueError("pressure_mse_weight must be a finite nonnegative number.")
    case_weighting = config["training"].get("case_weighting", "none")
    if not isinstance(case_weighting, str) or case_weighting not in {"none", "wind_direction", "relative_pressure"}:
        raise ValueError("case_weighting must be none/wind_direction/relative_pressure.")
    generation = config["generation"]
    grid = generation["grid_shape_zyx"]
    if len(grid) != 3 or any(not isinstance(size, int) or size < 16 for size in grid):
        raise ValueError("Training grid must contain three integer dimensions of at least 16 cells each.")
    if math.prod((size + 15) // 16 for size in grid) > 512:
        raise ValueError("Training grid Transformer token count must not exceed 512.")
    validate_generation_conditions(generation)
    if config["physics"]["rho"] <= 0 or config["physics"]["mu"] <= 0:
        raise ValueError("Density and viscosity must be positive.")
    if config["physics"]["z0"] <= 0 or config["physics"]["zref"] <= config["physics"]["displacement"]:
        raise ValueError("Roughness or reference height is invalid.")
    if generation["mpi_ranks"] < 1 or generation["max_iterations"] < 1:
        raise ValueError("MPI process count and iteration count must be positive.")
    if generation.get("unit_scale", 1) <= 0 or generation.get("up_axis", "z") not in {"y", "z"}:
        raise ValueError("Source unit scale must be positive and the up axis must be y/z.")
    if config["physics"]["displacement"] != 0:
        raise ValueError("Initial neutral atmosphere experiments require displacement=0.")
    if config["training"]["max_epochs"] < 1 or config["training"]["batch_size"] < 1:
        raise ValueError("Training epoch count and batch size must be positive.")


def environment_info() -> dict:
    # 패키지 버전 수집
    versions = {}
    for package in ("torch", "numpy", "pyvista", "vtk", "PyYAML"):
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            versions[package] = None

    # 실행 환경 정보 구성
    result = {"python": platform.python_version(), "packages": versions}
    if os.getenv("WM_PROJECT_VERSION"):
        result["openfoam"] = os.environ["WM_PROJECT_VERSION"]
    return result


def create_run(config: dict, run_id: str | None = None) -> Path:
    run_id = run_id or datetime.now(KST).strftime("%Y%m%d_%H%M%S_") + uuid.uuid4().hex[:6]
    run_dir = existing_run(config, run_id, required=False)
    run_dir.mkdir(parents=True, exist_ok=False)
    snapshot = _jsonable(config)
    snapshot["run"] = {"id": run_id, "started_at": timestamp(), "timezone": "Asia/Seoul"}
    serialized = yaml.safe_dump(snapshot, allow_unicode=True, sort_keys=False).encode()
    _atomic_write(run_dir / "config.yaml", lambda stream: stream.write(serialized))
    atomic_json(run_dir / "metrics.json", {"run": snapshot["run"], "status": "created",
                                          "environment": environment_info()})
    return run_dir


def existing_run(config: dict, run_id: str, required: bool = True) -> Path:
    if not RUN_PATTERN.fullmatch(run_id):
        raise ValueError("Run-ID must use the YYYYMMDD_HHMMSS_hex6 format.")
    root = Path(config["paths"]["results"]).resolve()
    result = root / run_id
    if result.resolve().parent != root:
        raise ValueError("Result path is outside the results directory.")
    if required and not (result / "config.yaml").is_file():
        raise FileNotFoundError(f"Run configuration is missing: {result}.")
    return result


def load_run_config(run_dir: Path) -> dict:
    config = yaml.safe_load((Path(run_dir) / "config.yaml").read_text())
    validate_config(config)
    return config


def save_run_config(run_dir: Path, config: dict) -> None:
    serialized = yaml.safe_dump(_jsonable(config), allow_unicode=True, sort_keys=False).encode()
    _atomic_write(Path(run_dir) / "config.yaml", lambda stream: stream.write(serialized))


@contextlib.contextmanager
def directory_lock(path: Path):
    """잠금 파일 없이 디렉터리의 중복 쓰기 차단"""
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise RuntimeError(f"Another run is using this path: {path}.") from error
        yield
    finally:
        os.close(descriptor)
