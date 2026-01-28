# IITP PRE Web Preprocessor - Docker 가이드

## 개요
IITP PRE Web Preprocessor의 Docker 기반 빌드 및 배포 가이드입니다.

## 파일 구조
```
docker/
├── Dockerfile          # Multi-stage 빌드 설정
├── docker-compose.yml  # 컨테이너 실행 설정
├── nginx.conf         # Nginx 웹서버 설정
├── env.sh            # 런타임 환경변수 주입 스크립트
└── README.md         # 본 문서
```

## 빠른 시작

### 1. Docker Desktop 설치
Windows에서 Docker Desktop이 실행 중인지 확인:
```bash
docker --version
docker-compose --version 혹은 docker compose --version (최신 명령어)
```

### 2. 환경변수 설정 (필수!)

⚠️ **중요**: `VITE_API_URL`은 필수 환경변수입니다. 설정하지 않으면 컨테이너가 제대로 작동하지 않습니다.

#### 방법 1: .env 파일 생성 (권장)
`docker/.env` 파일을 생성하세요:
```env
# 필수 환경변수
VITE_API_URL=http://172.16.37.55:13000/api  # API 서버 주소 (필수!)

# 선택 환경변수 (기본값 있음)
IMAGE_NAME=nflow-web-pre      # 기본값: nflow-web-pre
VERSION=latest                 # 기본값: latest
NGINX_PORT=3000               # 기본값: 3000
VITE_ENV_MODE=production      # 기본값: production
```

#### 방법 2: 시스템 환경변수 설정
Windows 명령 프롬프트:
```cmd
# 필수 설정
set VITE_API_URL=http://your-api-server:13000/api

# 선택 설정
set NGINX_PORT=3000
set VITE_ENV_MODE=development
```

PowerShell:
```powershell
# 필수 설정
$env:VITE_API_URL="http://your-api-server:13000/api"

# 선택 설정
$env:NGINX_PORT="3000"
$env:VITE_ENV_MODE="development"
```

#### 방법 3: docker-compose.yml 수정 (비권장)
기본값을 직접 추가:
```yaml
environment:
  - NFLOW_ENV_API_URL=${VITE_API_URL:-http://172.16.37.55:13000/api}  # 기본값 추가
```

### 3. 빌드
```bash
# docker 폴더로 이동
cd docker

# 이미지 빌드
docker-compose build 혹은 docker compose build (최신 명령어)

# 캐시 무시하고 새로 빌드
docker-compose build --no-cache 혹은 docker compose build --no-cache (최신 명령어)
```

### 4. 실행
```bash
# 컨테이너 실행 (백그라운드)
docker-compose up -d 혹은 docker compose up -d (최신 명령어)

# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs iitp-pre-web -f

# 브라우저에서 접속
# http://localhost:3000
```

### 5. 중지
```bash
docker-compose down 혹은 docker compose down (최신 명령어)
```

## 환경변수 상세 설명

### 필수 환경변수
| 변수명 | 설명 | 예시 | 기본값 |
|--------|------|------|--------|
| `VITE_API_URL` | API 서버 주소 | `http://172.16.37.55:13000/api` | **없음** (필수!) |

### 선택 환경변수 (기본값 있음)
| 변수명 | 설명 | 예시 | 기본값 |
|--------|------|------|--------|
| `NGINX_PORT` | 호스트 포트 | `3000`, `80` | `3000` |
| `VITE_ENV_MODE` | 실행 환경 | `development`, `production` | `production` |
| `IMAGE_NAME` | 이미지 이름 | `nflow-web-pre` | `nflow-web-pre` |
| `VERSION` | 이미지 버전 | `latest`, `1.0.0` | `latest` |

## 서버 배포

⚠️ **권장**: `deploy.bat` 자동 배포 도구를 사용하세요 (Windows 환경)

### 방법 1: 자동 배포 (deploy.bat) ⭐ 권장

Windows 환경에서 한 번의 명령으로 전체 배포 프로세스를 자동화합니다.

#### 사전 준비

1. **PuTTY 설치 필수**
   - PuTTY 다운로드: https://www.putty.org/
   - `plink.exe` 명령어가 PATH에 등록되어야 함 (SSH 명령 실행용)
   - 설치 후 명령 프롬프트에서 `plink` 입력하여 확인

2. **Posh-SSH 모듈 설치 필수 (3.x 버전)**
   - PowerShell에서 다음 명령어 실행 (파일 전송용):
   ```powershell
   Install-Module -Name Posh-SSH -Force -Scope CurrentUser
   ```
   - 설치 확인 (3.0 이상 버전이어야 함):
   ```powershell
   Get-Module -ListAvailable -Name Posh-SSH | Select-Object Name, Version
   # Version이 3.0 이상인지 확인
   ```
   - **참고**: Posh-SSH 3.x에서는 `Set-SCPItem` 명령어를 사용합니다 (구버전의 `Set-SCPFile`과 다름)

