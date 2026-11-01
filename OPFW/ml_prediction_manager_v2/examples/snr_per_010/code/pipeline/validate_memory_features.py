from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
import json
import os
from pathlib import Path
import sys
import numpy as np
root=RUN_ROOT
sys.path[:0]=[str(root/'src'),str(root/'scripts')]
import torch
from detection_io import load_detections
from mot20_io import load_sequences
from osnet_quality_conditioner import _load_embeddings, _quality_geometry_features, _predict, OSNetQualityConditioner
from memory_features import JoinedFeatures
torch.set_num_threads(2)
torch.backends.cuda.matmul.allow_tf32=False
torch.backends.cudnn.allow_tf32=False
detections=load_detections(root/'outputs/detections/strictcv3315_vlmraw_prefilter_top1000_nms070_k600/MOT20-01.npz')
embeddings=_load_embeddings(root/'outputs/features/strictcv3315_vlmraw_prefilter_k600_osnet_msmt17_128x64','MOT20-01',len(detections))
sequence=load_sequences(root/'data/MOT20/train',['MOT20-01'])[0]
payload=torch.load(root/'outputs/models/strictcv3315_vlmosnet_quality_f01_relational_hq_v6_e12.pt',map_location='cpu',weights_only=False)
metadata=payload['metadata']
model=OSNetQualityConditioner(metadata['input_dim'],metadata['hidden_dim']).to('cuda')
model.load_state_dict(payload['state_dict'])
geometry=np.empty((len(detections),len(metadata['geometry_feature_names'])),dtype=np.float32)
for _,indices in sorted(detections.by_frame().items()):
    geometry[indices]=_quality_geometry_features(detections,indices,sequence,metadata['geometry_feature_names'])
arguments={'mean':np.asarray(payload['mean'],dtype=np.float32),'scale':np.asarray(payload['scale'],dtype=np.float32),'device':'cuda','batch_size':4096}
expected=_predict(model,np.concatenate([geometry,np.asarray(embeddings,dtype=np.float32)],axis=1),**arguments)
actual=_predict(model,JoinedFeatures(geometry,embeddings),**arguments)
assert all(np.array_equal(a,b) for a,b in zip(expected,actual))
(root/'memory-feature-equivalence.json').write_text(json.dumps({'passed':True,'sequence':'MOT20-01','detections':len(detections),'batch_size':4096,'scores_identical':True,'deltas_identical':True},indent=2))
print('MEMORY_FEATURE_EQUIVALENCE_VERIFIED',flush=True)
