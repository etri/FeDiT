# NiFi Python Runtime Image

`apache/nifi:1.28.1`에 NiFi `ExecuteStreamCommand`에서 사용할 Python/ML
런타임을 추가한 이미지이다.

포함 항목:

- Python 3 virtual environment: `/opt/pm-python`
- NumPy, pandas, scikit-learn, joblib, ONNX Runtime
- 승인 스크립트 경로: `/opt/pm/scripts`
- 사용자 승인 스크립트 PVC 경로: `/opt/pm/user-scripts`
- 모델 PVC 경로: `/opt/pm/models`

빌드 및 Push (`<REGISTRY>`는 Kubernetes 노드에서 접근 가능한 레지스트리로
교체한다):

```bash
docker build \
  -f docker/nifi-python/Dockerfile \
  -t <REGISTRY>/prediction-manager-nifi-python:1.28.1-pm2 \
  docker/nifi-python

docker push <REGISTRY>/prediction-manager-nifi-python:1.28.1-pm2
```

런타임 확인:

```bash
docker run --rm --entrypoint /opt/pm/scripts/runtime_check.py \
  <REGISTRY>/prediction-manager-nifi-python:1.28.1-pm2
```

`ExecuteStreamCommand` 검증 설정:

| 항목 | 값 |
|---|---|
| Command Path | `/opt/pm-python/bin/python` |
| Command Arguments | `/opt/pm/scripts/json_passthrough.py` |
| Ignore STDIN | `false` |
| Output Destination Attribute | 비움 |

입력 FlowFile이 JSON 객체이면 출력 JSON에 `_nifi_python.processed=true`와
처리 시각이 추가된다.

scikit-learn 또는 ONNX 모델 추론 설정:

| 항목 | 값 |
|---|---|
| Command Path | `/opt/pm-python/bin/python` |
| Command Arguments | `/opt/pm/scripts/model_infer.py;--model;/opt/pm/models/model.joblib;--features;temperature,pressure` |
| Argument Delimiter | `;` |
| Ignore STDIN | `false` |
| Output Destination Attribute | 비움 |

모델 파일은 `/opt/pm/models` 아래에 배치한다. 이 경로와
`/opt/pm/user-scripts`는 tenant NiFi PVC에 저장되어 Pod 재시작 후에도
유지된다. joblib/pickle은
역직렬화 시 코드를 실행할 수 있으므로 신뢰된 모델만 사용한다. PyTorch와
TensorFlow 모델은 NiFi 이미지에 대형 런타임을 포함하지 않고 `InvokeHTTP`로
KServe 추론 endpoint를 호출한다.

임의의 사용자 코드를 이미지 또는 Pod에 직접 넣지 않는다. 검토된 스크립트만
이미지에 포함하거나 읽기 전용 PVC/ConfigMap으로 마운트한다.
