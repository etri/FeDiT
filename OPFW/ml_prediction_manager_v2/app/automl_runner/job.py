"""Ray Job entrypoint for AutoML runs.

Executed inside the Ray cluster. Reads configuration from CLI args (JSON),
loads the dataset, runs HPO per selected model using Ray Tune + Optuna, and
logs everything to MLflow.
"""
import argparse
import json
import os
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import mlflow
import numpy as np
import pandas as pd
import joblib
from ray import tune
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split


SEARCH_SPACE = {
    "rf": lambda task: {
        "n_estimators": tune.choice([20, 50, 100]),
        "max_depth": tune.choice([None, 5, 10, 20, 40]),
        "min_samples_split": tune.choice([2, 5, 10]),
    },
    "xgb": lambda task: {
        "n_estimators": tune.choice([50, 100, 200]),
        "max_depth": tune.choice([3, 6, 10]),
        "learning_rate": tune.loguniform(1e-3, 3e-1),
        "subsample": tune.uniform(0.6, 1.0),
    },
    "lgbm": lambda task: {
        "n_estimators": tune.choice([50, 100, 200]),
        "num_leaves": tune.choice([15, 31, 63, 127]),
        "learning_rate": tune.loguniform(1e-3, 3e-1),
        "min_child_samples": tune.choice([5, 10, 20]),
    },
    "mlp": lambda task: {
        "hidden_layer_sizes": tune.choice([(64,), (128,), (64, 32), (128, 64), (256, 128, 64)]),
        "alpha": tune.loguniform(1e-5, 1e-2),
        "learning_rate_init": tune.loguniform(1e-4, 1e-2),
    },
    "tabnet": lambda task: {
        "n_d": tune.choice([8, 16, 32]),
        "n_a": tune.choice([8, 16, 32]),
        "n_steps": tune.choice([3, 5, 7]),
        "gamma": tune.uniform(1.0, 2.0),
        "lr": tune.loguniform(1e-3, 5e-2),
    },
}


GPU_CAPABLE_MODELS = {"xgb", "tabnet"}


# metric name → sklearn function, mode, task applicability
METRICS = {
    "mse": (lambda y, p, **kw: mean_squared_error(y, p), "min", {"regression"}),
    "rmse": (lambda y, p, **kw: float(np.sqrt(mean_squared_error(y, p))), "min", {"regression"}),
    "mae": (lambda y, p, **kw: mean_absolute_error(y, p), "min", {"regression"}),
    "r2": (lambda y, p, **kw: r2_score(y, p), "max", {"regression"}),
    "accuracy": (lambda y, p, **kw: accuracy_score(y, p), "max", {"classification"}),
    "f1": (lambda y, p, **kw: f1_score(y, p, average="weighted"), "max", {"classification"}),
    "precision": (lambda y, p, **kw: precision_score(y, p, average="weighted", zero_division=0), "max", {"classification"}),
    "recall": (lambda y, p, **kw: recall_score(y, p, average="weighted", zero_division=0), "max", {"classification"}),
    "roc_auc": (
        lambda y, p, proba=None, **kw: roc_auc_score(y, proba if proba is not None else p, multi_class="ovr"),
        "max",
        {"classification"},
    ),
}


_DATASET_HARD_BYTES = int(os.environ.get("DATASET_HARD_BYTES", 10 * 1024**3))  # 10 GB


