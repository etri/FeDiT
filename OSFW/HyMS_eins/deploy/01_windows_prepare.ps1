# =============================================================================
#  01_windows_prepare.ps1
#  서버(Windows) 1회성 준비 작업  -  관리자 권한 필요
#
#   1) HTTP.sys URL 예약 : REST API(8082, 8084) 를 와일드카드로 바인딩
#      -> Nginx 컨테이너가 host.docker.internal 로 접근 가능해진다.
#   2) 방화벽 규칙
#      - 80 / 443 (.env 의 HTTP_PORT/HTTPS_PORT) : 외부 공개 (웹 UI, 외부 REST 연동)
#      - 8082/8084/8864/8865/8869/8870           : 로컬 + Docker 서브넷만 허용 (인터넷 비공개)
#
#  실행 : (관리자 PowerShell)
#         powershell -ExecutionPolicy Bypass -File .\01_windows_prepare.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] `
            [Security.Principal.WindowsIdentity]::GetCurrent() `
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[중단] 관리자 권한으로 실행해야 합니다." -ForegroundColor Red
    Write-Host "       PowerShell 을 '관리자 권한으로 실행' 후 다시 시도하세요." -ForegroundColor Red
    exit 1
}

Write-Host "=== 1) HTTP.sys URL 예약 (REST API) ===" -ForegroundColor Cyan
Write-Host "  8082 : poc_manager REST (/api/simulations, /api/tci/sim/weight, /GetWeight ...)"
Write-Host "  8084 : fDTSimServer 보조 REST (/api/sim/run)"

foreach ($port in @(8082, 8084)) {
    $url = "http://+:$port/"
    $acl = cmd.exe /d /c "netsh http show urlacl url=$url 2>nul"
    if ($acl -match [string]$port) {
        Write-Host ("  이미 예약됨 : {0}" -f $url) -ForegroundColor Green
    }
    else {
        # user=Everyone 은 Windows 표시 언어에 따라 계정 이름이 달라 실패할 수 있다.
        # SID(WD = Everyone)로 지정하면 언어와 무관하다. netsh 출력은 인코딩이 깨져 숨긴다.
        netsh http add urlacl url=$url 'sddl=D:(A;;GX;;;WD)' | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host ("  예약 완료   : {0}" -f $url) -ForegroundColor Green
        }
        else {
            Write-Host ("  [경고] {0} 예약 실패. 해당 exe 를 관리자 권한으로 실행하면 대체 가능합니다." -f $url) -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== 2) 방화벽 규칙 ===" -ForegroundColor Cyan

function Set-FwRule {
    param(
        [string]   $Name,
        [int[]]    $Ports,
        [string[]] $RemoteAddress
    )
    Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
    if ($RemoteAddress) {
        New-NetFirewallRule -DisplayName $Name -Direction Inbound -Action Allow `
            -Protocol TCP -LocalPort $Ports -RemoteAddress $RemoteAddress -Profile Any | Out-Null
        Write-Host ("  {0,-42} TCP {1}  (from {2})" -f $Name, ($Ports -join ','), ($RemoteAddress -join ',')) -ForegroundColor Green
    }
    else {
        New-NetFirewallRule -DisplayName $Name -Direction Inbound -Action Allow `
            -Protocol TCP -LocalPort $Ports -Profile Any | Out-Null
        Write-Host ("  {0,-42} TCP {1}  (공개)" -f $Name, ($Ports -join ',')) -ForegroundColor Green
    }
}

# 외부 공개 : 웹 UI + 외부 REST 연동 (Nginx)
#   포트는 docker_setup\.env 의 HTTP_PORT / HTTPS_PORT 를 따른다(없으면 80/443).
$httpPort = 80; $httpsPort = 443
$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker_setup\.env'
if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
        if ($line -match '^\s*HTTP_PORT\s*=\s*(\d+)\s*$')  { $httpPort  = [int]$Matches[1] }
        if ($line -match '^\s*HTTPS_PORT\s*=\s*(\d+)\s*$') { $httpsPort = [int]$Matches[1] }
    }
}
Set-FwRule -Name 'HyMS_eins Web (80,443)' -Ports @($httpPort, $httpsPort)

# 로컬/Docker 전용 : 시뮬레이션 엔진 및 모델 매니저
$localOnly = @('127.0.0.1', '172.16.0.0/12', '192.168.0.0/16', '10.0.0.0/8')
Set-FwRule -Name 'HyMS_eins SimEngine (local only)' -Ports @(8082, 8084, 8864, 8865, 8869, 8870) -RemoteAddress $localOnly

Write-Host "`n=== 완료 ===" -ForegroundColor Green
Write-Host "  다음 단계: .\02_start_all.ps1"
