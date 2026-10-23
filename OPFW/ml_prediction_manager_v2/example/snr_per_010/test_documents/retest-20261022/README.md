# GitHub clone 기반 SNR-PER-010 재시험

2026년 10월 22~23일 예측매니저에서 v4.0 이미지를 생성하고 `snr-per-010-retest` 컨테이너의 외부 포트 8080 JupyterLab에서 시험했습니다. 시험 소스는 `OPFW_development_ETRI_pman` 브랜치의 `4ce1a356eb335cda642a09eee2054db31d674c3d`입니다.

공식 MOT20 데이터를 처음부터 다운로드하고 사전학습 모델 60개 해시를 검증했습니다. 이전 추론 캐시 없이 4개 시퀀스 전체 8,931프레임을 처리한 MOTA 산술평균은 **80.011059%**이며, 판정 조건은 IoU 0.1에서 80% 이상입니다.

- [원본 양식 결과서 HWP](SNR-PER-010_시험절차및결과서_최종.hwp), [HWPX](SNR-PER-010_시험절차및결과서_최종.hwpx), [PDF](SNR-PER-010_시험절차및결과서_최종.pdf): 19쪽(v2.2), 예측매니저 접속 주소·이미지 Dockerfile·컨테이너 자원과 볼륨 설정·GitHub 인증·실행 명령·정상 출력·실제 그림 포함
- [시험 화면 및 평가 이미지 PPTX](SNR-PER-010_시험화면및평가이미지.pptx): 78장, 실제 화면·그래프·추적 및 이동 궤적 이미지
- [전체 시험 녹화 MP4](SNR-PER-010_GitHub_clone_전체시험녹화.mp4): 10시간 12분 40초, 이미지 생성·컨테이너 실행·GitHub clone·공식 데이터셋 다운로드·추론·평가 완료 화면 포함
- [녹화 구간 목록](SNR-PER-010_GitHub_clone_전체시험녹화.chapters.txt): MP4에도 27개 구간 삽입
- [원본 녹화 MKV](전체시험녹화_원본.mkv), [재생·해시 검증](SNR-PER-010_GitHub_clone_전체시험녹화.verification.json)
- [평가 결과·예측 파일·48개 원본 평가 이미지](../../results/retest-20261022/), [실행 노트북](../../results/retest-20261022/execution/SNR-PER-010_추론_성능평가.ipynb)

MP4는 실제 녹화의 전체 프레임과 시간을 보존했습니다. 원본 및 MP4는 모두 5,350프레임이며 전체 디코딩 검사를 통과했습니다. 화면이 변할 때 프레임을 저장하는 방식으로 기록했습니다.

`presentation-images.json`은 슬라이드 이미지의 저장소 상대 경로와 해시를 제공합니다. 모델은 example 패키지의 `MODEL_MANIFEST.json`, `WEIGHT_PARTS.json`, `outputs/models/`, `artifacts/reid/`, `weights/`에 보관하며 `prepare_weights.py`로 복원합니다. 기본 노트북은 다음 시험을 위해 출력이 없는 상태를 유지합니다.

[접속·설정·시험 실행 안내 텍스트](SNR-PER-010_시험실행명령.txt)는 결과서 7~19쪽의 절차와 명령을 제공합니다. 2.1에서 계정·권한·저장 공간을 준비하고, 2.2에서 예측매니저 이미지·컨테이너와 GitHub 인증을 설정한 뒤, 4.1의 clone·입력 검증과 4.2의 추론·평가·결과 다운로드를 순서대로 실행합니다.