def _require_http_url(url: str, label: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{label} must be an http(s) URL")
    return url


def _load_dataset(path: str) -> pd.DataFrame:
    def read(local_path):
        if Path(local_path).suffix.lower() == ".parquet":
            return pd.read_parquet(local_path)
        return pd.read_csv(local_path)

    if not path.startswith(("http://", "https://")):
        return read(path)

    path = _require_http_url(path, "dataset_url")
    # Parse only the URL path: signed URLs may append a query to .parquet.
    suffix = Path(urlparse(path).path).suffix.lower() or ".csv"
    try:
        head_req = urllib.request.Request(path, method="HEAD")
        with urllib.request.urlopen(head_req, timeout=10) as response:  # nosec
            length = response.headers.get("Content-Length")
            if length and int(length) > _DATASET_HARD_BYTES:
                raise ValueError("Dataset exceeds the configured download size limit")
    except ValueError:
        raise
    except Exception:  # nosec
        pass  # Servers without HEAD support are checked while streaming.

    # Close before reopening (Windows), and clean up on read/download failure.
    with tempfile.TemporaryDirectory(prefix="pman-dataset-") as directory:
        local_path = Path(directory) / ("dataset" + suffix)
        with urllib.request.urlopen(path, timeout=60) as response, local_path.open("wb") as output:  # nosec
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > _DATASET_HARD_BYTES:
                    raise ValueError("Dataset exceeds the configured download size limit")
                output.write(chunk)
        return read(local_path)


def _prepare_features_target(df: pd.DataFrame, target: str, task: str, test_size: float) -> tuple[pd.DataFrame, pd.Series]:
    if target not in df.columns:
        raise ValueError(f"타깃 컬럼을 찾을 수 없습니다: {target}")
    if df.empty:
        raise ValueError("데이터셋에 학습할 행이 없습니다.")

    work = df.dropna(subset=[target]).copy()
    min_rows = max(3, int(np.ceil(1 / max(float(test_size or 0.2), 0.01))))
    if len(work) < min_rows:
        raise ValueError(f"학습 행이 부족합니다. 현재 {len(work)}행, 최소 {min_rows}행 이상이 필요합니다.")

    y = work[target]
    X = work.drop(columns=[target])
    X = X.dropna(axis=1, how="all")
    if X.empty:
        raise ValueError("학습 feature 컬럼이 없습니다. 타깃 이외의 숫자형 또는 범주형 컬럼을 포함해 주세요.")

    for col in list(X.columns):
        if pd.api.types.is_datetime64_any_dtype(X[col]):
            X[col] = X[col].astype("int64")
    X = pd.get_dummies(X, dummy_na=True)
    X = X.apply(pd.to_numeric, errors="coerce")
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    X = X.loc[:, X.nunique(dropna=False) > 1]
    if X.empty:
        raise ValueError("학습 가능한 feature가 없습니다. 모든 feature 값이 비어 있거나 동일합니다.")

    if task == "classification":
        if y.nunique(dropna=True) < 2:
            raise ValueError("분류 학습에는 최소 2개 이상의 target 클래스가 필요합니다.")
        y = y.astype("category").cat.codes
    else:
        y_num = pd.to_numeric(y, errors="coerce")
        valid = y_num.notna()
        X = X.loc[valid]
        y = y_num.loc[valid]
        if len(y) < min_rows:
            raise ValueError(f"숫자형 target으로 사용할 수 있는 행이 부족합니다. 현재 {len(y)}행, 최소 {min_rows}행 이상이 필요합니다.")

    return X, y


def _validate_training_dataset(cfg: dict) -> None:
    df = _load_dataset(cfg["dataset_path"])
    X, y = _prepare_features_target(
        df,
        cfg["target_column"],
        cfg["task"],
        float(cfg.get("test_size", 0.2)),
    )
    print(
        "[AutoML] DATASET_VALIDATION=" + json.dumps({
            "rows": int(len(y)),
            "features": int(len(X.columns)),
            "target": cfg["target_column"],
            "task": cfg["task"],
        }, ensure_ascii=False),
        flush=True,
    )

def _build_model(model_id: str, task: str, params: dict, *, use_gpu: bool = False,
                 cpu_per_trial: float = 1, gpu_memory_fraction: float = 0.8):
    threads = max(1, int(cpu_per_trial))
    if model_id == "rf":
        from sklearn.ensemble import (
            RandomForestClassifier,
            RandomForestRegressor,
        )
        cls = RandomForestClassifier if task == "classification" else RandomForestRegressor
        return cls(random_state=42, n_jobs=threads, **params)
    if model_id == "xgb":
        from xgboost import XGBClassifier, XGBRegressor
        if use_gpu:
            import xgboost
            if not xgboost.build_info().get("USE_CUDA", False):
                raise RuntimeError("GPU XGBoost requires the CUDA-enabled xgboost package, not xgboost-cpu")
        cls = XGBClassifier if task == "classification" else XGBRegressor
        return cls(random_state=42, tree_method="hist", device="cuda" if use_gpu else "cpu", n_jobs=threads, **params)
    if model_id == "lgbm":
        from lightgbm import LGBMClassifier, LGBMRegressor
        cls = LGBMClassifier if task == "classification" else LGBMRegressor
        return cls(random_state=42, n_jobs=threads, verbose=-1, **params)
    if model_id == "mlp":
        from sklearn.neural_network import MLPClassifier, MLPRegressor
        cls = MLPClassifier if task == "classification" else MLPRegressor
        return cls(random_state=42, max_iter=300, early_stopping=True, **params)
    if model_id == "tabnet":
        # pytorch-tabnet wrapper
        import torch
        torch.set_num_threads(threads)
        if use_gpu:
            if not torch.cuda.is_available():
                raise RuntimeError("GPU requested but PyTorch CUDA is unavailable on this Ray worker")
            torch.cuda.set_per_process_memory_fraction(gpu_memory_fraction, device=0)
        from pytorch_tabnet.tab_model import TabNetClassifier, TabNetRegressor
        tabnet_params = {k: v for k, v in params.items() if k != "lr"}
        optimizer_params = {"lr": params.get("lr", 2e-2)}
        cls = TabNetClassifier if task == "classification" else TabNetRegressor
        return cls(optimizer_params=optimizer_params, verbose=0,
                   device_name="cuda" if use_gpu else "cpu", **tabnet_params)
    raise ValueError(f"Unknown model: {model_id}")


def _fit_predict(model_id: str, model, X_train, y_train, X_test, task: str,
                 *, batch_size: int = 256, max_epochs: int = 30):
    if model_id == "tabnet":
        import numpy as np
        X_tr = np.array(X_train, dtype=np.float32)
        y_tr = np.array(y_train)
        if task == "regression":
            y_tr = y_tr.astype(np.float32).reshape(-1, 1)
        else:
            y_tr = y_tr.astype(np.int64)
        X_te = np.array(X_test, dtype=np.float32)
        if len(X_tr) < 2:
            raise ValueError("TabNet requires at least two training rows")
        effective_batch = min(batch_size, len(X_tr))
        model.fit(X_tr, y_tr, max_epochs=max_epochs, patience=10,
                  batch_size=effective_batch,
                  virtual_batch_size=min(32, effective_batch), num_workers=0,
                  drop_last=True)
        preds = model.predict(X_te)
        proba = None
        if task == "classification" and hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_te)
            if proba.shape[1] == 2:
                proba = proba[:, 1]
        return preds.ravel(), proba
    model.fit(X_train, y_train)
    if model_id == "xgb" and model.get_params().get("device") == "cuda":
        actual_device = json.loads(model.get_booster().save_config())["learner"]["generic_param"]["device"]
        if not actual_device.startswith("cuda"):
            raise RuntimeError("XGBoost fell back to CPU although GPU training was requested")
    preds = model.predict(X_test)
    proba = None
    if task == "classification" and hasattr(model, "predict_proba"):
        try:
            proba = model.predict_proba(X_test)
            if proba.shape[1] == 2:
                proba = proba[:, 1]
        except Exception:
            proba = None
    return preds, proba


