# =============================================================================
#  00_clean_reset.ps1  -  컨테이너/DB 를 완전히 지우고 처음부터 다시 기동
#  작성 : 2026-09-23
#
#  언제 쓰나
#    MariaDB 버전 불일치로 기동이 꼬였을 때(Column count of mysql.proc is wrong,
#    FATAL ERROR: Upgrade failed, container mariadb is unhealthy 등).
#    기존 db/ 데이터를 버리고 docker_setup/initdb/01_model_designer.sql 로
#    스키마·저장프로시저·모델 데이터를 새로 만든다.
#    initdb 덤프에는 프로젝트 14 / 커플드 13 / 아토믹 36 행이 들어 있다.
#
#  하는 일 (순서대로)
#    1) 컨테이너 정지·삭제 (compose 프로젝트 + 고정이름 nginx/node/mariadb)
#    2) db\ 폴더를 db_backup_<날짜시각>\ 로 이름만 바꿔 보관 (삭제하지 않음)
#    3) -RemoveImages 를 주면 이미지도 삭제 (삭제 전 tar 로 백업)
#    4) docker compose up -d
#    5) mariadb 가 healthy 가 될 때까지 대기 후 테이블/프로시저 검증
#
#  사용법
#    powershell -ExecutionPolicy Bypass -File .\00_clean_reset.ps1
#    powershell -ExecutionPolicy Bypass -File .\00_clean_reset.ps1 -RemoveImages
#    powershell -ExecutionPolicy Bypass -File .\00_clean_reset.ps1 -KeepDb
#
#  주의
#    -RemoveImages 는 폐쇄망에서 위험하다. 이미지를 다시 받지 못하면 기동이
#    불가능하므로 이 스크립트는 삭제 전에 docker save 로 tar 백업을 남긴다.
#    (-NoImageBackup 으로 생략 가능, 권장하지 않음)
# =============================================================================

[CmdletBinding()]
param(
    # 이미지(nginx/node/mariadb)까지 삭제하고 다시 받는다.
    [switch]$RemoveImages,
    # 이미지 삭제 전 tar 백업을 만들지 않는다.
    [switch]$NoImageBackup,
    # db\ 를 그대로 두고 컨테이너만 새로 만든다(데이터 유지).
    [switch]$KeepDb,
    # 확인 프롬프트 없이 진행한다.
    [switch]$Force
)

# PowerShell 5.1 주의: $ErrorActionPreference='Stop' 상태에서 네이티브 명령(docker)의
# stderr 를 리다이렉트하면 NativeCommandError 로 스크립트가 중단된다.
# docker 호출이 많으므로 전역은 Continue 로 두고, 중요한 지점은 아래에서 직접 검사한다.
$ErrorActionPreference = 'Continue'

# --- 경로 --------------------------------------------------------------------
$deployDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir    = Split-Path -Parent $deployDir                 # HyMS_eins_Server
$setupDir   = Join-Path $rootDir 'docker_setup'
$dbDir      = Join-Path $rootDir 'db'
$composeYml = Join-Path $setupDir 'docker-compose.yaml'
$envFile    = Join-Path $setupDir '.env'
$stamp      = Get-Date -Format 'yyyyMMdd_HHmmss'

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)       { Write-Host "    OK  $msg" -ForegroundColor Green }
function Write-Warn2($msg)    { Write-Host "    !!  $msg" -ForegroundColor Yellow }

# --- 사전 점검 ---------------------------------------------------------------
Write-Step 0 '사전 점검'

if (-not (Test-Path $composeYml)) { throw "docker-compose.yaml 을 찾을 수 없습니다: $composeYml" }
if (-not (Test-Path $envFile))    { throw ".env 가 없습니다: $envFile  (.env.example 을 복사해 값을 채우세요)" }
Write-Ok "compose : $composeYml"
Write-Ok ".env    : $envFile"

