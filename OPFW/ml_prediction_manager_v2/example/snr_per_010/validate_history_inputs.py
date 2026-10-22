from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import numpy as np

root=RUN_ROOT
sys.path[:0]=[str(root/'src'),str(root/'scripts')]
from detection_io import load_detections,make_detection_set,save_detections
from filter_detections import _filter_sequence
from mot20_io import load_sequences
from vlm_conditioner import apply_conditioner_to_dir
output=root/'history-input-equivalence'
output.mkdir(exist_ok=True)
subprocess.run([sys.executable,str(PACKAGE_ROOT/'historical_fold03_inputs.py'),'--sequence','MOT20-01','--validation-frames','20','--validation-output',str(output/'stream')],check=True)
frames=[]
boxes=[]
scores=[]
widths=[]
heights=[]
prompts=[]
with (root/'raw-grounding/MOT20-01.jsonl').open() as stream:
    for index,line in enumerate(stream):
        if index>=20:
            break
        raw=json.loads(line)
        count=len(raw['scores'])
        frames.extend([raw['frame_idx']]*count)
        boxes.extend(raw['grounding_boxes'])
        scores.extend(raw['scores'])
        widths.extend([raw['image_width']]*count)
        heights.extend([raw['image_height']]*count)
        prompts.extend([raw['prompt']]*count)
source=make_detection_set(frames=frames,boxes=boxes,raw_scores=scores,image_widths=widths,image_heights=heights,prompt_texts=prompts)
params={'score_threshold':0.25,'nms_iou_threshold':0.5,'min_box_area':700,'min_height':28,'min_width':14,'min_height_width_ratio':1.0,'max_height_width_ratio':7.0,'top_k':800,'score_bias':0.08}
expected=_filter_sequence(source,params)
actual=load_detections(output/'stream/fold03_raw17_filtered/MOT20-01.npz')
assert all(np.array_equal(getattr(expected,field),getattr(actual,field)) for field in expected.__slots__)
save_detections(output/'input/MOT20-01.npz',source)
apply_conditioner_to_dir(model_path=root/'outputs/models/vlm_conditioner_strictcv3315_rescue_v1_f03.pkl',source_dir=output/'input',target_dir=output/'original',sequences=load_sequences(root/'data/MOT20/train',['MOT20-01']),sequence_names=['MOT20-01'],threshold=0.3137,blend_raw=0,score_floor=0,top_k=700,nms_iou=0.85,overwrite=True)
expected=load_detections(output/'original/MOT20-01.npz')
actual=load_detections(output/'stream/fold03_historical_conditioned/MOT20-01.npz')
differences=[field for field in expected.__slots__ if not np.array_equal(getattr(expected,field),getattr(actual,field))]
assert not differences,differences
proof={'passed':True,'frames':20,'raw_detections':len(source),'raw17_all_fields_equal':True,'conditioner_all_fields_equal':True,'conditioned_detections':len(actual),'module_sha256':hashlib.file_digest((PACKAGE_ROOT/'historical_fold03_inputs.py').open('rb'),'sha256').hexdigest(),'ground_truth_used':False,'model_training_executed':False}
(root/'history-input-equivalence.json').write_text(json.dumps(proof,indent=2))
print(json.dumps(proof,indent=2),flush=True)
