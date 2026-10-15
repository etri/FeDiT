"""Run the real Tune/Optuna -> HTTP MLflow path with tiny GPU training jobs."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main():
    import pandas as pd
    import ray
    import torch
    from sklearn.datasets import make_classification
    from app.automl_runner.job import run

    if not torch.cuda.is_available():
        raise RuntimeError('GPU integration requires CUDA; CPU fallback is not allowed')
    with tempfile.TemporaryDirectory(prefix='pman-gpu-') as tmp:
        work = Path(tmp)
        X, y = make_classification(n_samples=160, n_features=8, random_state=42)
        frame = pd.DataFrame(X, columns=[f'x{i}' for i in range(8)])
        frame['target'] = y
        dataset = work / 'dataset.csv'
        frame.to_csv(dataset, index=False)
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        uri = f'http://127.0.0.1:{port}'
        with (work / 'mlflow.log').open('w', encoding='utf-8') as log:
            server = subprocess.Popen([
                sys.executable, '-m', 'mlflow', 'server', '--host', '127.0.0.1',
                '--port', str(port), '--workers', '1',
                '--backend-store-uri', 'sqlite:///' + (work / 'tracking.db').as_posix(),
                '--artifacts-destination', (work / 'artifacts').as_uri(),
            ], stdout=log, stderr=subprocess.STDOUT, cwd=work,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
            print(f'MLFLOW_TEST_SERVER pid={server.pid} url={uri}', flush=True)
            try:
                for attempt in range(120):
                    if server.poll() is not None:
                        raise RuntimeError('MLflow server exited: ' + (work / 'mlflow.log').read_text(encoding='utf-8'))
                    try:
                        with urllib.request.urlopen(uri + '/health', timeout=2) as response:
                            if response.status == 200:
                                break
                    except OSError:
                        time.sleep(1)
                else:
                    raise TimeoutError('MLflow HTTP readiness timed out')
                ray.init(num_cpus=2, num_gpus=1, include_dashboard=False,
                         object_store_memory=128 * 1024**2, _node_ip_address='127.0.0.1',
                         runtime_env={'env_vars': {'PYTHONPATH': str(ROOT)}})
                result = run({
                    'job_id': 'gpu-integration', 'experiment_name': 'gpu-integration',
                    'models': ['xgb', 'tabnet'], 'task': 'classification',
                    'dataset_path': str(dataset), 'target_column': 'target',
                    'num_trials': 1, 'timeout_minutes': 4,
                    'cpu_per_trial': 1, 'gpu_per_trial': 1,
                    'memory_per_trial_gb': 0.5, 'max_concurrent_trials': 1,
                    'batch_size': 64, 'max_epochs': 2, 'gpu_memory_fraction': 0.75,
                    'mlflow_uri': uri, 'storage_path': (work / 'tune').as_posix(),
                    'top_n': 1,
                })
                models = result.get('per_model', [])
                if (not result.get('best') or len(models) != 2 or
                        any(m.get('best_metric') is None or not m.get('top_models') for m in models)):
                    raise AssertionError('Missing GPU AutoML results: ' + json.dumps(result))
                print('AUTOML_GPU_INTEGRATION_RESULT=' + json.dumps(result), flush=True)
            finally:
                ray.shutdown()
                if os.name == 'nt':
                    # The venv launcher may have a separate Python server
                    # child; terminate only this test's entire process tree.
                    subprocess.run(['taskkill', '/PID', str(server.pid), '/T', '/F'],
                                   capture_output=True, check=False)
                else:
                    server.terminate()
                try:
                    server.wait(timeout=20)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait(timeout=10)


if __name__ == '__main__':
    if os.name == 'nt' and not sys.flags.utf8_mode:
        # MLflow emits Unicode run links, and Tune writes exception text.
        # Enable UTF-8 for this process tree without changing Windows locale.
        env = dict(os.environ, PYTHONUTF8='1', PYTHONIOENCODING='utf-8')
        raise SystemExit(subprocess.call([sys.executable, '-X', 'utf8', __file__], env=env))
    main()
