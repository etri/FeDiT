# =============================================================================
#  10_서버_설치_및_기동.ps1
#  서버(simulation.fedit.or.kr)에서 이 폴더 하나로 전체를 점검하고 기동한다.
#
#  하는 일 (순서대로)
#    0) 관리자 권한 / 사전 조건 확인
#       - db 폴더(MariaDB 데이터)가 제자리에 있는가   <- 가장 중요
#       - docker_setup\.env 존재
#       - Docker Desktop 실행 중
#       - VC++ 2015-2022 x64 재배포 패키지 설치 여부
#       - sim_engine 실행 파일 존재
#    1) HTTPS 자체 서명 인증서 생성 (없을 때만)      -> 00_generate_cert.ps1
#    2) HTTP.sys URL 예약(8082,8083) + 방화벽        -> 01_windows_prepare.ps1
#    3) Docker 3종 + 시뮬레이션 엔진 3종 기동        -> 02_start_all.ps1
#    4) 상태 점검                                     -> 03_health_check.ps1
#
#  실행 : (관리자 PowerShell)
#         powershell -ExecutionPolicy Bypass -File .\10_서버_설치_및_기동.ps1
#
#  옵션 : -SkipPrepare   이미 urlacl/방화벽을 설정한 서버에서 2) 를 건너뛴다
#         -SkipHealth    4) 점검을 건너뛴다
# =============================================================================

param(
    [switch]$SkipPrepare,
    [switch]$SkipHealth
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot      # ...\HyMS_eins_Server
$deploy = $PSScriptRoot

function Fail([string]$msg) {
    Write-Host ""
    Write-Host "[중단] $msg" -ForegroundColor Red
    exit 1
}

Write-Host "=== HyMS_eins 서버 설치/기동 ===" -ForegroundColor Cyan
Write-Host "  루트 : $root"

# --- 0) 사전 조건 -----------------------------------------------------------
Write-Host "`n=== 0) 사전 조건 확인 ===" -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal] `
            [Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Fail "관리자 권한으로 실행해야 합니다. PowerShell 을 '관리자 권한으로 실행' 후 다시 시도하세요."
}
Write-Host "  [OK]   관리자 권한" -ForegroundColor Green

# db 폴더 - 이 패키지에는 의도적으로 포함하지 않았다(서버 운영 데이터를 덮어쓰지 않기 위해).
#   있으면  : 그대로 사용한다. 버전이 낮으면 MARIADB_AUTO_UPGRADE 가 자동 처리.
#   없으면  : docker_setup\initdb\01_model_designer.sql 로 새로 초기화된다.
#             (스키마 + 저장 프로시저 + 기본 프로젝트 데이터)
# 어느 쪽이든 기동은 가능하므로 더 이상 중단하지 않고 안내만 한다.
$dbDir = Join-Path $root 'db'
$dbLooksReal = (Test-Path (Join-Path $dbDir 'ibdata1')) -or (Test-Path (Join-Path $dbDir 'mysql'))
if (-not $dbLooksReal) {
    Write-Host "  [안내] MariaDB 데이터 폴더가 없습니다: $dbDir" -ForegroundColor Yellow
    Write-Host "         initdb\01_model_designer.sql 로 새 DB 를 초기화합니다." -ForegroundColor Yellow
    Write-Host "         서버의 기존 데이터를 이어서 쓰려면, 지금 중단하고(Ctrl+C)" -ForegroundColor Yellow
    Write-Host "         기존 db 폴더를 '$dbDir' 에 두고 다시 실행하세요." -ForegroundColor Yellow
}
else {
    $upgradeInfo = Join-Path $dbDir 'mariadb_upgrade_info'
    $ver = if (Test-Path $upgradeInfo) { (Get-Content $upgradeInfo -Raw).Trim() } else { '(알 수 없음)' }
    Write-Host "  [OK]   MariaDB 데이터 폴더 확인 - 데이터 버전 $ver" -ForegroundColor Green
    # compose 는 mariadb:11.4 로 고정돼 있다. 데이터가 11.4 보다 높은 메이저면
    # 다운그레이드가 되어 기동하지 못한다(12.x / 13.x 로 한 번이라도 띄운 경우).
    if ($ver -match '^(\d+)\.(\d+)') {
        $maj = [int]$Matches[1]; $min = [int]$Matches[2]
        if ($maj -gt 11 -or ($maj -eq 11 -and $min -gt 4)) {
            Write-Host ""
            Write-Host "[중단] db 데이터가 $ver 입니다. compose 는 mariadb:11.4 로 고정돼 있어" -ForegroundColor Red
            Write-Host "       다운그레이드가 되며 기동하지 못합니다." -ForegroundColor Red
            Write-Host "       12.x/13.x 이미지로 한 번이라도 기동한 적이 있다면 db 백업본으로" -ForegroundColor Yellow
            Write-Host "       되돌린 뒤 다시 실행하세요. (db\system_mysql_backup_*.sql.zst 참고)" -ForegroundColor Yellow
            exit 1
        }
    }
}

$envFile = Join-Path $root 'docker_setup\.env'
if (-not (Test-Path $envFile)) {
    Fail "docker_setup\.env 가 없습니다. .env.example 을 복사해 값을 채우세요."
}
Write-Host "  [OK]   docker_setup\.env" -ForegroundColor Green

docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker 에 연결할 수 없습니다. Docker Desktop 이 실행 중인지 확인하세요."
}
Write-Host "  [OK]   Docker 실행 중" -ForegroundColor Green

if (-not (Test-Path "$env:SystemRoot\System32\MSVCP140.dll")) {
    Fail "VC++ 2015-2022 x64 재배포 패키지가 설치돼 있지 않습니다(MSVCP140.dll 없음). 설치 후 다시 실행하세요."
}
Write-Host "  [OK]   VC++ 재배포 패키지(MSVCP140.dll)" -ForegroundColor Green

foreach ($exe in @('fDTSimServer.exe', 'atomic_model_manager.exe')) {
    if (-not (Test-Path (Join-Path $root "sim_engine\$exe"))) {
        Fail "sim_engine\$exe 가 없습니다."
    }
}
Write-Host "  [OK]   시뮬레이션 엔진 실행 파일" -ForegroundColor Green

# --- 1) HTTPS 인증서 --------------------------------------------------------
#  없어도 nginx 컨테이너가 기동 시 자체 서명 인증서를 만든다(docker-compose.yaml 참고).
#  여기서 미리 만들어 두면 컨테이너 기동이 그만큼 빨라지고, 공인 인증서로
#  교체할 파일 위치를 미리 확인할 수 있다.
Write-Host "`n=== 1) HTTPS 인증서 ===" -ForegroundColor Cyan
$crt = Join-Path $root 'web_conf\certs\server.crt'
if (Test-Path $crt) {
    Write-Host "  이미 존재 - 건너뜀" -ForegroundColor Yellow
}
else {
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $deploy '00_generate_cert.ps1')
    if (-not (Test-Path $crt)) {
        Write-Host "  [안내] 여기서 생성하지 못했습니다. nginx 컨테이너가 기동할 때" -ForegroundColor Yellow
        Write-Host "         자체 서명 인증서를 대신 만듭니다." -ForegroundColor Yellow
    }
}

