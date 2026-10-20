# =============================================================================
#  03_health_check.ps1  -  서버 배포 점검 (2026-10-07 개정본)
#
#  변경 이력
#   2026-09-18
#   1) 엔진 포트(8864/8865/8869/8870)에 TCP 접속하지 않는다.
#      "연결 직후 끊김"(TcpClient.Connect + Close 같은 포트 스캔)은
#      websocket_server 가 그 핸들을 조회하다 죽을 수 있는 패턴이라
#      점검이 서버를 내리는 일이 생긴다. Get-NetTCPConnection 으로
#      리스닝 여부만 관찰한다.
#   2) nginx 컨테이너가 host.docker.internal 을 윈도우 호스트로 해석하는지
#      검사한다. 172.17.x.x 로 나오면 compose 의 extra_hosts 때문에
#      /sim, /model, /api 가 전부 502 가 되는 상태다.
#   2026-10-07
#   3) 포트를 2026-10-02 빌드 바이너리 기준으로 정렬
#      poc_manager REST = 8082, fDTSimServer 보조 REST = 8084
#   4) 기본 점검 대상을 localhost 로 변경 (DNS 설정 전에도 설치 직후 점검 가능)
#      포트는 docker_setup\.env 의 HTTP_PORT / HTTPS_PORT 를 따른다.
#
#  실행 : powershell -ExecutionPolicy Bypass -File .\03_health_check.ps1
#         -TargetHost <도메인|IP>  : 외부 주소로 점검 (기본 localhost)
# =============================================================================

param(
    [string]$TargetHost = 'localhost'
)

$ErrorActionPreference = 'Continue'

# 포트와 공개 주소는 docker_setup\.env 에서 읽는다(없으면 기본값).
$serverName = 'localhost'
$httpPort   = '80'
$httpsPort  = '443'
$nodePort   = '8081'
$dbExtPort  = '3307'
$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker_setup\.env'
if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
        if ($line -match '^\s*SERVER_HOST\s*=\s*(.+?)\s*$') { $serverName = $Matches[1] }
        if ($line -match '^\s*HTTP_PORT\s*=\s*(\d+)\s*$')   { $httpPort   = $Matches[1] }
        if ($line -match '^\s*HTTPS_PORT\s*=\s*(\d+)\s*$')  { $httpsPort  = $Matches[1] }
        if ($line -match '^\s*NODE_PORT\s*=\s*(\d+)\s*$')   { $nodePort   = $Matches[1] }
        if ($line -match '^\s*DB_EXT_PORT\s*=\s*(\d+)\s*$') { $dbExtPort  = $Matches[1] }
    }
}
$httpsOrigin = if ($httpsPort -eq '443') { "https://$TargetHost" } else { "https://${TargetHost}:$httpsPort" }
$httpOrigin  = if ($httpPort  -eq '80')  { "http://$TargetHost" }  else { "http://${TargetHost}:$httpPort" }
$baseUrl     = "$httpsOrigin/simulation"

# 자체 서명 인증서 허용 (Windows PowerShell 5.1)
try {
    Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class HymsCertPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@ -ErrorAction SilentlyContinue
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object HymsCertPolicy
    [System.Net.ServicePointManager]::SecurityProtocol  = [System.Net.SecurityProtocolType]::Tls12
} catch { }

$fail = 0
$warn = 0

function Test-Listen {
    param([string]$Label, [int]$Port, [switch]$Optional)
    $listening = $null
    try { $listening = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue } catch { }
    if ($listening) {
        Write-Host ("  [OK]   {0,-30} :{1} LISTENING" -f $Label, $Port) -ForegroundColor Green
    }
    elseif ($Optional) {
        Write-Host ("  [SKIP] {0,-30} :{1}  (선택 구성요소)" -f $Label, $Port) -ForegroundColor DarkGray
        $script:warn++
    }
    else {
        Write-Host ("  [FAIL] {0,-30} :{1} 리스닝 없음" -f $Label, $Port) -ForegroundColor Red
        $script:fail++
    }
}

