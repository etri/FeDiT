# =============================================================================
#  00b_diagnose_db.ps1  -  "container mariadb is unhealthy" 원인 진단
#  작성 : 2026-09-23
#
#  읽기 전용이다. 컨테이너를 만들거나 지우거나 DB 를 건드리지 않는다.
#  아래 6가지를 모아 찍고 마지막에 판정을 낸다.
#
#    1) 지금 쓰는 compose 파일과 db 이미지 태그 / 헬스체크 방식
#    2) .env 존재 여부와 키 구성 (비밀번호 값은 출력하지 않는다)
#    3) db 폴더 상태 - 비어 있는지, 데이터가 어느 버전으로 만들어졌는지
#    4) mariadb 컨테이너 상태와 재시작 횟수
#    5) 헬스체크 실패 사유 (직접 접속해 에러 원문 확보)
#    6) mariadb 로그에서 결정적인 줄만 추출
#
#  사용법
#    powershell -ExecutionPolicy Bypass -File .\00b_diagnose_db.ps1
#
#  로컬 실측 기준값 (2026-09-23, Docker Desktop / Windows)
#    빈 db + mariadb:11.4            -> 9초 만에 initdb 적재 완료, 헬스체크 통과
#    11.1.3 db + 11.4 + AUTO_UPGRADE -> 21초 만에 업그레이드 완료, 헬스체크 통과
#  즉 정상 구성이면 1분 안에 healthy 가 된다. 그렇지 않다면 구성이 다른 것이다.
# =============================================================================

# PowerShell 5.1 주의: EAP=Stop 에서 네이티브 명령(docker)의 stderr 를 리다이렉트하면
# NativeCommandError 로 중단된다. 진단 스크립트이므로 전역을 Continue 로 둔다.
$ErrorActionPreference = 'Continue'

$deployDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir    = Split-Path -Parent $deployDir
$setupDir   = Join-Path $rootDir 'docker_setup'
$dbDir      = Join-Path $rootDir 'db'
$composeYml = Join-Path $setupDir 'docker-compose.yaml'
$envFile    = Join-Path $setupDir '.env'

$verdicts = New-Object System.Collections.ArrayList

function Write-Sec($n, $t) { Write-Host "`n===== [$n] $t =====" -ForegroundColor Cyan }
function Add-Verdict($t)   { [void]$verdicts.Add($t) }

# --- 1) compose 구성 ----------------------------------------------------------
Write-Sec 1 'compose 구성'

if (-not (Test-Path $composeYml)) {
    Write-Host "  docker-compose.yaml 없음: $composeYml" -ForegroundColor Red
    Add-Verdict "compose 파일을 찾지 못했습니다. 경로를 확인하세요: $composeYml"
} else {
    Write-Host "  파일 : $composeYml"
    $yml = Get-Content $composeYml -Raw
    # 주석(#로 시작하는 줄)에도 healthcheck.sh 등이 언급되므로 판정에서 제외한다.
    $ymlCode = ((Get-Content $composeYml) | Where-Object { $_ -notmatch '^\s*#' }) -join "`n"

    $dbImage = [regex]::Matches($ymlCode, '(?m)^\s*image:\s*(mariadb\S*)') | ForEach-Object { $_.Groups[1].Value }
    Write-Host "  db 이미지 : $dbImage"
    if ($dbImage -notmatch '^mariadb:11\.4') {
        Add-Verdict "db 이미지가 mariadb:11.4 가 아닙니다($dbImage). 새 패키지의 docker-compose.yaml 로 교체하세요."
    }

    if ($ymlCode -match 'healthcheck\.sh') {
        Write-Host '  헬스체크 : healthcheck.sh (이미지 내장)' -ForegroundColor Yellow
        Add-Verdict '옛 compose 를 쓰고 있습니다. 내장 healthcheck.sh 는 자격증명을 /var/lib/mysql/.my-healthcheck.cnf 에서 읽는데, Windows 바인드 마운트에서는 0777 로 보여 MariaDB 클라이언트가 무시합니다. 그 결과 항상 Access denied -> unhealthy 가 됩니다. 새 패키지의 docker-compose.yaml 로 교체하세요.'
    } elseif ($ymlCode -match 'MYSQL_PWD') {
        Write-Host '  헬스체크 : model_designer TCP 접속 (새 방식)'
        if ($ymlCode -match '/dev/null 2>&1') {
            Write-Host '  주의 : 헬스체크 출력이 /dev/null 로 버려집니다(실패 사유가 남지 않음).' -ForegroundColor Yellow
            Add-Verdict '헬스체크에서 >/dev/null 2>&1 을 제거하면 실패 사유가 docker inspect 에 남습니다(2026-09-23 패키지에 반영됨).'
        }
    }

    if ($ymlCode -match '(?m)^\s*start_period:\s*(\S+)') { Write-Host "  start_period : $($Matches[1])" }
    if ($ymlCode -match '(?m)^\s*retries:\s*(\S+)')      { Write-Host "  retries      : $($Matches[1])" }
    if ($ymlCode -match 'MARIADB_AUTO_UPGRADE')          { Write-Host '  MARIADB_AUTO_UPGRADE : 설정됨' }
}

