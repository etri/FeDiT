# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
"""테스트용 가짜 해석기. 실제 해석기(NFLOW_LBM, NFLOW_LBM_DEM)와 같은 모양의 결과 파일과 로그를 만든다.

사용: python fake_solver.py <config.json>   (작업 폴더에서 실행)
동작은 JSON의 "fake" 항목으로 정한다.
  mode   ok | diverge | nan | parse_error | no_rc   (기본 ok)
  saves  저장 횟수 (기본 3)
  levels 격자 레벨 수 (기본 1)
  grid0  true면 0번 저장에만 고정 입자 파일(<title>_grid0_0.vtk)을 쓴다
  grid1  true면 저장마다 입자 파일(<title>_grid1_<n>.vtk)을 쓴다
  sleep  저장 사이 대기 초 (기본 0)
결과 위치는 실제 해석기와 같다: export_path가 비면 <JSON 이름>/, 파일 이름 앞부분은 meta.title(없으면 JSON 이름).
"""
import json
import sys
import time
from pathlib import Path

cfg_path = Path(sys.argv[1])
try:
    cfg = json.loads(cfg_path.read_text(encoding='utf-8'))
except Exception as e:  # 실제 해석기처럼 파싱 오류는 RC -2002, 종료 코드 1
    print(f'RC : -2002, ERROR: {e}')
    sys.exit(1)

fake = cfg.get('fake', {})
mode = fake.get('mode', 'ok')
if mode == 'parse_error':
    print('RC : -2002, ERROR: [json.exception.out_of_range.403] key not found')
    sys.exit(1)

title = (cfg.get('meta') or {}).get('title') or cfg_path.stem
export = cfg.get('config', {}).get('result_report', {}).get('export_path', '') or cfg_path.stem
out = Path(export)
saves, levels = int(fake.get('saves', 3)), int(fake.get('levels', 1))

print('\x1b[94mEnd Generation\x1b[0m')
print('Init Device')
for n in range(saves):
    vtm = ['<VTKFile type="vtkMultiBlockDataSet"><vtkMultiBlockDataSet>']
    for lv in range(levels):
        d = out / 'bin' / f'LEVEL_{lv:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / f'{title}_{n}.vtu').write_bytes(bytes([n % 256]) * (1000 + 37 * n))
        vtm.append(f'<DataSet index="{lv}" file="bin/LEVEL_{lv:02d}/{title}_{n}.vtu"/>')
    (out / f'{title}_{n}.vtm').write_text(''.join(vtm) + '</vtkMultiBlockDataSet></VTKFile>')
    if fake.get('grid0') and n == 0:
        (out / f'{title}_grid0_0.vtk').write_bytes(b'grid0' * 100)
    if fake.get('grid1'):
        (out / f'{title}_grid1_{n}.vtk').write_bytes(b'grid1' * (50 + n))
    (out / 'continue').mkdir(exist_ok=True)
    (out / 'continue' / f'{title}_LEVEL_0.bin').write_bytes(b'restart' * 1000)
    print(f'{n + 1} / {saves} ({n + 1:.8f} / {saves:.8f}) 10.0iter/s')
    if mode == 'nan' and n == saves - 1:
        print('max velocity = nan')
    time.sleep(float(fake.get('sleep', 0)))

if mode == 'diverge':
    print('\x1b[31mSolver has diverged at step:3\x1b[0m')
    print('RC : -4001, ERROR: diverged')
    sys.exit(1)
if mode == 'no_rc':
    sys.exit(0)
print('\x1b[32m\nAnalysis Done\n\x1b[0m')
print('RC : 0, SUCCESS: Analysis Done')
sys.exit(0)
