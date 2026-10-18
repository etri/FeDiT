"""Export CUDA-trained artifacts, then verify them in a separate CPU-only container."""
import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

import joblib
import mlflow.pyfunc
import mlflow.sklearn
import numpy as np
import pandas as pd
import torch
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.automl_runner.job import _as_serving_model, _build_model, _fit_predict, _mlflow_pip_requirements


def verify_http(package, X, expected):
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    url = f'http://127.0.0.1:{port}'
    with tempfile.TemporaryFile(mode='w+b') as log:
        process = subprocess.Popen([
            sys.executable, '-m', 'mlflow', 'models', 'serve', '-m', str(package),
            '--env-manager', 'local', '--host', '127.0.0.1', '--port', str(port), '--workers', '1',
        ], stdout=log, stderr=subprocess.STDOUT, start_new_session=os.name != 'nt')
        try:
            for attempt in range(90):
                if process.poll() is not None:
                    log.seek(0)
                    raise RuntimeError(log.read().decode('utf-8', errors='replace'))
                try:
                    with urllib.request.urlopen(url + '/ping', timeout=2) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(1)
            else:
                raise TimeoutError('MLflow prediction server did not become ready')
            payload = json.dumps({'dataframe_split': pd.DataFrame(X).to_dict(orient='split')}).encode()
            request = urllib.request.Request(url + '/invocations', data=payload,
                                             headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(request, timeout=30) as response:
                prediction = np.asarray(json.load(response)['predictions']).ravel()
            np.testing.assert_allclose(prediction, expected, rtol=1e-5, atol=1e-5)
        finally:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], capture_output=True)
            else:
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['export', 'verify'])
    parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    args.directory.mkdir(parents=True, exist_ok=True)
    if args.mode == 'export':
        assert torch.cuda.is_available(), 'Export requires a real GPU'
        for task in ['classification', 'regression']:
            generator = make_classification if task == 'classification' else make_regression
            X, y = generator(n_samples=256, n_features=8, random_state=42)
            Xtr, Xte, ytr, _ = train_test_split(X.astype('float32'), y, random_state=42)
            for model_id in ['xgb', 'tabnet']:
                destination = args.directory / f'{model_id}-{task}'
                destination.mkdir(exist_ok=True)
                model = _build_model(model_id, task, {}, use_gpu=True, cpu_per_trial=1,
                                     gpu_memory_fraction=0.75)
                prediction, _ = _fit_predict(model_id, model, Xtr, ytr, Xte, task,
                                             batch_size=64, max_epochs=2)
                model = _as_serving_model(model_id, model)
                joblib.dump(model, destination / 'model.joblib')
                np.savez(destination / 'expected.npz', X=Xte, prediction=prediction)
                mlflow.sklearn.save_model(model, str(destination / 'mlflow'),
                                          pip_requirements=_mlflow_pip_requirements(model_id))
    else:
        assert not torch.cuda.is_available(), 'Verify in a container without GPU devices'
        count = 0
        http_count = 0
        for destination in sorted(args.directory.iterdir()):
            data = np.load(destination / 'expected.npz')
            expected = data['prediction'].ravel()
            for model in [joblib.load(destination / 'model.joblib'),
                          mlflow.pyfunc.load_model(str(destination / 'mlflow'))]:
                prediction = np.asarray(model.predict(pd.DataFrame(data['X']))).ravel()
                np.testing.assert_allclose(prediction, expected, rtol=1e-5, atol=1e-5)
                count += 1
            verify_http(destination / 'mlflow', data['X'], expected)
            http_count += 1
        assert count == 8, count
        assert http_count == 4, http_count
        print('CPU_PORTABILITY_RESULT=' + json.dumps({'gpu_available': False, 'checks': count,
                                                     'http_predictions': http_count}))


if __name__ == '__main__':
    main()