def _score_all(y_true, y_pred, task: str, proba=None) -> dict:
    out = {}
    for name, (fn, _, tasks) in METRICS.items():
        if task not in tasks:
            continue
        try:
            out[name] = float(fn(y_true, y_pred, proba=proba))
        except Exception:  # nosec
            pass
    return out


def _as_serving_model(model_id: str, model):
    """Export inference artifacts without requiring a GPU or worker-local code.

    TabNet indexes rows of arrays, whereas MLflow pyfunc supplies DataFrames.
    Use standard sklearn components so unpickling needs no job.py module.
    Called only after training and evaluation have finished.
    """
    if model_id == "xgb":
        model.set_params(device="cpu")
    if model_id != "tabnet":
        return model
    import torch
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import FunctionTransformer

    model.network.cpu()
    model.device = torch.device("cpu")
    model.device_name = "cpu"
    # TabNet 4.1 keeps attention/group matrices as ordinary attributes, not
    # registered buffers; Module.cpu() alone leaves those tensors on CUDA.
    moved = {}
    for owner in [model, *model.network.modules()]:
        for name, value in list(vars(owner).items()):
            if isinstance(value, torch.Tensor):
                if id(value) not in moved:
                    moved[id(value)] = value.cpu()
                setattr(owner, name, moved[id(value)])
    optimizer = getattr(model, "_optimizer", None)
    if optimizer is not None:
        for state in optimizer.state.values():
            for key, value in state.items():
                if isinstance(value, torch.Tensor):
                    state[key] = value.cpu()
    return Pipeline([
        ("array", FunctionTransformer(np.asarray, kw_args={"dtype": np.float32})),
        ("model", model),
    ])


def _resolve_metric(task: str, requested: str) -> tuple[str, str]:
    if requested and requested != "auto":
        if requested not in METRICS:
            raise ValueError(f"unknown metric: {requested}")
        _, mode, tasks = METRICS[requested]
        if task not in tasks:
            raise ValueError(f"metric '{requested}' not applicable for task '{task}'")
        return requested, mode
    # auto
    return ("mse", "min") if task == "regression" else ("accuracy", "max")



def _mlflow_pip_requirements(model_id: str | None = None) -> list[str]:
    """Avoid slow run-time dependency inference while logging AutoML models."""
    import cloudpickle
    import sklearn
    requirements = [
        f"scikit-learn=={sklearn.__version__}",
        f"cloudpickle=={cloudpickle.__version__}",
        "joblib",
    ]
    if model_id == "xgb":
        import xgboost
        requirements.append(f"xgboost=={xgboost.__version__}")
    elif model_id == "lgbm":
        import lightgbm
        requirements.append(f"lightgbm=={lightgbm.__version__}")
    elif model_id == "tabnet":
        import torch
        # Artifacts contain CPU tensors. Allow a serving runtime to provide
        # the CPU wheel of this same release instead of forcing CUDA wheels.
        requirements += [f"torch=={torch.__version__.split('+')[0]}", "pytorch-tabnet==4.1.0"]
    return requirements


