import argparse
import colorsys
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path

import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np


def color(identifier):
    values = colorsys.hsv_to_rgb((int(identifier) * 0.61803398875) % 1, 0.78, 0.98)
    return tuple(int(value * 255) for value in values[::-1])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=Path, required=True)
    parser.add_argument('--run-name', required=True)
    args = parser.parse_args()
    result = args.workspace.resolve() / 'results' / args.run_name
    metrics_path = result / 'evaluation/metrics.json'
    metrics = json.loads(metrics_path.read_text())
    primary = next(item for item in metrics['evaluations'] if item['match_iou'] == 0.1)
    assert metrics['complete_four_fold_scope']
    lengths = {'MOT20-01': 429, 'MOT20-02': 2782, 'MOT20-03': 2405, 'MOT20-05': 3315}
    rows = {item['sequence']: item for item in primary['folds']}
    assert set(rows) == set(lengths)
    directory = result / 'visual_evidence'
    directory.mkdir(exist_ok=True)
    assets = []

    def register(path, title, **details):
        assets.append({'file': path.name, 'title': title, 'sha256': hashlib.file_digest(path.open('rb'), 'sha256').hexdigest(), **details})

    def plot(name, title, draw):
        figure, axis = plt.subplots(figsize=(12, 6.4), constrained_layout=True)
        draw(figure, axis)
        axis.set_title(title, fontsize=17, pad=16)
        axis.grid(axis='y', alpha=0.2)
        axis.set_axisbelow(True)
        path = directory / name
        figure.savefig(path, dpi=160, facecolor='white')
        plt.close(figure)
        register(path, title, kind='chart', match_iou=0.1)

    sequences = list(lengths)
    values = [rows[sequence]['mota_percent'] for sequence in sequences]

    def mota(figure, axis):
        bars = axis.bar(sequences, values, color=['#2365ad', '#3887bd', '#28a29d', '#52b891'])
        axis.bar_label(bars, labels=[f'{value:.6f}%' for value in values], padding=5, fontsize=12)
        axis.axhline(80, color='#c23b3b', linestyle='--', label='Target 80%')
        axis.set_ylim(0, 100)
        axis.set_ylabel('MOTA (%)')
        axis.legend(loc='lower right')
        figure.suptitle(f"Four-sequence mean MOTA: {primary['macro_mota_percent']:.6f}%", fontsize=18, fontweight='bold')

    plot('01-mota.png', 'Sequence MOTA at IoU 0.1', mota)

    def errors(figure, axis):
        bottom = np.zeros(4)
        for key, label, shade in [('fp', 'FP', '#4593c5'), ('fn', 'FN', '#ebaa49'), ('idsw', 'IDSW', '#c8606b')]:
            values = np.array([rows[sequence][key] for sequence in sequences])
            axis.bar(sequences, values, bottom=bottom, label=label, color=shade)
            bottom += values
        axis.set_ylabel('Count')
        axis.legend()

    plot('02-error-counts.png', 'Evaluation error counts at IoU 0.1', errors)

    def idf1(figure, axis):
        values = [rows[sequence]['idf1_percent'] for sequence in sequences]
        bars = axis.bar(sequences, values, color='#287f99')
        axis.bar_label(bars, labels=[f'{value:.4f}%' for value in values], padding=5)
        axis.set_ylim(0, 100)
        axis.set_ylabel('IDF1 (%)')

    plot('03-idf1.png', 'Sequence IDF1 at IoU 0.1', idf1)

    def scope(figure, axis):
        bars = axis.bar(sequences, list(lengths.values()), color='#6676aa')
        axis.bar_label(bars, padding=5)
        axis.set_ylim(0, 3800)
        axis.set_ylabel('Frames')
        figure.suptitle('Full evaluation coverage: 8,931 frames', fontsize=18, fontweight='bold')

    plot('04-frame-coverage.png', 'Processed frames by sequence', scope)

    for sequence, count in lengths.items():
        prediction = result / 'predictions' / (sequence + '.txt')
        values = np.loadtxt(prediction, delimiter=',', ndmin=2)
        prediction_sha = hashlib.file_digest(prediction.open('rb'), 'sha256').hexdigest()
        assert prediction_sha == metrics['inputs'][sequence]['prediction_sha256']
        frame_numbers = np.unique(np.linspace(1, count, 8, dtype=int)).tolist()
        selections = [(frame, False) for frame in frame_numbers]
        selections += [(frame, True) for frame in np.linspace(count // 3, count, 3, dtype=int).tolist()]
        for frame, trajectory in selections:
            image_path = args.workspace.resolve() / 'data/MOT20/train' / sequence / 'img1' / f'{frame:06d}.jpg'
            picture = cv2.imread(str(image_path))
            if picture is None:
                raise FileNotFoundError(image_path)
            current = values[values[:, 0] == frame]
            for item in current:
                identifier = int(item[1])
                x, y, width, height = item[2:6]
                shade = color(identifier)
                cv2.rectangle(picture, (round(x), round(y)), (round(x + width), round(y + height)), shade, 2, cv2.LINE_AA)
                cv2.putText(picture, str(identifier), (max(0, round(x)), max(12, round(y) - 2)), cv2.FONT_HERSHEY_SIMPLEX, 0.38, shade, 1, cv2.LINE_AA)
            if trajectory:
                recent = values[(values[:, 0] <= frame) & (values[:, 0] > max(0, frame - 30))]
                candidates = [(int(identifier), recent[recent[:, 1] == identifier]) for identifier in np.unique(current[:, 1])]
                candidates.sort(key=lambda item: (-len(item[1]), item[0]))
                for identifier, track in candidates[:30]:
                    track = track[np.argsort(track[:, 0])]
                    points = np.column_stack((track[:, 2] + track[:, 4] / 2, track[:, 3] + track[:, 5])).round().astype(np.int32)
                    if len(points) > 1:
                        cv2.polylines(picture, [points], False, color(identifier), 3, cv2.LINE_AA)
            kind = 'trajectory' if trajectory else 'tracking'
            title = f'{sequence} frame {frame:06d} / {kind}'
            picture = cv2.copyMakeBorder(picture, 44, 0, 0, 0, cv2.BORDER_CONSTANT, value=(30, 30, 30))
            cv2.putText(picture, title + f' / predicted objects: {len(current)}', (14, 29), cv2.FONT_HERSHEY_SIMPLEX, 0.66, (255, 255, 255), 1, cv2.LINE_AA)
            path = directory / f'{sequence}-{kind}-{frame:06d}.png'
            if not cv2.imwrite(str(path), picture):
                raise OSError(path)
            register(path, title, kind=kind, sequence=sequence, frame=frame, prediction_sha256=prediction_sha, displayed_objects=len(current))

    document = {'created_at': datetime.now(timezone.utc).isoformat(), 'metrics_sha256': hashlib.file_digest(metrics_path.open('rb'), 'sha256').hexdigest(), 'macro_mota_percent': primary['macro_mota_percent'], 'match_iou': 0.1, 'assets': assets}
    (directory / 'manifest.json').write_text(json.dumps(document, indent=2), encoding='utf-8')
    cards = ''.join('<article><h2>' + html.escape(item['title']) + '</h2><a href="' + item['file'] + '"><img src="' + item['file'] + '" loading="lazy"></a></article>' for item in assets)
    (directory / 'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>SNR-PER-010 visual evidence</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#203448;background:#f3f6fa}article{background:white;padding:20px;margin:24px 0;border:1px solid #dce4ec}h2{font-size:20px}img{max-width:100%;height:auto}header{background:white;padding:24px}</style><header><h1>SNR-PER-010 visual evidence</h1><p>Four-sequence mean MOTA: ' + f"{primary['macro_mota_percent']:.6f}% at IoU 0.1</p></header>" + cards + '</html>', encoding='utf-8')
    print(json.dumps({'assets': len(assets), 'output': str(directory), 'macro_mota_percent': primary['macro_mota_percent']}), flush=True)


if __name__ == '__main__':
    main()
