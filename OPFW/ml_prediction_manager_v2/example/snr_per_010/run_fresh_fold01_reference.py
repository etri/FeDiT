from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
from contextlib import nullcontext
from datetime import datetime, timezone
import json
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

PROFILE=json.loads((PACKAGE_ROOT/'INFERENCE_PROFILE.json').read_text())
work=WORK_ROOT
delivery=DELIVERY_ROOT
root=RUN_ROOT
root.mkdir(parents=True,exist_ok=True)
for directory in ['src','scripts','configs','external/TrackEval']:
    if not (root/directory).exists():
        shutil.copytree(delivery/directory,root/directory)
for destination,source in [(root/'data',work/'data'),(root/'weights',delivery/'weights'),(root/'artifacts/reid',delivery/'artifacts/reid'),(root/'outputs/models',delivery/'outputs/models')]:
    destination.parent.mkdir(parents=True,exist_ok=True)
    if not destination.exists():
        destination.symlink_to(source,target_is_directory=True)
common=root/'scripts/_common.py'
text=common.read_text()
if 'original_prefix =' not in text:
    text=text.replace('    resolved = Path(path).expanduser()', '    original_prefix = "/Users/user/Desktop/ir_autolabeling/"\n    path = str(path)\n    if path.startswith(original_prefix):\n        path = path[len(original_prefix):]\n    resolved = Path(path).expanduser()')
    common.write_text(text)
linker=root/'scripts/apply_osnet_tracklet_linker.py'
text=linker.read_text().replace('Path(metadata["detection_dir"]).expanduser().resolve()','rel(metadata["detection_dir"])').replace('Path(metadata["embedding_dir"]).expanduser().resolve()','rel(metadata["embedding_dir"])')
linker.write_text(text)
tracker_script=root/'scripts/run_tracker.py'
text=tracker_script.read_text().replace('        print(f"WARNING: BoxMOT tracker unavailable, using fallback IoU tracker: {exc!r}")','        raise RuntimeError("BoxMOT initialization failed; fallback is disabled") from exc')
tracker_script.write_text(text)
os.chdir(root)
sys.path[:0]=[str(root/'src'),str(root/'scripts')]
os.environ['PYTHONPATH']=':'.join(sys.path[:2])
os.environ['HF_HUB_CACHE']=str(root/'weights/hub')
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['OMP_NUM_THREADS']='2'
os.environ['MKL_NUM_THREADS']='2'
status_path=root/'progress.json'
state={'runtime_profile':'provided versions: torch2.11.0, torchvision0.26.0, transformers5.3.0, numpy2.4.4, scipy1.17.1; sklearn1.6.1 matches model fit','scope':'fresh MOT20-01 only; not complete 4-fold LOSO','full_four_fold_reproduction':False,'device':'NVIDIA A40 / CUDA','detector_precision':'float32; TF32 disabled','model_training_executed':False,'frames_expected':429,'frames_complete':0,'completed_stages':[]}
if status_path.exists():
    state.update(json.loads(status_path.read_text()))

def status(stage,**kwargs):
    state.update(stage=stage,updated_at=datetime.now(timezone.utc).isoformat(),**kwargs)
    temporary=root/'progress.tmp'
    temporary.write_text(json.dumps(state,indent=2))
    temporary.replace(status_path)
    print(json.dumps(state),flush=True)

def run(script,*args):
    label=script+' '+str(args)
    if label in state['completed_stages']:
        return
    if (root/'STOP').exists():
        raise KeyboardInterrupt('STOP requested')
    status(script)
    command=[sys.executable,str(PACKAGE_ROOT/'run_with_fp32.py'),str(root/'scripts'/script),*map(str,args)]
    subprocess.run(command,check=True)
    state['completed_stages'].append(label)
    status(script+' complete')

