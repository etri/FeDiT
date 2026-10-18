# Grounding DINO + SAM 로컬 실측 (2026-10-15)

RTX 3050 Laptop 4GB에서 실제 사전학습 모델의 검출 및 마스크 생성을 확인했다.
예측매니저 `docker_service.render_dockerfile(ImageBuildRequest(...))`로 생성한
이미지를 Docker에서 실행했고, Jupyter REST/WebSocket API로 실제 Python 커널을
만들어 검증 코드를 실행했다. Jupyter 화면 클릭이나 Kubernetes Notebook 배포를
대신한 검증은 아니다. 실행 사용자는 uid 1000, 소스는 읽기 전용 mount다.

## 실행 조건

- 이미지: `grounded-sam-jupyter:local-test`.
- 부모: 앞서 빌드한 `pman-gpu-validation:20261015`의 PyTorch 2.7.1+cu118.
  이미지 생성 요청의 `custom` 모드를 사용했다. 기본 PyTorch 2.1/CUDA 12.1
  이미지 태그나 원본 GroundingDINO CUDA 확장 빌드를 검증한 결과는 아니다.
- 생성 요청과 Dockerfile: `scripts/docker/grounded-sam/`.
- Transformers 4.51.3, torchvision 0.22.1+cu118, Jupyter Server 2.21.1.
  이미지의 `pip check` 통과.
- Grounding DINO Tiny: `IDEA-Research/grounding-dino-tiny`, revision
  `a2bb814dd30d776dcf7e30523b00659f4f141c71`.
- SAM ViT-B: `facebook/sam-vit-base`, revision
  `70c1a07f894ebb5b307fd9eaaee97b9dfc16068f`.
- FP16 가중치, CUDA autocast, inference_mode. CUDA 메모리 할당 상한 85%.
- WSL: RAM 6GB, CPU 4개, swap 4GB. 컨테이너: CPU 2, RAM 4GiB,
  memory+swap 6GiB, 공유 메모리 256MiB.
- GPU 연결: 기존 WSL 방식의 `/dev/dxg` 및 `/usr/lib/wsl` mount.
  표준 NVIDIA Container Toolkit runtime 및 Kubernetes GPU device plugin은 미검증.
- 별도 Docker subnet `10.254.254.224/28`. 호스트 포트를 공개하지 않고
  컨테이너 안의 loopback Jupyter API에 접속했다.