def _find_candidate_model_reference(
    tracking_uri: str,
    experiment_name: str,
    job_id: str,
    model_id: str,
    trial_id: str,
) -> tuple[str, str] | None:
    """Find the MLflow 3 LoggedModel written by a Ray worker.

    Ray Tune keeps only numeric values in a trial result.  A worker therefore
    cannot return an MLflow ``models:/`` URI through ``tune.report``.  The
    worker records a stable trial tag instead and the driver resolves that tag
    after ranking the trials.
    """
    if not trial_id:
        return None
    try:
        client = mlflow.tracking.MlflowClient(tracking_uri=tracking_uri)
        experiment = client.get_experiment_by_name(experiment_name)
        if not experiment:
            return None
        filters = " and ".join([
            f"tags.`automl.job_id` = '{job_id}'",
            f"tags.`automl.model` = '{model_id}'",
            f"tags.`automl.ray_trial_id` = '{trial_id}'",
        ])
        runs = client.search_runs(
            [experiment.experiment_id],
            filter_string=filters,
            order_by=["attributes.start_time DESC"],
            max_results=10,
        )
        for run in runs:
            artifact_uri = (run.data.tags or {}).get("automl.model_uri")
            if artifact_uri and artifact_uri.startswith(("models:/", "runs:/")):
                return run.info.run_id, artifact_uri
    except Exception as error:
        print(f"[AutoML] candidate model reference lookup failed: {error}", flush=True)
    return None

def _train_fn_builder(
    model_id: str,
    task: str,
    data_path: str,
    target: str,
    test_size: float,
    random_state: int,
    mlflow_uri: str | None = None,
    experiment_name: str | None = None,
    base_tags: dict | None = None,
    use_gpu: bool = False,
    cpu_per_trial: float = 1,
    batch_size: int = 256,
    max_epochs: int = 30,
    gpu_memory_fraction: float = 0.8,
):
    def train_fn(config):
        df = _load_dataset(data_path)
        X, y = _prepare_features_target(df, target, task, test_size)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        model = _build_model(model_id, task, config, use_gpu=use_gpu,
                             cpu_per_trial=cpu_per_trial, gpu_memory_fraction=gpu_memory_fraction)
        preds, proba = _fit_predict(model_id, model, X_train, y_train, X_test, task,
                                   batch_size=batch_size, max_epochs=max_epochs)
        metrics = _score_all(y_test, preds, task, proba=proba)
        metrics["model_id"] = model_id
        # Worker-local files are not visible to the Ray driver. Persist the
        # serving artifact before reporting a terminal Tune result: after
        # ``tune.report`` Ray may tear the worker down, which otherwise leaves
        # a successful-looking trial without an MLflow model artifact.
        try:
            artifact_logged = False
            serving_model = _as_serving_model(model_id, model)
            tmp_dir = tempfile.mkdtemp(prefix=f"automl_{model_id}_")
            model_file = os.path.join(tmp_dir, "model.joblib")
            features_file = os.path.join(tmp_dir, "features.json")
            joblib.dump(serving_model, model_file)
            with open(features_file, "w") as f:
                json.dump({"columns": list(X.columns), "target": target}, f)
            metrics["_model_dir"] = tmp_dir
            if mlflow_uri and experiment_name:
                try:
                    import pandas as _pd
                    import mlflow as _mlflow
                    import mlflow.sklearn as _mls

                    _mlflow.set_tracking_uri(mlflow_uri)
                    _mlflow.set_experiment(experiment_name)
                    input_example = _pd.DataFrame([{c: 0.0 for c in X.columns}])
                    ray_trial_id = tune.get_context().get_trial_id()
                    with _mlflow.start_run(run_name=f"candidate-{model_id}") as mrun:
                        tags = dict(base_tags or {})
                        tags.update({
                            "automl.model": model_id,
                            "automl.ray_trial_id": ray_trial_id,
                            "automl.task": task,
                            "framework": _MODEL_FRAMEWORK_MAP.get(model_id, "unknown"),
                            "framework.version": _get_framework_version(model_id),
                            "automl.device": "cuda" if use_gpu else "cpu",
                        })
                        _mlflow.set_tags(tags)
                        _mlflow.log_params(config)
                        for k, v in metrics.items():
                            if k.startswith("_") or not isinstance(v, (int, float)):
                                continue
                            try:
                                _mlflow.log_metric(k, float(v))
                            except Exception:  # nosec
                                pass
                        model_info = _mls.log_model(
                            serving_model,
                            artifact_path="model",
                            input_example=input_example,
                            pip_requirements=_mlflow_pip_requirements(model_id),
                        )
                        _mlflow.log_artifact(model_file, artifact_path="model")
                        _mlflow.log_artifact(features_file, artifact_path="model")
                        model_artifact_uri = (
                            getattr(model_info, "model_uri", None)
                            or f"runs:/{mrun.info.run_id}/model"
                        )
                        # Persist the non-numeric model reference in MLflow.
                        # Ray Tune result metrics intentionally discard string
                        # metadata, so the driver resolves this tag by trial ID.
                        _mlflow.set_tag("automl.model_uri", model_artifact_uri)
                        artifact_logged = True
                        print(
                            f"[AutoML] worker log_model OK for {model_id}: "
                            f"{model_artifact_uri}",
                            flush=True,
                        )
                except Exception as e:
                    print(f"[AutoML] worker log_model failed: {e}", flush=True)
                    raise RuntimeError(
                        f"AutoML candidate MLflow artifact logging failed: {e}"
                    ) from e
            if not artifact_logged:
                raise RuntimeError(
                    "AutoML candidate MLflow artifact logging requires a tracking URI and experiment"
                )
        except Exception as e:
            print(f"[AutoML] model save warning: {e}", flush=True)
            raise RuntimeError(f"AutoML candidate artifact logging failed: {e}") from e

        # The driver resolves this candidate by its MLflow tags and returns
        # its run ID to the UI's one-click serving action. Do not rank it
        # before the artifact write has completed.
        tune.report(metrics)
        return

    return train_fn


