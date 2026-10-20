# =============================================================================
#  00_generate_cert.ps1
#  Nginx HTTPS 용 자체 서명 인증서 생성 (web_conf/certs/server.crt, server.key)
#
#  - 공인 인증서를 외부에 요청해 둔 상태라면, 발급 전까지 쓸 임시 자체 서명
#    인증서를 만든다. 발급받으면 같은 이름(server.crt/server.key)으로 덮어쓴다.
#  - 대상 이름은 docker_setup\.env 의 SERVER_HOST 를 읽어서 쓴다.
#    도메인이면 SAN 에 DNS:<도메인>, IP 면 SAN 에 IP:<주소> 로 넣는다.
#  - 공인 인증서를 발급받았다면 이 스크립트를 실행하지 말고
#    web_conf/certs/server.crt (인증서+중간체인), server.key (개인키) 로
#    PEM 형식 파일만 덮어쓰면 된다.
#
#  실행 : powershell -ExecutionPolicy Bypass -File .\00_generate_cert.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

$days = 3650

# 대상 이름은 docker_setup\.env 의 SERVER_HOST 에서 읽는다(없으면 기본값).
$serverName = 'simulation.fedit.or.kr'
$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker_setup\.env'
if (Test-Path $envPath) {
    $m = Select-String -Path $envPath -Pattern '^\s*SERVER_HOST\s*=\s*(.+?)\s*$' | Select-Object -First 1
    if ($m) { $serverName = $m.Matches[0].Groups[1].Value }
}
$isIp = $serverName -match '^\d+\.\d+\.\d+\.\d+$'

$root    = Split-Path -Parent $PSScriptRoot           # ...\HyMS_eins
$certDir = Join-Path $root 'web_conf\certs'

Write-Host "=== HyMS_eins HTTPS 인증서 생성 ===" -ForegroundColor Cyan
Write-Host "  대상 이름 : $serverName"
Write-Host "  출력 경로 : $certDir"

if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

$crt = Join-Path $certDir 'server.crt'
$key = Join-Path $certDir 'server.key'

if ((Test-Path $crt) -and (Test-Path $key)) {
    Write-Host "`n[주의] 인증서가 이미 존재합니다." -ForegroundColor Yellow
    Write-Host "       $crt"
    Write-Host "       덮어쓰려면 위 두 파일을 먼저 삭제하고 다시 실행하세요." -ForegroundColor Yellow
    exit 0
}

# 경로에 한글이 있으면 docker 볼륨 마운트가 실패할 수 있으므로
# ASCII 임시 폴더에서 생성한 뒤 복사한다.
$tmp = Join-Path $env:TEMP ('hyms_cert_' + (Get-Date -Format 'yyyyMMddHHmmss'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

$subj = "/C=KR/ST=Seoul/O=EINS/OU=fDTSim/CN=$serverName"
if ($isIp) {
    $san = "subjectAltName=IP:$serverName,DNS:localhost,IP:127.0.0.1"
}
else {
    $san = "subjectAltName=DNS:$serverName,DNS:localhost,IP:127.0.0.1"
}

$openssl = $null
$cmd = Get-Command openssl -ErrorAction SilentlyContinue
if ($cmd) { $openssl = $cmd.Source }

try {
    if ($openssl) {
        Write-Host "`n--- 로컬 openssl 사용 : $openssl ---" -ForegroundColor Cyan
        & $openssl req -x509 -nodes -newkey rsa:2048 -days $days `
            -keyout "$tmp\server.key" -out "$tmp\server.crt" `
            -subj $subj -addext $san
        if ($LASTEXITCODE -ne 0) { throw "openssl 실행 실패 (exit $LASTEXITCODE)" }
    }
    else {
        Write-Host "`n--- 로컬 openssl 이 없어 docker(alpine/openssl) 로 생성 ---" -ForegroundColor Cyan
        docker run --rm -v "${tmp}:/certs" alpine/openssl req -x509 -nodes -newkey rsa:2048 -days $days `
            -keyout /certs/server.key -out /certs/server.crt `
            -subj $subj -addext $san
        if ($LASTEXITCODE -ne 0) { throw "docker openssl 실행 실패 (exit $LASTEXITCODE)" }
    }

    if (-not (Test-Path "$tmp\server.crt")) { throw "인증서가 생성되지 않았습니다." }

    Copy-Item "$tmp\server.crt" $crt -Force
    Copy-Item "$tmp\server.key" $key -Force

    Write-Host "`n=== 완료 ===" -ForegroundColor Green
    Write-Host "  $crt"
    Write-Host "  $key"
    Write-Host "`n[안내] 자체 서명 인증서이므로 브라우저에 경고가 표시됩니다." -ForegroundColor Yellow
    Write-Host "       https://$serverName/simulation/ 에 접속해 '고급 > 계속' 으로 예외를 한 번 승인해야" -ForegroundColor Yellow
    Write-Host "       WebSocket(wss) 연결도 정상 동작합니다." -ForegroundColor Yellow
}
finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