샘플은 [SAM 공식 문서에 사용되는 자동차 이미지](https://huggingface.co/ybelkada/segment-anything/resolve/main/assets/car.png)다.
원본을 최대 1024px로 줄인 1024×683 이미지를 사용했다. Grounding DINO 입력은
shortest edge 640 / longest edge 1024, 텍스트는 `a car. a wheel.`,
box threshold 0.3 / text threshold 0.25다. SAM 이미지 인코더는 기본 1024 입력이다.

## 측정 결과

| 단계 | 배치 | 결과 | 시간(초) | PyTorch 최대 예약 메모리(MiB) |
| --- | ---: | --- | ---: | ---: |
| DINO 이미지 검출 | 1 | 성공 | 13.356 | 1240 |
| DINO 이미지 검출 | 2 | 성공 | 3.084 | 2114 |
| DINO 이미지 검출 | 4 | OOM | — | — |
| SAM 이미지 인코딩, 두 모델 GPU 상주 | 1 | 성공 | 3.104 | 2710 |
| SAM 박스 디코딩, 이미지 임베딩 재사용 | 1 | 성공 | 0.507 | 594 |
| 동일 | 4 | 성공 | 0.159 | 680 |
| 동일 | 8 | 성공 | 0.198 | 784 |
| 동일 | 16 | 성공 | 0.271 | 1038 |
| 동일 | 32 | 성공 | 0.588 | 1502 |
| 전체 검출→이미지 인코딩→실제 검출 박스 분할 | 이미지 1 | 성공 | 14.687 | 3358 |
| 전체 경로 반복 2 | 이미지 1 | 성공 | 14.344 | 3358 |
| 전체 경로 반복 3 | 이미지 1 | 성공 | 14.332 | 3358 |

첫 DINO 측정에는 초기 CUDA 실행 비용이 포함된다. 시간은 전처리·후처리와
CPU로의 결과 복사를 포함하는 단일 측정값이며, 장시간 처리량 벤치마크가 아니다.
전체 경로의 최대 할당 메모리는 2499.5MiB, 최대 예약 메모리는 3358MiB다.
CUDA context나 다른 프로세스를 포함한 GPU 전체 점유량과는 구분해야 한다.
OOM은 **85% 할당 한도 조건**에서 발생했으며 물리적 최대 배치를 확정한 결과는 아니다.

자동차 1개와 바퀴 2개가 검출됐고, 자동차 마스크가 실제 차량 윤곽을 따르는 것을
출력 이미지로 확인했다. SAM 출력의 predicted IoU score는 약 0.995지만,
정답 마스크와 비교한 실측 IoU나 정확도는 아니다.

박스 배치 확장 검사는 같은 이미지에서 실제 검출 박스를 반복해 decoder 부하를
분리한 것이다. 서로 다른 이미지 32장을 처리했다는 의미가 아니다.
전체 경로 반복은 매번 DINO 검출과 SAM 임베딩을 새로 계산하고 실제 검출 박스
3개를 모두 분할한다. 두 모델은 GPU에 계속 상주했다.

## 권장값과 한계

- 로컬 기본: **이미지 배치 1 / SAM 박스 배치 8 / 동시 작업 1**.
  고해상도 마스크나 다른 GPU 작업이 있으면 박스 배치를 4 또는 1로 낮춘다.
- 박스 배치 32도 이 샘플에서는 성공했다. 기본값을 32로 높이기보다는 실제
  업무 이미지의 해상도·객체 수·마스크 저장 방식을 먼저 측정한다.
- DINO 이미지 배치 2의 성공은 전체 DINO+SAM 이미지 배치 2의 성공을 뜻하지 않는다.
- A40은 이번에 실행하지 않았다. A40 배치 권장치는 여전히 실측 전 시작값이다.
- 원본 GroundingDINO 확장, SAM ViT-H, FP32, 학습/미세조정, 대량 데이터,
  실제 업무 이미지의 품질, 다중 사용자 부하와 장시간 안정성은 미검증이다.
- 예측매니저의 기존 AutoML GPU 검증과 별개인 Jupyter 사용자 작업 검증이다.

## 재실행 및 산출물

1. `scripts/docker/ray-mlflow/Dockerfile`로 위 부모 이미지를 먼저 준비한다.
2. `scripts/docker/grounded-sam/image-request.json`을 예측매니저 이미지 생성
   요청으로 사용하거나 같은 디렉터리의 생성된 Dockerfile로 이미지를 빌드한다.
3. 사용자 소유 캐시/작업 디렉터리를 `/home/jovyan/cache`, `/home/jovyan/work`에
   연결하고 이 checkout을 `/home/jovyan/source:ro`에 연결한다.
   `HF_HOME=/home/jovyan/cache`, `HF_HUB_DISABLE_XET=1`을 사용했다.
4. 이미지 기본 CMD로 JupyterLab을 실행한 뒤 컨테이너에서 다음을 수행한다.

```bash
python /home/jovyan/source/scripts/run-grounded-sam-notebook.py
```

`tmp/grounded-sam/`에 결과 JSON, 실행된 notebook, 마스크 PNG, 시각화 및 로그를
보관했다. Git에는 가중치·캐시·원시 산출물을 넣지 않았다. 가중치 캐시는 WSL
사용자 홈 `/home/user/grounded-sam-validation/cache`에 남겨 재사용할 수 있다.
검증용 컨테이너와 네트워크는 종료·제거하며 기존 컨테이너는 유지한다.

모델 사용 근거: [Grounding DINO Transformers](https://huggingface.co/docs/transformers/model_doc/grounding-dino),
[SAM Transformers](https://huggingface.co/docs/transformers/model_doc/sam).
