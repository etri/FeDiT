from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
from contextlib import nullcontext
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import time

parser = argparse.ArgumentParser()
parser.add_argument('--sequence', required=True, choices=['MOT20-01','MOT20-02','MOT20-03','MOT20-05'])
parser.add_argument('--expanded', action='store_true')
args = parser.parse_args()
work = WORK_ROOT
root = RUN_ROOT
os.chdir(root)
sys.path[:0] = [str(root/'src'), str(root/'scripts')]
os.environ['HF_HUB_CACHE'] = str(root/'weights/hub')
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['OMP_NUM_THREADS'] = '2'
os.environ['MKL_NUM_THREADS'] = '2'
proof_path=Path(os.environ.get('SNR010_NMM_PROOF',str(work/'logs/nmm-reference-validation.json')))
proof = json.loads(proof_path.read_text())
if not proof.get('passed') or proof['module_sha256'] != hashlib.sha256((PACKAGE_ROOT/'nmm_accelerator.py').read_bytes()).hexdigest():
    raise RuntimeError('Unverified accelerator')
from nmm_accelerator import install
install()
import torch
import yaml
import ir_autolabeling.detectors.grounded_sam2_detector as module
torch.set_num_threads(2)
torch.set_num_interop_threads(1)
torch.backends.cuda.matmul.allow_tf32 = False
torch.backends.cudnn.allow_tf32 = False
module._autocast_for = lambda device: nullcontext()
lengths = {'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}
mode = 'expanded' if args.expanded else 'grounding'
directory = root/f'raw-{mode}'
directory.mkdir(exist_ok=True)
cache = directory/f'{args.sequence}.jsonl'
finished = set()
if cache.exists():
    with cache.open() as stream:
        for line in stream:
            finished.add(int(json.loads(line)['frame_idx']))
expected = lengths[args.sequence]
if finished == set(range(1,expected+1)):
    print('COMPLETE_CACHE', args.sequence, mode, flush=True)
    raise SystemExit(0)
config_name = 'full_cache_groundingdino_expanded_person_native_mps.yaml' if args.expanded else 'full_cache_extend_mot20_01.yaml'
config = yaml.safe_load((root/'configs'/config_name).read_text())['detector']
config['grounding_device'] = config['sam2_device'] = 'cuda'
detector = module.GroundedSam2Detector(module.GroundedSam2Config.from_dict(config))
with cache.open('a') as stream:
    for frame in range(1,expected+1):
        if frame in finished:
            continue
        if (root/'STOP_REMAINING').exists():
            raise KeyboardInterrupt('STOP_REMAINING requested')
        started = time.perf_counter()
        result = detector.detect(root/f'data/MOT20/train/{args.sequence}/img1/{frame:06d}.jpg',frame)
        if detector.grounding_device!='cuda':
            raise RuntimeError('GPU detector initialization failed; CPU fallback is disabled')
        torch.cuda.synchronize()
        stream.write(json.dumps(result.to_json_dict())+'\n')
        stream.flush()
        finished.add(frame)
        state = {'sequence':args.sequence,'mode':mode,'frames_complete':len(finished),'frames_expected':expected,'last_frame_seconds':time.perf_counter()-started,'device':'NVIDIA A40 / CUDA','precision':'float32; TF32 disabled','model_training_executed':False,'updated_at':datetime.now(timezone.utc).isoformat()}
        destination = root/'remaining-detector-progress.json'
        temporary = destination.with_suffix('.tmp')
        temporary.write_text(json.dumps(state,indent=2))
        temporary.replace(destination)
        print(json.dumps(state),flush=True)
assert finished == set(range(1,expected+1))
