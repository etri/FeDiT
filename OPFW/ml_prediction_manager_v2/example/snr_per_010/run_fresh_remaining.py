from runtime_paths import WORK_ROOT, RUN_ROOT, PACKAGE_ROOT, DELIVERY_ROOT
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import traceback

PROFILE=json.loads((PACKAGE_ROOT/'INFERENCE_PROFILE.json').read_text())
work=WORK_ROOT
root=RUN_ROOT
os.chdir(root)
os.environ['SNR010_NMM_PROOF']=str(work/'logs/nmm-reference-validation.json')
os.environ['PYTHONPATH']=':'.join([str(PACKAGE_ROOT),str(root/'src'),str(root/'scripts')])
os.environ['OMP_NUM_THREADS']='2'
os.environ['MKL_NUM_THREADS']='2'
os.environ['HF_HUB_CACHE']=str(root/'weights/hub')
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
path=root/'remaining-progress.json'
state={'full_four_fold_reproduction':False,'model_training_executed':False,'completed_stages':[],'sequence_results':{}}
if path.exists():
    state.update(json.loads(path.read_text()))
state.pop('error',None)

def status(stage,**values):
    state.update(stage=stage,updated_at=datetime.now(timezone.utc).isoformat(),**values)
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(state,indent=2))
    temporary.replace(path)
    print(json.dumps(state),flush=True)

def execute(script,*arguments,home=False):
    command=[sys.executable,str(PACKAGE_ROOT/'run_with_fp32.py'),str(PACKAGE_ROOT/script if home else root/'scripts'/script),*map(str,arguments)]
    label=json.dumps(command)
    if label in state['completed_stages']:
        return
    if (root/'STOP_REMAINING').exists():
        raise KeyboardInterrupt('STOP_REMAINING requested')
    status(script)
    subprocess.run(command,check=True)
    state['completed_stages'].append(label)
    status(script+' complete')

def evaluate(sequence,tag,scope):
    destination=root/'evaluation'/tag
    execute('evaluate_folds.py','--trackeval-root',root/'external/TrackEval','--dataset-root',root/'data/MOT20','--tracks',tracks/tag,'--output',destination,'--sequences',sequence,home=True)
    state['sequence_results'][sequence]={'scope':scope,'metrics_path':str(destination/'metrics.json'),'historical_final_pipeline_complete':scope=='complete documented fold02 pipeline'}
    status('sequence_evaluated')

