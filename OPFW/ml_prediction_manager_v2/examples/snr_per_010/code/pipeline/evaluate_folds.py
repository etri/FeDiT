import argparse
import configparser
import csv
import hashlib
import json
import math
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


SEQUENCES = {'MOT20-01': 429, 'MOT20-02': 2782, 'MOT20-03': 2405, 'MOT20-05': 3315}


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            value.update(block)
    return value.hexdigest()


def validate(path, frames):
    seen = set()
    rows = 0
    with path.open(encoding='utf-8') as stream:
        for row in csv.reader(stream):
            if not row:
                continue
            values = [float(x) for x in row]
            if len(values) != 10 or not all(math.isfinite(x) for x in values):
                raise ValueError(f'Invalid MOT row: {path}:{rows + 1}')
            frame, identity = values[:2]
            if frame != int(frame) or not 1 <= frame <= frames or identity != int(identity) or identity < 1:
                raise ValueError(f'Invalid frame or ID: {path}:{rows + 1}')
            if values[4] <= 0 or values[5] <= 0 or (frame, identity) in seen:
                raise ValueError(f'Invalid box or duplicate ID: {path}:{rows + 1}')
            seen.add((frame, identity))
            rows += 1
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--trackeval-root', type=Path, required=True)
    parser.add_argument('--dataset-root', type=Path, required=True)
    parser.add_argument('--tracks', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--sequences', nargs='+', choices=list(SEQUENCES), default=list(SEQUENCES))
    args = parser.parse_args()
    sequences = {name: SEQUENCES[name] for name in args.sequences}
    args.output.mkdir(parents=True, exist_ok=False)
    inputs = {}
    for name, length in sequences.items():
        gt = args.dataset_root / 'train' / name / 'gt/gt.txt'
        info = args.dataset_root / 'train' / name / 'seqinfo.ini'
        prediction = args.tracks / f'{name}.txt'
        config = configparser.ConfigParser()
        config.read(info, encoding='utf-8')
        if config.getint('Sequence', 'seqLength') != length:
            raise ValueError(f'Sequence length mismatch: {name}')
        inputs[name] = {'prediction_sha256': digest(prediction), 'gt_sha256': digest(gt), 'rows': validate(prediction, length)}
    sys.path.insert(0, str(args.trackeval_root.resolve()))
    import trackeval
    import numpy as np
    np.float = float
    np.int = int
    work = args.output / 'tracker' / 'loso' / 'data'
    work.mkdir(parents=True)
    for name in sequences:
        shutil.copyfile(args.tracks / f'{name}.txt', work / f'{name}.txt')
    dataset = trackeval.datasets.MotChallenge2DBox({'GT_FOLDER': str((args.dataset_root / 'train').resolve()), 'TRACKERS_FOLDER': str(work.parents[1].resolve()), 'TRACKERS_TO_EVAL': ['loso'], 'BENCHMARK': 'MOT20', 'SPLIT_TO_EVAL': 'train', 'SKIP_SPLIT_FOL': True, 'SEQ_INFO': sequences, 'DO_PREPROC': True, 'PRINT_CONFIG': False})
    results = []
    for threshold in [0.1, 0.5]:
        metrics = [trackeval.metrics.CLEAR({'THRESHOLD': threshold, 'PRINT_CONFIG': False}), trackeval.metrics.Identity({'THRESHOLD': threshold, 'PRINT_CONFIG': False})]
        evaluator = trackeval.Evaluator({'USE_PARALLEL': False, 'PRINT_RESULTS': False, 'PRINT_CONFIG': False, 'TIME_PROGRESS': False, 'PLOT_CURVES': False, 'OUTPUT_SUMMARY': False, 'OUTPUT_DETAILED': False, 'LOG_ON_ERROR': str(args.output / 'errors.log')})
        raw, messages = evaluator.evaluate([dataset], metrics)
        data = raw[dataset.get_name()]['loso']
        folds = []
        for name in sequences:
            clear = data[name]['pedestrian']['CLEAR']
            identity = data[name]['pedestrian']['Identity']
            folds.append({'sequence': name, 'mota_percent': 100 * float(clear['MOTA']), 'fp': int(clear['CLR_FP']), 'fn': int(clear['CLR_FN']), 'idsw': int(clear['IDSW']), 'gt': int(clear['CLR_TP'] + clear['CLR_FN']), 'idf1_percent': 100 * float(identity['IDF1'])})
        total_gt = sum(x['gt'] for x in folds)
        total_errors = sum(x['fp'] + x['fn'] + x['idsw'] for x in folds)
        macro = sum(x['mota_percent'] for x in folds) / len(sequences)
        results.append({'match_iou': threshold, 'folds': folds, 'macro_mota_percent': macro, 'pooled_mota_percent': 100 * (1 - total_errors / total_gt), 'macro_at_least_80': macro >= 80})
    payload = {'kind': 'prediction_reevaluation', 'inference_executed_by_this_command': False, 'evaluated_sequences': list(sequences), 'complete_four_fold_scope': set(sequences) == set(SEQUENCES), 'created_at': datetime.now(timezone.utc).isoformat(), 'inputs': inputs, 'evaluations': results}
    (args.output / 'metrics.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(payload, indent=2))


if __name__ == '__main__':
    main()
