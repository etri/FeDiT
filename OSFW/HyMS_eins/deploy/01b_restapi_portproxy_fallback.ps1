# =============================================================================
#  01b_restapi_portproxy_fallback.ps1
#  fDTSimServer.exe 를 아직 재빌드하지 못한 경우의 임시 우회책  -  관리자 권한 필요
#
#  배경
#    기존 fDTSimServer.exe 는 REST API 를 http://localhost:8082 (루프백 전용) 로
#    바인딩한다. 그래서 Nginx 컨테이너가 host.docker.internal:8082 로 접근하면
#    502 Bad Gateway 가 발생한다.
#
#    정식 해결 : masterAgent.cpp 수정분(와일드카드 바인딩)으로 VS2016 x64 Release
#                재빌드 -> deploy_to_sim_engine.ps1 로 배포
#    임시 우회 : Windows portproxy 로 (호스트 Docker 게이트웨이 IP):8082 요청을
#                127.0.0.1:8082 로 전달
#
#  실행 : (관리자 PowerShell)
#         powershell -ExecutionPolicy Bypass -File .\01b_restapi_portproxy_fallback.ps1
#  해제 : 같은 스크립트에 -Remove 옵션
# =============================================================================

param([switch]$Remove)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] `
            [Security.Principal.WindowsIdentity]::GetCurrent() `
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[중단] 관리자 권한으로 실행하세요." -ForegroundColor Red
    exit 1
}

# --- nginx 컨테이너가 보는 host.docker.internal 주소를 직접 조회 --------------
Write-Host "=== host.docker.internal 주소 확인 ===" -ForegroundColor Cyan
$hostLine = docker exec nginx getent hosts host.docker.internal 2>$null
if (-not $hostLine) {
    Write-Host "[중단] nginx 컨테이너에서 host.docker.internal 을 확인할 수 없습니다." -ForegroundColor Red
    Write-Host "       컨테이너가 실행 중인지( docker ps ) 확인하세요." -ForegroundColor Red
    exit 1
}
$gatewayIp = ($hostLine -split '\s+')[0]
Write-Host "  host.docker.internal = $gatewayIp" -ForegroundColor Green

if ($Remove) {
    netsh interface portproxy delete v4tov4 listenaddress=$gatewayIp listenport=8082
    Write-Host "portproxy 규칙을 삭제했습니다." -ForegroundColor Green
    netsh interface portproxy show v4tov4
    exit 0
}

Write-Host "`n=== portproxy 등록 : ${gatewayIp}:8082 -> 127.0.0.1:8082 ===" -ForegroundColor Cyan
netsh interface portproxy delete v4tov4 listenaddress=$gatewayIp listenport=8082 2>$null | Out-Null
netsh interface portproxy add v4tov4 listenaddress=$gatewayIp listenport=8082 connectaddress=127.0.0.1 connectport=8082
if ($LASTEXITCODE -ne 0) {
    Write-Host "[실패] portproxy 등록 실패. 'IP Helper(iphlpsvc)' 서비스가 실행 중인지 확인하세요." -ForegroundColor Red
    exit 1
}

netsh interface portproxy show v4tov4

Write-Host "`n=== 완료 ===" -ForegroundColor Green
Write-Host "  확인 : .\03_health_check.ps1 의 '6) 시뮬레이션 REST API 프록시' 항목" -ForegroundColor Cyan
Write-Host "  [주의] 호스트 재부팅으로 Docker 게이트웨이 IP 가 바뀌면 이 스크립트를 다시 실행해야 합니다." -ForegroundColor Yellow
Write-Host "         영구 해결은 masterAgent.cpp 재빌드입니다." -ForegroundColor Yellow