# --- 2) .env ------------------------------------------------------------------
Write-Sec 2 '.env'

if (-not (Test-Path $envFile)) {
    Write-Host "  .env 없음: $envFile" -ForegroundColor Red
    Add-Verdict '.env 가 없습니다. 비밀번호가 빈 값으로 전달되어 헬스체크가 항상 실패합니다. .env.example 을 복사해 값을 채우고 docker_setup 폴더에서 실행하세요.'
} else {
    $bom = [System.IO.File]::ReadAllBytes($envFile)[0..2]
    $hasBom = ($bom[0] -eq 0xEF -and $bom[1] -eq 0xBB -and $bom[2] -eq 0xBF)
    Write-Host "  파일 : $envFile"
    if ($hasBom) {
        Write-Host '  BOM  : 있음' -ForegroundColor Yellow
        Add-Verdict '.env 에 UTF-8 BOM 이 있습니다. 첫 변수(MYSQL_ROOT_PASSWORD)를 읽지 못할 수 있습니다. BOM 없이 다시 저장하세요.'
    }

    $envMap = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $envMap[$Matches[1]] = $Matches[2].Trim() }
    }
    foreach ($k in @('MYSQL_USER','MYSQL_DATABASE','MYSQL_PASSWORD','MYSQL_ROOT_PASSWORD','DB_PASSWORD')) {
        $v = $envMap[$k]
        if ($k -match 'PASSWORD') { Write-Host ("  {0,-20} : 길이 {1}" -f $k, $(if ($v) { $v.Length } else { 0 })) }
        else                      { Write-Host ("  {0,-20} : {1}" -f $k, $v) }
    }
    if (-not $envMap['MYSQL_PASSWORD']) { Add-Verdict 'MYSQL_PASSWORD 가 비어 있습니다.' }
    if ($envMap['MYSQL_PASSWORD'] -ne $envMap['DB_PASSWORD']) {
        Add-Verdict 'MYSQL_PASSWORD 와 DB_PASSWORD 가 다릅니다. 같은 값이어야 백엔드가 접속합니다.'
    }
}

# --- 3) db 폴더 ---------------------------------------------------------------
Write-Sec 3 'db 폴더'

$dbEmpty = $true
if (-not (Test-Path $dbDir)) {
    Write-Host "  db 폴더 없음 (기동 시 자동 생성) : $dbDir"
} else {
    $items = @(Get-ChildItem -Force $dbDir)
    $dbEmpty = ($items.Count -eq 0)
    Write-Host "  경로     : $dbDir"
    Write-Host "  항목 수  : $($items.Count)"
    $infoPath = Join-Path $dbDir 'mariadb_upgrade_info'
    if (Test-Path $infoPath) {
        $dataVer = (Get-Content $infoPath -Raw).Trim()
        Write-Host "  데이터 버전 : $dataVer"
        if ($dataVer -match '^(1[2-9]|[2-9][0-9])\.') {
            Add-Verdict "db 데이터가 $dataVer 로 만들어졌습니다. mariadb:11.4 로는 열 수 없습니다(다운그레이드). 백업본으로 되돌리거나, 데이터와 같은 버전으로 한 번 띄워 논리 덤프를 뽑은 뒤 빈 db 로 11.4 에 넣으세요."
        }
    } elseif (-not $dbEmpty) {
        Write-Host '  데이터 버전 : mariadb_upgrade_info 없음 (초기화 중단 흔적일 수 있음)' -ForegroundColor Yellow
    }
}
if ($dbEmpty) {
    Write-Host '  -> 비어 있음. initdb\01_model_designer.sql 이 실행됩니다 (로컬 실측 9초).'
} else {
    Write-Host '  -> 기존 데이터를 그대로 사용합니다. initdb 는 실행되지 않습니다.'
    Add-Verdict 'db 폴더가 비어 있지 않습니다. 컨테이너/이미지를 지워도 바인드 마운트인 db 폴더는 남습니다. 완전 초기화를 원하면 00_clean_reset.ps1 을 쓰거나 db 폴더를 직접 옮기세요.'
}

# --- 4) 컨테이너 상태 ---------------------------------------------------------
Write-Sec 4 'mariadb 컨테이너'

$exists = docker ps -aq --filter 'name=^mariadb$'
if (-not $exists) {
    Write-Host '  mariadb 컨테이너가 없습니다.' -ForegroundColor Yellow
} else {
    docker ps -a --filter 'name=^mariadb$' --format '  이름={{.Names}}  이미지={{.Image}}  상태={{.Status}}'
    $restarts = docker inspect mariadb --format '{{.RestartCount}}'
    $state    = docker inspect mariadb --format '{{.State.Status}}'
    $health   = docker inspect mariadb --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}(헬스체크 없음){{end}}'
    Write-Host "  State        : $state"
    Write-Host "  Health       : $health"
    Write-Host "  RestartCount : $restarts"
    if ([int]$restarts -gt 2) {
        Add-Verdict "컨테이너가 $restarts 회 재시작했습니다. DB 가 기동 자체를 못 하는 상태입니다. 아래 [6] 로그의 ERROR/FATAL 줄을 확인하세요."
    }

    Write-Host "`n  --- 헬스체크 기록 (최근 3회) ---"
    $log = docker inspect mariadb --format '{{if .State.Health}}{{range .State.Health.Log}}{{.ExitCode}}|{{.Output}}{{println}}{{end}}{{end}}'
    if ($log) { ($log -split "`n" | Where-Object { $_ } | Select-Object -Last 3) | ForEach-Object { "    $_" } }
    else      { Write-Host '    (기록 없음)' }
}