# docker compose(v2) / docker-compose(v1) 자동 판별
$composeCmd = $null
try { docker compose version *> $null; if ($LASTEXITCODE -eq 0) { $composeCmd = @('docker','compose') } } catch {}
if (-not $composeCmd) {
    try { docker-compose version *> $null; if ($LASTEXITCODE -eq 0) { $composeCmd = @('docker-compose') } } catch {}
}
if (-not $composeCmd) { throw 'docker compose 를 실행할 수 없습니다. Docker Desktop 이 실행 중인지 확인하세요.' }
Write-Ok ("compose 명령 : " + ($composeCmd -join ' '))

function Invoke-Compose {
    param([string[]]$Arguments)
    $exe  = $composeCmd[0]
    $pre  = @()
    if ($composeCmd.Count -gt 1) { $pre = $composeCmd[1..($composeCmd.Count-1)] }
    & $exe @pre @Arguments
}

# node_modules 가 없으면 app 컨테이너가 npm install 을 시도한다(폐쇄망에서 실패).
if (-not (Test-Path (Join-Path $rootDir 'app_root\node_modules\express'))) {
    Write-Warn2 'app_root\node_modules 가 없습니다. 폐쇄망이면 node 컨테이너가 기동하지 못합니다.'
}

# --- 확인 --------------------------------------------------------------------
if (-not $Force) {
    Write-Host ''
    Write-Host '다음 작업을 수행합니다:' -ForegroundColor White
    Write-Host '  - nginx / node / mariadb 컨테이너 정지 및 삭제'
    if ($KeepDb)       { Write-Host '  - db\ 유지 (데이터 보존)' }
    else               { Write-Host "  - db\ 를 db_backup_$stamp\ 로 이동하고 빈 db\ 로 새로 시작" -ForegroundColor Yellow }
    if ($RemoveImages) { Write-Host '  - nginx:1.27 / node:20-alpine / mariadb:11.4 이미지 삭제 후 재수신' -ForegroundColor Yellow }
    Write-Host '  - docker compose up -d'
    Write-Host ''
    $ans = Read-Host '진행하시겠습니까? (y/N)'
    if ($ans -notmatch '^[yY]') { Write-Host '취소했습니다.'; exit 0 }
}

# --- 1) 컨테이너 정지·삭제 ----------------------------------------------------
Write-Step 1 '컨테이너 정지 및 삭제'

Push-Location $setupDir
try {
    Invoke-Compose @('down','--remove-orphans') 2>&1 | ForEach-Object { "    $_" }
} finally {
    Pop-Location
}

# container_name 이 고정이라 예전 compose 프로젝트가 남긴 동명 컨테이너가
# 있으면 새로 만들 때 이름 충돌이 난다. 이름으로 한 번 더 지운다.
foreach ($name in @('nginx','node','mariadb')) {
    $exists = docker ps -aq --filter "name=^$name$"
    if ($exists) {
        docker rm -f $name *> $null
        Write-Ok "잔여 컨테이너 삭제: $name"
    }
}

# --- 2) db 폴더 보관 ----------------------------------------------------------
Write-Step 2 'DB 데이터 처리'

if ($KeepDb) {
    Write-Ok 'db\ 유지 (-KeepDb)'
} else {
    if ((Test-Path $dbDir) -and (Get-ChildItem -Force $dbDir | Select-Object -First 1)) {
        $backup = Join-Path $rootDir "db_backup_$stamp"
        Move-Item -LiteralPath $dbDir -Destination $backup -ErrorAction Stop
        Write-Ok "기존 데이터 보관: $backup  (삭제하지 않았습니다)"
    } else {
        Write-Ok 'db\ 가 이미 비어 있습니다.'
    }
    if (-not (Test-Path $dbDir)) { New-Item -ItemType Directory -Path $dbDir -ErrorAction Stop | Out-Null }
    Write-Ok '빈 db\ 준비 완료 -> initdb\01_model_designer.sql 이 자동 실행됩니다.'
}

# --- 3) 이미지 삭제 -----------------------------------------------------------
$images = @('nginx:1.27','node:20-alpine','mariadb:11.4')

