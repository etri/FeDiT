# =============================================================================
#  common.ps1  -  deploy 스크립트 공용 함수
#  setup.ps1 / 02_start_all.ps1 / 99_stop_all.ps1 에서 dot-source 한다.
#     . (Join-Path $PSScriptRoot 'common.ps1')
#
#  PowerShell 5.1 주의
#   - 네이티브 명령(docker)의 stderr 를 PowerShell 에서 리다이렉트(2>$null, *>$null)하면
#     오류 레코드로 바뀌어 'Stop' 상태에서는 스크립트가 중단되고, 'Continue' 상태에서도
#     Start-Transcript 로그에 NativeCommandError 로 남는다(실측 : 2026-10-08 설치 로그).
#   - 그래서 docker 는 cmd.exe 를 거쳐 실행하고 리다이렉트도 cmd 안에서 한다.
#     (인수에 공백·따옴표가 없는 docker 명령에만 사용한다)
# =============================================================================

$HymsRoot     = Split-Path -Parent $PSScriptRoot
$HymsSetupDir = Join-Path $HymsRoot 'docker_setup'
$HymsEnvFile  = Join-Path $HymsSetupDir '.env'

# .env 의 KEY=VALUE 를 해시테이블로 읽는다 (주석/빈 줄 무시)
function Read-EnvMap([string]$path = $HymsEnvFile) {
    $map = @{}
    if (-not (Test-Path $path)) { return $map }
    foreach ($line in Get-Content $path) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') { $map[$Matches[1]] = $Matches[2] }
    }
    return $map
}

# 출력 없이 실행하고 종료 코드만 돌려준다.
function Invoke-Quiet([string]$commandLine) {
    cmd.exe /d /c "$commandLine >nul 2>&1"
    return $LASTEXITCODE
}

# 표준 출력 줄만 돌려준다 (stderr 는 버린다). 종료 코드는 $LASTEXITCODE 로 확인.
function Invoke-Capture([string]$commandLine) {
    return @(cmd.exe /d /c "$commandLine 2>nul")
}

# stdout/stderr 를 모두 화면과 로그에 남긴다. 실패 원인이 로그에 있어야 한다. 종료 코드 반환.
function Invoke-Logged([string]$commandLine) {
    # docker 출력은 UTF-8 이다. 콘솔 기본(CP949)으로 읽으면 한글 경로가 깨진다.
    $oldEnc = [Console]::OutputEncoding
    try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
    try {
        cmd.exe /d /c "$commandLine 2>&1" | ForEach-Object { Write-Host "    $_" }
        return $LASTEXITCODE
    }
    finally { try { [Console]::OutputEncoding = $oldEnc } catch { } }
}

# docker CLI 경로. 방금 설치되어 현재 세션 PATH 에 아직 없으면 PATH 에 추가한다.
function Find-Docker {
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $p = Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe'
    if (Test-Path $p) {
        $env:Path = (Split-Path $p) + ';' + $env:Path
        return $p
    }
    return $null
}

function Test-DockerReady {
    if (-not (Find-Docker)) { return $false }
    return ((Invoke-Quiet 'docker info') -eq 0)
}