class ProgressCallback(tune.Callback):
    """각 trial 종료 시 stdout에 `[AutoML] PROGRESS={...}` JSON 출력."""

    def __init__(self, primary: str, mode: str, total_trials: int, model_id: str, model_idx: int, model_total: int):
        self.primary = primary
        self.mode = mode
        self.total = total_trials
        self.done = 0
        self.best = None
        self.model_id = model_id
        self.model_idx = model_idx
        self.model_total = model_total

    def _is_better(self, score: float) -> bool:
        if self.best is None:
            return True
        return (self.mode == "min" and score < self.best) or (self.mode == "max" and score > self.best)

    def on_trial_complete(self, iteration, trials, trial, **info):
        self.done += 1
        score = None
        try:
            lr = trial.last_result or {}
            v = lr.get(self.primary)
            if v is not None:
                score = float(v)
        except Exception:  # nosec
            pass
        if score is not None and self._is_better(score):
            self.best = score
        payload = {
            "model_id": self.model_id,
            "model_idx": self.model_idx,
            "model_total": self.model_total,
            "trial_done": self.done,
            "trial_total": self.total,
            "metric": self.primary,
            "mode": self.mode,
            "last_score": score,
            "best_score": self.best,
        }
        print(f"[AutoML] PROGRESS={json.dumps(payload)}", flush=True)


_FRAMEWORK_VERSIONS: dict[str, str] = {}


def _get_framework_version(model_id: str) -> str:
    """모델 id별 프레임워크 버전을 반환 (캐시)."""
    if model_id in _FRAMEWORK_VERSIONS:
        return _FRAMEWORK_VERSIONS[model_id]
    v = ""
    try:
        if model_id == "rf":
            import sklearn
            v = sklearn.__version__
        elif model_id == "xgb":
            import xgboost
            v = xgboost.__version__
        elif model_id == "lgbm":
            import lightgbm
            v = lightgbm.__version__
        elif model_id == "mlp":
            import sklearn
            v = sklearn.__version__
        elif model_id == "tabnet":
            import pytorch_tabnet
            v = getattr(pytorch_tabnet, "__version__", "unknown")
    except Exception:  # nosec
        pass
    _FRAMEWORK_VERSIONS[model_id] = v
    return v


_MODEL_FRAMEWORK_MAP = {
    "rf": "scikit-learn",
    "xgb": "xgboost",
    "lgbm": "lightgbm",
    "mlp": "scikit-learn",
    "tabnet": "pytorch-tabnet",
}


def _compute_dataset_id(dataset_path: str) -> tuple[str, int]:
    """데이터셋 파일 해시 + row 수. 실패 시 ('', 0)."""
    import hashlib
    try:
        df = _load_dataset(dataset_path)
        sample = df.head(100).to_csv(index=False).encode()
        meta = f"{len(df)}:{','.join(str(c) for c in df.columns)}".encode()
        digest = hashlib.sha256(sample + meta).hexdigest()[:16]
        return digest, len(df)
    except Exception:
        return "", 0


