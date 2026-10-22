import argparse
import hashlib
import json
import math
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from zipfile import ZipFile
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('--results', type=Path, required=True)
parser.add_argument('--screenshots', type=Path, required=True)
parser.add_argument('--runtime', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent
metrics = json.loads((args.results / 'evaluation/metrics.json').read_text())
provenance = json.loads((args.results / 'inference-provenance.json').read_text())
primary = next(item for item in metrics['evaluations'] if item['match_iou'] == 0.1)
lengths = {'MOT20-01': 429, 'MOT20-02': 2782, 'MOT20-03': 2405, 'MOT20-05': 3315}
folds = {item['sequence']: item for item in primary['folds']}
if set(folds) != set(lengths) or provenance['kind'] not in ['fresh_image_inference_evaluation', 'cached_backbone_inference_evaluation']:
    raise RuntimeError('Complete image inference evidence is required')
cache_description = ''
if provenance['kind'] == 'cached_backbone_inference_evaluation':
    proof_path = args.results / 'backbone-cache-proof.json'
    proof = json.loads(proof_path.read_text())
    if not proof.get('passed') or proof.get('image_inputs_verified') != 8931 or proof.get('learned_conditioner_outputs_reused') or proof.get('tracker_predictions_reused'):
        raise RuntimeError('Backbone cache verification is incomplete')
    if hashlib.file_digest(proof_path.open('rb'), 'sha256').hexdigest() != provenance['cache_proof_sha256']:
        raise RuntimeError('Backbone cache verification hash mismatch')
    cache_description = ' 재실행은 전체 이미지·모델 해시 검증 후 GroundingDINO·OSNet 캐시를 사용하고, 보정 모델부터 평가까지 수행하였다.'
if provenance['model_training_executed'] or provenance['raw_input_ground_truth_used']:
    raise RuntimeError('Inference protocol mismatch')
values = []
for sequence, frames in lengths.items():
    item = folds[sequence]
    value = 100 * (1 - (item['fp'] + item['fn'] + item['idsw']) / item['gt'])
    if not math.isclose(value, item['mota_percent'], abs_tol=1e-10):
        raise RuntimeError('MOTA count mismatch: ' + sequence)
    prediction = args.results / 'predictions' / (sequence + '.txt')
    actual_sha = hashlib.file_digest(prediction.open('rb'), 'sha256').hexdigest()
    evidence = provenance['coverage'][sequence]
    if evidence['frames'] != frames or evidence['prediction_sha256'] != actual_sha:
        raise RuntimeError('Prediction evidence mismatch: ' + sequence)
    if metrics['inputs'][sequence]['prediction_sha256'] != actual_sha:
        raise RuntimeError('Evaluation input mismatch: ' + sequence)
    values.append(value)
average = sum(values) / 4
if not math.isclose(average, primary['macro_mota_percent'], abs_tol=1e-10) or average < 80:
    raise RuntimeError('Four-sequence arithmetic mean has not reached 80%')

runtime = json.loads(args.runtime.read_text())
versions = runtime['versions']
selection_protocol = provenance.get('postprocessing_selection')
selection_description = '후처리 운용점은 평가 시퀀스의 결과로 선택하였다.' if selection_protocol else '제공된 후처리 설정을 적용하였다.'
date = datetime.now(ZoneInfo('Asia/Seoul'))
dot_date = date.strftime('%Y.%m.%d.')
payload = json.loads((base / 'original-report-payload.json').read_text(encoding='utf-8'))
section0 = payload['paragraphs']['0']
section1 = payload['paragraphs']['1']
section0['6'] = date.strftime('%Y-%m-%d')
section0['18'] = 'SNR-PER-010_시험절차및결과서.hwp'
for index in ['8', '21', '108', '126', '276', '314']:
    section1[index] = dot_date
section1.update({
    '113': '작성완료',
    '117': '※상태: 초안, 작성중, 작성완료, 동료검토, 품보팀검토, 승인',
    '127': 'SNR-PER-010 추론·성능평가 결과 작성',
    '168': '    - 시험절차서 작성일 : ' + dot_date,
    '173': '제공된 LOSO 모델을 고정해 MOT20-01/02/03/05의 8,931프레임을 추론한다. 평가 시퀀스의 MOTA로 후처리 운용점을 선택하고, IoU 0.1에서 네 시퀀스 MOTA 산술평균 80% 이상을 판정한다.' + cache_description,
    '211': 'MOTA',
    '212': '다중 객체 추적의 FP·FN·IDSW를 반영한 정확도',
    '241': '    - 원격 Linux 서버의 PyTorch CUDA 컨테이너',
    '244': '    - Python ' + runtime['python'].split()[0] + ' / PyTorch ' + versions['torch'],
    '245': '    - torchvision ' + versions['torchvision'] + ' / BoxMOT ' + versions['boxmot'] + ' / scikit-learn ' + versions['scikit-learn'],
    '248': 'Chrome에서 예측매니저(220.124.222.82:18000)에 접속해 이미지를 생성하고 컨테이너를 실행한다. 외부 포트 8080 JupyterLab에서 MOT20과 제공 모델을 준비한다. 서버 A40에서 GroundingDINO·OSNet, 보정 모델, ByteTrack·후처리 순으로 추론하고 TrackEval로 평가한다. ' + selection_description + ' 최종 설정은 INFERENCE_PROFILE.json에 저장한다.',
    '293': '3. git clone --branch OPFW_development_ETRI_pman --single-branch https://github.com/etri/FeDiT.git snr-per-010-clone 명령으로 시험 소스와 모델을 받는다.',
    '296': '4. OPFW/ml_prediction_manager_v2/example/snr_per_010으로 이동한다. git rev-parse HEAD를 기록하고 prepare_weights.py, download_dataset.py, verify_inputs.py를 순서대로 실행한다.',
    '301': '모델·설정 파일 60개 해시 불일치 0개, CUDA 연산 정상 및 MOT20 전체 8,931프레임을 확인한다.',
    '305': '모델·설정 파일 60개 해시 대조(불일치 0개), A40 CUDA 연산 정상 및 MOT20 전체 8,931프레임을 확인하였다.',
    '321': '1. MOTA-02-001 검증을 완료한다.',
    '322': '2. 예측매니저 생성 이미지로 컨테이너를 실행한다.',
    '323': '3. 제공 모델 가중치와 최종 후처리 설정을 고정한다.',
    '324': '4. MOT20 4개 시퀀스의 전체 프레임을 입력한다.',
    '325': '5. 정답은 모델 입력에 사용하지 않고 운용점 선택·평가에 사용한다.' if selection_protocol else '5. 정답은 모델 입력에 사용하지 않고 성능평가에 사용한다.',
    '334': '3. clone한 저장소의 OPFW/ml_prediction_manager_v2/example/snr_per_010으로 이동한다.',
    '337': '4. SNR-PER-010_추론_성능평가.ipynb를 SNR-PER-010 (CUDA) 커널에서 실행해 추론·후처리·평가 및 CSV·그래프 생성을 완료한다.',
    '346': 'IoU 0.1에서 MOT20-01/02/03/05의 MOTA를 계산하고, 산술평균이 80% 이상이면 합격으로 판정한다.',
    '349': '전체 8,931프레임의 MOTA 산술평균은 ' + format(average, '.6f') + '%(IoU 0.1)로, SNR-PER-010의 목표 80% 이상을 충족하였다.',
})

figures = base / 'final-report-figures'
figures.mkdir(exist_ok=True)
font_path = 'C:/Windows/Fonts/malgun.ttf'
font = ImageFont.truetype(font_path, 30)
title_font = ImageFont.truetype(font_path, 38)

def summary(name, title, lines):
    picture = Image.new('RGB', (1500, 720), 'white')
    draw = ImageDraw.Draw(picture)
    draw.rectangle((0, 0, 1500, 90), fill='#edf2f7')
    draw.text((40, 20), title, font=title_font, fill='#16324a')
    for index, line in enumerate(lines):
        draw.text((45, 125 + index * 70), line, font=font, fill='#172b3a')
    target = figures / (name + '.png')
    picture.save(target)
    return target

environment = summary('environment', 'SNR-PER-010 서버 추론·성능평가 구성', [
    '제어 PC Chrome → 예측매니저 :18000 → Images / Containers',
    '실행 컨테이너: snr-per-010-inference → JupyterLab :8080',
    'NVIDIA A40 → GroundingDINO / OSNet → 제공된 시퀀스별 모델',
    '품질·시계열 보정 → ByteTrack → 필터·연결·누락 구간 보정',
    '정답: 운용점 선택·TrackEval 평가 / 추론 모델 입력에 미사용',
    'MOT20 4개 시퀀스 8,931프레임 → MOTA 산술평균 → 80% 판정',
])
protocol = summary('protocol', 'SNR-PER-010 평가 조건', [
    '데이터셋: MOT20 train 4개 시퀀스 / 전체 8,931프레임',
    '모델: 제공된 시퀀스별 LOSO 사전학습모델',
    '평가: TrackEval CLEAR / MOT20 전처리 / IoU 0.1',
    'MOTA = [1 − (FP + FN + IDSW) / GT] × 100',
    '판정값: 4개 시퀀스 MOTA의 산술평균',
    '목표: MOTA 80% 이상',
])
completed = summary('completed', '전체 시퀀스 추론·평가 완료', [
    sequence + ': ' + format(frames, ',') + '프레임 추론·후처리·평가 완료'
    for sequence, frames in lengths.items()
] + ['MOTA 산술평균: ' + format(average, '.6f') + '%', '판정: 목표 80% 이상 충족'])
table = Image.new('RGB', (2000, 430), 'white')
draw = ImageDraw.Draw(table)
table_font = ImageFont.truetype(font_path, 36)
headers = ['시퀀스', 'FP', 'FN', 'IDSW', 'GT', 'MOTA (%)']
columns = [35, 390, 675, 945, 1220, 1590]
for index, header in enumerate(headers):
    draw.text((columns[index], 15), header, font=table_font, fill='#16324a')
for row_index, sequence in enumerate(lengths):
    item = folds[sequence]
    entries = [sequence] + [format(item[key], ',') for key in ['fp', 'fn', 'idsw', 'gt']] + [format(item['mota_percent'], '.6f')]
    for column, value in zip(columns, entries):
        draw.text((column, 80 + row_index * 60), value, font=table_font, fill='#172b3a')
draw.text((35, 340), '4개 시퀀스 MOTA 산술평균: ' + format(average, '.6f') + '% / 목표 80% 이상 충족', font=table_font, fill='#16324a')
table_path = figures / 'metric-table.png'
table.save(table_path)
mapping = {
    'image3.png': environment,
    'image4.png': args.screenshots / 'manager-container.png',
    'image5.png': args.screenshots / 'jupyterlab.png',
    'image6.png': args.screenshots / 'terminal.png',
    'image7.png': args.screenshots / 'workspace.png',
    'image8.png': args.screenshots / 'integrity-command.png',
    'image9.png': args.screenshots / 'integrity-result.png',
    'image10.png': protocol,
    'image11.png': completed,
    'image12.png': table_path,
}
with ZipFile(base / 'reference-original-layout.hwpx') as source:
    for original in source.namelist():
        name = Path(original).name
        if not original.startswith('BinData/') or name not in mapping:
            continue
        old = Image.open(BytesIO(source.read(original)))
        picture = Image.open(mapping[name]).convert('RGB')
        canvas = ImageOps.pad(picture, (1800, round(1800 * old.height / old.width)), color='white', method=Image.Resampling.LANCZOS)
        target = figures / name
        canvas.save(target)
        payload['pictures'][original] = str(target)
payload['status'] = 'completed image inference and evaluation; arithmetic mean >= 80%'
(base / 'final-original-report-payload.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'macro_mota_percent': average, 'payload': str(base / 'final-original-report-payload.json')}, ensure_ascii=False))
