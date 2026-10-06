# 예제

해석기 5종마다 예제가 하나씩 있다. 각 폴더에는 입력 JSON, JSON이 쓰는 STL, 결과 미리보기(`preview.mp4`, `preview.png`)와 설명이 들어 있다.

| 예제 | 해석기 | 실행 파일 | 입력 출처 |
| --- | --- | --- | --- |
| [01_multi_component](01_multi_component/) | 다성분 (2성분) | LBM | IITP 2024 테스트 시나리오 |
| [02_multiphase](02_multiphase/) | 다상 | LBM | 모세관 내 액체층 (Ca = 0.0091) |
| [03_concentration_diffusion](03_concentration_diffusion/) | 농도확산 | LBM | Zhang et al. (2012) 벽 주입 Couette 흐름 벤치마크 |
| [04_conjugate_heat_transfer](04_conjugate_heat_transfer/) | 복합 열전달 | LBM | 공인시험 시나리오 HT-001 (핀이 달린 공동의 자연대류) |
| [05_fluid_dem](05_fluid_dem/) | 유체-DEM 연성 | LBM_DEM | 공인시험 시나리오 FD-001 (입자가 섞인 댐 붕괴) |

## 실행

`modeling_simulation_engines` 폴더에서 실행한다. 스크립트는 실행 파일 묶음을 필요할 때 풀고, `runs/<시각>_<JSON 이름>/` 폴더를 새로 만들어 그 안에서 해석기를 돌린다.

```powershell
# Windows (PowerShell 7)
pwsh -File scripts\run_case.ps1 examples\03_concentration_diffusion\03_concentration_diffusion.json
```

```bash
# Linux
bash scripts/run_case.sh examples/03_concentration_diffusion/03_concentration_diffusion.json
```

끝나면 판정(`completed` 또는 `failed`)과 이유, 걸린 시간, 결과 크기를 출력하고 같은 내용을 작업 폴더의 `result.json`에 남긴다. 해석기의 화면 출력은 `run.log`에 있다. 판정 기준은 다음과 같다.

- 종료 코드가 0이고 로그의 마지막 결과 코드 줄이 `RC : 0`이면 성공이다.
- LBM_DEM은 계산이 발산해도 종료 코드 0으로 끝날 수 있다. 그래서 로그에 `nan`이나 `inf`가 있으면 실패로 본다.

스크립트 없이 확인하려면 `run.log` 마지막 줄이 `RC : 0, SUCCESS: Analysis Done`인지, 결과 폴더에 마지막 저장 번호의 파일이 있는지 본다.

## 짧은 실행과 원래 길이

원래 길이 입력은 결과가 수 GB에서 수십 GB까지 커진다. 그래서 처음에는 종료 시간만 줄인 짧은 실행(`*_short.json`)을 권한다. 03 농도확산은 원래 길이도 1분 안에 끝나 짧은 실행 파일이 없다.

| 예제 | 짧은 실행 | 원래 길이 |
| --- | --- | --- |
| 01 다성분 | 640 스텝, 91초, 4.2 GB | 13,120 스텝, 약 18분, VTU 약 29 GB |
| 02 다상 | 200 스텝, 10초, 0.09 GB | 100,000 스텝, 저장 1,001회, 약 10.6 GB |
| 03 농도확산 | - | 20,000 스텝, 13~41초, 0.5 MB |
| 04 복합 열전달 | 1,280 스텝, 57초, 1.4 GB | 64,000 스텝, 40분, 31.3 GB |
| 05 유체-DEM 연성 | 200 스텝, 16초, 0.4 GB | 2,000 스텝, 약 1분 |

시간은 RTX 5080 한 장에서 잰 값이다. 이 GPU는 빌드 대상 밖이라 드라이버가 GPU 코드를 컴파일하며 돌았으므로 참고로만 본다. 03 농도확산의 41초는 그 컴파일 시간이 들어간 첫 실행이다. 원래 길이의 01·02·05 시간과 01·02 크기는 짧은 실행에서 추정한 값이고, 04는 실제로 돌린 값이다. 결과 크기에는 재시작 파일(`continue/`)이 들어 있다.

## 결과 보기

결과는 VTK 형식이다. ParaView에서 결과 폴더의 `<title>_<n>.vtm`을 열면 된다. 폴더 구성은 [`doc/output_format.md`](../doc/output_format.md)에 있다.
