# FeDiT Prediction Manager CPU 전용 실행본

`FeDiT` 루트에 CPU 압축을 한 번 풀고 다음 두 파일만 순서대로 실행한다.

```bash
cd /home/$USER/prediction-manager-work/FeDiT/OPFW/ml_prediction_manager_v2/scripts
./01-install-required-modules-cpu.sh
./02-start-prediction-manager-cpu.sh
```

CPU 실행본은 `nvidia-smi`를 요구하지 않고 NVIDIA driver, Container
Toolkit, Device Plugin, DCGM Exporter를 설치하지 않는다. Ray는
`rayproject/ray:2.54.1-py312` CPU 이미지를 사용하고 GPU worker를 생성하지
않는다. IP, DNS, 백엔드·프런트엔드 경로는 실행 PC에서 다시 감지한다.
