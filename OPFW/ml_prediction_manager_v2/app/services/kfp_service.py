import os
from pathlib import Path

import yaml


KFP_PIPELINE_SPEC_PATH = os.environ.get("KFP_PIPELINE_SPEC_PATH", "")


def _pipeline_spec_file() -> Path:
    candidates: list[Path] = []
    if KFP_PIPELINE_SPEC_PATH:
        candidates.append(Path(KFP_PIPELINE_SPEC_PATH))
    candidates.extend([
        Path("/app/examples/weekly_retrain_pipeline.yaml"),
        Path(__file__).resolve().parents[2] / "examples" / "weekly_retrain_pipeline.yaml",
        Path.cwd() / "examples" / "weekly_retrain_pipeline.yaml",
    ])
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise ValueError("weekly_retrain_pipeline.yaml not found in Prediction Manager image")


def weekly_retrain_pipeline_spec() -> dict:
    path = _pipeline_spec_file()
    with path.open("r", encoding="utf-8") as f:
        spec = yaml.safe_load(f)
    if not isinstance(spec, dict) or not spec.get("root"):
        raise ValueError(f"invalid pipeline spec: {path}")
    return spec

def weekly_retrain_pipeline_yaml() -> str:
    path = _pipeline_spec_file()
    return path.read_text(encoding="utf-8")