detections=root/'outputs/detections'
tracks=root/'outputs/tracks'
models=root/'outputs/models'
source='strictcv3315_vlmraw_prefilter_top1000_nms070_k600'
features=root/'outputs/features/strictcv3315_vlmraw_prefilter_k600_osnet_msmt17_128x64'
params=root/'tracker-params.json'
params.write_text(json.dumps({'fuse_score':False,'match_thresh':0.8,'new_track_thresh':0.5,'track_buffer':120,'track_high_thresh':0.45,'track_low_thresh':0.1}))
failures=[]
try:
    execute('import_filtered_stream.py','--sequence','MOT20-01','--validate',home=True)
    execute('validate_memory_features.py',home=True)
    if not json.loads((root/'memory-feature-equivalence.json').read_text())['passed']:
        raise RuntimeError('Feature memory transformation was not verified')
    module=root/'src/osnet_quality_conditioner.py'
    original=module.read_text()
    before='''        features = np.concatenate(
            [geometry, np.asarray(embeddings, dtype=np.float32)],
            axis=1,
        )'''
    after='''        from memory_features import JoinedFeatures
        features = JoinedFeatures(geometry, embeddings)'''
    if after not in original:
        if original.count(before)!=1:
            raise RuntimeError('Unexpected quality inference source')
        module.write_text(original.replace(before,after))
    for fold in ['02','03','05']:
        sequence='MOT20-'+fold
        sequence_args=['--data-root',root/'data/MOT20/train','--sequence-names',sequence]
        try:
            status('sequence_started',current_sequence=sequence)
            execute('detect_sequence.py','--sequence',sequence,home=True)
            execute('import_filtered_stream.py','--sequence',sequence,home=True)
            execute('cache_osnet_crop_embeddings.py','--detections',detections/source,'--output-dir',features,'--weights',root/'artifacts/reid/osnet_x0_25_msmt17.pt','--device','cuda:0','--batch-size',600,*sequence_args)
            prefix='fold'+fold
            execute('apply_osnet_quality_conditioner.py','--model',models/f'strictcv3315_vlmosnet_quality_f{fold}_relational_hq_v6_e12.pt','--detections',detections/source,'--embedding-dir',features,'--run-name',prefix+'_relational_quality','--device','cuda','--threshold',0.01,'--top-k',600,'--blend-input',0,'--box-delta-scale',1,*sequence_args)
            execute('apply_temporal_box_conditioner.py','--model',models/f'strictcv3315_vlmosnet_quality_settemporalbox_f{fold}_relational_v6_k48_e10_mps.pt','--detections',detections/(prefix+'_relational_quality'),'--run-name',prefix+'_relational_temporal','--device','cuda','--threshold',0.05,'--top-k',700,'--blend-input',0,'--box-delta-scale',1,*sequence_args)
            execute('filter_detections.py','--detections',detections/(prefix+'_relational_temporal'),'--run-name',prefix+'_relational_post','--score-threshold',0.05,'--nms-iou-threshold',0.5,'--top-k',300,'--sequence-names',sequence)
            execute('run_tracker.py','--detections',detections/(prefix+'_relational_post'),'--tracker-name',prefix+'_relational','--tracker-params-json',params,'--device','cpu','--skip-trackeval-copy',*sequence_args)
            evaluate(sequence,prefix+'_relational','primary relational branch only; not historical final output')
            if fold=='02':
                execute('apply_osnet_quality_ensemble.py','--primary-model',models/'strictcv3315_vlmosnet_quality_f02_robust_hq_v3_e12.pt','--adapted-model',str(sequence)+'='+str(models/'strictcv3315_vlmosnet_quality_f02_relational_hq_v6_e12.pt'),'--adapted-weight',0.5,'--delta-adapted-weight',0.5,'--detections',detections/source,'--embedding-dir',features,'--run-name','fold02_ensemble_quality','--device','cuda','--threshold',0.01,'--top-k',600,'--blend-input',0,'--box-delta-scale',1,'--batch-size',8192,'--chunk-rows',131072,*sequence_args)
                execute('apply_temporal_box_conditioner.py','--model',models/'strictcv3315_vlmosnet_quality_settemporalbox_f02_robustrel_ens050_v7_k48_e10_mps.pt','--detections',detections/'fold02_ensemble_quality','--run-name','fold02_ensemble_temporal','--device','cuda','--threshold',0.05,'--top-k',700,'--blend-input',0,'--box-delta-scale',1,*sequence_args)
                execute('filter_detections.py','--detections',detections/'fold02_ensemble_temporal','--run-name','fold02_ensemble_post','--score-threshold',0.05,'--nms-iou-threshold',0.5,'--top-k',300,'--sequence-names',sequence)
                execute('run_tracker.py','--detections',detections/'fold02_ensemble_post','--tracker-name','fold02_ensemble','--tracker-params-json',params,'--device','cpu','--skip-trackeval-copy',*sequence_args)
                execute('apply_track_filter.py','--tracker-dir',tracks/'fold02_relational','--support-tracker-dir',tracks/'fold02_ensemble','--model',models/'strictcv3315_relational_v6_f02_k48_h045_consensus_ens050_iou010_trackfilter.json','--output-tracker-name','fold02_consensus','--threshold',0.3,*sequence_args)
                execute('apply_osnet_tracklet_linker.py','--tracker-dir',tracks/'fold02_consensus','--model',models/'strictcv3315_relational_v6_f02_k48_h045_constf_t030_osnetlink_g90_c6.pkl','--output-tracker-name','fold02_linked','--threshold',0.2,*sequence_args)
                execute('detect_sequence.py','--sequence',sequence,'--expanded',home=True)
                execute('fuse_streamed_candidates.py','--sequence',sequence,home=True)
                execute('apply_neural_gap_selector.py','--model',models/'strictcv3315_relational_v6_constf_t030_neuralgap_f02_g60_h96_e36_mps.pt','--tracker-dir',tracks/'fold02_linked','--detections',detections/'original_sahi_k600_expanded_native_union_nms070_k1000_partial','--tracker-name','fold02_gap','--threshold',0.5,'--duplicate-iou',0.9,'--device','cuda',*sequence_args)
                execute('extend_track_endpoints_with_detections.py','--input-tracker-dir',tracks/'fold02_gap','--detections',detections/'fold02_relational_post','--output-tracker-name','fold02_final','--score-threshold',0.5,'--match-iou',0.3,'--center-distance',0.75,'--duplicate-iou',0.5,'--max-extension',10,'--max-misses',1,'--velocity-weight',0.5,*sequence_args)
                evaluate(sequence,'fold02_final','complete documented fold02 pipeline')
            else:
                execute('detect_sequence.py','--sequence',sequence,'--expanded',home=True)
                execute('fuse_streamed_candidates.py','--sequence',sequence,home=True)
                union=detections/'original_sahi_k600_expanded_native_union_nms070_k1000_partial'
                if fold=='05':
                    execute('filter_detections.py','--detections',detections/'fold05_relational_quality','--run-name','fold05_quality_support_detections','--score-threshold',0.05,'--nms-iou-threshold',0.5,'--top-k',300,'--sequence-names',sequence)
                    execute('run_tracker.py','--detections',detections/'fold05_quality_support_detections','--tracker-name','fold05_quality_support','--tracker-params-json',params,'--device','cpu','--skip-trackeval-copy',*sequence_args)
                    linker=models/'strictcv3315_relational_v6_f05_k48_h045_constable_t020_osnetlink_g90_c6.pkl'
                    execute('apply_osnet_tracklet_linker.py','--tracker-dir',tracks/'fold05_quality_support','--model',linker,'--output-tracker-name','fold05_quality_support_linked','--threshold',0.5,*sequence_args)
                    execute('interpolate_mot_results.py','--input-dir',tracks/'fold05_quality_support_linked','--output-dir',tracks/'fold05_quality_support_interpolated','--n-min',10,'--n-dti',5)
                    support=tracks/'fold05_quality_support_interpolated'
                    original_support=DELIVERY_ROOT/'outputs/tracks/strictcv3315_vlmosnet_f05_current_osnetlink_t050_interp_m10_g5_ALL4'
                    if (original_support/f'{sequence}.txt').exists():
                        support=original_support
                    execute('apply_track_filter.py','--tracker-dir',tracks/'fold05_relational','--support-tracker-dir',support,'--model',models/'strictcv3315_relational_v6_f05_k48_h045_consensus_stablefinal_iou010_trackfilter.json','--output-tracker-name','fold05_consensus_reconstructed_support','--threshold',PROFILE['fold05']['filter_threshold'],*sequence_args)
                    execute('apply_osnet_tracklet_linker.py','--tracker-dir',tracks/'fold05_consensus_reconstructed_support','--model',linker,'--output-tracker-name','fold05_linked_reconstructed_support','--threshold',PROFILE['fold05']['link_threshold'],*sequence_args)
                    execute('apply_neural_gap_selector.py','--model',models/'strictcv3315_relational_v6_constable_t020_neuralgap_f05_g60_h96_e36_mps.pt','--tracker-dir',tracks/'fold05_linked_reconstructed_support','--detections',union,'--tracker-name','fold05_final_reconstructed_support','--threshold',PROFILE['fold05']['neural_gap_threshold'],'--duplicate-iou',0.9,'--device','cuda',*sequence_args)
                    evaluate(sequence,'fold05_final_reconstructed_support','provided fold05 checkpoints; quality-only support branch generated before temporal conditioning')
                    state['sequence_results'][sequence]['support_tracker_dir']=str(support)
                else:
                    execute('apply_osnet_quality_conditioner.py','--model',models/'strictcv3315_vlmosnet_quality_f03_full_hq_v3_e12.pt','--detections',detections/source,'--embedding-dir',features,'--run-name','fold03_full_quality','--device','cuda','--threshold',0.01,'--top-k',600,'--blend-input',0,'--box-delta-scale',1,*sequence_args)
                    execute('apply_temporal_box_conditioner.py','--model',models/'strictcv3315_vlmosnet_quality_settemporalbox_f03_full_v3_k48_e10_cpu.pt','--detections',detections/'fold03_full_quality','--run-name','fold03_full_temporal','--device','cpu','--threshold',0.05,'--top-k',700,'--blend-input',0,'--box-delta-scale',1,*sequence_args)
                    execute('filter_detections.py','--detections',detections/'fold03_full_temporal','--run-name','fold03_full_post','--score-threshold',0.05,'--nms-iou-threshold',0.5,'--top-k',300,'--sequence-names',sequence)
                    execute('restore_fold03_history.py',home=True)
                    execute('apply_osnet_tracklet_linker.py','--tracker-dir',tracks/'fold03_history_gap20','--model',models/'strictcv3315_histarch_f03_osnet_linker_g90_c6_oof_p080.pkl','--output-tracker-name','fold03_full_linked','--threshold',0.2,*sequence_args)
                    execute('interpolate_mot_results.py','--input-dir',tracks/'fold03_full_linked','--output-dir',tracks/'fold03_full_interpolated','--n-min',5,'--n-dti',10)
                    execute('apply_neural_gap_selector.py','--model',models/'strictcv3315_neuralgap_f03_g60.pt','--tracker-dir',tracks/'fold03_full_interpolated','--detections',union,'--tracker-name','fold03_full_gap','--threshold',0.9,'--duplicate-iou',0.9,'--device','cuda',*sequence_args)
                    execute('extend_track_endpoints_with_detections.py','--input-tracker-dir',tracks/'fold03_full_gap','--detections',detections/'fold03_full_post','--output-tracker-name','fold03_full_extended','--score-threshold',0.2,'--match-iou',0.4,'--center-distance',0.6,'--duplicate-iou',0.5,'--max-extension',20,'--max-misses',1,'--velocity-weight',0.5,*sequence_args)
                    execute('extend_track_endpoints_with_detections.py','--input-tracker-dir',tracks/'fold03_full_extended','--detections',detections/'fold03_relational_post','--output-tracker-name','fold03_final_historical','--score-threshold',0.3,'--match-iou',0.4,'--center-distance',0.6,'--duplicate-iou',0.5,'--max-extension',10,'--max-misses',1,'--velocity-weight',0.5,*sequence_args)
                    evaluate(sequence,'fold03_final_historical','historical raw17 and provided conditioner/HistGB protected rescue models, followed by linker, gap and neural endpoint stages')
                status('provided_model_pipeline_evaluated')
        except Exception as error:
            traceback.print_exc()
            failures.append({'sequence':sequence,'error':str(error)})
            status('sequence_failed_continuing',failures=failures)
    status('available_sequences_finished',failures=failures,full_four_fold_reproduction=False)
except BaseException as error:
    status('stopped' if isinstance(error,KeyboardInterrupt) else 'failed',error=str(error))
    raise
