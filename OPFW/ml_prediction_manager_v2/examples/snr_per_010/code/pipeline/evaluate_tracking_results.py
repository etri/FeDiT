"""Evaluate pre-computed tracking results (MOT txt files) with TrackEval.

Fast path for the SNR-PER-010 acceptance test: the tracking results stored in tracking_results/ were produced by the
full image inference (run_inference.py) on 예측매니저. This script does not run any model. It
  1. checks the SHA-256 of every tracking-result file against tracking_results/MANIFEST.json,
  2. checks the ground truth (gt.txt) of MOT20-01/02/03/05 against the recorded SHA-256,
  3. scores the tracks with TrackEval (CLEAR/Identity, IoU 0.1 and 0.5) through evaluate_folds.py,
  4. writes metrics, CSV tables and charts, and verifies the 4-sequence mean MOTA >= 80 % at IoU 0.1.
"""
import argparse
import csv
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from runtime_paths import CODE_ROOT, PACKAGE_ROOT, PROFILE_PATH, resolve_data_root

parser = argparse.ArgumentParser()
parser.add_argument('--tracking-results', type=Path, default=PACKAGE_ROOT / 'tracking_results')
parser.add_argument('--workspace', type=Path, default=PACKAGE_ROOT / 'workspace')
parser.add_argument('--data-root', type=Path, default=None, help='directory that contains MOT20/ (default: data/)')
parser.add_argument('--output', type=Path, required=True, help='new directory for the evaluation outputs')
parser.add_argument('--trackeval-root', type=Path, default=CODE_ROOT / 'external/TrackEval')
args = parser.parse_args()

tracking = args.tracking_results.expanduser().resolve()
data_root = resolve_data_root(args.workspace, args.data_root)
output = args.output.expanduser().resolve()
manifest = json.loads((tracking / 'MANIFEST.json').read_text(encoding='utf-8'))
profile = json.loads(PROFILE_PATH.read_text(encoding='utf-8'))
sequences = {name.removesuffix('.txt'): item['frames'] for name, item in manifest['files'].items()}
assert set(sequences) == {'MOT20-01', 'MOT20-02', 'MOT20-03', 'MOT20-05'}


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            value.update(block)
    return value.hexdigest()


# 1-2. input verification (tracking results and ground truth)
verified = {}
for name, length in sequences.items():
    recorded = manifest['files'][name + '.txt']
    prediction = tracking / (name + '.txt')
    if prediction.stat().st_size != recorded['bytes'] or digest(prediction) != recorded['sha256']:
        raise RuntimeError('Tracking result differs from the recorded file: ' + prediction.name)
    gt = data_root / 'MOT20/train' / name / 'gt/gt.txt'
    if digest(gt) != recorded['gt_sha256']:
        raise RuntimeError('Ground truth differs from the recorded file: ' + name)
    verified[name] = {'frames': length, 'rows': recorded['rows'], 'prediction_sha256': recorded['sha256'], 'gt_sha256': recorded['gt_sha256']}
    print('INPUT_VERIFIED', name, 'frames', length, 'rows', recorded['rows'], flush=True)

# 3. TrackEval
output.mkdir(parents=True, exist_ok=False)
evaluation = output / 'evaluation'
subprocess.run([sys.executable, str(Path(__file__).with_name('evaluate_folds.py')), '--trackeval-root', str(args.trackeval_root), '--dataset-root', str(data_root / 'MOT20'), '--tracks', str(tracking), '--output', str(evaluation)], check=True, stdout=subprocess.DEVNULL)
metrics = json.loads((evaluation / 'metrics.json').read_text(encoding='utf-8'))
shutil.rmtree(evaluation / 'tracker')  # TrackEval's working copy of the tracking results; their SHA-256 stays in metrics.json
primary = next(item for item in metrics['evaluations'] if item['match_iou'] == 0.1)
if not metrics['complete_four_fold_scope']:
    raise RuntimeError('The evaluation does not cover all four sequences')
for name, recorded in manifest['files'].items():
    if metrics['inputs'][name.removesuffix('.txt')]['prediction_sha256'] != recorded['sha256']:
        raise RuntimeError('The evaluated file is not the verified file: ' + name)

# 4. tables, charts, provenance
shutil.copytree(tracking, output / 'tracking_results', ignore=shutil.ignore_patterns('*.txt'))
rows = [{'match_iou': item['match_iou'], **fold} for item in metrics['evaluations'] for fold in item['folds']]
with (output / 'sequence_metrics.csv').open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=['match_iou', 'sequence', 'mota_percent', 'fp', 'fn', 'idsw', 'gt', 'idf1_percent'])
    writer.writeheader()
    writer.writerows(rows)
