from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
import argparse
import json
import os
from pathlib import Path
import sys
import numpy as np

parser=argparse.ArgumentParser()
parser.add_argument('--sequence',required=True)
args=parser.parse_args()
root=RUN_ROOT
sys.path[:0]=[str(root/'src'),str(root/'scripts')]
from detection_io import DetectionSet, load_detections, make_detection_set
from fuse_detection_dirs import _concat, _subset, _valid_indices, _topk_per_frame, _sort_detection_set
from nms import apply_nms_to_set
source_name='strictcv3315_vlmraw_prefilter_top1000_nms070_k600'
expanded_name='expanded_person_native_v1_full'
tag='original_sahi_k600_expanded_native_union_nms070_k1000_partial'
destination=root/'outputs/detections'/tag/f'{args.sequence}.npz'
if destination.exists():
    raise SystemExit(0)
source=load_detections(root/'outputs/detections'/source_name/f'{args.sequence}.npz')
by_frame=source.by_frame()
collected={}
seen=set()
counts={'sources':2,'before_nms':0,'after_nms':0,'final':0}
with (root/'raw-expanded'/f'{args.sequence}.jsonl').open() as stream:
    for line in stream:
        raw=json.loads(line)
        frame=int(raw['frame_idx'])
        if frame in seen:
            raise AssertionError('Duplicate frame')
        seen.add(frame)
        indices=by_frame.get(frame,np.zeros(0,dtype=np.int64))
        count=len(raw['scores'])
        native=make_detection_set(frames=[frame]*count,boxes=raw['grounding_boxes'],raw_scores=raw['scores'],image_widths=[raw['image_width']]*count,image_heights=[raw['image_height']]*count,prompt_texts=[raw['prompt']]*count)
        fused=_concat([_subset(source,indices),native],[f's0_{source_name}',f's1_{expanded_name}'])
        fused=_subset(fused,_valid_indices(fused))
        counts['before_nms']+=len(fused)
        fused=apply_nms_to_set(fused,nms_type='standard',iou_threshold=0.7,sigma=0.5)
        counts['after_nms']+=len(fused)
        fused=_sort_detection_set(_topk_per_frame(fused,1000))
        counts['final']+=len(fused)
        for field in fused.__slots__:
            values=getattr(fused,field)
            if field=='prompt_texts':
                values=values.astype(object)
            collected.setdefault(field,[]).append(values)
expected={'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}[args.sequence]
assert seen==set(range(1,expected+1))
arrays={field:np.concatenate(values) for field,values in collected.items()}
arrays['prompt_texts']=arrays['prompt_texts'].astype(str)
destination.parent.mkdir(parents=True,exist_ok=True)
temporary=destination.with_suffix('.tmp.npz')
np.savez_compressed(temporary,**arrays)
temporary.replace(destination)
(destination.parent/f'{args.sequence}.stream_metadata.json').write_text(json.dumps({'source':source_name,'expanded_source':str(root/'raw-expanded'),'parameters':{'nms_type':'standard','nms_iou':0.7,'top_k_per_frame':1000},'coverage_frames':len(seen),'expected_frames':expected,'counts':counts,'ground_truth_used_for_inference':False},indent=2))
print('STREAMED_UNION_COMPLETE',args.sequence,counts,flush=True)
