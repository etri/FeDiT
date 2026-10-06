# 실행 파일

해석기 5종은 실행 파일 2개로 돈다. 어느 해석기를 쓸지는 입력 JSON의 `solver_type`이 정한다.

| 실행 파일 (Windows / Linux) | 해석기 |
| --- | --- |
| `LBM_Runtime.exe` / `NFLOW_LBM` | 다성분, 다상, 농도확산, 복합 열전달 |
| `LBM_DEM_Runtime.exe` / `NFLOW_LBM_DEM` | 유체-DEM 연성 |

이 폴더의 실행 파일은 오픈소스가 아니며 [`LICENSE.md`](LICENSE.md)의 약관을 따른다. 저장소의 LGPL-2.1 선언은 이 폴더에 적용되지 않는다.

## 묶음

| 파일 | 크기 | 내용 |
| --- | --- | --- |
| `windows/NFLOW_LBM_windows_x64.7z` | 50 MB | `LBM\` 폴더: `LBM_Runtime.exe`와 dll 10개 |
| `windows/NFLOW_LBM_DEM_windows_x64.7z` | 5 MB | `LBM_DEM\` 폴더: `LBM_DEM_Runtime.exe`와 dll 4개 |
| `linux/NFLOW_LBM_linux_x64.tar.xz` | 43 MB | `lbm/bin/NFLOW_LBM`, `lbm/lib/` (NVRTC 포함) |
| `linux/NFLOW_LBM_DEM_linux_x64.tar.xz` | 13 MB | `lbm_dem/bin/NFLOW_LBM_DEM`, `lbm_dem/lib/` |

묶음마다 최상위 폴더 안에 이 약관(`LICENSE.md`), 서드파티 고지(`THIRD_PARTY_NOTICES.md`), 빌드 정보(`BUILD_INFO.txt`)가 함께 들어 있다. 빌드 커밋, 컴파일러, 대상 GPU는 `BUILD_INFO.txt`에 있다. 묶음의 SHA256 값은 `SHA256SUMS.txt`에 있다.

## 필요한 것

| 항목 | Windows | Linux |
| --- | --- | --- |
| GPU | NVIDIA GPU | NVIDIA GPU |
| 드라이버 | CUDA 11.7 이상을 지원하는 NVIDIA 드라이버 | CUDA 12.1 이상을 지원하는 NVIDIA 드라이버 |
| 그 밖에 | Microsoft Visual C++ 2015–2022 재배포 가능 패키지(x64) | `libgomp1`(OpenMP), 묶음을 풀 `xz` |

CUDA 툴킷은 설치하지 않아도 된다. Windows 묶음에는 CUDA 런타임과 NVRTC dll이 들어 있다. Linux 실행 파일은 CUDA 런타임을 정적으로 링크했고 NVRTC는 묶음의 `lib/`에 들어 있으며, 같은 묶음의 라이브러리를 스스로 찾으므로 `LD_LIBRARY_PATH`도 필요 없다.

빌드 대상 GPU(Windows LBM sm_61·75·86, LBM_DEM sm_61·75·80, Linux sm_75·80·86·89)가 아닌 GPU에서는 첫 실행 때 드라이버가 GPU 코드를 컴파일한다. RTX 5080에서는 LBM이 약 140초, LBM_DEM이 약 50초 더 걸렸다. 컴파일한 코드는 드라이버 캐시에 남아 다음 실행부터는 이 시간이 들지 않는다.

## 풀기

`scripts/run_case.ps1`과 `scripts/run_case.sh`는 실행 파일 폴더가 없으면 묶음을 알아서 푼다. 직접 풀 때는 다음과 같이 한다.

```powershell
# Windows (modeling_simulation_engines 폴더에서). Windows 10은 7-Zip으로 풀어도 된다.
tar -xf release\windows\NFLOW_LBM_windows_x64.7z -C release\windows
tar -xf release\windows\NFLOW_LBM_DEM_windows_x64.7z -C release\windows
```

```bash
# Linux
tar -xJf release/linux/NFLOW_LBM_linux_x64.tar.xz -C release/linux
tar -xJf release/linux/NFLOW_LBM_DEM_linux_x64.tar.xz -C release/linux
```

묶음이 온전한지 확인하려면 `release` 폴더에서 `sha256sum -c SHA256SUMS.txt`를 실행한다(Windows는 `Get-FileHash`로 값을 비교한다).

## 직접 실행하기

실행 파일은 현재 폴더에서 입력 JSON과 JSON이 가리키는 STL 파일을 읽고, 같은 폴더에 결과 폴더를 만든다. 그래서 입력 파일을 한 폴더에 모은 뒤 그 폴더에서 실행한다.

```powershell
# Windows: 입력 파일이 있는 폴더에서
<저장소>\OPFW\modeling_simulation_engines\release\windows\LBM\LBM_Runtime.exe 03_concentration_diffusion.json
```

```bash
# Linux: 입력 파일이 있는 폴더에서
<저장소>/OPFW/modeling_simulation_engines/release/linux/lbm/bin/NFLOW_LBM 03_concentration_diffusion.json
```

정상으로 끝나면 로그 마지막에 `RC : 0, SUCCESS: Analysis Done`이 찍히고 종료 코드가 0이다. 결과 폴더와 파일 이름 규칙은 [`doc/output_format.md`](../doc/output_format.md)에 있다.
