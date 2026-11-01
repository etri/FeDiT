import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

from runtime_paths import PACKAGE_ROOT, PIPELINE_ROOT, CODE_ROOT, PROFILE_PATH, resolve_data_root

parser=argparse.ArgumentParser()
parser.add_argument('--workspace',type=Path,default=PACKAGE_ROOT/'workspace')
parser.add_argument('--data-root',type=Path,default=None,help='directory that contains MOT20/ (default: data/)')
parser.add_argument('--run-name',default='inference')
parser.add_argument('--reuse-backbone-cache',type=Path)
args=parser.parse_args()
if not args.run_name or Path(args.run_name).name!=args.run_name or args.run_name in {'.','..'}:
    raise ValueError('run-name must be one directory name')
package=PACKAGE_ROOT
from prepare_weights import restore_weights
restore_weights(package)
profile_path=PROFILE_PATH
profile=json.loads(profile_path.read_text())
if not profile.get('target_verified') or not isinstance(profile.get('verified_macro_mota_percent'),(int,float)) or profile['verified_macro_mota_percent']<80:
    raise RuntimeError('The inference operating-point profile has not passed the MOTA 80 target')
work=args.workspace.expanduser().resolve()
data_root=resolve_data_root(work,args.data_root)
root=work/'runs'/args.run_name
root.mkdir(parents=True,exist_ok=True)
source_version={}
for key,arguments in [('commit',['rev-parse','HEAD']),('branch',['branch','--show-current']),('repository',['remote','get-url','origin'])]:
    completed=subprocess.run(['git','-C',str(package),*arguments],capture_output=True,text=True)
    source_version[key]=completed.stdout.strip() if completed.returncode==0 else None
(root/'source-version.json').write_text(json.dumps(source_version,indent=2))
(work/'logs').mkdir(exist_ok=True)
models=json.loads((package/'models'/'MODEL_MANIFEST.json').read_text())
for item in models:
    file=package/item['path']
    if file.stat().st_size!=item['bytes'] or hashlib.file_digest(file.open('rb'),'sha256').hexdigest()!=item['sha256']:
        raise RuntimeError('Model verification failed: '+item['path'])
lengths={'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}
for sequence,length in lengths.items():
    images=data_root/'MOT20/train'/sequence/'img1'
    if any(not (images/f'{frame:06d}.jpg').is_file() for frame in range(1,length+1)):
        raise RuntimeError('Dataset is incomplete: '+sequence)
recipe={'format':2,'osnet_batch_size':600,'cuda_matmul_tf32':False,'cudnn_tf32':False,'float32_matmul_precision':'highest','backbone_cache_source':str(args.reuse_backbone_cache.expanduser().resolve()) if args.reuse_backbone_cache else None,'inference_profile_sha256':hashlib.file_digest(profile_path.open('rb'),'sha256').hexdigest()}
recipe_path=root/'runtime-recipe.json'
if recipe_path.exists():
    if json.loads(recipe_path.read_text())!=recipe:
        raise RuntimeError('Runtime settings differ from this run; use a new run-name')
elif any((root/name).exists() for name in ['progress.json','remaining-progress.json']):
    raise RuntimeError('This run has no precision record; use a new run-name')
else:
    recipe_path.write_text(json.dumps(recipe,indent=2))
for directory in ['src','scripts','configs','external/TrackEval']:
    if not (root/directory).exists():
        shutil.copytree(CODE_ROOT/directory,root/directory)
for destination,source in [(root/'data',data_root),(root/'weights',package/'models/weights'),(root/'artifacts/reid',package/'models/reid'),(root/'outputs/models',package/'models/checkpoints')]:
    destination.parent.mkdir(parents=True,exist_ok=True)
    if not destination.exists():
        destination.symlink_to(source,target_is_directory=True)
env=os.environ.copy()
env.update(SNR010_WORK_ROOT=str(work),SNR010_RUN_ROOT=str(root),SNR010_DELIVERY_ROOT=str(package),SNR010_DATA_ROOT=str(data_root),SNR010_NMM_PROOF=str(work/'logs/nmm-reference-validation.json'),PYTHONUNBUFFERED='1',OMP_NUM_THREADS='2',MKL_NUM_THREADS='2')
commands=[
    ['verify_inputs.py','--workspace',str(work),'--data-root',str(data_root)],
    ['check_reference_runtime.py'],
    ['validate_nmm_reference.py'],
    ['run_fresh_fold01_reference.py'],
    ['validate_history_inputs.py'],
    ['run_fresh_remaining.py'],
    ['apply_inference_profile.py'],
    ['assemble_results.py','--run-root',str(root),'--output',str(work/'results'/args.run_name),'--dataset-root',str(data_root/'MOT20'),'--trackeval-root',str(root/'external/TrackEval')],
]
if args.reuse_backbone_cache:
    commands.insert(2,['reuse_backbone_cache.py','--source',str(args.reuse_backbone_cache),'--workspace',str(work),'--run-root',str(root),'--data-root',str(data_root)])
for arguments in commands:
    print('STAGE',arguments[0],flush=True)
    subprocess.run([sys.executable,str(PIPELINE_ROOT/arguments[0]),*arguments[1:]],cwd=PIPELINE_ROOT,env=env,check=True)
metrics=json.loads((work/'results'/args.run_name/'evaluation/metrics.json').read_text())
shutil.copy2(root/'source-version.json',work/'results'/args.run_name/'source-version.json')
primary=next(item for item in metrics['evaluations'] if item['match_iou']==0.1)
if not metrics['complete_four_fold_scope'] or primary['macro_mota_percent']<80:
    raise RuntimeError('The four-sequence arithmetic mean has not reached MOTA 80')
print('MOTA_TARGET_VERIFIED',format(primary['macro_mota_percent'],'.6f')+'%',flush=True)
print('INFERENCE_AND_EVALUATION_COMPLETE',str(work/'results'/args.run_name),flush=True)