3. **SSH 호스트 키 사전 등록** (첫 배포 시 1회만)
   ```bash
   # 배포 서버에 대한 호스트 키 캐시 등록 (plink.exe {host})
   e.g) plink.exe "172.16.37.55"

   # "Store key in cache? (y/n)" 메시지가 나오면 'y' 입력
   # 로그인 필요 시, 서버 계정 이름과 비밀번호 입력
   # 이후 Ctrl+C로 종료
   ```

#### 설정 파일 수정

`deploy/deploy.conf` 파일을 환경에 맞게 수정:

```conf
# 내부 배포 서버 정보
INTERNAL_DEPLOY_USER=e8ight                          # 서버 사용자명
INTERNAL_DEPLOY_HOST=172.16.37.55                    # 서버 주소
INTERNAL_DEPLOY_DIR=/home/e8ight/cfd_web_pre/        # 배포 경로

# 외부 배포 서버 정보
EXTERNAL_DEPLOY_USER=e8ight                          # 서버 사용자명
EXTERNAL_DEPLOY_HOST=172.16.38.8                     # 서버 주소
EXTERNAL_DEPLOY_DIR=/home/e8ight/web-pre/preprocessor # 배포 경로

# 로컬 Docker 이미지 정보
IMAGE_NAME=nflow-web-pre                    # 이미지 이름
IMAGE_TAG=latest                            # 이미지 태그

# 전송할 파일 목록 (쉼표로 구분)
FILES_TO_TRANSFER=docker-compose.yml,.env,{IMAGE_NAME}.tar
```

**참고**:
- 비밀번호는 파일에 저장하지 않으며, 실행 시 1회만 입력합니다.
- 배포 대상은 스크립트 실행 시 선택합니다 (1: 내부 - 172.16.37.55 / 2: 외부 - 172.16.38.8)

#### 실행

```bash
# 방법 1: 더블클릭 실행
# deploy/deploy.bat 파일을 더블클릭

# 방법 2: 명령 프롬프트에서 실행
cd deploy
deploy.bat
```

**배포 프로세스** (자동 진행):
0. 설정 파일 로드
1. **배포 대상 선택** (1: 내부 / 2: 외부)
2. **비밀번호 입력** (1회만, 이후 자동 사용)
3. Docker Desktop 실행 확인
4. Docker 이미지 빌드 (캐시 무시)
5. 이미지를 TAR 파일로 저장
6. 배포 서버 기존 컨테이너 중지 (Plink 사용)
7. TAR 파일 및 설정 파일 전송 (Posh-SSH 사용)
8. 서버에서 이미지 로드 (Plink 사용)
9. 서버에서 새 컨테이너 실행 (Plink 사용)
10. 로컬 TAR 파일 자동 삭제
11. 배포 완료

#### 트러블슈팅

**문제 1: "The host key is not cached" 오류**
```bash
# 원인: SSH 호스트 키가 등록되지 않음
# 해결: 다음 명령어로 사전 등록
plink.exe 172.16.37.55

# "Store key in cache? (y/n)" 메시지에서 'y' 입력
```

**문제 2: "plink를 찾을 수 없습니다" 오류**
```bash
# 원인: PuTTY가 설치되지 않았거나 PATH에 없음
# 해결 1: PuTTY 설치 (https://www.putty.org/)
# 해결 2: PATH 환경변수에 PuTTY 경로 추가
#        예) C:\Program Files\PuTTY
```

**문제 3: 비밀번호 인증 실패**
```bash
# 원인: 잘못된 비밀번호 또는 네트워크 문제
# 해결: 비밀번호 확인 후 재시도
# 스크립트가 자동으로 중단되므로 안전함
```

**문제 4: Docker Desktop 실행 안됨**
```bash
# 원인: Docker Desktop이 설치되지 않았거나 경로가 다름
# 해결: deploy.conf의 DOCKER_DESKTOP_PATH 수정
DOCKER_DESKTOP_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe
```

**문제 5: "Posh-SSH 모듈을 찾을 수 없습니다" 오류**
```powershell
# 원인: Posh-SSH 모듈 미설치
# 해결: PowerShell에서 다음 명령어 실행
Install-Module -Name Posh-SSH -Force -Scope CurrentUser

# 설치 확인 (3.0 이상 버전 필요)
Get-Module -ListAvailable -Name Posh-SSH | Select-Object Name, Version
```

**문제 6: "Set-SCPFile 명령을 찾을 수 없습니다" 오류**
```powershell
# 원인: Posh-SSH 2.x 구버전 설치됨
# 해결: Posh-SSH 3.x로 업그레이드
Uninstall-Module Posh-SSH -Force -AllVersions
Install-Module -Name Posh-SSH -Force -Scope CurrentUser

# 버전 확인 (3.0 이상이어야 함)
(Get-Module -ListAvailable -Name Posh-SSH).Version
```

<details>
<summary><b>방법 2: 수동 배포 (상세 가이드 - 클릭하여 펼치기)</b></summary>

### 이미지 파일로 수동 배포

