"""Real CPU/GPU training probes; fail rather than silently substituting CPU."""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def training_probe(use_gpu, check_mlflow=False):
    import joblib
    import numpy as np
    import torch
    from app.automl_runner.job import _build_model, _fit_predict, _score_all, _mlflow_pip_requirements, _as_serving_model
    from sklearn.datasets import make_classification, make_regression
    from sklearn.model_selection import train_test_split

    torch.set_num_threads(1)
    if use_gpu:
        if not torch.cuda.is_available():
            raise RuntimeError('A real CUDA GPU is required')
        tensor = torch.randn(64, 64, device='cuda', requires_grad=True)
        tensor.square().mean().backward()
        torch.cuda.synchronize()
    results = []
    for task in ('regression', 'classification'):
        if task == 'classification':
            X, y = make_classification(n_samples=160, n_features=8, random_state=42)
        else:
            X, y = make_regression(n_samples=160, n_features=8, random_state=42)
        X = X.astype(np.float32)
        Xtr, Xte, ytr, yte = train_test_split(X, y, random_state=42)
        candidates = [
            ('xgb', {'n_estimators': 5, 'max_depth': 3}),
            ('tabnet', {'n_d': 8, 'n_a': 8, 'n_steps': 3}),
        ]
        if not use_gpu:
            candidates += [
                ('rf', {'n_estimators': 5}),
                ('lgbm', {'n_estimators': 5}),
                ('mlp', {'hidden_layer_sizes': (8,)}),
            ]
        for model_id, params in candidates:
            print(f'PROBE model={model_id} task={task} device={"cuda" if use_gpu else "cpu"}', flush=True)
            model = _build_model(model_id, task, params, use_gpu=use_gpu,
                                 gpu_memory_fraction=0.75)
            pred, proba = _fit_predict(model_id, model, Xtr, ytr, Xte, task,
                                       batch_size=64, max_epochs=2)
            if not np.isfinite(pred).all():
                raise AssertionError('Non-finite predictions')
            metrics = _score_all(yte, pred, task, proba=proba)
            if not metrics or (task == 'classification' and 'roc_auc' not in metrics):
                raise AssertionError('Missing evaluation metrics')
            if model_id == 'tabnet' and str(model.device).startswith('cuda') != use_gpu:
                raise AssertionError('TabNet ran on the wrong device')
            with tempfile.TemporaryDirectory() as tmp:
                serving_model = _as_serving_model(model_id, model)
                if model_id == 'tabnet':
                    if str(model.device) != 'cpu' or any(p.device.type != 'cpu' for p in model.network.parameters()):
                        raise AssertionError('TabNet serving artifact still requires CUDA')
                    if any(isinstance(v, torch.Tensor) and v.device.type != 'cpu'
                           for owner in [model, *model.network.modules()] for v in vars(owner).values()):
                        raise AssertionError('TabNet attention/group matrices still require CUDA')
                    if any(isinstance(v, torch.Tensor) and v.device.type != 'cpu'
                           for state in model._optimizer.state.values() for v in state.values()):
                        raise AssertionError('TabNet optimizer state still contains CUDA tensors')
                artifact = Path(tmp) / 'model.joblib'
                joblib.dump(serving_model, artifact)
                restored = joblib.load(artifact)
                np.testing.assert_allclose(restored.predict(Xte).ravel(), pred, rtol=1e-5, atol=1e-5)
                if check_mlflow and model_id in {'xgb', 'tabnet'}:
                    import mlflow.sklearn
                    import mlflow.pyfunc
                    import pandas as pd
                    package = Path(tmp) / 'mlflow-model'
                    mlflow.sklearn.save_model(serving_model, str(package),
                                              pip_requirements=_mlflow_pip_requirements(model_id))
                    served = mlflow.pyfunc.load_model(str(package))
                    np.testing.assert_allclose(
                        np.asarray(served.predict(pd.DataFrame(Xte))).ravel(), pred, rtol=1e-5, atol=1e-5)
            results.append({'model': model_id, 'task': task, 'gpu': use_gpu,
                            'metrics': metrics})
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--require-gpu', action='store_true')
    parser.add_argument('--ray', action='store_true', help='Also verify GPU scheduling in a real local Ray worker')
    parser.add_argument('--mlflow', action='store_true', help='Also package/reload MLflow models and predict DataFrames')
    args = parser.parse_args()
    import torch
    if args.require_gpu and not torch.cuda.is_available():
        raise SystemExit('FAIL: CUDA unavailable; no CPU fallback is allowed')
    output = {'torch': torch.__version__, 'cuda_runtime': torch.version.cuda,
              'gpu': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
              'cpu_training': training_probe(False, args.mlflow)}
    if args.require_gpu:
        output['gpu_training'] = training_probe(True, args.mlflow)
    if args.ray:
        import ray
        ray.init(num_cpus=2, num_gpus=1 if args.require_gpu else 0,
                 include_dashboard=False, object_store_memory=128 * 1024**2,
                 _node_ip_address='127.0.0.1',
                 runtime_env={'env_vars': {'PYTHONPATH': str(ROOT)}})
        try:
            remote_probe = ray.remote(num_cpus=1, num_gpus=1 if args.require_gpu else 0)(training_probe)
            output['ray_training'] = ray.get(remote_probe.remote(args.require_gpu), timeout=180)
        finally:
            ray.shutdown()
    print('GPU_SMOKE_RESULT=' + json.dumps(output, ensure_ascii=False))
