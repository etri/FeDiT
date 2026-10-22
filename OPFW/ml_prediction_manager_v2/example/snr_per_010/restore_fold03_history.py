from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
from datetime import datetime,timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

root=RUN_ROOT
proof=json.loads((root/'history-input-equivalence.json').read_text())
module=(PACKAGE_ROOT/'historical_fold03_inputs.py')
if not proof.get('passed') or proof['module_sha256']!=hashlib.file_digest(module.open('rb'),'sha256').hexdigest():
    raise RuntimeError('Historical input transformation is unverified')
state_path=root/'fold03-history-progress.json'
state={'completed_stages':[],'model_training_executed':False,'ground_truth_used_for_inference':False}
if state_path.exists():
    state.update(json.loads(state_path.read_text()))
sequence=['--data-root',root/'data/MOT20/train','--sequence-names','MOT20-03']
tracks=root/'outputs/tracks'
models=root/'outputs/models'
detections=root/'outputs/detections'

def execute(script,*arguments,home=False):
    command=[sys.executable,str(PACKAGE_ROOT/script if home else root/'scripts'/script),*map(str,arguments)]
    label=json.dumps(command)
    if label in state['completed_stages']:
        return
    if (root/'STOP_REMAINING').exists():
        raise KeyboardInterrupt('STOP_REMAINING requested')
    subprocess.run(command,cwd=root,check=True)
    state['completed_stages'].append(label)
    state.update(stage=script,updated_at=datetime.now(timezone.utc).isoformat())
    state_path.write_text(json.dumps(state,indent=2))

execute('historical_fold03_inputs.py',home=True)
execute('run_tracker.py','--detections',detections/'fold03_raw17_filtered','--tracker-name','fold03_history_raw17','--tracker-type','bytetrack','--tracker-params-json',root/'configs/replay_raw17_bytetrack_params.json','--device','cpu','--skip-trackeval-copy',*sequence)
execute('postprocess_tracks.py','--input-tracker-dir',tracks/'fold03_history_raw17','--output-tracker-name','fold03_history_tracklen50_conf55','--min-len',50,'--min-median-conf',0.55,*sequence)
execute('apply_histgb_track_filter.py','--tracker-dir',tracks/'fold03_history_tracklen50_conf55','--model',models/'strictcv_full3315_f03_histgb_p068_n012_noseq.pkl','--output-tracker-name','fold03_history_base','--threshold',0.05,*sequence)
execute('postprocess_tracks.py','--input-tracker-dir',tracks/'fold03_history_tracklen50_conf55','--output-tracker-name','fold03_history_fixed_gap20','--max-gap',20,*sequence)
execute('postprocess_tracks.py','--input-tracker-dir',tracks/'fold03_history_fixed_gap20','--output-tracker-name','fold03_history_fixed_gap20_exp202030','--expand-x',0.2,'--expand-y-top',0.2,'--expand-y-bottom',0.3,*sequence)
execute('rescue_untracked_detections.py','--base-output-tracker-dir',tracks/'fold03_history_fixed_gap20_exp202030','--base-gate-tracker-dir',tracks/'fold03_history_fixed_gap20','--detections',detections/'fold03_historical_conditioned','--output-tracker-name','fold03_history_rescue','--score-threshold',0.82,'--base-overlap-iou-max',0.4,'--candidate-nms-iou',0.7,'--max-candidates-per-frame',120,'--min-width',2,'--min-height',8,'--min-track-len',8,'--min-median-score',0,'--max-link-gap',2,'--link-iou-thresh',0.3,'--attach-to-base','--attach-max-gap',90,'--attach-iou-thresh',0.1,*sequence)
execute('apply_histgb_track_filter.py','--tracker-dir',tracks/'fold03_history_rescue','--always-keep-tracker-dir',tracks/'fold03_history_base','--model',models/'strictcv3315_rescue_v1_f03_histgb_p010_n000.pkl','--output-tracker-name','fold03_history_protected','--threshold',0.95,*sequence)
execute('postprocess_tracks.py','--input-tracker-dir',tracks/'fold03_history_protected','--output-tracker-name','fold03_history_gap20','--max-gap',20,*sequence)
state.update(stage='complete',recipe={'raw17_filter_source':'scripts/rerun_mot20_full3315_pipeline.sh','tracker_parameters_source':'configs/replay_raw17_bytetrack_params.json','conditioner_threshold':0.3137,'base_filter_threshold':0.05,'protected_filter_threshold':0.95,'base_gap':20,'expansion':[0.2,0.2,0.3],'post_rescue_gap':20,'long_track_policy':'provided script defaults: minimum length 80 and median confidence 0.45','base_reconstruction':'raw17 track-length/confidence filter followed by gap20 and expansion'},updated_at=datetime.now(timezone.utc).isoformat())
state_path.write_text(json.dumps(state,indent=2))
print('FOLD03_HISTORICAL_INPUTS_READY',flush=True)
