import argparse
import configparser
import hashlib
import json
from pathlib import Path

from runtime_paths import PACKAGE_ROOT, resolve_data_root

parser = argparse.ArgumentParser()
parser.add_argument('--workspace', type=Path, default=PACKAGE_ROOT / 'workspace')
parser.add_argument('--data-root', type=Path, default=None, help='directory that contains MOT20/ (default: data/)')
parser.add_argument('--gt-only', action='store_true', help='check gt.txt and seqinfo.ini only (no frame images)')
args = parser.parse_args()
package = PACKAGE_ROOT
from prepare_weights import restore_weights
restore_weights(package)
workspace = args.workspace.expanduser().resolve()
data_root = resolve_data_root(workspace, args.data_root)
manifest = json.loads((package / 'models' / 'MODEL_MANIFEST.json').read_text())
for item in manifest:
    target = package / item['path']
    if target.stat().st_size != item['bytes'] or hashlib.file_digest(target.open('rb'), 'sha256').hexdigest() != item['sha256']:
        raise RuntimeError('Model file mismatch: ' + item['path'])
lengths = {'MOT20-01': 429, 'MOT20-02': 2782, 'MOT20-03': 2405, 'MOT20-05': 3315}
ground_truth = {
    'MOT20-01': '89fd0196d67a5eb6011a470dc2a49b02255403b49e8848031cdf99add8a36d9c',
    'MOT20-02': '10abe457a67d9919a9cbfe821d3619c8e6174c2b0ed7ecf4cb68c1fd6cad58de',
    'MOT20-03': '350fbc950c6dc00e3cc8a71358b3d0b8958906c8be57a7bf5fb9db34bff70f28',
    'MOT20-05': '6da1ad9a528c39203c181aa93fc492d194358c50856695a7fe17656c928f5c17',
}
for sequence, length in lengths.items():
    folder = data_root / 'MOT20/train' / sequence
    configuration = configparser.ConfigParser()
    configuration.read(folder / 'seqinfo.ini', encoding='utf-8')
    if configuration.getint('Sequence', 'seqLength') != length:
        raise RuntimeError('Sequence length mismatch: ' + sequence)
    for frame in ([] if args.gt_only else range(1, length + 1)):
        if not (folder / 'img1' / f'{frame:06d}.jpg').is_file():
            raise RuntimeError('Image is missing: ' + sequence + '/' + str(frame))
    actual = hashlib.file_digest((folder / 'gt/gt.txt').open('rb'), 'sha256').hexdigest()
    if actual != ground_truth[sequence]:
        raise RuntimeError('Ground truth mismatch: ' + sequence)
result = {'passed': True, 'scope': 'ground truth only' if args.gt_only else 'ground truth and frame images', 'model_files_verified': len(manifest), 'model_hash_mismatches': 0, 'sequence_frames': lengths, 'frames_total': sum(lengths.values()), 'ground_truth_sha256': ground_truth}
print(json.dumps(result, indent=2), flush=True)