function Test-Proc {
    param([string]$Label, [string]$ProcName, [switch]$Optional)
    $p = Get-Process -Name $ProcName -ErrorAction SilentlyContinue
    if ($p) { Write-Host ("  [OK]   {0,-30} PID {1}" -f $Label, ($p.Id -join ',')) -ForegroundColor Green }
    elseif ($Optional) { Write-Host ("  [SKIP] {0,-30} 미실행 (선택)" -f $Label) -ForegroundColor DarkGray; $script:warn++ }
    else { Write-Host ("  [FAIL] {0,-30} 실행되지 않음" -f $Label) -ForegroundColor Red; $script:fail++ }
}

# 프록시 경로 점검 : 백엔드가 응답하면(상태코드 무관) 프록시는 정상, 502/504 는 백엔드 미도달.
function Test-Proxy {
    param([string]$Label, [string]$Url, [string]$Hint)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
        Write-Host ("  [OK]   {0,-24} {1} -> {2}" -f $Label, $Url, $r.StatusCode) -ForegroundColor Green
    }
    catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
        if ($code -eq 502 -or $code -eq 504) {
            Write-Host ("  [FAIL] {0,-24} {1} -> {2} (백엔드 미도달)" -f $Label, $Url, $code) -ForegroundColor Red
            if ($Hint) { Write-Host "         $Hint" -ForegroundColor Yellow }
            $script:fail++
        }
        elseif ($code -gt 0) {
            Write-Host ("  [OK]   {0,-24} {1} -> {2} (백엔드 응답)" -f $Label, $Url, $code) -ForegroundColor Green
        }
        else {
            Write-Host ("  [FAIL] {0,-24} {1} -> {2}" -f $Label, $Url, $_.Exception.Message) -ForegroundColor Red
            $script:fail++
        }
    }
}

Write-Host "  점검 대상 : $httpsOrigin  (공개 주소 SERVER_HOST=$serverName)" -ForegroundColor DarkGray

Write-Host "`n=== 1) Docker 컨테이너 ===" -ForegroundColor Cyan
docker ps --filter "name=nginx" --filter "name=node" --filter "name=mariadb" --format "  {{.Names}} | {{.Status}} | {{.Ports}}"

Write-Host "`n=== 2) 네이티브 프로세스 ===" -ForegroundColor Cyan
Test-Proc -Label 'AtomicModelManager' -ProcName 'atomic_model_manager'
Test-Proc -Label 'fDTSimServer'       -ProcName 'fDTSimServer'
Test-Proc -Label 'poc_manager'        -ProcName 'poc_manager'

Write-Host "`n=== 3) 포트 (리스닝 여부만 관찰 - 엔진에 접속하지 않음) ===" -ForegroundColor Cyan
Test-Listen -Label 'Nginx HTTP'            -Port ([int]$httpPort)
Test-Listen -Label 'Nginx HTTPS'           -Port ([int]$httpsPort)
Test-Listen -Label 'Node.js API'           -Port ([int]$nodePort)
Test-Listen -Label 'MariaDB'               -Port ([int]$dbExtPort)
Test-Listen -Label 'AMM model registry'    -Port 8865
Test-Listen -Label 'AMM GUI WebSocket'     -Port 8870
Test-Listen -Label 'fDTSimServer model'    -Port 8864
Test-Listen -Label 'fDTSimServer GUI WS'   -Port 8869
Test-Listen -Label 'fDTSimServer REST API' -Port 8084
Test-Listen -Label 'poc_manager REST API'  -Port 8082

