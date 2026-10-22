from runtime_paths import WORK_ROOT
from datetime import datetime, timezone
import importlib
import importlib.metadata
import json
from pathlib import Path
import sys
import torch

work=WORK_ROOT
(work/'logs').mkdir(parents=True,exist_ok=True)
packages=['torch','torchvision','transformers','numpy','scipy','pandas','scikit-learn','boxmot','sahi','shapely','cython_bbox','lap']
versions={name:importlib.metadata.version(name) for name in packages}
expected={'torch':'2.11.0+cu126','torchvision':'0.26.0+cu126','transformers':'5.3.0','numpy':'2.4.4','scipy':'1.17.1','pandas':'2.3.3','scikit-learn':'1.6.1','boxmot':'17.0.0','sahi':'0.11.36','shapely':'2.1.2','cython_bbox':'0.1.5','lap':'0.5.13'}
differences={name:{'expected':value,'actual':versions[name]} for name,value in expected.items() if versions[name]!=value}
if differences or sys.version_info[:2]!=(3,11):
    raise RuntimeError('Inference runtime does not match the selected profile: '+json.dumps(differences))
for name in ['torchvision','transformers','numpy','scipy','pandas','sklearn','boxmot','sahi','shapely','cython_bbox','lap']:
    importlib.import_module(name)
if importlib.import_module('lap').__version__!='0.5.13':
    raise RuntimeError('The imported LAP module does not match lap==0.5.13')
torch.set_num_threads(1)
torch.backends.cuda.matmul.allow_tf32=False
torch.backends.cudnn.allow_tf32=False
torch.set_float32_matmul_precision('highest')
if not torch.cuda.is_available():
    raise RuntimeError('CUDA is unavailable')
tests={}
with torch.inference_mode():
    matrix=torch.randn(64,64,device='cuda')
    tests['matmul_finite']=bool(torch.isfinite(matrix@matrix).all())
    image=torch.randn(2,3,64,64,device='cuda')
    weight=torch.randn(8,3,3,3,device='cuda')
    tests['convolution_finite']=bool(torch.isfinite(torch.nn.functional.conv2d(image,weight)).all())
    grid=torch.rand(2,16,16,2,device='cuda')*2-1
    tests['grid_sample_finite']=bool(torch.isfinite(torch.nn.functional.grid_sample(image,grid,align_corners=False)).all())
    torch.cuda.synchronize()
if not all(tests.values()):
    raise RuntimeError('CUDA operation failed')
result={'passed':True,'python':sys.version,'versions':versions,'gpu':torch.cuda.get_device_name(0),'cuda_runtime':torch.version.cuda,'tests':tests,'created_at':datetime.now(timezone.utc).isoformat()}
(work/'logs/reference-runtime-check.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2),flush=True)