# --- 2) Windows 준비 (urlacl + 방화벽) --------------------------------------
if ($SkipPrepare) {
    Write-Host "`n=== 2) Windows 준비 : -SkipPrepare 지정으로 건너뜀 ===" -ForegroundColor Yellow
}
else {
    Write-Host "`n=== 2) Windows 준비 (urlacl + 방화벽) ===" -ForegroundColor Cyan
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $deploy '01_windows_prepare.ps1')
}

# --- 3) 전체 기동 -----------------------------------------------------------
Write-Host "`n=== 3) 전체 기동 ===" -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $deploy '02_start_all.ps1')

# --- 4) 점검 ----------------------------------------------------------------
if ($SkipHealth) {
    Write-Host "`n=== 4) 점검 : -SkipHealth 지정으로 건너뜀 ===" -ForegroundColor Yellow
}
else {
    Write-Host "`n=== 4) 상태 점검 ===" -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $deploy '03_health_check.ps1')
}

Write-Host "`n=== 마무리 확인 ===" -ForegroundColor Cyan
Write-Host "  1) DB 가 정상인지 :" -ForegroundColor Yellow
Write-Host "       docker logs mariadb --tail 30"
Write-Host "       docker exec mariadb mariadb -umodel_designer -p'<비밀번호>' -D model_designer -e `"SELECT COUNT(*) FROM projects;`""
Write-Host "  2) 브라우저에서 https://simulation.fedit.or.kr/simulation/ 접속" -ForegroundColor Yellow
Write-Host "       공인 인증서가 아직 없어 자체 서명 인증서를 쓰는 동안에는"
Write-Host "       '고급 > 계속' 으로 예외를 한 번 승인해야 WebSocket(wss) 까지 연결됩니다."
Write-Host "       (공인 인증서를 web_conf\certs 에 넣으면 이 단계는 불필요)"
Write-Host "  3) 프로젝트 목록 표시 -> Push -> 모델 창이 뜨는지 확인" -ForegroundColor Yellow