Write-Host "`n=== 4) Nginx -> 호스트 엔진 경로 ===" -ForegroundColor Cyan
# cmd 안에서 stderr 를 버린다 (PowerShell 5.1 에서 2>$null 은 설치 로그에 오류로 남는다)
$hdi = cmd.exe /d /c "docker exec nginx getent hosts host.docker.internal 2>nul" | Select-Object -First 1
if (-not $hdi) {
    Write-Host "  [FAIL] nginx 컨테이너에서 host.docker.internal 해석 실패" -ForegroundColor Red
    $fail++
}
else {
    $hdiIp = ($hdi -split '\s+')[0]
    if ($hdiIp -like '172.17.*') {
        Write-Host ("  [FAIL] host.docker.internal = {0} (Docker VM 브리지)" -f $hdiIp) -ForegroundColor Red
        Write-Host "         docker-compose.yaml 의 extra_hosts 'host.docker.internal:host-gateway' 를 제거하세요." -ForegroundColor Yellow
        Write-Host "         이 상태면 /sim, /model, /api 가 전부 502 가 됩니다." -ForegroundColor Yellow
        $fail++
    }
    else {
        Write-Host ("  [OK]   host.docker.internal = {0} (윈도우 호스트)" -f $hdiIp) -ForegroundColor Green
    }
}

Write-Host "`n=== 5) HTTPS 정적 페이지 ===" -ForegroundColor Cyan
foreach ($u in @("$httpsOrigin/", "$baseUrl/")) {
    try {
        $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 15
        Write-Host ("  [OK]   GET {0}  ->  {1} ({2} bytes)" -f $u, $r.StatusCode, $r.RawContentLength) -ForegroundColor Green
    }
    catch {
        Write-Host ("  [FAIL] GET {0}  ->  {1}" -f $u, $_.Exception.Message) -ForegroundColor Red
        $fail++
    }
}

Write-Host "`n=== 6) Node.js REST API (DB 연동) ===" -ForegroundColor Cyan
foreach ($p in @("$baseUrl/get_project_list", "$httpsOrigin/get_project_list")) {
    try {
        $r = Invoke-WebRequest -Uri $p -Method POST -ContentType 'application/json; charset=utf-8' `
                -Body '{}' -UseBasicParsing -TimeoutSec 20
        if ($r.Content -match '"result"\s*:\s*1') { Write-Host ("  [OK]   POST {0}  ->  DB 응답 정상" -f $p) -ForegroundColor Green }
        else { Write-Host ("  [WARN] POST {0}  ->  {1}" -f $p, $r.Content) -ForegroundColor Yellow; $warn++ }
    }
    catch { Write-Host ("  [FAIL] POST {0}  ->  {1}" -f $p, $_.Exception.Message) -ForegroundColor Red; $fail++ }
}

Write-Host "`n=== 7) 시뮬레이션 REST 프록시 (fDTSimServer 8084) ===" -ForegroundColor Cyan
# 파라미터 없이 호출하면 fDTSimServer 가 400 으로 응답한다 = 프록시 경로 정상
Test-Proxy -Label '/api/sim/run' -Url "$httpOrigin/api/sim/run" `
    -Hint 'fDTSimServer 콘솔의 "REST API listening on http://+:8084" 로그와 01_windows_prepare.ps1(urlacl/방화벽) 실행 여부 확인'

Write-Host "`n=== 8) POC REST 프록시 (poc_manager 8082) ===" -ForegroundColor Cyan
Test-Proxy -Label '/api/health' -Url "$httpOrigin/api/health" `
    -Hint 'poc_manager.exe 실행 여부와 sim_engine\poc_manager.json 의 "port": 8082 확인'
Test-Proxy -Label '/GetWeight'  -Url "$httpOrigin/GetWeight"

Write-Host "`n  [INFO] /sim, /model 실제 연결은 브라우저에서 UI 를 열어 확인하세요." -ForegroundColor DarkGray
Write-Host "         (스크립트가 엔진 WebSocket 에 직접 요청하지 않습니다)" -ForegroundColor DarkGray

Write-Host ""
if ($fail -eq 0) { Write-Host ("=== 필수 항목 정상 (경고 {0} 건) ===" -f $warn) -ForegroundColor Green }
else { Write-Host ("=== 실패 {0} 건 - 위 [FAIL] 항목을 확인하세요 ===" -f $fail) -ForegroundColor Red }
exit $fail
