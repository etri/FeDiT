from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
import argparse
import json
import os
from pathlib import Path
import sys
import numpy as np

parser=argparse.ArgumentParser()
parser.add_argument('--sequence',default='MOT20-03')
parser.add_argument('--validation-frames',type=int)
parser.add_argument('--validation-output',type=Path)
args=parser.parse_args()
if (args.validation_frames is None)!=(args.validation_output is None):
    parser.error('validation-frames and validation-output must be used together')
if args.validation_frames is not None and args.validation_frames<1:
    parser.error('validation-frames must be positive')
root=RUN_ROOT
sys.path[:0]=[str(root/'src'),str(root/'scripts')]
from detection_io import DetectionSet,make_detection_set,save_detections
from filter_detections import _filter_sequence
from mot20_io import load_sequences
from nms import standard_nms
from vlm_conditioner import _frame_features,load_conditioner_model,predict_conditioner_probability
sequence=load_sequences(root/'data/MOT20/train',[args.sequence])[0]
model=load_conditioner_model(root/'outputs/models/vlm_conditioner_strictcv3315_rescue_v1_f03.pkl')
params={'score_threshold':0.25,'nms_iou_threshold':0.5,'min_box_area':700,'min_height':28,'min_width':14,'min_height_width_ratio':1.0,'max_height_width_ratio':7.0,'top_k':800,'score_bias':0.08}
tags=['fold03_raw17_filtered','fold03_historical_conditioned']
output_root=args.validation_output or root/'outputs/detections'
outputs={tag:output_root/tag/f'{args.sequence}.npz' for tag in tags}
if all(path.exists() for path in outputs.values()):
    raise SystemExit(0)
collected={tag:{} for tag in tags}
seen=set()
for line in (root/'raw-grounding'/f'{args.sequence}.jsonl').open():
    raw=json.loads(line)
    frame=int(raw['frame_idx'])
    if frame in seen:
        raise ValueError('Duplicate raw frame')
    if args.validation_frames is not None and len(seen)>=args.validation_frames:
        break
    seen.add(frame)
    count=len(raw['scores'])
    source=make_detection_set(frames=[frame]*count,boxes=raw['grounding_boxes'],raw_scores=raw['scores'],image_widths=[raw['image_width']]*count,image_heights=[raw['image_height']]*count,prompt_texts=[raw['prompt']]*count)
    filtered=_filter_sequence(source,params)
    indices=np.arange(count,dtype=np.int64)
    probabilities=np.clip(predict_conditioner_probability(model,_frame_features(source,indices,sequence)),0,1).astype(np.float32)
    selected=indices[(probabilities>=0.3137)&(source.raw_scores>=0.0)]
    if len(selected):
        selected=selected[standard_nms(source.boxes[selected],probabilities[selected],0.85)]
    if len(selected)>700:
        selected=selected[np.argsort(-probabilities[selected])[:700]]
    values={field:getattr(source,field)[selected] for field in source.__slots__}
    values['calibrated_scores']=probabilities[selected]
    conditioned=DetectionSet(**values)
    for tag,result in zip(tags,[filtered,conditioned]):
        for field in result.__slots__:
            array=getattr(result,field)
            if field=='prompt_texts':
                array=array.astype(object)
            collected[tag].setdefault(field,[]).append(array)
expected=args.validation_frames or sequence.seq_length
if seen!=set(range(1,expected+1)):
    raise RuntimeError('Incomplete image inference coverage')
for tag,path in outputs.items():
    arrays={field:np.concatenate(values) for field,values in collected[tag].items()}
    arrays['prompt_texts']=arrays['prompt_texts'].astype(str)
    path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix('.tmp.npz')
    save_detections(temporary,DetectionSet(**arrays))
    temporary.replace(path)
    (path.parent/f'{args.sequence}.metadata.json').write_text(json.dumps({'sequence':args.sequence,'frames':len(seen),'raw_filter_params':params if tag==tags[0] else None,'conditioner_threshold':0.3137 if tag==tags[1] else None,'conditioner_nms_iou':0.85 if tag==tags[1] else None,'model_training_executed':False,'ground_truth_used_for_inference':False,'rows':len(arrays['frames']),'validation_only':args.validation_frames is not None},indent=2))
    print(tag,len(arrays['frames']),flush=True)
