import hashlib
import json
import os
import shutil
import subprocess
import sys

from runtime_paths import PACKAGE_ROOT, RUN_ROOT

root = RUN_ROOT
profile_path = PACKAGE_ROOT / 'INFERENCE_PROFILE.json'
profile = json.loads(profile_path.read_text())
tracks = root / 'outputs/tracks'
selected = {'MOT20-01': 'fold01_final', 'MOT20-02': 'fold02_final', 'MOT20-03': 'fold03_final_historical', 'MOT20-05': 'fold05_final_reconstructed_support'}


def run(script, *arguments):
    environment = os.environ.copy()
    environment['PYTHONPATH'] = os.pathsep.join([str(root / 'src'), str(root / 'scripts'), str(PACKAGE_ROOT)])
    subprocess.run([sys.executable, str(PACKAGE_ROOT / 'run_with_fp32.py'), str(root / 'scripts' / script), *map(str, arguments)], cwd=root, env=environment, check=True)


for index, stage in enumerate(profile['fold01'].get('endpoint_stages', [])):
    if stage['branch'] not in ['robust', 'relational']:
        raise ValueError('Unknown fold01 endpoint branch')
    name = 'profile_fold01_endpoint_' + str(index)
    run('extend_track_endpoints_with_detections.py', '--input-tracker-dir', tracks / selected['MOT20-01'], '--detections', root / 'outputs/detections' / ('fold01_' + stage['branch'] + '_post'), '--output-tracker-name', name, '--score-threshold', stage['score_threshold'], '--match-iou', 0.4, '--center-distance', 0.6, '--duplicate-iou', 0.5, '--max-extension', stage['max_extension'], '--max-misses', 1, '--velocity-weight', 0.5, '--data-root', root / 'data/MOT20/train', '--sequence-names', 'MOT20-01')
    selected['MOT20-01'] = name
final_filter = profile['fold03'].get('final_filter')
if final_filter:
    allowed = ['strictcv_full3315_f03_histgb_p068_n012_noseq.pkl', 'strictcv3315_rescue_v1_f03_histgb_p010_n000.pkl']
    if final_filter['model'] not in allowed or final_filter['keep_long_min_len'] != 0:
        raise ValueError('Unknown fold03 final filter profile')
    model = root / 'outputs/models' / final_filter['model']
    metadata = json.loads(model.with_suffix(model.suffix + '.json').read_text())
    if 'MOT20-03' in metadata['train_sequences']:
        raise ValueError('The fold03 model includes its evaluation sequence')
    run('apply_histgb_track_filter.py', '--tracker-dir', tracks / selected['MOT20-03'], '--model', model, '--output-tracker-name', 'profile_fold03_filtered', '--threshold', final_filter['threshold'], '--keep-long-min-len', 0, '--data-root', root / 'data/MOT20/train', '--sequence-names', 'MOT20-03')
    selected['MOT20-03'] = 'profile_fold03_filtered'
combined = tracks / 'profile_input'
combined.mkdir(parents=True, exist_ok=True)
inputs = {}
for sequence, tag in selected.items():
    source = tracks / tag / (sequence + '.txt')
    shutil.copy2(source, combined / source.name)
    inputs[sequence] = {'tracker': tag, 'prediction_sha256': hashlib.file_digest(source.open('rb'), 'sha256').hexdigest()}
post = profile['final_postprocessing']
run('postprocess_tracks.py', '--input-tracker-dir', combined, '--output-tracker-name', 'profile_final', '--data-root', root / 'data/MOT20/train', '--smoothing-window', post['smoothing_window'], '--expand-x', post['expand_x'], '--expand-y-top', post['expand_y_top'], '--expand-y-bottom', post['expand_y_bottom'])
(root / 'final-predictions.json').write_text(json.dumps({sequence: 'profile_final' for sequence in selected}, indent=2))
(root / 'profile-application.json').write_text(json.dumps({'profile': profile, 'profile_sha256': hashlib.file_digest(profile_path.open('rb'), 'sha256').hexdigest(), 'input_predictions': inputs, 'model_training_executed': False, 'ground_truth_used_as_model_input': False}, indent=2))
print('INFERENCE_PROFILE_APPLIED', flush=True)