#### 로컬에서 준비
```bash
# 1. .env 파일 생성 (필수!)
cd docker
cat > .env << EOF
VITE_API_URL=http://production-api:13000/api
NGINX_PORT=80
VITE_ENV_MODE=production
EOF

# 2. 이미지 빌드
docker-compose build 혹은 docker compose build (최신 명령어)

# 3. 이미지를 tar 파일로 저장
docker save -o nflow-web-pre.tar nflow-web-pre:latest
```

#### 서버로 전송
```bash
# 1. 필요 파일들 전송
scp "docker-compose.yml" ".env" "nflow-web-pre.tar" e8ight@172.16.37.55:/home/e8ight/cfd_web_pre/
```
필요한 파일 (3개):
- `nflow-web-pre.tar` - Docker 이미지
- `docker-compose.yml` - 실행 설정
- `.env` - 환경변수 설정

#### 서버에서 실행
```bash
# 1. 이미지 로드
docker load -i nflow-web-pre.tar

# 2. .env 파일 확인 (반드시 VITE_API_URL 포함)
cat .env

# 3. 컨테이너 실행
docker-compose up -d 혹은 docker compose up -d (최신 명령어)

# 4. 상태 확인
docker ps
docker exec nflow-web-pre env | grep NFLOW_ENV_API_URL
```

</details>

## 주요 명령어

### 컨테이너 관리
```bash
# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 재시작
docker-compose restart 혹은 docker compose restart (최신 명령어)

# 컨테이너 로그 보기
docker logs nflow-web-pre

# 컨테이너 내부 접속
docker exec -it nflow-web-pre sh

# 환경변수 확인
docker exec nflow-web-pre env | findstr NFLOW_ENV
```

### 이미지 관리
```bash
# 이미지 목록
docker images

# 이미지 삭제
docker rmi nflow-web-pre:latest

# 미사용 리소스 정리
docker system prune -a
```

## 동작 원리

### Multi-stage 빌드
1. **Stage 1 (Node.js)**: React 앱 빌드
   - 소스 코드 복사
   - 종속성 설치
   - 프로덕션 빌드 생성

2. **Stage 2 (Nginx)**: 웹 서버 설정
   - 빌드된 정적 파일 복사
   - Nginx 설정 적용
   - 환경변수 주입 스크립트 설정

### 런타임 환경변수 주입
`env.sh` 스크립트가 컨테이너 시작 시 자동 실행되어:
1. `NFLOW_ENV_`로 시작하는 환경변수 탐색
2. 빌드된 JS 파일에 실제 값 주입
3. API 주소 등을 동적으로 변경 가능

## E8IGHT 서버 환경 상세 설명 (25.09.23 기준)

### 구성 정보
| 항목 | 값 | 비고 |
|--------|------|------|
| 서버 주소 | `e8ight@172.16.37.55` | 사내 AI 서버 |
| 폴더 경로 | `home/e8ight/cfd-web-pre` | 컨테이너 실행 시, 필요 파일 위치 |

### shell 명령어 예시
1. 파일 전송 (로커 -> 서버)<br>
  `scp .\docker-compose.yml e8ight@172.16.37.55:/home/e8ight/cfd_web_pre`

2. 서버 접속<br>
  `ssh e8ight@172.16.37.55`

## 트러블슈팅

### API 연결 실패
```bash
# 환경변수 확인
docker exec nflow-web-pre env | grep NFLOW_ENV_API_URL

# 비어있다면 .env 파일 확인
cat docker/.env

# .env 파일 생성/수정 후 재시작
docker-compose down 혹은 docker compose down (최신 명령어)
docker-compose up -d 혹은 docker compose up -d (최신 명령어)
```

### 포트 충돌
```bash
# 3000 포트 사용 중인지 확인
netstat -an | findstr :3000

# 다른 포트로 변경
set NGINX_PORT=8080
docker-compose up -d 혹은 docker compose up -d (최신 명령어)
```

### 컨테이너 재시작 반복
```bash
# 로그 확인
docker logs nflow-web-pre --tail 50

# 주로 VITE_API_URL 미설정이 원인
# .env 파일 생성 후 재시작
```

## 개발 팁

### 로컬 개발 시
```bash
# .env 파일 설정 확인
cat docker/.env

# 코드 수정 후 재빌드
docker-compose down 혹은 docker compose down (최신 명령어)
docker-compose build 혹은 docker compose build (최신 명령어)
docker-compose up -d 혹은 docker compose up -d (최신 명령어)
```

### 디버깅
```bash
# 컨테이너 쉘 접속
docker exec -it nflow-web-pre sh

# 환경변수 전체 확인
env | grep NFLOW

# Nginx 설정 확인
cat /etc/nginx/conf.d/default.conf

# 빌드된 파일 확인
ls -la /usr/share/nginx/html
```

## ⚠️ 주의사항

1. **`VITE_API_URL`은 반드시 설정해야 합니다** - 기본값이 없어 미설정 시 오류 발생
2. **.env 파일을 사용하는 것을 권장합니다** - 환경변수 관리가 편리함
3. **서버 배포 시 .env 파일을 함께 전송하세요** - 환경변수 설정 필수

---
*Last Updated: 2025-01-23*