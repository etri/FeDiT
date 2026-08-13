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
사용 가능 메모리가 16 GiB 미만이면 서비스 진입 검증용 저메모리 프로필을
자동 사용하며, 메모리 용량 때문에 설치를 중단하지는 않는다.