def run(cfg: dict) -> dict:
    # Search/storage integrations are needed by the driver, not by every
    # training worker or the standalone GPU probe.
    from ray.tune.search.optuna import OptunaSearch
    from ray.air.integrations.mlflow import MLflowLoggerCallback
    mlflow_uri = _require_http_url(cfg.get("mlflow_uri", "http://mlflow-service.ray-system:5000"), "mlflow_uri")
    mlflow.set_tracking_uri(mlflow_uri)

    # 같은 이름의 deleted experiment 있으면 restore
    try:
        import urllib.request
        import urllib.parse
        url = f"{mlflow_uri}/api/2.0/mlflow/experiments/get-by-name?experiment_name={urllib.parse.quote(cfg['experiment_name'])}"
        with urllib.request.urlopen(url, timeout=10) as r:  # nosec
            resp = json.loads(r.read().decode())
        exp = resp.get("experiment", {})
        if exp.get("lifecycle_stage") == "deleted":
            req = urllib.request.Request(
                f"{mlflow_uri}/api/2.0/mlflow/experiments/restore",
                data=json.dumps({"experiment_id": exp["experiment_id"]}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=10).read()  # nosec
            print(f"[AutoML] restored deleted experiment: {cfg['experiment_name']}", flush=True)
    except Exception:  # nosec
        # experiment 없으면 404 → 무시, set_experiment에서 생성됨
        pass

    mlflow.set_experiment(cfg["experiment_name"])

    # 데이터셋 메타데이터와 학습 가능 여부를 한 번 먼저 확인
    dataset_id, dataset_rows = _compute_dataset_id(cfg["dataset_path"])
    print(f"[AutoML] dataset_id={dataset_id} rows={dataset_rows}", flush=True)
    _validate_training_dataset(cfg)

    primary, mode = _resolve_metric(cfg["task"], cfg.get("metric", "auto"))
    timeout_minutes = cfg.get("timeout_minutes", 60)
    # 모델 수로 나눠서 각 모델에 시간 예산 할당 (단순화)
    per_model_budget = max(30, int((timeout_minutes * 60) / max(1, len(cfg["models"]))))

    # 시작 이벤트
    print(f"[AutoML] PROGRESS={json.dumps({'event': 'start', 'models': cfg['models'], 'num_trials': cfg['num_trials'], 'metric': primary, 'mode': mode})}", flush=True)

    cpu_per_trial = float(cfg.get("cpu_per_trial", 1.0))
    gpu_per_trial = float(cfg.get("gpu_per_trial", 0.0))
    mem_per_trial_bytes = int(float(cfg.get("memory_per_trial_gb", 2.0)) * 1024 * 1024 * 1024)

    all_results = []
    for idx, model_id in enumerate(cfg["models"]):
        model_gpu_per_trial = gpu_per_trial if model_id in GPU_CAPABLE_MODELS else 0.0
        if gpu_per_trial > 0 and model_gpu_per_trial == 0.0:
            print(
                f"[AutoML] GPU request ignored for {model_id}: current training path is CPU-only",
                flush=True,
            )
        print(f"[AutoML] Starting HPO for {model_id} (metric={primary}, mode={mode}, budget={per_model_budget}s, cpu={cpu_per_trial}, gpu={model_gpu_per_trial})", flush=True)
        print(f"[AutoML] PROGRESS={json.dumps({'event': 'model_start', 'model_id': model_id, 'model_idx': idx + 1, 'model_total': len(cfg['models'])})}", flush=True)
        search_space = SEARCH_SPACE[model_id](cfg["task"])
        base_tags = {
            "automl.metric": primary,
            "automl.job_id": cfg.get("job_id", ""),
            "dataset.id": dataset_id,
            "dataset.rows": str(dataset_rows),
            "dataset.path": cfg["dataset_path"],
            "dataset.target": cfg["target_column"],
            "created_by": cfg.get("submitted_by", ""),
        }
        train_fn = _train_fn_builder(
            model_id,
            cfg["task"],
            cfg["dataset_path"],
            cfg["target_column"],
            cfg.get("test_size", 0.2),
            cfg.get("random_state", 42),
            mlflow_uri=mlflow_uri,
            experiment_name=cfg["experiment_name"],
            base_tags=base_tags,
            use_gpu=model_gpu_per_trial > 0,
            cpu_per_trial=cpu_per_trial,
            batch_size=int(cfg.get("batch_size", 256)),
            max_epochs=int(cfg.get("max_epochs", 30)),
            gpu_memory_fraction=float(cfg.get("gpu_memory_fraction", 0.8)),
        )
        # 모델별 기본 GPU 사용 - tabnet은 GPU 있으면 자동 사용
        resources = {"cpu": cpu_per_trial, "memory": mem_per_trial_bytes}
        if model_gpu_per_trial > 0:
            resources["gpu"] = model_gpu_per_trial
        trainable = tune.with_resources(train_fn, resources)
        tuner = tune.Tuner(
            trainable,
            param_space=search_space,
            tune_config=tune.TuneConfig(
                search_alg=OptunaSearch(metric=primary, mode=mode),
                num_samples=cfg["num_trials"],
                max_concurrent_trials=int(cfg.get("max_concurrent_trials", 1)),
                # Parameter-expanded names exceed Windows path limits even
                # for a single trial under the user's normal temp directory.
                trial_dirname_creator=lambda trial: trial.trial_id,
                metric=primary,
                mode=mode,
                time_budget_s=per_model_budget,
            ),
            run_config=tune.RunConfig(
                name=f"{cfg['experiment_name']}-{model_id}",
                storage_path=cfg.get("storage_path") or str(Path.home() / ".cache" / "prediction-manager" / "ray_automl"),
                callbacks=[
                    MLflowLoggerCallback(
                        tracking_uri=mlflow_uri,
                        experiment_name=cfg["experiment_name"],
                        save_artifact=False,
                        tags={
                            "automl.model": model_id,
                            "automl.task": cfg["task"],
                            "framework": _MODEL_FRAMEWORK_MAP.get(model_id, "unknown"),
                            "framework.version": _get_framework_version(model_id),
                            **base_tags,
                        },
                    ),
                    ProgressCallback(primary, mode, cfg["num_trials"], model_id, idx + 1, len(cfg["models"])),
                ],
            ),
        )
        results = tuner.fit()
        try:
            best = results.get_best_result(metric=primary, mode=mode)
            # trial 전체 히스토리 수집 (DataFrame)
            top_n = int(cfg.get("top_n", 3))
            trials_info = []
            for trial_index, r in enumerate(results, 1):
                if r.metrics is None:
                    continue
                trials_info.append({
                    "trial_index": trial_index,
                    "trial_id": r.metrics.get("trial_id") or r.path or "",
                    "config": r.config,
                    "score": r.metrics.get(primary),
                    "all_metrics": {k: float(v) for k, v in r.metrics.items() if isinstance(v, (int, float))},
                    "trial_path": str(r.path) if r.path else None,
                    "model_dir": r.metrics.get("_model_dir"),
                    "model_run_id": r.metrics.get("_model_run_id"),
                    "model_artifact_uri": r.metrics.get("_model_artifact_uri"),
                })
            # Top-N sort
            valid_trials = [t for t in trials_info if t["score"] is not None]
            ranked_trials = sorted(valid_trials, key=lambda t: t["score"], reverse=(mode == "max"))
            top_trials = ranked_trials[:top_n]
            # 각 top-N 모델을 MLflow artifact로 업로드 (job-level run)
            saved_models = []
            for rank, t in enumerate(top_trials, 1):
                candidate_reference = _find_candidate_model_reference(
                    mlflow_uri,
                    cfg["experiment_name"],
                    cfg["job_id"],
                    model_id,
                    t.get("trial_id") or "",
                )
                if candidate_reference:
                    candidate_run_id, candidate_artifact_uri = candidate_reference
                    try:
                        client = mlflow.tracking.MlflowClient(tracking_uri=mlflow_uri)
                        client.set_tag(candidate_run_id, "automl.rank", str(rank))
                        client.set_tag(candidate_run_id, "automl.top_model", "true")
                    except Exception as _e:
                        print(f"[AutoML] top model tag update failed: {_e}", flush=True)
                    saved_models.append({
                        "rank": rank,
                        "model_id": model_id,
                        "score": t["score"],
                        "metric": primary,
                        "params": t["config"],
                        "run_id": candidate_run_id,
                        "artifact_path": candidate_artifact_uri,
                        "virtual_path": f"/workspace/models/automl/{cfg['job_id']}/{model_id}_rank{rank}",
                    })
                    continue
                try:
                    with mlflow.start_run(run_name=f"top-{model_id}-rank{rank}", nested=False) as mrun:
                        mlflow.set_tag("automl.job_id", cfg["job_id"])
                        mlflow.set_tag("automl.model", model_id)
                        mlflow.set_tag("automl.rank", rank)
                        mlflow.set_tag("automl.task", cfg["task"])
                        mlflow.set_tag("automl.metric", primary)
                        mlflow.set_tag("framework", _MODEL_FRAMEWORK_MAP.get(model_id, "unknown"))
                        mlflow.set_tag("framework.version", _get_framework_version(model_id))
                        mlflow.set_tag("dataset.id", dataset_id)
                        mlflow.set_tag("dataset.rows", str(dataset_rows))
                        mlflow.set_tag("dataset.path", cfg["dataset_path"])
                        mlflow.set_tag("dataset.target", cfg["target_column"])
                        mlflow.set_tag("created_by", cfg.get("submitted_by", ""))
                        mlflow.log_params(t["config"])
                        for k, v in t["all_metrics"].items():
                            try:
                                mlflow.log_metric(k, v)
                            except Exception:  # nosec
                                pass
                        model_artifact_uri = None
                        # 모델 파일 업로드 (tempfile 경로 우선, fallback: trial_path)
                        # 표준 MLflow flavor (sklearn)로 log_model → MLmodel, conda.yaml,
                        # python_env.yaml, requirements.txt, model.pkl 자동 생성.
                        # XGBoost/LightGBM도 sklearn 호환 래퍼(XGBClassifier, LGBMClassifier)라
                        # sklearn flavor로 저장하면 MLServer sklearn runtime과 그대로 호환.
                        model_dir = t.get("model_dir") or t.get("trial_path")
                        if model_dir and os.path.isdir(model_dir):
                            mj = os.path.join(model_dir, "model.joblib")
                            fj = os.path.join(model_dir, "features.json")

                            # features.json → input_example 구성 (signature 포함)
                            input_example = None
                            try:
                                if os.path.isfile(fj):
                                    import json as _json
                                    import pandas as _pd
                                    with open(fj) as _f:
                                        _spec = _json.load(_f)
                                    _cols = _spec.get("columns") or []
                                    if _cols:
                                        input_example = _pd.DataFrame([{c: 0.0 for c in _cols}])
                            except Exception as _e:
                                print(f"[AutoML] input_example build failed: {_e}", flush=True)

                            if os.path.isfile(mj):
                                logged_mlflow_model = False
                                try:
                                    import joblib as _joblib
                                    import mlflow.sklearn as _mls
                                    _model_obj = _joblib.load(mj)
                                    _model_info = _mls.log_model(
                                        _model_obj,
                                        artifact_path="model",
                                        input_example=input_example,
                                        pip_requirements=_mlflow_pip_requirements(model_id),
                                    )
                                    model_artifact_uri = getattr(_model_info, "model_uri", None)
                                    logged_mlflow_model = True
                                    print(f"[AutoML] log_model(sklearn) OK for {model_id} rank{rank}", flush=True)
                                except Exception as _e:
                                    # 실패 시 기존 방식(파일 업로드)으로 폴백 → 최소한 재현은 가능
                                    print(f"[AutoML] log_model failed, fallback log_artifact: {_e}", flush=True)
                                    mlflow.log_artifact(mj, artifact_path="model")
                                if logged_mlflow_model:
                                    # 노트북 import/기존 후처리 호환용 원본 joblib도 함께 유지
                                    try:
                                        mlflow.log_artifact(mj, artifact_path="model")
                                    except Exception as _e:
                                        print(f"[AutoML] model.joblib compatibility upload failed: {_e}", flush=True)
                            else:
                                print(f"[AutoML] no model.joblib at {mj}", flush=True)
                            # features.json은 별도 artifact로 유지 (serving 단계에서 참조)
                            if os.path.isfile(fj):
                                mlflow.log_artifact(fj, artifact_path="model")
                        if not model_artifact_uri:
                            raise RuntimeError(
                                f"serving artifact was not created for {model_id} rank{rank}"
                            )
                        saved_models.append({
                            "rank": rank,
                            "model_id": model_id,
                            "score": t["score"],
                            "metric": primary,
                            "params": t["config"],
                            "run_id": mrun.info.run_id,
                            "artifact_path": model_artifact_uri or f"runs:/{mrun.info.run_id}/model",
                            "virtual_path": f"/workspace/models/automl/{cfg['job_id']}/{model_id}_rank{rank}",
                        })
                except Exception as e:
                    print(f"[AutoML] save rank{rank} {model_id} failed: {e}", flush=True)

            model_result = {
                "model_id": model_id,
                "best_metric": best.metrics.get(primary),
                "best_config": best.config,
                "top_models": saved_models,
                "trials": [
                    {
                        "trial_index": t.get("trial_index"),
                        "trial_id": t.get("trial_id"),
                        "score": t["score"],
                        "config": t["config"],
                        "metrics": t["all_metrics"],
                    }
                    for t in valid_trials
                ],
            }
            all_results.append(model_result)
            done_trials = len(trials_info) or len(valid_trials) or int(cfg["num_trials"])
            print(f"[AutoML] {model_id} best {primary}={best.metrics.get(primary)}, top-{len(saved_models)} saved", flush=True)
            progress_payload = {
                "event": "model_done",
                "model_id": model_id,
                "model_idx": idx + 1,
                "model_total": len(cfg["models"]),
                "trial_done": min(done_trials, int(cfg["num_trials"])),
                "trial_total": int(cfg["num_trials"]),
                "metric": primary,
                "mode": mode,
                "best_score": best.metrics.get(primary),
            }
            print(f"[AutoML] PROGRESS={json.dumps(progress_payload)}", flush=True)
        except Exception as e:
            print(f"[AutoML] {model_id} failed: {e}", flush=True)
            all_results.append({"model_id": model_id, "best_metric": None, "best_config": None, "error": str(e), "top_models": [], "trials": []})

    # Overall best (best_metric이 None인 항목 제외)
    valid = [r for r in all_results if r.get("best_metric") is not None]
    reverse = mode == "max"
    valid.sort(key=lambda r: r["best_metric"], reverse=reverse)
    overall_best = valid[0] if valid else None
    if overall_best and not overall_best.get("top_models"):
        raise RuntimeError(
            "AutoML 학습은 완료됐지만 서빙 가능한 MLflow 모델 아티팩트를 저장하지 못했습니다. "
            "MLflow 연결과 Ray worker 로그를 확인한 뒤 다시 실행해 주세요."
        )
    print(f"[AutoML] Overall best: {overall_best}", flush=True)
    done_payload = {
        "event": "done",
        "models": cfg["models"],
        "num_trials": int(cfg["num_trials"]),
        "done_trials": int(cfg["num_trials"]) * len(cfg["models"]),
        "total_trials": int(cfg["num_trials"]) * len(cfg["models"]),
        "metric": primary,
        "mode": mode,
        "best_score": overall_best.get("best_metric") if overall_best else None,
        "best_model": overall_best.get("model_id") if overall_best else "",
    }
    print(f"[AutoML] PROGRESS={json.dumps(done_payload)}", flush=True)
    return {"per_model": all_results, "best": overall_best, "metric": primary, "mode": mode}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, help="JSON file path or inline JSON string")
    args = parser.parse_args()

    if Path(args.config).exists():
        with open(args.config) as f:
            cfg = json.load(f)
    else:
        cfg = json.loads(args.config)

    result = run(cfg)
    print("[AutoML] RESULT_JSON=" + json.dumps(result), flush=True)
    if not result.get("best"):
        raise SystemExit("유효한 best 모델이 생성되지 않았습니다. dataset path, target column, feature type 또는 trial 오류 로그를 확인하세요.")
