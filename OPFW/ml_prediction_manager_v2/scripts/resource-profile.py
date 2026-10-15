"""Print a read-only host inventory and conservative single-trial defaults."""
import argparse
import csv
import io
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess

import psutil


def recommend(cpu_count, available_ram_gib, gpu_free_mib):
    # Initial limits, not benchmark-derived optimal hyperparameters. Never infer
    # physical GPU count from time-sliced Kubernetes resource capacity.
    return {
        'cpu_per_trial': 1,
        'gpu_per_trial': 1 if gpu_free_mib >= 2048 else 0,
        'memory_per_trial_gb': min(4, max(0.5, int(available_ram_gib / 4))),
        'max_concurrent_trials': 1,
        'batch_size': 64 if gpu_free_mib < 8192 else 256 if gpu_free_mib < 24576 else 512,
        'gpu_memory_fraction': 0.75 if gpu_free_mib < 8192 else 0.8,
        'gpu_time_slices': 1,
        'host_cpus_not_requested_by_trial': max(0, cpu_count - 1),
    }


def inventory():
    devices = []
    gpu_error = None
    try:
        output = subprocess.check_output([
            'nvidia-smi', '--query-gpu=name,driver_version,memory.total,memory.free',
            '--format=csv,noheader,nounits'], text=True, timeout=15)
        for row in csv.reader(io.StringIO(output)):
            devices.append({'name': row[0].strip(), 'driver': row[1].strip(),
                            'total_mib': int(row[2].strip()), 'free_mib': int(row[3].strip())})
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        gpu_error = str(exc)
    ram = psutil.virtual_memory()
    effective_total = ram.total
    effective_available = ram.available
    for cgroup_path in ('/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes'):
        try:
            limit = int(Path(cgroup_path).read_text().strip())
            if 0 < limit < effective_total:
                effective_total = limit
                usage_path = Path(cgroup_path).with_name(
                    'memory.current' if cgroup_path.endswith('memory.max') else 'memory.usage_in_bytes')
                used = int(usage_path.read_text().strip()) if usage_path.exists() else 0
                effective_available = min(effective_available, max(0, limit - used))
        except (OSError, ValueError):
            pass
    cpus = len(os.sched_getaffinity(0)) if hasattr(os, 'sched_getaffinity') else os.cpu_count() or 1
    disk = shutil.disk_usage(Path.home())
    free_mib = min((d['free_mib'] for d in devices), default=0)
    return {'os': platform.platform(), 'cpu_logical': cpus,
            'ram_total_gib': round(effective_total / 1024**3, 2),
            'ram_available_gib': round(effective_available / 1024**3, 2),
            'home_free_gib': round(disk.free / 1024**3, 2),
            'gpus': devices, 'gpu_probe_error': gpu_error,
            'recommendation': recommend(cpus, effective_available / 1024**3, free_mib),
            'scope': 'conservative development defaults; benchmark with the real dataset before increasing concurrency'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    text = json.dumps(inventory(), indent=2, ensure_ascii=False)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + '\n', encoding='utf-8')
    print(text)