if ($RemoveImages) {
    Write-Step 3 '이미지 삭제'

    $present = @()
    foreach ($img in $images) {
        $id = docker images -q $img
        if ($id) { $present += $img }
    }

    if ($present.Count -eq 0) {
        Write-Ok '삭제할 이미지가 없습니다.'
    } else {
        if (-not $NoImageBackup) {
            $tar = Join-Path $rootDir "images_backup_$stamp.tar"
            Write-Host "    이미지를 먼저 백업합니다 (수 분 소요, 약 1GB): $tar"
            docker save -o $tar @present
            if ($LASTEXITCODE -ne 0) { throw "이미지 백업 실패. 중단합니다. (복구: docker load -i $tar)" }
            Write-Ok "백업 완료: $tar"
        } else {
            Write-Warn2 '이미지 백업을 생략했습니다. 재수신에 실패하면 복구할 수 없습니다.'
        }

        foreach ($img in $present) {
            docker rmi -f $img *> $null
            Write-Ok "삭제: $img"
        }
    }
} else {
    Write-Step 3 '이미지 삭제 건너뜀 (-RemoveImages 를 주면 삭제합니다)'
}

# --- 4) 기동 ------------------------------------------------------------------
Write-Step 4 'docker compose up -d'

Push-Location $setupDir
try {
    Invoke-Compose @('up','-d') 2>&1 | ForEach-Object { "    $_" }
    $upExit = $LASTEXITCODE
} finally {
    Pop-Location
}

# --- 5) 검증 ------------------------------------------------------------------
Write-Step 5 'mariadb 준비 대기 (최대 15분)'

$deadline = (Get-Date).AddMinutes(15)
$health   = ''
while ((Get-Date) -lt $deadline) {
    $health = (docker inspect mariadb --format '{{.State.Health.Status}}' 2>$null)
    if ($health -eq 'healthy')   { break }
    if ($health -eq 'unhealthy') { break }
    Start-Sleep -Seconds 5
}

if ($health -ne 'healthy') {
    Write-Warn2 "mariadb 상태: $health"
    Write-Host ''
    Write-Host '--- 헬스체크 실패 사유 ---' -ForegroundColor Yellow
    docker inspect mariadb --format '{{json .State.Health}}' 2>&1
    Write-Host ''
    Write-Host '--- mariadb 로그 (마지막 40줄) ---' -ForegroundColor Yellow
    docker logs mariadb --tail 40 2>&1
    exit 1
}
Write-Ok 'mariadb healthy'

# node/nginx 가 아직이면 한 번 더 올린다(헬스 대기 중 실패했을 수 있음).
Push-Location $setupDir
try { Invoke-Compose @('up','-d') 2>&1 | Out-Null } finally { Pop-Location }

Write-Step 6 '검증'

docker ps --filter 'name=^nginx$' --filter 'name=^node$' --filter 'name=^mariadb$' `
          --format '    {{.Names}}  {{.Image}}  {{.Status}}'

$envMap = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $envMap[$Matches[1]] = $Matches[2].Trim() }
}
$dbUser = $envMap['MYSQL_USER'];     if (-not $dbUser) { $dbUser = 'model_designer' }
$dbName = $envMap['MYSQL_DATABASE']; if (-not $dbName) { $dbName = 'model_designer' }
$dbPass = $envMap['MYSQL_PASSWORD']

Write-Host ''
docker exec -e "MYSQL_PWD=$dbPass" mariadb `
    mariadb -h 127.0.0.1 -u $dbUser -D $dbName -e @"
SELECT VERSION() AS mariadb_version;
SELECT (SELECT COUNT(*) FROM projects)       AS projects,
       (SELECT COUNT(*) FROM coupled_models) AS coupled,
       (SELECT COUNT(*) FROM atomic_models)  AS atomic;
SELECT COUNT(*) AS procedures_cnt FROM information_schema.routines
 WHERE routine_schema='$dbName' AND routine_type='PROCEDURE';
"@

Write-Host ''
Write-Host '완료되었습니다.' -ForegroundColor Green
Write-Host '  mariadb_version 이 11.4.x, procedures_cnt 가 8 이면 정상입니다.'
if (-not $KeepDb) {
    Write-Host "  이전 데이터는 db_backup_$stamp\ 에 남아 있습니다. 확인 후 삭제하세요."
}
