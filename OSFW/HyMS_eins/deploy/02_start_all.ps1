# =============================================================================
#  02_start_all.ps1
#  HyMS_eins 전체 기동
#    0) Docker 엔진이 꺼져 있으면 Docker Desktop 을 실행하고 기다린다
#    1) Docker : nginx(80/443) + node(8081) + mariadb(3306/3307)
#    2) AtomicModelManager.exe : 8865(model) / 8870(GUI WS)
#    3) fDTSimServer.exe       : 8864(model) / 8869(GUI WS) / 8084(REST /api/sim/run)
#    4) poc_manager.exe        : 8082(POC REST API, poc_manager.json)
#
#  실행 : powershell -ExecutionPolicy Bypass -File .\02_start_all.ps1
#  옵션 : -WaitMinutes <분>  Docker 엔진 대기 시간 (기본 10분)
#         -AutoStart         로그인 시 자동 기동 작업에서 사용. logs\autostart.log 에 기록
# =============================================================================

param(
    [int]$WaitMinutes = 10,
    [switch]$AutoStart
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$root      = $HymsRoot
$simEngine = Join-Path $root 'sim_engine'
$certDir   = Join-Path $root 'web_conf\certs'

if ($AutoStart) {
    $logDir = Join-Path $root 'logs'
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    try { Start-Transcript -Path (Join-Path $logDir 'autostart.log') -ErrorAction Stop | Out-Null } catch { }
}

Write-Host "=== HyMS_eins 기동 ===" -ForegroundColor Cyan
Write-Host "  루트 : $root"

# --- 0) 사전 점검 -----------------------------------------------------------
# 인증서가 없어도 nginx 컨테이너가 기동 시 자체 서명 인증서를 만든다.
# (docker_setup/docker-compose.yaml 의 web.command 참고)
if (-not (Test-Path (Join-Path $certDir 'server.crt'))) {
    Write-Host "[안내] HTTPS 인증서가 없습니다. nginx 컨테이너가 자체 서명 인증서를 생성합니다." -ForegroundColor Yellow
    Write-Host "       공인 인증서를 쓰려면 $certDir 에 server.crt / server.key 를 넣으세요." -ForegroundColor Yellow
}
if (-not (Test-Path $HymsEnvFile)) {
    Write-Host "[중단] docker_setup\.env 가 없습니다. setup.bat 을 먼저 실행하세요." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $simEngine 'fDTSimServer.exe'))) {
    Write-Host "[중단] sim_engine\fDTSimServer.exe 가 없습니다." -ForegroundColor Red
    exit 1
}

# --- 1) Docker 서비스 -------------------------------------------------------
Write-Host "`n=== 1) Docker 서비스 기동 ===" -ForegroundColor Cyan

# 재부팅 직후에는 Docker Desktop 이 아직 뜨는 중일 수 있다.
if (-not (Wait-DockerEngine $WaitMinutes)) {
    Write-Host "[중단] $WaitMinutes 분 안에 Docker 엔진이 응답하지 않았습니다. Docker Desktop 상태를 확인하세요." -ForegroundColor Red
    exit 1
}

# 80/443 등을 다른 프로그램(IIS 등)이 쓰고 있으면 compose 가 중간에 실패하므로 미리 확인한다.
if (-not (Test-ComposePortsFree)) {
    Write-Host "[중단] 포트 충돌로 기동할 수 없습니다 (위 [충돌] 참고)." -ForegroundColor Red
    exit 1
}

$code = Invoke-Compose @('up', '-d')
if ($code -ne 0) {
    Write-Host "[중단] docker compose up 실패 (종료 코드 $code)" -ForegroundColor Red
    Show-ComposeDiagnostics
    exit 1
}
Write-Host "  Docker 컨테이너 기동 요청 완료" -ForegroundColor Green

# --- 2) 시뮬레이션 엔진 (네이티브 프로세스) ---------------------------------
Write-Host "`n=== 2) 시뮬레이션 엔진 기동 ===" -ForegroundColor Cyan

function Start-SimProcess {
    param([string]$ExeName, [string]$Label)

    $procName = [IO.Path]::GetFileNameWithoutExtension($ExeName)
    $running  = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host ("  {0,-24} 이미 실행 중 (PID {1})" -f $Label, ($running.Id -join ',')) -ForegroundColor Yellow
        return
    }
    $exe = Join-Path $simEngine $ExeName
    if (-not (Test-Path $exe)) {
        Write-Host ("  {0,-24} [없음] {1}" -f $Label, $exe) -ForegroundColor Red
        return
    }
    # WorkingDirectory 가 sim_engine 이어야 am_inventory.json / projects 를 찾는다.
    Start-Process -FilePath $exe -WorkingDirectory $simEngine | Out-Null
    Write-Host ("  {0,-24} 기동" -f $Label) -ForegroundColor Green
}

# 기동 순서가 중요하다.
#   1) AtomicModelManager : 모델 레지스트리(8865)
#   2) fDTSimServer       : AMM 에 접속, GUI WS(8869) + REST(8084)
#   3) poc_manager        : fDTSimServer(8869) 에 클라이언트로 접속, REST(8082)
Start-SimProcess -ExeName 'atomic_model_manager.exe' -Label 'AtomicModelManager'
Start-Sleep -Seconds 2
Start-SimProcess -ExeName 'fDTSimServer.exe'         -Label 'fDTSimServer'
Start-Sleep -Seconds 3
Start-SimProcess -ExeName 'poc_manager.exe'          -Label 'poc_manager (POC REST)'
Start-Sleep -Seconds 2

# 안내 주소는 docker_setup\.env 의 SERVER_HOST / HTTPS_PORT 를 따른다.
$envMap = Read-EnvMap
$serverName = if ($envMap['SERVER_HOST']) { $envMap['SERVER_HOST'] } else { 'localhost' }
$origin = if ($envMap['HTTPS_PORT'] -and $envMap['HTTPS_PORT'] -ne '443') { "https://${serverName}:$($envMap['HTTPS_PORT'])" } else { "https://$serverName" }

Write-Host "`n=== 완료 ===" -ForegroundColor Green
Write-Host "  웹 UI          : $origin/simulation/"
Write-Host "  시뮬레이션 REST : $origin/api/sim/run?id=<webid>&projectname=<proj>&end_t=<sec>"
Write-Host "  POC REST       : $origin/api/simulations/push , /run , /api/health"
Write-Host "                   $origin/api/tci/sim/weight?user_id=&W1=&W2=&W3=&W4= , /GetWeight"
Write-Host "`n  상태 확인      : status.bat (deploy\03_health_check.ps1)" -ForegroundColor Cyan

if ($AutoStart) { try { Stop-Transcript | Out-Null } catch { } }
