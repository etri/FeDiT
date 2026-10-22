from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
from contextlib import nullcontext
import json
import hashlib
import os
from pathlib import Path
import sys
import time

work=WORK_ROOT
root=RUN_ROOT
sys.path[:0]=[str(root/'src'),str(root/'scripts'),str(PACKAGE_ROOT)]
os.environ['HF_HUB_CACHE']=str(root/'weights/hub')
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
import numpy as np
import torch
import yaml
import sahi.postprocess.combine as combine
import ir_autolabeling.detectors.grounded_sam2_detector as module
from nmm_accelerator import nmm

torch.set_num_threads(1)
torch.set_num_interop_threads(1)
torch.backends.cuda.matmul.allow_tf32=False
torch.backends.cudnn.allow_tf32=False
module._autocast_for=lambda device:nullcontext()
original=combine.nmm
comparisons=[]

def checked(predictions,match_metric='IOU',match_threshold=0.5):
    started=time.perf_counter()
    expected=original(predictions,match_metric,match_threshold)
    original_seconds=time.perf_counter()-started
    started=time.perf_counter()
    actual=nmm(predictions,match_metric,match_threshold)
    optimized_seconds=time.perf_counter()-started
    same=list(expected.items())==list(actual.items())
    row={'input_boxes':len(predictions),'match_metric':match_metric,'threshold':match_threshold,'same_ordered_merge_map':same,'original_seconds':original_seconds,'optimized_seconds':optimized_seconds}
    comparisons.append(row)
    cases=work/'logs/nmm-reference-cases'
    cases.mkdir(exist_ok=True)
    index=len(comparisons)
    torch.save(predictions.detach().cpu(),cases/f'{index:02d}.pt')
    (cases/f'{index:02d}.json').write_text(json.dumps({'expected':list(expected.items()),'match_metric':match_metric,'match_threshold':match_threshold}))
    print(json.dumps(row),flush=True)
    if not same:
        raise AssertionError('NMM merge mapping changed')
    return actual

combine.nmm=checked
config=yaml.safe_load((root/'configs/full_cache_extend_mot20_01.yaml').read_text())['detector']
config['grounding_device']='cuda'
config['sam2_device']='cuda'
detector=module.GroundedSam2Detector(module.GroundedSam2Config.from_dict(config))
frames=[]
for sequence,frame in [('MOT20-01',1),('MOT20-02',1),('MOT20-03',1),('MOT20-05',1)]:
    result=detector.detect(root/f'data/MOT20/train/{sequence}/img1/{frame:06d}.jpg',frame)
    record={'sequence':sequence,'frame':frame,'raw_detections':len(result.scores)}
    frames.append(record)
    print(json.dumps(record),flush=True)
    (work/'logs/nmm-reference-validation-progress.json').write_text(json.dumps({'comparisons':comparisons,'frames':frames},indent=2))
if not all(row['same_ordered_merge_map'] for row in comparisons):
    raise AssertionError('At least one NMM comparison failed')
proof={'passed':True,'torch_version':torch.__version__,'numpy_version':np.__version__,'module_sha256':hashlib.file_digest((PACKAGE_ROOT/'nmm_accelerator.py').open('rb'),'sha256').hexdigest(),'comparisons':comparisons,'frames':frames}
(work/'logs/nmm-reference-validation.json').write_text(json.dumps(proof,indent=2))
print('NMM_VALIDATION_COMPLETE',flush=True)
