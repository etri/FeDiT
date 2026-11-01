from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
import argparse
import gc
import json
import os
from pathlib import Path
import sys
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--sequence',required=True)
parser.add_argument('--validate',action='store_true')
args = parser.parse_args()
root = RUN_ROOT
sys.path[:0] = [str(root/'src'),str(root/'scripts')]
from detection_io import make_detection_set, load_detections
from filter_detections import _filter_sequence
params = {'score_threshold':0.01,'nms_iou_threshold':0.7,'pre_nms_top_k':1000,'top_k':600,'min_box_area':16,'min_height':4,'min_width':2,'min_height_width_ratio':0.2,'max_height_width_ratio':20}
tag = 'strictcv3315_vlmraw_prefilter_top1000_nms070_k600'
output = root/'outputs/detections'/tag
output.mkdir(parents=True,exist_ok=True)
destination = output/f'{args.sequence}.npz'
if destination.exists() and not args.validate:
    raise SystemExit(0)
parts = {}
seen = set()
with (root/f'raw-grounding/{args.sequence}.jsonl').open() as stream:
    for line in stream:
        raw = json.loads(line)
        frame = int(raw['frame_idx'])
        if frame in seen:
            raise AssertionError('Duplicate raw frame')
        seen.add(frame)
        count = len(raw['scores'])
        detections = make_detection_set(frames=[frame]*count,boxes=raw['grounding_boxes'],raw_scores=raw['scores'],image_widths=[raw['image_width']]*count,image_heights=[raw['image_height']]*count,prompt_texts=[raw['prompt']]*count)
        filtered = _filter_sequence(detections,params)
        for field in filtered.__slots__:
            parts.setdefault(field,[]).append(getattr(filtered,field))
expected = {'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}[args.sequence]
assert seen == set(range(1,expected+1)), 'Incomplete frame coverage'
arrays = {field:np.concatenate(values) for field,values in parts.items()}
if args.validate:
    original = load_detections(destination)
    differences = [field for field,array in arrays.items() if not np.array_equal(array,getattr(original,field))]
    assert not differences, differences
    (root/'stream-filter-equivalence.json').write_text(json.dumps({'passed':True,'sequence':args.sequence,'frames':expected,'detections':len(arrays['frames']),'all_fields_equal':True},indent=2))
else:
    arrays['prompt_texts'] = arrays['prompt_texts'].astype(str)
    temporary = destination.with_suffix('.tmp.npz')
    np.savez_compressed(temporary,**arrays)
    temporary.replace(destination)
    (output/f'{args.sequence}.stream_metadata.json').write_text(json.dumps({'source':str(root/'raw-grounding'),'params':params,'coverage_frames':len(seen),'expected_frames':expected,'no_model_change':True},indent=2))
print('STREAM_IMPORT_COMPLETE',args.sequence,len(arrays['frames']),flush=True)
