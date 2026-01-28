# ==================================================
# Docker 이미지 배포 자동화 스크립트 (deploy.ps1)
# ==================================================
# 이 스크립트는 Windows PowerShell 환경에서 실행됩니다.
# 실행 방법: .\deploy.ps1 또는 deploy.bat
# ==================================================

# 콘솔 인코딩을 UTF-8로 설정 (한글 깨짐 방지)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 스크립트 실행 시 에러 발생 시 중단
$ErrorActionPreference = "Stop"

# 작업 디렉토리를 docker/ 폴더로 변경 (스크립트가 프로젝트 루트의 deploy/에 있으므로)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$dockerPath = Join-Path $projectRoot "docker"
Set-Location $dockerPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker 배포 스크립트 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================================================
# 0. 설정 파일 로드
# ==================================================
Write-Host "[0/11] 설정 파일 로드 중..." -ForegroundColor Yellow

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $deployDir "deploy.conf"

if (-Not (Test-Path $configPath)) {
    Write-Host "❌ 오류: deploy.conf 파일을 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

# deploy.conf 파일 읽기 및 변수 설정
Get-Content $configPath | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

## TAR 파일명을 IMAGE_NAME으로부터 동적 생성
$TAR_FILE_NAME = "${IMAGE_NAME}.tar"

## FILES_TO_TRANSFER에서 {IMAGE_NAME} 플레이스홀더를 실제 값으로 치환
$FILES_TO_TRANSFER = $FILES_TO_TRANSFER -replace '\{IMAGE_NAME\}', $IMAGE_NAME

Write-Host "✅ 설정 파일 로드 완료" -ForegroundColor Green
Write-Host "   - TAR 파일: $TAR_FILE_NAME" -ForegroundColor Gray
Write-Host ""

# ==================================================
# 1. 배포 대상 선택
# ==================================================
Write-Host "[1/11] 배포 대상 선택" -ForegroundColor Yellow
Write-Host "   1. 내부 배포 (${INTERNAL_DEPLOY_HOST})" -ForegroundColor Cyan
Write-Host "   2. 외부 배포 (${EXTERNAL_DEPLOY_HOST})" -ForegroundColor Cyan
Write-Host "   3. 외부2 배포 (${EXTERNAL2_DEPLOY_HOST})" -ForegroundColor Cyan
Write-Host ""

$deployChoice = Read-Host "배포 대상을 선택하세요 (1, 2 또는 3)"

if ($deployChoice -eq "1") {
    $DEPLOY_USER = $INTERNAL_DEPLOY_USER
    $DEPLOY_HOST = $INTERNAL_DEPLOY_HOST
    $DEPLOY_DIR = $INTERNAL_DEPLOY_DIR
    $DEPLOY_PASSWORD = $INTERNAL_DEPLOY_PASSWORD
    Write-Host "✅ 내부 배포 선택" -ForegroundColor Green
}
elseif ($deployChoice -eq "2") {
    $DEPLOY_USER = $EXTERNAL_DEPLOY_USER
    $DEPLOY_HOST = $EXTERNAL_DEPLOY_HOST
    $DEPLOY_DIR = $EXTERNAL_DEPLOY_DIR
    $DEPLOY_PASSWORD = $EXTERNAL_DEPLOY_PASSWORD
    Write-Host "✅ 외부 배포 선택" -ForegroundColor Green
}
elseif ($deployChoice -eq "3") {
    $DEPLOY_USER = $EXTERNAL2_DEPLOY_USER
    $DEPLOY_HOST = $EXTERNAL2_DEPLOY_HOST
    $DEPLOY_DIR = $EXTERNAL2_DEPLOY_DIR
    $DEPLOY_PASSWORD = $EXTERNAL2_DEPLOY_PASSWORD
    Write-Host "✅ 외부2 배포 선택" -ForegroundColor Green
}
else {
    Write-Host "❌ 오류: 잘못된 선택입니다. 1, 2 또는 3을 입력하세요." -ForegroundColor Red
    exit 1
}

Write-Host "   - 배포 서버: $DEPLOY_USER@$DEPLOY_HOST" -ForegroundColor Gray
Write-Host "   - 배포 경로: $DEPLOY_DIR" -ForegroundColor Gray
Write-Host ""

# ==================================================
# 2. 비밀번호 확인 및 입력
# ==================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  배포 비밀번호 확인" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# deploy.conf에 비밀번호가 설정되어 있는지 확인
if ([string]::IsNullOrEmpty($DEPLOY_PASSWORD)) {
    Write-Host "⚠️  deploy.conf에 비밀번호를 추가하지 않았습니다. (보안 유지)" -ForegroundColor Yellow
    Write-Host "   비밀번호를 입력해주세요" -ForegroundColor Gray
    Write-Host ""

    # 비밀번호 입력 (SecureString)
    $securePassword = Read-Host "   배포 서버 비밀번호" -AsSecureString

    # SecureString을 평문으로 변환 (메모리에만 저장)
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DEPLOY_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

    Write-Host ""
    Write-Host "✅ 비밀번호가 설정되었습니다." -ForegroundColor Green
    Write-Host "   이후 모든 SSH/SCP 작업에 자동으로 사용됩니다." -ForegroundColor Gray
} else {
    Write-Host "✅ deploy.conf에서 비밀번호를 읽었습니다." -ForegroundColor Green
    Write-Host "   이후 모든 SSH/SCP 작업에 자동으로 사용됩니다." -ForegroundColor Gray
}

Write-Host ""

# ==================================================
# 호스트 키 자동 등록 (처음 1회)
# ==================================================
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "배포 서버 연결 테스트 중..." -ForegroundColor Gray

    # 먼저 호스트 키 자동 수락 시도 (y를 자동 입력)
    # 이미 등록된 경우 무시되고, 미등록 시 자동으로 수락됨
    try {
        Write-Host "호스트 키 확인 및 등록 중..." -ForegroundColor Gray
        $acceptResult = echo y | plink -pw $DEPLOY_PASSWORD -ssh "$DEPLOY_USER@$DEPLOY_HOST" "exit" 2>&1

        # 이제 -batch 모드로 정상 연결 테스트
        $testResult = plink -batch -pw $DEPLOY_PASSWORD -ssh "$DEPLOY_USER@$DEPLOY_HOST" "exit" 2>&1
        $testOutput = $testResult | Out-String

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 배포 서버 연결 정상 (호스트 키 등록됨)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  연결 테스트 경고: $testOutput" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ 오류: 배포 서버 연결 실패" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }

    Write-Host ""
}

