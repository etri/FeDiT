import argparse
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--workspace', type=Path, required=True)
parser.add_argument('--run-root', type=Path, required=True)
args = parser.parse_args()
source = args.source.expanduser().resolve()
workspace = args.workspace.expanduser().resolve()
root = args.run_root.expanduser().resolve()
package = Path(__file__).resolve().parent
if source == root:
    raise ValueError('Source and destination runs must differ')
recipe = json.loads((source / 'precision-recipe.json').read_text())
if recipe['osnet_batch_size'] != 600 or recipe['cuda_matmul_tf32'] or recipe['cudnn_tf32']:
    raise RuntimeError('Backbone cache precision does not match the runtime')
feature_relative = Path('outputs/features/strictcv3315_vlmraw_prefilter_k600_osnet_msmt17_128x64')
feature_metadata = json.loads((source / feature_relative / 'metadata.json').read_text())
if feature_metadata['batch_size'] != 600 or feature_metadata['crop_height'] != 128 or feature_metadata['crop_width'] != 64 or feature_metadata['dtype'] != 'float16':
    raise RuntimeError('OSNet cache settings do not match the runtime')
lengths = {'MOT20-01': 429, 'MOT20-02': 2782, 'MOT20-03': 2405, 'MOT20-05': 3315}
manifest = json.loads((package / 'MODEL_MANIFEST.json').read_text())


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


weights = {}
for item in manifest:
    relative = item['path']
    if relative.startswith('artifacts/reid/') or relative.endswith('model.safetensors'):
        actual = digest(source / relative)
        if actual != item['sha256']:
            raise RuntimeError('Cached backbone weight mismatch: ' + relative)
        weights[relative] = actual
images = {}
for sequence, length in lengths.items():
    for frame in range(1, length + 1):
        relative = Path('data/MOT20/train') / sequence / 'img1' / f'{frame:06d}.jpg'
        expected = digest(source / relative)
        actual = digest(workspace / relative)
        if actual != expected:
            raise RuntimeError('Cached image differs from the inference input: ' + str(relative))
        images[str(relative)] = actual
    print('CACHE_IMAGE_INPUTS_VERIFIED', sequence, length, flush=True)
paths = []
coverage = {}
for sequence, length in lengths.items():
    for directory in ['raw-grounding', 'raw-expanded']:
        relative = Path(directory) / (sequence + '.jsonl')
        if directory == 'raw-expanded' and sequence == 'MOT20-01':
            continue
        frames = set()
        with (source / relative).open() as stream:
            for line in stream:
                frame = int(json.loads(line)['frame_idx'])
                if frame in frames:
                    raise RuntimeError('Duplicate cached frame: ' + str(relative))
                frames.add(frame)
        if frames != set(range(1, length + 1)):
            raise RuntimeError('Incomplete cached sequence: ' + str(relative))
        paths.append(relative)
        coverage[str(relative)] = len(frames)
    relative = Path('outputs/detections/strictcv3315_vlmraw_prefilter_top1000_nms070_k600') / (sequence + '.npz')
    with np.load(source / relative) as detections:
        rows = len(detections['frames'])
    embedding_relative = feature_relative / (sequence + '.npy')
    embeddings = np.load(source / embedding_relative, mmap_mode='r')
    if embeddings.shape != (rows, 512) or embeddings.dtype != np.float16:
        raise RuntimeError('Cached embeddings do not align with detections: ' + sequence)
    del embeddings
    paths.extend([relative, embedding_relative])
    if sequence == 'MOT20-01':
        paths.append(Path('outputs/detections/imported_full3315_grounded_sam2_sahi_v2_grounding') / (sequence + '.npz'))
    else:
        paths.append(Path('outputs/detections/original_sahi_k600_expanded_native_union_nms070_k1000_partial') / (sequence + '.npz'))
files = {}
for relative in paths:
    original = (source / relative).resolve()
    target = root / relative
    if target.exists() or target.is_symlink():
        if not target.is_symlink() or target.resolve() != original:
            raise RuntimeError('The run already contains a different cache: ' + str(relative))
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.symlink_to(original)
    files[str(relative)] = {'sha256': digest(original), 'bytes': original.stat().st_size}
for relative in [feature_relative / 'metadata.json', Path('outputs/detections/strictcv3315_vlmraw_prefilter_top1000_nms070_k600/metadata.json')]:
    target = root / relative
    if not target.exists() and (source / relative).exists():
        shutil.copy2(source / relative, target)
proof = {'passed': True, 'source_run': str(source), 'image_inputs_verified': sum(lengths.values()), 'image_sha256': images, 'backbone_weights_sha256': weights, 'raw_frame_coverage': coverage, 'cache_files': files, 'reused_content': ['frozen GroundingDINO detections', 'frozen OSNet embeddings', 'deterministic detection prefilter and union'], 'learned_conditioner_outputs_reused': False, 'tracker_predictions_reused': False, 'ground_truth_used_for_cache_matching': False}
(root / 'backbone-cache-proof.json').write_text(json.dumps(proof, indent=2))
print('FROZEN_BACKBONE_CACHE_VERIFIED', json.dumps({'images': sum(lengths.values()), 'files': len(files), 'learned_conditioner_outputs_reused': False, 'tracker_predictions_reused': False}), flush=True)
