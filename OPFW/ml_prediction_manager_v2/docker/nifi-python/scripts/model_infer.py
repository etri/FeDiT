#!/opt/pm-python/bin/python
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import onnxruntime
import pandas as pd


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--features", default="")
    parser.add_argument("--input-key", default="")
    parser.add_argument("--output-field", default="prediction")
    return parser.parse_args()


def _json_value(value: Any) -> Any:
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (list, tuple)):
        return [_json_value(item) for item in value]
    return value


def _payload_rows(payload: Any) -> tuple[list[dict[str, Any]], bool]:
    if isinstance(payload, dict):
        return [payload], False
    if isinstance(payload, list) and all(isinstance(item, dict) for item in payload):
        return payload, True
    raise ValueError("FlowFile JSON content must be an object or an array of objects")


def _source_row(row: dict[str, Any], input_key: str) -> dict[str, Any]:
    if not input_key:
        return row
    value = row.get(input_key)
    if not isinstance(value, dict):
        raise ValueError(f"Input key '{input_key}' must contain a JSON object")
    return value


def _feature_matrix(
    rows: list[dict[str, Any]], features: list[str], input_key: str
) -> tuple[np.ndarray, pd.DataFrame | None]:
    sources = [_source_row(row, input_key) for row in rows]
    if features:
        missing = [
            feature
            for source in sources
            for feature in features
            if feature not in source
        ]
        if missing:
            raise ValueError(f"Missing model feature: {missing[0]}")
        frame = pd.DataFrame(
            [[source[feature] for feature in features] for source in sources],
            columns=features,
        )
        return frame.to_numpy(), frame

    values = [source.get("features") for source in sources]
    if any(not isinstance(value, list) for value in values):
        raise ValueError(
            "Set --features or provide a 'features' array in each input object"
        )
    return np.asarray(values, dtype=np.float32), None


def _predict(
    model_path: Path, matrix: np.ndarray, frame: pd.DataFrame | None
) -> tuple[Any, Any | None, str]:
    suffix = model_path.suffix.lower()
    if suffix in {".joblib", ".pkl", ".pickle"}:
        model = joblib.load(model_path)
        model_input = frame if frame is not None else matrix
        predictions = model.predict(model_input)
        probabilities = (
            model.predict_proba(model_input) if hasattr(model, "predict_proba") else None
        )
        return predictions, probabilities, "scikit-learn"

    if suffix == ".onnx":
        session = onnxruntime.InferenceSession(
            str(model_path), providers=["CPUExecutionProvider"]
        )
        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: matrix.astype(np.float32)})
        predictions = outputs[0]
        probabilities = outputs[1] if len(outputs) > 1 else None
        return predictions, probabilities, "onnxruntime"

    raise ValueError("Supported model extensions: .joblib, .pkl, .pickle, .onnx")


def main() -> None:
    args = _parse_args()
    model_path = Path(args.model).resolve()
    model_root = Path(os.environ.get("PM_NIFI_MODEL_ROOT", "/opt/pm/models")).resolve()
    if model_root not in model_path.parents:
        raise ValueError(f"Model must be stored under {model_root}")
    if not model_path.is_file():
        raise FileNotFoundError(model_path)

    payload = json.load(sys.stdin)
    rows, is_list = _payload_rows(payload)
    features = [item.strip() for item in args.features.split(",") if item.strip()]
    matrix, frame = _feature_matrix(rows, features, args.input_key)
    predictions, probabilities, runtime = _predict(model_path, matrix, frame)

    normalized_predictions = _json_value(predictions)
    normalized_probabilities = _json_value(probabilities)
    for index, row in enumerate(rows):
        prediction = normalized_predictions[index]
        row[args.output_field] = prediction
        row["_inference"] = {
            "model": model_path.name,
            "runtime": runtime,
        }
        if normalized_probabilities is not None:
            row["_inference"]["probabilities"] = normalized_probabilities[index]

    json.dump(rows if is_list else rows[0], sys.stdout, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