state.pop('error',None)
try:
    proof=json.loads((work/'logs/nmm-reference-validation.json').read_text())
    module_path=(PACKAGE_ROOT/'nmm_accelerator.py')
    if not proof.get('passed') or proof['module_sha256'] != hashlib.file_digest(module_path.open('rb'),'sha256').hexdigest():
        raise RuntimeError('NMM equivalence proof is missing or does not match deployed module')
    from nmm_accelerator import install
    install()
    import torch
    import yaml
    import ir_autolabeling.detectors.grounded_sam2_detector as detector_module
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    torch.backends.cuda.matmul.allow_tf32=False
    torch.backends.cudnn.allow_tf32=False
    detector_module._autocast_for=lambda device:nullcontext()
    raw_dir=root/'raw-grounding'
    raw_dir.mkdir(exist_ok=True)
    cache=raw_dir/'MOT20-01.jsonl'
    finished=set()
    if cache.exists():
        for line in cache.read_text().splitlines():
            finished.add(int(json.loads(line)['frame_idx']))
    state['frames_complete']=len(finished)
    if len(finished)<429:
        config=yaml.safe_load((root/'configs/full_cache_extend_mot20_01.yaml').read_text())['detector']
        config['grounding_device']='cuda'
        config['sam2_device']='cuda'
        detector=detector_module.GroundedSam2Detector(detector_module.GroundedSam2Config.from_dict(config))
        with cache.open('a') as stream:
            for frame in range(1,430):
                if frame in finished:
                    continue
                if (root/'STOP').exists():
                    raise KeyboardInterrupt('STOP requested')
                started=time.perf_counter()
                raw=detector.detect(root/f'data/MOT20/train/MOT20-01/img1/{frame:06d}.jpg',frame)
                if detector.grounding_device!='cuda':
                    raise RuntimeError('GPU detector initialization failed; CPU fallback is disabled')
                torch.cuda.synchronize()
                stream.write(json.dumps(raw.to_json_dict())+'\n')
                stream.flush()
                finished.add(frame)
                status('frozen_detector',frames_complete=len(finished),last_frame_seconds=time.perf_counter()-started,last_frame_detections=len(raw.scores))
        del detector
        torch.cuda.empty_cache()
    data=root/'data/MOT20/train'
    sequence=['--data-root',data,'--sequence-names','MOT20-01']
    detection_root=root/'outputs/detections'
    feature=root/'outputs/features/strictcv3315_vlmraw_prefilter_k600_osnet_msmt17_128x64'
    source_tag='strictcv3315_vlmraw_prefilter_top1000_nms070_k600'
    raw_tag='imported_full3315_grounded_sam2_sahi_v2_grounding'
    run('import_jsonl_detections.py','--jsonl-dir',raw_dir,'--run-name',raw_tag,*sequence)
    run('filter_detections.py','--detections',detection_root/raw_tag,'--run-name',source_tag,'--score-threshold',0.01,'--nms-iou-threshold',0.7,'--pre-nms-top-k',1000,'--top-k',600,'--min-box-area',16,'--min-height',4,'--min-width',2,'--min-height-width-ratio',0.2,'--max-height-width-ratio',20,'--sequence-names','MOT20-01')
    run('cache_osnet_crop_embeddings.py','--detections',detection_root/source_tag,'--output-dir',feature,'--weights',root/'artifacts/reid/osnet_x0_25_msmt17.pt','--device','cuda:0','--batch-size',600,*sequence)
    params=root/'tracker-params.json'
    params.write_text(json.dumps({'fuse_score':False,'match_thresh':0.8,'new_track_thresh':0.5,'track_buffer':120,'track_high_thresh':0.45,'track_low_thresh':0.1}))
    branches=[('relational','strictcv3315_vlmosnet_quality_f01_relational_hq_v6_e12.pt','strictcv3315_vlmosnet_quality_settemporalbox_f01_relational_v6_k48_e10_mps.pt','cuda'),('robust','strictcv3315_vlmosnet_quality_f01_robust_hq_v3_e12.pt','strictcv3315_vlmosnet_quality_settemporalbox_f01_robust_v3_k48_e10_cpu.pt','cpu')]
    for tag,quality,temporal,temporal_device in branches:
        run('apply_osnet_quality_conditioner.py','--model',root/'outputs/models'/quality,'--detections',detection_root/source_tag,'--embedding-dir',feature,'--run-name','fold01_'+tag+'_quality','--device','cuda','--threshold',0.01,'--top-k',600,'--blend-input',0,'--box-delta-scale',1,*sequence)
        run('apply_temporal_box_conditioner.py','--model',root/'outputs/models'/temporal,'--detections',detection_root/('fold01_'+tag+'_quality'),'--run-name','fold01_'+tag+'_temporal','--device',temporal_device,'--threshold',0.05,'--top-k',700,'--blend-input',0,'--box-delta-scale',1,*sequence)
        run('filter_detections.py','--detections',detection_root/('fold01_'+tag+'_temporal'),'--run-name','fold01_'+tag+'_post','--score-threshold',0.05,'--nms-iou-threshold',0.5,'--top-k',300,'--sequence-names','MOT20-01')
        branch_params=params
        if tag=='robust' and PROFILE['fold01'].get('robust_tracker'):
            branch_params=root/'tracker-params-robust.json'
            branch_params.write_text(json.dumps(PROFILE['fold01']['robust_tracker']))
        run('run_tracker.py','--detections',detection_root/('fold01_'+tag+'_post'),'--tracker-name','fold01_'+tag,'--tracker-params-json',branch_params,'--device','cpu','--skip-trackeval-copy',*sequence)
    tracks=root/'outputs/tracks'
    run('apply_track_filter.py','--tracker-dir',tracks/'fold01_robust','--model',root/'outputs/models/strictcv3315_vlmosnet_settemporalbox_f01_consensus_relationraw_iou010_trackfilter.json','--support-tracker-dir',tracks/'fold01_relational','--output-tracker-name','fold01_consensus','--threshold',PROFILE['fold01']['filter_threshold'],*sequence)
    run('apply_osnet_tracklet_linker.py','--tracker-dir',tracks/'fold01_consensus','--model',root/'outputs/models/strictcv3315_vlmosnet_settemporalbox_f01_stablecons_t060_osnetlink_g90_c6.pkl','--output-tracker-name','fold01_linked','--threshold',PROFILE['fold01']['link_threshold'],*sequence)
    run('interpolate_mot_results.py','--input-dir',tracks/'fold01_linked','--output-dir',tracks/'fold01_final','--n-min',PROFILE['fold01']['n_min'],'--n-dti',PROFILE['fold01']['n_dti'])
    status('evaluating_fresh_predictions')
    output=root/'evaluation'
    if not (output/'metrics.json').exists():
        subprocess.run([sys.executable,str(PACKAGE_ROOT/'evaluate_folds.py'),'--trackeval-root',str(root/'external/TrackEval'),'--dataset-root',str(root/'data/MOT20'),'--tracks',str(tracks/'fold01_final'),'--output',str(output),'--sequences','MOT20-01'],check=True)
    status('complete',fresh_fold01_complete=True)
except BaseException as error:
    status('stopped' if isinstance(error,KeyboardInterrupt) else 'failed',error=str(error))
    raise
