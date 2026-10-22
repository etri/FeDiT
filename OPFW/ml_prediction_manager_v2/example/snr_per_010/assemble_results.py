import argparse
import csv
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

parser=argparse.ArgumentParser()
parser.add_argument('--run-root',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--dataset-root',type=Path,required=True)
parser.add_argument('--trackeval-root',type=Path,required=True)
args=parser.parse_args()
root=args.run_root.resolve()
output=args.output.resolve()
selected={
    'MOT20-01':'fold01_final',
    'MOT20-02':'fold02_final',
    'MOT20-03':'fold03_final_historical',
    'MOT20-05':'fold05_final_reconstructed_support',
}
selection_path=root/'final-predictions.json'
if selection_path.exists():
    selected=json.loads(selection_path.read_text())
    if set(selected)!={'MOT20-01','MOT20-02','MOT20-03','MOT20-05'} or any(Path(tag).name!=tag for tag in selected.values()):
        raise ValueError('Invalid final prediction selection')
expected={'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}
coverage={}
for sequence,length in expected.items():
    source=root/'raw-grounding'/f'{sequence}.jsonl'
    frames=set()
    with source.open() as stream:
        for line in stream:
            frame=int(json.loads(line)['frame_idx'])
            if frame in frames:
                raise AssertionError(f'Duplicate frame in {sequence}')
            frames.add(frame)
    if frames!=set(range(1,length+1)):
        raise AssertionError(f'Incomplete image inference coverage for {sequence}')
    prediction=root/'outputs/tracks'/selected[sequence]/f'{sequence}.txt'
    if not prediction.exists() or prediction.stat().st_size==0:
        raise FileNotFoundError(prediction)
    coverage[sequence]={'frames':length,'tracker':selected[sequence],'prediction_sha256':hashlib.file_digest(prediction.open('rb'),'sha256').hexdigest()}
evaluation=output/'evaluation'
existing_metrics=evaluation/'metrics.json'
if existing_metrics.exists():
    previous=json.loads(existing_metrics.read_text())
    if any(previous['inputs'][name]['prediction_sha256']!=coverage[name]['prediction_sha256'] for name in selected):
        raise RuntimeError('Existing evaluation belongs to different predictions')
    for name in selected:
        gt=args.dataset_root/'train'/name/'gt/gt.txt'
        if previous['inputs'][name]['gt_sha256']!=hashlib.file_digest(gt.open('rb'),'sha256').hexdigest():
            raise RuntimeError('Existing evaluation belongs to different ground truth')
output.mkdir(parents=True,exist_ok=True)
tracks=output/'predictions'
tracks.mkdir(exist_ok=True)
for sequence,tag in selected.items():
    shutil.copy2(root/'outputs/tracks'/tag/f'{sequence}.txt',tracks/f'{sequence}.txt')
if not existing_metrics.exists():
    subprocess.run([sys.executable,str(Path(__file__).with_name('evaluate_folds.py')),'--trackeval-root',str(args.trackeval_root),'--dataset-root',str(args.dataset_root),'--tracks',str(tracks),'--output',str(evaluation)],check=True)
metrics=json.loads((evaluation/'metrics.json').read_text())
primary=next(item for item in metrics['evaluations'] if item['match_iou']==0.1)
provenance={'kind':'fresh_image_inference_evaluation','run_root':str(root),'coverage':coverage,'frames_total':sum(expected.values()),'model_training_executed':False,'raw_input_ground_truth_used':False,'metric_protocol':'TrackEval CLEAR/Identity with MOT20 preprocessing; IoU 0.1 and 0.5','primary_macro_mota_percent':primary['macro_mota_percent'],'primary_pooled_mota_percent':primary['pooled_mota_percent'],'target_macro_80_passed':primary['macro_mota_percent']>=80,'target_pooled_80_passed':primary['pooled_mota_percent']>=80,'selection':selected}
cache_proof=root/'backbone-cache-proof.json'
if cache_proof.exists():
    proof=json.loads(cache_proof.read_text())
    if not proof.get('passed') or proof.get('image_inputs_verified')!=sum(expected.values()):
        raise RuntimeError('Backbone cache verification is incomplete')
    provenance.update(kind='cached_backbone_inference_evaluation',frozen_backbone_cache_reused=True,source_image_inference_run=proof['source_run'],cache_proof_sha256=hashlib.file_digest(cache_proof.open('rb'),'sha256').hexdigest(),learned_conditioner_outputs_reused=False,tracker_predictions_reused=False)
    shutil.copy2(cache_proof,output/'backbone-cache-proof.json')
application=root/'profile-application.json'
if application.exists():
    applied=json.loads(application.read_text())
    provenance.update(inference_profile=applied['profile'],inference_profile_sha256=applied['profile_sha256'],postprocessing_selection=applied['profile']['selection'])
    shutil.copy2(application,output/'profile-application.json')
(output/'inference-provenance.json').write_text(json.dumps(provenance,indent=2))
rows=[]
for evaluation in metrics['evaluations']:
    for fold in evaluation['folds']:
        rows.append({'match_iou':evaluation['match_iou'],**fold})
fields=['match_iou','sequence','mota_percent','fp','fn','idsw','gt','idf1_percent']
with (output/'sequence_metrics.csv').open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
with (output/'aggregate_metrics.csv').open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=['match_iou','macro_mota_percent','pooled_mota_percent'])
    writer.writeheader()
    writer.writerows({key:item[key] for key in writer.fieldnames} for item in metrics['evaluations'])
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
charts=output/'charts'
charts.mkdir(exist_ok=True)
labels=list(expected)+['4-sequence mean']
x=np.arange(len(labels))
fig,axis=plt.subplots(figsize=(10,5.5),layout='constrained')
values=[fold['mota_percent'] for fold in primary['folds']]+[primary['macro_mota_percent']]
bars=axis.bar(x,values,width=0.62,color=['#1d567a']*4+['#237b68'])
axis.bar_label(bars,labels=[f'{value:.4f}%' for value in values],padding=4,fontsize=10)
axis.axhline(80,color='#b52e31',linestyle='--',linewidth=1.2,label='80% target (IoU 0.1 protocol)')
axis.set_xticks(x,labels)
axis.set_ylim(0,100)
axis.set_ylabel('MOTA (%)')
axis.set_title('SNR-PER-010 MOTA at IoU 0.1')
axis.legend(loc='lower right')
axis.spines[['top','right']].set_visible(False)
fig.savefig(charts/'mota_comparison.png',dpi=180)
plt.close(fig)
fig,axis=plt.subplots(figsize=(10,5.5),layout='constrained')
bottom=np.zeros(4)
for field,color,label in [('fn','#1d567a','False negatives'),('fp','#e2a837','False positives'),('idsw','#a44743','ID switches')]:
    values=np.asarray([100*fold[field]/fold['gt'] for fold in primary['folds']])
    axis.bar(np.arange(4),values,bottom=bottom,color=color,label=label)
    bottom+=values
axis.set_xticks(np.arange(4),list(expected))
axis.set_ylabel('Errors / GT (%)')
axis.set_title('MOT20 error breakdown at IoU 0.1')
axis.spines[['top','right']].set_visible(False)
axis.legend()
fig.savefig(charts/'error_breakdown.png',dpi=180)
plt.close(fig)
print(f"{'Sequence':<12}{'MOTA@0.1':>12}{'FP':>12}{'FN':>12}{'IDSW':>10}{'GT':>12}",flush=True)
for fold in primary['folds']:
    print(f"{fold['sequence']:<12}{fold['mota_percent']:>12.6f}{fold['fp']:>12}{fold['fn']:>12}{fold['idsw']:>10}{fold['gt']:>12}",flush=True)
print(f"Macro MOTA: {primary['macro_mota_percent']:.6f}%",flush=True)
print(json.dumps(provenance,indent=2),flush=True)