with (output / 'aggregate_metrics.csv').open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=['match_iou', 'macro_mota_percent', 'pooled_mota_percent'])
    writer.writeheader()
    writer.writerows({key: item[key] for key in writer.fieldnames} for item in metrics['evaluations'])
reference = manifest['reference_metrics_iou_0.1']
difference = {fold['sequence']: fold['mota_percent'] - reference['sequences'][fold['sequence']]['mota_percent'] for fold in primary['folds']}
provenance = {
    'kind': 'precomputed_tracking_result_evaluation',
    'created_at': datetime.now(timezone.utc).isoformat(),
    'inference_executed_by_this_command': False,
    'model_training_executed': False,
    'tracking_results_manifest_sha256': digest(tracking / 'MANIFEST.json'),
    'tracking_results_produced_by': manifest['produced_by'],
    'inputs': verified,
    'metric_protocol': manifest['evaluation_protocol'],
    'inference_profile_sha256': digest(PROFILE_PATH),
    'inference_profile_selection': profile['selection'],
    'primary_macro_mota_percent': primary['macro_mota_percent'],
    'primary_pooled_mota_percent': primary['pooled_mota_percent'],
    'target_macro_80_passed': primary['macro_mota_percent'] >= 80,
    'reference_macro_mota_percent': reference['macro_mota_percent'],
    'difference_from_reference_percentage_points': primary['macro_mota_percent'] - reference['macro_mota_percent'],
    'per_sequence_difference_from_reference_percentage_points': difference,
}
(output / 'evaluation-provenance.json').write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
charts = output / 'charts'
charts.mkdir()
labels = list(sequences) + ['4-sequence mean']
x = np.arange(len(labels))
fig, axis = plt.subplots(figsize=(10, 5.5), layout='constrained')
values = [fold['mota_percent'] for fold in primary['folds']] + [primary['macro_mota_percent']]
bars = axis.bar(x, values, width=0.62, color=['#1d567a'] * 4 + ['#237b68'])
axis.bar_label(bars, labels=[f'{value:.4f}%' for value in values], padding=4, fontsize=10)
axis.axhline(80, color='#b52e31', linestyle='--', linewidth=1.2, label='80% target (IoU 0.1 protocol)')
axis.set_xticks(x, labels)
axis.set_ylim(0, 100)
axis.set_ylabel('MOTA (%)')
axis.set_title('SNR-PER-010 MOTA at IoU 0.1')
axis.legend(loc='lower right')
axis.spines[['top', 'right']].set_visible(False)
fig.savefig(charts / 'mota_comparison.png', dpi=180)
plt.close(fig)
fig, axis = plt.subplots(figsize=(10, 5.5), layout='constrained')
bottom = np.zeros(4)
for field, color, label in [('fn', '#1d567a', 'False negatives'), ('fp', '#e2a837', 'False positives'), ('idsw', '#a44743', 'ID switches')]:
    values = np.asarray([100 * fold[field] / fold['gt'] for fold in primary['folds']])
    axis.bar(np.arange(4), values, bottom=bottom, color=color, label=label)
    bottom += values
axis.set_xticks(np.arange(4), list(sequences))
axis.set_ylabel('Errors / GT (%)')
axis.set_title('MOT20 error breakdown at IoU 0.1')
axis.spines[['top', 'right']].set_visible(False)
axis.legend()
fig.savefig(charts / 'error_breakdown.png', dpi=180)
plt.close(fig)

print(f"{'Sequence':<12}{'MOTA@0.1':>12}{'FP':>10}{'FN':>10}{'IDSW':>8}{'GT':>10}", flush=True)
for fold in primary['folds']:
    print(f"{fold['sequence']:<12}{fold['mota_percent']:>12.6f}{fold['fp']:>10}{fold['fn']:>10}{fold['idsw']:>8}{fold['gt']:>10}", flush=True)
print(f"Macro MOTA (IoU 0.1): {primary['macro_mota_percent']:.6f}%  reference {reference['macro_mota_percent']:.6f}%  difference {provenance['difference_from_reference_percentage_points']:+.12f} pp", flush=True)
if primary['macro_mota_percent'] < 80:
    raise RuntimeError('The four-sequence arithmetic mean has not reached MOTA 80')
print('MOTA_TARGET_VERIFIED', format(primary['macro_mota_percent'], '.6f') + '%', flush=True)
print('EVALUATION_COMPLETE', str(output), flush=True)