# ==================================================
# 3. Docker Desktop 실행 상태 확인
# ==================================================
Write-Host "[3/11] Docker Desktop 실행 상태 확인 중..." -ForegroundColor Yellow

$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

if ($null -eq $dockerProcess) {
    Write-Host "⚠️  Docker Desktop이 실행되지 않았습니다. 실행 중..." -ForegroundColor Yellow

    if (Test-Path $DOCKER_DESKTOP_PATH) {
        Start-Process $DOCKER_DESKTOP_PATH
        Write-Host "   Docker Desktop 시작 대기 중 (30초)..." -ForegroundColor Gray
        Start-Sleep -Seconds 30

        # Docker 데몬 준비 확인
        $maxRetries = 10
        $retryCount = 0
        while ($retryCount -lt $maxRetries) {
            try {
                docker info | Out-Null
                Write-Host "✅ Docker Desktop이 준비되었습니다." -ForegroundColor Green
                break
            }
            catch {
                $retryCount++
                Write-Host "   Docker 데몬 대기 중... ($retryCount/$maxRetries)" -ForegroundColor Gray
                Start-Sleep -Seconds 3
            }
        }

        if ($retryCount -eq $maxRetries) {
            Write-Host "❌ 오류: Docker Desktop이 제대로 시작되지 않았습니다." -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ 오류: Docker Desktop 실행 파일을 찾을 수 없습니다." -ForegroundColor Red
        Write-Host "   경로: $DOCKER_DESKTOP_PATH" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ Docker Desktop이 실행 중입니다." -ForegroundColor Green
}
Write-Host ""

# ==================================================
# 4. Docker 이미지 빌드 (캐시 무시)
# ==================================================
Write-Host "[4/11] Docker 이미지 빌드 중..." -ForegroundColor Yellow
Write-Host "   명령어: docker-compose build --no-cache" -ForegroundColor Gray

try {
    docker-compose build --no-cache
    Write-Host "✅ Docker 이미지 빌드 완료" -ForegroundColor Green
}
catch {
    Write-Host "❌ 오류: Docker 이미지 빌드 실패" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================================================
# 5. Docker 이미지를 TAR 파일로 저장
# ==================================================
Write-Host "[5/11] Docker 이미지를 TAR 파일로 저장 중..." -ForegroundColor Yellow
Write-Host "   명령어: docker save -o $TAR_FILE_NAME ${IMAGE_NAME}:${IMAGE_TAG}" -ForegroundColor Gray

try {
    docker save -o $TAR_FILE_NAME "${IMAGE_NAME}:${IMAGE_TAG}"
    $fileSize = (Get-Item $TAR_FILE_NAME).Length / 1MB
    Write-Host "✅ Docker 이미지 저장 완료 (크기: $([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
}
catch {
    Write-Host "❌ 오류: Docker 이미지 저장 실패" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================================================
# 6. 배포 서버 접속 및 기존 컨테이너 중지
# ==================================================
Write-Host "[6/11] 배포 서버의 기존 컨테이너 중지 중..." -ForegroundColor Yellow
Write-Host "   서버: $DEPLOY_USER@$DEPLOY_HOST" -ForegroundColor Gray

try {
    $sshCommand = "cd $DEPLOY_DIR && docker compose down"

    # Plink로 SSH 연결 (비밀번호 자동 입력)
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "   Plink로 연결 중..." -ForegroundColor Gray
        plink -pw $DEPLOY_PASSWORD -batch -ssh $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ 기존 컨테이너 중지 완료" -ForegroundColor Green
    }
    # SSH 폴백 (수동 비밀번호 입력 필요)
    elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "   SSH로 연결 중 (비밀번호 입력 필요)..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ 기존 컨테이너 중지 완료" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 오류: plink 또는 ssh 명령어를 찾을 수 없습니다." -ForegroundColor Red
        Write-Host "   PuTTY(plink) 또는 OpenSSH를 설치해야 합니다." -ForegroundColor Red
        Write-Host "❌ 스크립트를 중단합니다." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 오류: 원격 서버 접속 실패" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "   비밀번호가 틀렸거나 네트워크 연결에 문제가 있습니다." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================================================
# 7. SCP로 파일 전송 (Posh-SSH 사용)
# ==================================================
Write-Host "[7/11] 파일을 원격 서버로 전송 중..." -ForegroundColor Yellow
Write-Host "   전송 대상: $FILES_TO_TRANSFER" -ForegroundColor Gray

try {
    # Posh-SSH 모듈 로드
    if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
        Write-Host "❌ 오류: Posh-SSH 모듈이 설치되지 않았습니다." -ForegroundColor Red
        Write-Host "   설치: Install-Module -Name Posh-SSH -Scope CurrentUser" -ForegroundColor Yellow
        exit 1
    }

    Import-Module Posh-SSH -ErrorAction Stop

    # SecureString 비밀번호 생성
    $securePassword = ConvertTo-SecureString $DEPLOY_PASSWORD -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($DEPLOY_USER, $securePassword)

    # FILES_TO_TRANSFER는 이미 {IMAGE_NAME}이 치환되어 TAR 파일 포함됨
    $fileArray = $FILES_TO_TRANSFER -split ','
    $existingFiles = @()
    $missingFiles = @()

    # 파일 존재 여부 검증
    foreach ($file in $fileArray) {
        $file = $file.Trim()  # 쉼표 구분 후 공백 제거
        if (Test-Path $file) {
            $existingFiles += $file
        }
        else {
            $missingFiles += $file
        }
    }

    # 누락 파일 경고
    if ($missingFiles.Count -gt 0) {
        Write-Host "   ⚠️  경고: 다음 파일을 찾을 수 없습니다: $($missingFiles -join ', ')" -ForegroundColor Yellow
    }

    # 파일 전송
    if ($existingFiles.Count -gt 0) {
        Write-Host "   전송 방법: Posh-SSH (SCP)" -ForegroundColor Gray

        foreach ($file in $existingFiles) {
            $localSize = (Get-Item $file).Length
            Write-Host "   전송 중: $file ($([math]::Round($localSize/1MB, 2)) MB)" -ForegroundColor Gray

            # SCP 전송 (-AcceptKey: 호스트 키 자동 수락)
            Set-SCPItem -ComputerName $DEPLOY_HOST -Credential $credential -Path $file -Destination $DEPLOY_DIR -AcceptKey -ErrorAction Stop

            Write-Host "   ✅ 전송 완료: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }

        Write-Host "✅ 파일 전송 완료" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 오류: 전송할 파일이 없습니다." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 오류: 파일 전송 실패" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Message -match "Posh-SSH") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "   Posh-SSH 모듈이 설치되지 않았습니다." -ForegroundColor Yellow
        Write-Host "   다음 명령어로 설치하세요:" -ForegroundColor Yellow
        Write-Host "   Install-Module -Name Posh-SSH -Force -Scope CurrentUser" -ForegroundColor Cyan
    }

    exit 1
}
Write-Host ""

# ==================================================
# 8. 배포 서버에 재접속하여 이미지 로드
# ==================================================
Write-Host "[8/11] 배포 서버에서 Docker 이미지 로드 중..." -ForegroundColor Yellow
Write-Host "   명령어: docker load -i $TAR_FILE_NAME" -ForegroundColor Gray

try {
    $sshCommand = "cd $DEPLOY_DIR && docker load -i $TAR_FILE_NAME"

    # Plink로 SSH 연결 (비밀번호 자동 입력)
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "   Plink로 연결 중..." -ForegroundColor Gray
        plink -pw $DEPLOY_PASSWORD -batch -ssh $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ Docker 이미지 로드 완료" -ForegroundColor Green
    }
    # SSH 폴백 (수동 비밀번호 입력 필요)
    elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "   SSH로 연결 중 (비밀번호 입력 필요)..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ Docker 이미지 로드 완료" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 오류: plink 또는 ssh 명령어를 찾을 수 없습니다." -ForegroundColor Red
        Write-Host "   PuTTY(plink) 또는 OpenSSH를 설치해야 합니다." -ForegroundColor Red
        Write-Host "❌ 스크립트를 중단합니다." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 오류: Docker 이미지 로드 실패" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "   원격 서버 연결에 문제가 있거나 Docker 명령어 실행에 실패했습니다." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================================================
# 9. 배포 서버에서 컨테이너 실행
# ==================================================
Write-Host "[9/11] 배포 서버에서 컨테이너 실행 중..." -ForegroundColor Yellow
Write-Host "   명령어: docker compose up -d" -ForegroundColor Gray

try {
    $sshCommand = "cd $DEPLOY_DIR && docker compose up -d"

    # Plink로 SSH 연결 (비밀번호 자동 입력)
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "   Plink로 연결 중..." -ForegroundColor Gray
        plink -pw $DEPLOY_PASSWORD -batch -ssh $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ 컨테이너 실행 완료" -ForegroundColor Green
    }
    # SSH 폴백 (수동 비밀번호 입력 필요)
    elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "   SSH로 연결 중 (비밀번호 입력 필요)..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $DEPLOY_USER@$DEPLOY_HOST $sshCommand
        Write-Host "✅ 컨테이너 실행 완료" -ForegroundColor Green
    }
    else {
        Write-Host "❌ 오류: plink 또는 ssh 명령어를 찾을 수 없습니다." -ForegroundColor Red
        Write-Host "   PuTTY(plink) 또는 OpenSSH를 설치해야 합니다." -ForegroundColor Red
        Write-Host "❌ 스크립트를 중단합니다." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ 오류: 컨테이너 실행 실패" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "   원격 서버 연결에 문제가 있거나 Docker Compose 실행에 실패했습니다." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ==================================================
# 10. 로컬 TAR 파일 정리
# ==================================================
Write-Host "[10/11] 로컬 TAR 파일 삭제 중..." -ForegroundColor Yellow
Write-Host "   파일: $TAR_FILE_NAME" -ForegroundColor Gray

try {
    Remove-Item $TAR_FILE_NAME -Force
    Write-Host "✅ TAR 파일 삭제 완료" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  경고: TAR 파일 삭제 실패" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# ==================================================
# 11. 배포 완료
# ==================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "배포 정보:" -ForegroundColor White
Write-Host "  - 이미지: ${IMAGE_NAME}:${IMAGE_TAG}" -ForegroundColor Gray
Write-Host "  - 서버: $DEPLOY_USER@$DEPLOY_HOST" -ForegroundColor Gray
Write-Host "  - 경로: $DEPLOY_DIR" -ForegroundColor Gray
Write-Host ""
Write-Host "서비스 상태 확인:" -ForegroundColor White
Write-Host "  ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_DIR && docker compose ps'" -ForegroundColor Cyan
Write-Host ""
