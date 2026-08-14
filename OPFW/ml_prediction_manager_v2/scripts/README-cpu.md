# FeDiT Prediction Manager CPU 전용 실행본

`FeDiT` 루트에 CPU 압축을 한 번 풀고 다음 두 파일만 순서대로 실행한다.

```bash
cd /home/$USER/prediction-manager-work/FeDiT/OPFW/ml_prediction_manager_v2/scripts
sudo find . -type f -name '*.sh' -exec chmod +x {} +
sudo ./01-install-required-modules-cpu.sh
sudo ./02-start-prediction-manager-cpu.sh
```

CPU 실행본은 `nvidia-smi`를 요구하지 않고 NVIDIA driver, Container
Toolkit, Device Plugin, DCGM Exporter를 설치하지 않는다. Ray는
`rayproject/ray:2.54.1-py312` CPU 이미지를 사용하고 GPU worker를 생성하지
않는다. IP, DNS, 백엔드·프런트엔드 경로는 실행 PC에서 다시 감지한다.
CPU 전용 설치기는 단일 노드 리소스 프로필을 적용한다. 메모리 용량 때문에
설치를 중단하거나 메뉴를 숨기지 않으며, Prediction Manager, Dataset, AutoML,
Ray, MLflow, TensorBoard, KServe, NiFi, Label Studio 및 모니터링 서비스를
동일한 CPU 설치에서 사용할 수 있다.