# Docker Desktop 이 설치돼 있고 꺼져 있으면 실행한다. 설치돼 있지 않으면 $false.
function Start-DockerDesktop {
    $dd = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $dd)) { return $false }
    if (-not (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        # explorer 를 거치면 관리자 권한이 아닌 일반 사용자 권한으로 뜬다.
        Start-Process -FilePath 'explorer.exe' -ArgumentList "`"$dd`""
    }
    return $true
}

# 엔진이 응답할 때까지 기다린다. 필요하면 Docker Desktop 을 먼저 실행한다.
function Wait-DockerEngine([int]$Minutes = 5) {
    if (Test-DockerReady) { return $true }
    [void](Start-DockerDesktop)
    Write-Host "    Docker 엔진 기동 대기 (최대 $Minutes 분)..."
    $deadline = (Get-Date).AddMinutes($Minutes)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 5
        if (Test-DockerReady) { return $true }
    }
    return $false
}

# 이름이 정확히 일치하는 컨테이너가 있으면 상태(running, exited ...)를, 없으면 $null.
function Get-ContainerState([string]$name) {
    $line = Invoke-Capture "docker ps -a --filter name=$name --format {{.Names}}={{.State}}" |
            Where-Object { $_ -like "$name=*" } | Select-Object -First 1
    if ($line) { return $line.Substring($name.Length + 1) }
    return $null
}

# docker_setup 폴더에서 compose 를 실행하고 종료 코드를 반환한다. 출력은 모두 로그에 남긴다.
# -f 를 쓰지 않아야 .env 의 COMPOSE_FILE(Linux 엔진용 오버라이드)이 적용된다.
function Invoke-Compose([string[]]$Arguments) {
    Push-Location $HymsSetupDir
    try {
        $compose = if ((Invoke-Quiet 'docker compose version') -eq 0) { 'docker compose' } else { 'docker-compose' }
        return (Invoke-Logged ("$compose " + ($Arguments -join ' ')))
    }
    finally { Pop-Location }
}

# HyMS 가 호스트에서 쓰는 TCP 포트 (compose 공개 포트 + 네이티브 엔진 포트)
function Get-HymsHostPorts {
    $e = Read-EnvMap
    return @(
        [int]$(if ($e['HTTP_PORT'])   { $e['HTTP_PORT'] }   else { 80 }),
        [int]$(if ($e['HTTPS_PORT'])  { $e['HTTPS_PORT'] }  else { 443 }),
        [int]$(if ($e['NODE_PORT'])   { $e['NODE_PORT'] }   else { 8081 }),
        [int]$(if ($e['DB_EXT_PORT']) { $e['DB_EXT_PORT'] } else { 3307 }),
        8082, 8084, 8864, 8865, 8869, 8870
    )
}

# Windows 가 예약해 둔 TCP 포트 대역 (Hyper-V / WSL2 의 WinNAT 등).
# 이 대역 안의 포트는 쓰는 프로세스가 없어도 bind 가 거부된다
# ("An attempt was made to access a socket in a way forbidden by its access permissions").
function Get-ExcludedPortRanges {
    foreach ($line in (Invoke-Capture 'netsh int ipv4 show excludedportrange protocol=tcp')) {
        if ($line -match '^\s*(\d+)\s+(\d+)\s*(\*)?\s*$') {
            [pscustomobject]@{ Start = [int]$Matches[1]; End = [int]$Matches[2]; Administered = [bool]$Matches[3] }
        }
    }
}

function Get-ExcludedPortConflicts([int[]]$Ports) {
    $ranges = @(Get-ExcludedPortRanges)
    foreach ($port in $Ports) {
        $r = $ranges | Where-Object { $port -ge $_.Start -and $port -le $_.End } | Select-Object -First 1
        if ($r) { [pscustomobject]@{ Port = $port; Start = $r.Start; End = $r.End; Administered = $r.Administered } }
    }
}

# TCP 동적(임시) 포트 범위. WinNAT 는 이 범위 안에서 대역을 예약한다.
# Windows 기본값은 49152 부터 16384 개. 1024 부터로 바뀌어 있으면 HyMS 포트가 예약될 수 있다.
function Get-DynamicPortRange {
    $text = (Invoke-Capture 'netsh int ipv4 show dynamicport tcp') -join ' '
    $nums = @([regex]::Matches($text, '\d+') | ForEach-Object { [int]$_.Value })
    # 출력의 마지막 두 숫자가 [시작 포트, 포트 수] 이다 (표시 언어와 무관)
    if ($nums.Count -ge 2) { return [pscustomobject]@{ Start = $nums[-2]; Count = $nums[-1] } }
    return $null
}

# 지정한 포트를 이미 LISTEN 하고 있는 프로세스 목록 (IPv4/IPv6 로 두 번 잡히는 것은 하나로)
function Get-PortListeners([int[]]$Ports) {
    $seen = @{}
    foreach ($port in $Ports) {
        foreach ($c in @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)) {
            if ($seen["$port/$($c.OwningProcess)"]) { continue }
            $seen["$port/$($c.OwningProcess)"] = $true
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            [pscustomobject]@{
                Port    = $port
                Pid     = $c.OwningProcess
                Process = $(if ($p) { $p.ProcessName } else { '?' })
                Address = $c.LocalAddress
            }
        }
    }
}

# compose 가 쓰는 호스트 포트(.env 기준)를 다른 프로그램이 쓰고 있으면 안내하고 $false.
# 이 패키지의 컨테이너가 이미 떠 있으면(재실행) 그 포트는 검사하지 않는다.
function Test-ComposePortsFree {
    $envMap = Read-EnvMap
    $checks = @(
        @{ Container = 'nginx';   Ports = @([int]$(if ($envMap['HTTP_PORT'])   { $envMap['HTTP_PORT'] }   else { 80 }),
                                            [int]$(if ($envMap['HTTPS_PORT'])  { $envMap['HTTPS_PORT'] }  else { 443 })) },
        @{ Container = 'node';    Ports = @([int]$(if ($envMap['NODE_PORT'])   { $envMap['NODE_PORT'] }   else { 8081 })) },
        @{ Container = 'mariadb'; Ports = @([int]$(if ($envMap['DB_EXT_PORT']) { $envMap['DB_EXT_PORT'] } else { 3307 })) }
    )
    $ok = $true
    foreach ($chk in $checks) {
        if ((Get-ContainerState $chk.Container) -eq 'running') { continue }
        foreach ($x in @(Get-ExcludedPortConflicts $chk.Ports)) {
            $ok = $false
            Write-Host ("  [충돌] 포트 {0} 은(는) Windows 가 예약한 포트 대역({1}-{2}) 안에 있어 쓸 수 없습니다. -> {3} 컨테이너가 뜰 수 없습니다." -f `
                        $x.Port, $x.Start, $x.End, $chk.Container) -ForegroundColor Red
            if ($x.Administered) {
                Write-Host "         관리자가 직접 예약한 대역(*)입니다. 확인 : netsh int ipv4 show excludedportrange protocol=tcp" -ForegroundColor Yellow
            }
            else {
                Write-Host "         Hyper-V/WSL2(WinNAT)의 자동 예약입니다. setup.bat 을 다시 실행하면 자동으로 정리합니다." -ForegroundColor Yellow
            }
        }
        foreach ($l in @(Get-PortListeners $chk.Ports)) {
            $ok = $false
            Write-Host ("  [충돌] 포트 {0} 을(를) 이미 {1} (PID {2}) 가 사용 중입니다. -> {3} 컨테이너가 뜰 수 없습니다." -f `
                        $l.Port, $l.Process, $l.Pid, $chk.Container) -ForegroundColor Red
            if ($l.Pid -eq 4) {
                Write-Host "         PID 4(System) 는 HTTP.sys 사용 서비스(IIS 'World Wide Web Publishing Service' 등)입니다." -ForegroundColor Yellow
                Write-Host "         확인 : netsh http show servicestate   /   IIS 라면 : Stop-Service W3SVC; Set-Service W3SVC -StartupType Disabled" -ForegroundColor Yellow
            }
            elseif ($l.Process -eq 'vmware-hostd') {
                Write-Host "         VMware Workstation Server(서비스 VMwareHostd, 원격 접속·공유 VM 용)입니다. 꺼도 로컬 VM 실행에는 영향 없음." -ForegroundColor Yellow
                Write-Host "         끄기 : Stop-Service VMwareHostd -Force; Set-Service VMwareHostd -StartupType Disabled" -ForegroundColor Yellow
            }
            elseif ($l.Process -match 'docker|wslrelay|vpnkit|host-switch') {
                Write-Host "         다른 Docker 컨테이너가 쓰고 있을 수 있습니다. 확인 : docker ps" -ForegroundColor Yellow
            }
        }
    }
    if (-not $ok) {
        Write-Host "         해당 프로그램을 중지하거나, docker_setup\.env 의 HTTP_PORT / HTTPS_PORT 를 다른 값(예: 8080 / 8443)으로" -ForegroundColor Yellow
        Write-Host "         바꾼 뒤 다시 실행하세요." -ForegroundColor Yellow
    }
    return $ok
}

# compose 실패 시 원인 파악에 필요한 정보를 출력한다 (로그에도 남는다).
function Show-ComposeDiagnostics {
    Write-Host "`n--- 진단 : 컨테이너 상태 (docker compose ps -a) ---" -ForegroundColor Yellow
    [void](Invoke-Compose @('ps', '-a'))
    foreach ($c in 'mariadb', 'node', 'nginx') {
        $state = Get-ContainerState $c
        if (-not $state) { continue }
        Write-Host "`n--- 진단 : $c ($state) 최근 로그 ---" -ForegroundColor Yellow
        [void](Invoke-Logged "docker logs --tail 30 $c")
    }
    Write-Host "`n--- 진단 : 호스트 포트 점유 ---" -ForegroundColor Yellow
    $envMap = Read-EnvMap
    $ports = @($envMap['HTTP_PORT'], $envMap['HTTPS_PORT'], $envMap['NODE_PORT'], $envMap['DB_EXT_PORT']) |
             Where-Object { $_ } | ForEach-Object { [int]$_ }
    if (-not $ports) { $ports = @(80, 443, 8081, 3307) }
    $listeners = @(Get-PortListeners $ports)
    if ($listeners) { $listeners | ForEach-Object { Write-Host ("    :{0,-5} {1} (PID {2}) {3}" -f $_.Port, $_.Process, $_.Pid, $_.Address) } }
    else { Write-Host "    (사용 중인 포트 없음 : $($ports -join ', '))" }
}