# --- 5) 실제 접속 시도 --------------------------------------------------------
Write-Sec 5 '헬스체크와 동일한 접속을 직접 시도'

if ($exists) {
    Write-Host '  컨테이너 안의 환경변수 확인 (값이 비어 있으면 .env 미적용):'
    # PowerShell 5.1 은 네이티브 명령 인자 속의 큰따옴표를 잃어버린다.
    # (그대로 두면 -e "SELECT 1" 이 쪼개져 SQL 구문 오류가 난다)
    # 그래서 sh 쪽 인용은 작은따옴표만 쓰고, $ 는 백틱으로 PS 확장만 막는다.
    $shEnv = "echo '    MYSQL_USER=['`$MYSQL_USER'] MYSQL_DATABASE=['`$MYSQL_DATABASE'] MYSQL_PASSWORD 길이='`${#MYSQL_PASSWORD}"
    docker exec mariadb sh -c $shEnv
    Write-Host '  접속 결과:'
    $shSql = "MYSQL_PWD=`$MYSQL_PASSWORD mariadb -h 127.0.0.1 -u`$MYSQL_USER -D`$MYSQL_DATABASE -e 'SELECT 1 AS ok'"
    docker exec mariadb sh -c $shSql
    if ($LASTEXITCODE -eq 0) {
        Write-Host '    -> 접속 성공.' -ForegroundColor Green
        if ($health -eq 'unhealthy') {
            Add-Verdict 'DB 접속은 되는데 unhealthy 입니다. 헬스체크 정의(옛 healthcheck.sh) 또는 start_period 부족이 원인입니다. 새 패키지의 docker-compose.yaml 로 교체한 뒤 docker compose up -d 하세요.'
        }
    } else {
        Write-Host "    -> 접속 실패 (exit=$LASTEXITCODE). 위 에러 원문이 원인입니다." -ForegroundColor Yellow
        Add-Verdict 'Access denied 면 .env 비밀번호와 실제 DB 계정 비밀번호가 다른 것입니다(기존 db 를 쓰면 .env 값은 적용되지 않습니다). Can not connect 면 DB 가 아직 기동 중이거나 죽은 것이니 [6] 로그를 보세요.'
    }
}

# --- 6) 로그 ------------------------------------------------------------------
Write-Sec 6 'mariadb 로그 (결정적인 줄)'

if ($exists) {
    # PS 5.1 에서 네이티브 명령에 2>&1 을 걸면 각 줄이 ErrorRecord 로 감싸져
    # "NativeCommandError" 잡음이 섞인다. 병합은 cmd 에 맡기고 stdout 만 받는다.
    $lines = (& cmd /c "docker logs mariadb --tail 200 2>&1") | Out-String
    $keys  = @('Entrypoint', 'ERROR', 'FATAL', 'Column count', 'upgrade', 'Phase ', 'ready for connections', 'Access denied', 'uninitialized')
    $hit = $lines -split "`r?`n" | Where-Object { $l = $_; $keys | Where-Object { $l -like "*$_*" } }
    if ($hit) { $hit | Select-Object -Last 30 | ForEach-Object { "  $_" } }
    else      { Write-Host '  (해당 줄 없음)' }

    if ($lines -match 'Database is uninitialized and password option is not specified') {
        Add-Verdict 'MYSQL_ROOT_PASSWORD 가 비어 있어 DB 초기화가 거부됐습니다. .env 를 docker_setup 폴더에 두고 다시 기동하세요.'
    }
    if ($lines -match 'FATAL ERROR: Upgrade failed') {
        Add-Verdict 'mariadb-upgrade 가 실패했습니다. 데이터 버전과 이미지 버전의 차이가 두 단계 이상입니다. 백업본 복원이 필요합니다.'
    }
    if ($lines -match 'Column count of mysql\.proc is wrong') {
        Add-Verdict 'mysql.proc 컬럼 수 불일치입니다. 숫자가 Expected 22 / found 21 이면 mariadb-upgrade 로 고칠 수 있고, Expected 21 / found 22 면 데이터가 이미 상위 버전이라 되돌려야 합니다.'
    }
}

# --- 판정 ---------------------------------------------------------------------
Write-Sec 7 '판정'

if ($verdicts.Count -eq 0) {
    Write-Host '  특이사항을 찾지 못했습니다. [5] 접속 결과와 [6] 로그를 그대로 공유해 주세요.' -ForegroundColor Yellow
} else {
    $i = 1
    foreach ($v in $verdicts) { Write-Host "  $i) $v" -ForegroundColor Yellow; $i++ }
}
Write-Host ''
