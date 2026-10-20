# =============================================================================
#  setup.ps1  -  HyMS_eins 통합 설치 / 기동  (패키지 루트의 setup.bat 이 호출)
#
#  setup.bat 한 번으로 아래를 모두 처리한다. 처음에 설치 계획을 보여주고 한 번만
#  확인을 받는다. 재부팅이 필요하면 자동 재부팅 후, 같은 계정으로 로그인하면
#  이어서 진행한다. 여러 번 실행해도 안전하다(끝난 단계는 건너뛰고, 기존 .env
#  비밀번호와 db\ 데이터는 건드리지 않는다).
#
#    1) 설정        docker_setup\.env 생성 (서버 주소 자동 감지 + 무작위 DB 비밀번호)
#                   sim_engine\poc_manager.json 의 public_url 반영
#    2) VC++ 2015-2022 x64 재배포 패키지
#    3) Python 3.10 x64            (model_cap_python.exe 가 python310.dll 로 사용)
#    4) Python 패키지              (sim_engine\requirements.txt -> Python 3.10)
#    5) Docker                     WSL 2 기능 활성화 -> WSL 업데이트 -> Docker Desktop
#                                  무인 설치 -> 엔진 기동 -> Linux 컨테이너 모드
#    6) Docker 이미지              (prereq\docker_images.tar 가 있으면 로드)
#                                  + 컨테이너 -> 호스트(host.docker.internal) 경로 확인
#    7) Windows 설정               HTTP.sys URL 예약, 이 PC 의 Windows 방화벽 규칙,
#                                  로그인 시 자동 기동 작업(작업 스케줄러)
#    8) 전체 기동                  Docker 3종 + 엔진 3종
#    9) 상태 점검
#
#  다루지 않는 것 (인프라 영역) : 공인 IP / DNS, 네트워크 방화벽, 공유기·L4 포트포워딩,
#                                 BIOS 가상화 설정, 공인 인증서 발급
#
#  설치 파일은 prereq\ 에 있으면 그것을 쓰고(오프라인 패키지), 없으면 인터넷에서 받는다.
#  실행 로그 : logs\setup_<날짜시각>.log
#
#  실행 : setup.bat 더블클릭 (관리자 권한을 자동으로 요청한다)
#  옵션 : -ServerHost <도메인|IP>  서버 공개 주소 (기본: 자동 감지한 이 PC 의 IP).
#                                  이미 설치된 서버에서 주면 주소만 바꾼다(비밀번호 유지).
#         -Unattended              확인 질문 없이 진행, 끝나도 창을 멈추지 않는다
#         -AcceptDockerLicense     -Unattended 로 Docker Desktop 까지 설치할 때 라이선스 동의
#         -NoReboot                재부팅이 필요해도 자동으로 재부팅하지 않는다
#         -NoAutoStart             로그인 시 자동 기동을 등록하지 않는다 (이미 있으면 삭제)
#         -SkipStart               설치만 하고 기동/점검은 하지 않는다
#         -NoBrowser               완료 후 브라우저를 열지 않는다
#         -Resumed                 (내부용) 재부팅 후 자동 재개
# =============================================================================

param(
    [string]$ServerHost,
    [switch]$Unattended,
    [switch]$AcceptDockerLicense,
    [switch]$NoReboot,
    [switch]$NoAutoStart,
    [switch]$SkipStart,
    [switch]$NoBrowser,
    [switch]$Resumed
)

# PowerShell 5.1 : 'Stop' 상태에서 네이티브 명령(docker, pip)의 stderr 를 리다이렉트하면
# NativeCommandError 로 중단된다. 전역은 Continue 로 두고 결과는 직접 검사한다.
$ErrorActionPreference = 'Continue'

# --- 관리자 권한 (아니면 UAC 로 다시 실행) -----------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal] `
            [Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
    foreach ($kv in $PSBoundParameters.GetEnumerator()) {
        if ($kv.Value -is [System.Management.Automation.SwitchParameter]) {
            if ($kv.Value.IsPresent) { $argList += "-$($kv.Key)" }
        }
        else {
            $argList += "-$($kv.Key)"
            $argList += "`"$($kv.Value)`""
        }
    }
    try {
        Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList -ErrorAction Stop
        Write-Host "관리자 권한 창에서 설치를 계속합니다."
    }
    catch {
        Write-Host "[중단] 관리자 권한이 필요합니다. (UAC 요청이 거부되었습니다)" -ForegroundColor Red
        if (-not $Unattended) { Read-Host 'Enter 를 누르면 창을 닫습니다' | Out-Null }
    }
    exit
}

. (Join-Path $PSScriptRoot 'common.ps1')

# --- 경로 / 상수 -------------------------------------------------------------
$deploy     = $PSScriptRoot
$root       = $HymsRoot
$prereq     = Join-Path $root 'prereq'
$setupDir   = $HymsSetupDir
$composeYml = Join-Path $setupDir 'docker-compose.yaml'
$envFile    = $HymsEnvFile
$envExample = Join-Path $setupDir '.env.example'
$dbDir      = Join-Path $root 'db'
$simEngine  = Join-Path $root 'sim_engine'
$pocJson    = Join-Path $simEngine 'poc_manager.json'
$reqFile    = Join-Path $simEngine 'requirements.txt'

# docker-compose.yaml 의 image 와 일치해야 한다 (build_package.ps1 도 같은 목록 사용)
$dockerImages = @('nginx:1.27', 'node:20-alpine', 'mariadb:11.4')

$pythonVersion  = '3.10.11'     # 3.10 계열 마지막 Windows 설치 파일
$pythonFile     = "python-$pythonVersion-amd64.exe"
$pythonUrl      = "https://www.python.org/ftp/python/$pythonVersion/$pythonFile"
$vcFile         = 'vc_redist.x64.exe'
$vcUrl          = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
$dockerFile     = 'Docker Desktop Installer.exe'
$dockerUrl      = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'

$resumeTaskName = 'HyMS_eins Setup Resume'
$autoTaskName   = 'HyMS_eins AutoStart'
$currentUser    = [Security.Principal.WindowsIdentity]::GetCurrent().Name

$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir ('setup_{0}.log' -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
try { Start-Transcript -Path $logFile -ErrorAction Stop | Out-Null } catch { }

# --- 출력 도우미 -------------------------------------------------------------
function Write-Step([string]$n, [string]$msg) { Write-Host "`n=== $n) $msg ===" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Write-Info([string]$msg) { Write-Host "  [안내] $msg" -ForegroundColor Yellow }
function Write-Plan([bool]$ready, [string]$label, [string]$todo = '설치') {
    if ($ready) { Write-Host "    [있음] $label" -ForegroundColor Green }
    else        { Write-Host "    [$todo] $label" -ForegroundColor Yellow }
}

function Stop-Setup([int]$code) {
    try { Stop-Transcript | Out-Null } catch { }
    if (-not $Unattended) { Read-Host "`nEnter 를 누르면 창을 닫습니다" | Out-Null }
    exit $code
}

function Fail([string]$msg) {
    Write-Host ""
    Write-Host "[중단] $msg" -ForegroundColor Red
    Write-Host "       로그 : $logFile" -ForegroundColor DarkGray
    Write-Host "       문제를 해결한 뒤 setup.bat 을 다시 실행하면 이어서 진행합니다." -ForegroundColor DarkGray
    Stop-Setup 1
}

function Confirm-Yes([string]$question, [bool]$default) {
    if ($Unattended) { return $default }
    $suffix = if ($default) { '(Y/n)' } else { '(y/N)' }
    $ans = Read-Host "  $question $suffix"
    if ([string]::IsNullOrWhiteSpace($ans)) { return $default }
    return ($ans -match '^[yY]')
}

# 네이티브 명령을 실행하고 출력을 들여쓰기해 보여준다(로그에도 남는다). 종료 코드를 반환.
function Invoke-Native([string]$exe, [string[]]$arguments) {
    & $exe @arguments 2>&1 | ForEach-Object { Write-Host "    $_" }
    return $LASTEXITCODE
}

# prereq\ 에 있으면 그 파일을, 없으면 내려받은 임시 파일 경로를 반환한다.
function Get-Installer([string]$fileName, [string]$url) {
    $local = Join-Path $prereq $fileName
    if (Test-Path $local) {
        Write-Host "    패키지 동봉 파일 사용 : $local"
        return $local
    }
    $dl = Join-Path $env:TEMP $fileName
    Write-Host "    다운로드 : $url"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'   # PS 5.1 진행률 표시는 다운로드를 크게 느리게 한다
        Invoke-WebRequest -Uri $url -OutFile $dl -UseBasicParsing -ErrorAction Stop
    }
    catch {
        Fail "$fileName 다운로드 실패 : $($_.Exception.Message)`n       인터넷이 없는 서버는 오프라인 패키지(prereq 폴더 포함)를 사용하세요."
    }
    return $dl
}

# KEY=VALUE 줄의 값만 바꾼다. 주석과 줄 순서는 그대로 둔다.
function Set-EnvValues([string[]]$lines, [hashtable]$values) {
    $done = @{}
    $out = @(foreach ($line in $lines) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=' -and $values.ContainsKey($Matches[1])) {
            $done[$Matches[1]] = $true
            "$($Matches[1])=$($values[$Matches[1]])"
        }
        else { $line }
    })
    foreach ($k in $values.Keys) { if (-not $done[$k]) { $out += "$k=$($values[$k])" } }
    return ,$out
}

function Write-Utf8NoBom([string]$path, [string]$text) {
    [IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))
}

# 영문/숫자만 사용한다. .env 보간($), 셸 인용(", `), 주석(#) 문제를 원천 차단.
function New-Secret([int]$length = 24) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    $bytes = New-Object byte[] $length
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

function Get-DefaultHost {
    try {
        $ip = Get-NetIPConfiguration -ErrorAction Stop |
              Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
              ForEach-Object { $_.IPv4Address.IPAddress } | Select-Object -First 1
        if ($ip) { return $ip }
    }
    catch { }
    return $env:COMPUTERNAME
}

function ConvertTo-HostName([string]$value) {
    $v = $value.Trim() -replace '^[a-zA-Z]+://', ''
    $v = ($v -split '/')[0]
    if ($v -notmatch '^[A-Za-z0-9.\-]+$') { Fail "서버 주소 형식이 올바르지 않습니다 : '$value' (예: sim.example.com 또는 10.0.0.5)" }
    return $v
}

function Get-PublicOrigin([string]$hostName, [string]$httpsPort) {
    if ($httpsPort -and $httpsPort -ne '443') { return "https://${hostName}:$httpsPort" }
    return "https://$hostName"
}

function Find-Python310 {
    # 64bit 3.10 은 PythonCore\3.10 (32bit 는 3.10-32) 에 등록된다.
    foreach ($hive in 'HKLM:', 'HKCU:') {
        $key = "$hive\SOFTWARE\Python\PythonCore\3.10\InstallPath"
        # 키가 없을 때 예외를 내지 않게 먼저 확인한다(잡힌 예외도 설치 로그에 '종료 오류'로 남는다).
        if (-not (Test-Path $key)) { continue }
        try {
            $p = Get-ItemProperty $key -ErrorAction Stop
            $exe = $p.ExecutablePath
            if (-not $exe -and $p.'(default)') { $exe = Join-Path $p.'(default)' 'python.exe' }
            if ($exe -and (Test-Path $exe)) { return $exe }
        }
        catch { }
    }
    return $null
}

# 엔진 exe/dll 은 VS2019+ 런타임(vcruntime140_1, concrt140)까지 필요하다.
function Test-VCRuntime {
    $sys32 = Join-Path $env:SystemRoot 'System32'
    return (Test-Path "$sys32\msvcp140.dll") -and (Test-Path "$sys32\vcruntime140_1.dll") -and (Test-Path "$sys32\concrt140.dll")
}

# Hyper-V 가 이미 돌고 있으면 펌웨어 값이 False 로 보이므로 HypervisorPresent 를 먼저 본다.
function Test-Virtualization {
    try {
        if ((Get-CimInstance Win32_ComputerSystem).HypervisorPresent) { return $true }
        return [bool]((Get-CimInstance Win32_Processor | Select-Object -First 1).VirtualizationFirmwareEnabled)
    }
    catch { return $true }   # 확인할 수 없으면 설치를 막지 않는다
}

# 관리자 권한 없이 docker 를 쓰려면(로그인 시 자동 기동 등) docker-users 그룹이 필요하다.
function Add-DockerUsers {
    try {
        $grp = Get-LocalGroup -Name 'docker-users' -ErrorAction Stop
        $isMember = Get-LocalGroupMember -Group $grp -ErrorAction Stop | Where-Object { $_.Name -eq $currentUser }
        if (-not $isMember) {
            Add-LocalGroupMember -Group $grp -Member $currentUser -ErrorAction Stop
            Write-Ok "docker-users 그룹에 $currentUser 추가 (다음 로그인부터 적용)"
        }
    }
    catch { }
}

# WSL 을 최신으로 만든다. 실패해도 계속한다(Docker Desktop 이 첫 기동 때 다시 안내한다).
function Update-Wsl {
    $msi = Get-ChildItem -Path $prereq -Filter 'wsl*.msi' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($msi) {
        Write-Host "    WSL 설치/업데이트 (동봉 파일) : $($msi.Name)"
        $p = Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i', "`"$($msi.FullName)`"", '/quiet', '/norestart' -Wait -PassThru
        if (@(0, 3010, 1638) -contains $p.ExitCode) { Write-Ok 'WSL 업데이트' }
        else { Write-Info "WSL 설치 파일 종료 코드 $($p.ExitCode) (계속 진행)" }
        return
    }
    if (Get-Command wsl.exe -ErrorAction SilentlyContinue) {
        Write-Host "    WSL 업데이트 (wsl --update --web-download)..."
        $code = Invoke-Quiet 'wsl.exe --update --web-download'
        if ($code -eq 0) { Write-Ok 'WSL 업데이트' }
        else { Write-Info "WSL 업데이트를 건너뜁니다 (종료 코드 $code)" }
    }
}

# 로그인 시 관리자 권한으로 실행되는 작업 (UAC 창 없이 실행된다)
function Register-LogonTask([string]$name, [string]$arguments, [string]$description) {
    $action    = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
    $trigger   = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
    $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest
    # 실행 시간 제한 없음(PT0S). 제한에 걸려 작업이 강제 종료되면 띄운 엔진까지 영향을 받을 수 있다.
    $settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                     -ExecutionTimeLimit (New-TimeSpan -Seconds 0)
    Register-ScheduledTask -TaskName $name -Description $description -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null
}

# 재부팅 후 로그인하면 setup 을 같은 옵션으로 이어서 실행하도록 등록하고 재부팅한다.
function Request-Reboot([string]$reason) {
    $a = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Resumed')
    if ($ServerHost) { $a += @('-ServerHost', $ServerHost) }
    if ($script:dockerLicenseAccepted) { $a += '-AcceptDockerLicense' }
    foreach ($sw in 'Unattended', 'NoReboot', 'NoAutoStart', 'SkipStart', 'NoBrowser') {
        if ((Get-Variable -Name $sw -ValueOnly).IsPresent) { $a += "-$sw" }
    }
    try {
        Register-LogonTask $resumeTaskName ($a -join ' ') 'HyMS_eins 설치를 재부팅 후 이어서 진행 (1회 실행 후 자동 삭제)'
    }
    catch { Fail "재부팅 후 자동 재개 작업 등록 실패 : $($_.Exception.Message)" }

    Write-Host ""
    Write-Host "  재부팅이 필요합니다 : $reason" -ForegroundColor Yellow
    Write-Host "  재부팅 후 같은 계정($currentUser)으로 로그인하면 설치가 자동으로 이어집니다." -ForegroundColor Yellow
    if ($NoReboot) {
        Write-Host "  -NoReboot : 준비가 되면 직접 재부팅하세요." -ForegroundColor Yellow
        Stop-Setup 0
    }
    & shutdown.exe /r /t 60 /c "HyMS_eins 설치: 재부팅 후 로그인하면 자동으로 이어서 진행합니다. (취소: shutdown /a)" | Out-Null
    Write-Host "  60초 후 재부팅합니다. 취소하려면 다른 명령 창에서 'shutdown /a' 를 실행하세요." -ForegroundColor Yellow
    Stop-Setup 0
}

# 컨테이너 안에서 host.docker.internal 이 호스트로 해석되는지 확인한다.
# 엔진 기동 직후에는 해석이 잠깐 실패할 수 있어(실측) 몇 번 다시 시도한다.
function Get-HostGatewayIp {
    for ($i = 0; $i -lt 6; $i++) {
        $line = Invoke-Capture "docker run --rm $($dockerImages[0]) getent hosts host.docker.internal" | Select-Object -First 1
        if ($LASTEXITCODE -eq 0 -and $line) { return (("$line".Trim() -split '\s+')[0]) }
        Start-Sleep -Seconds 5
    }
    return $null
}

# =============================================================================
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ("  HyMS_eins 통합 설치" + $(if ($Resumed) { '  (재부팅 후 자동 재개)' } else { '' })) -ForegroundColor Cyan
Write-Host "  설치 위치 : $root"
$verFile = Join-Path $root 'VERSION.txt'
if (Test-Path $verFile) { Write-Host ("  패키지    : " + (Get-Content $verFile -TotalCount 1)) }
Write-Host "=============================================================" -ForegroundColor Cyan

# --- 0) 사전 확인 + 설치 계획 ------------------------------------------------
Write-Step 0 '사전 확인'

# 재부팅 후 자동 재개 작업은 한 번만 쓴다.
if (Get-ScheduledTask -TaskName $resumeTaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $resumeTaskName -Confirm:$false -ErrorAction SilentlyContinue
}

foreach ($f in @($composeYml, $envExample, $reqFile, $pocJson,
                 (Join-Path $simEngine 'fDTSimServer.exe'),
                 (Join-Path $simEngine 'atomic_model_manager.exe'),
                 (Join-Path $simEngine 'poc_manager.exe'),
                 (Join-Path $simEngine 'model_cap_python.exe'))) {
    if (-not (Test-Path $f)) { Fail "패키지 파일이 없습니다 : $f  (압축을 전부 풀었는지 확인하세요)" }
}
if (-not (Test-Path (Join-Path $root 'app_root\node_modules\express'))) {
    Write-Info 'app_root\node_modules 가 없습니다. node 컨테이너가 최초 기동 시 npm install 을 시도합니다(인터넷 필요).'
}
Write-Ok '패키지 구성'

if ($root -match '[^\x00-\x7F]') {
    Write-Info "설치 경로에 한글 등 비 ASCII 문자가 있습니다. Docker 볼륨 마운트 문제를 피하려면"
    Write-Info "C:\HyMS_eins 처럼 영문 경로에 압축을 푸는 것을 권장합니다."
}
if ($root -match '\s') {
    Write-Info "설치 경로에 공백이 있습니다. 문제가 생기면 공백 없는 경로로 옮기세요."
}

# 인터넷에서 받은 zip 을 풀면 파일마다 '인터넷에서 받음' 표시가 붙어 exe 실행 시
# 보안 경고 창이 뜨거나 차단된다. 한 번에 해제한다.
Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
if (-not (Test-Path $dbDir)) { New-Item -ItemType Directory -Path $dbDir | Out-Null }

$os = Get-CimInstance Win32_OperatingSystem
Write-Ok ("{0} (build {1})" -f $os.Caption, $os.BuildNumber)
if ($os.ProductType -ne 1) {
    Write-Info 'Windows Server 는 Docker Desktop 의 공식 지원 OS 가 아닙니다. Docker 설치가 실패하면 Windows 10/11 을 사용하세요.'
}

$vcReady    = Test-VCRuntime
$py         = Find-Python310
$needDocker = -not (Find-Docker)

if ($needDocker -and -not (Test-Virtualization)) {
    Fail ("CPU 가상화가 꺼져 있어 Docker(WSL 2)를 쓸 수 없습니다.`n" +
          "       BIOS/UEFI 에서 Intel VT-x 또는 AMD-V(SVM)를 켠 뒤 다시 실행하세요. (가상 머신이면 중첩 가상화 필요)")
}

$existingEnv = Read-EnvMap $envFile
$planHost = if ($ServerHost) { ConvertTo-HostName $ServerHost }
            elseif ($existingEnv['SERVER_HOST']) { $existingEnv['SERVER_HOST'] }
            else { Get-DefaultHost }

$script:dockerLicenseAccepted = [bool]$AcceptDockerLicense
if (-not $Resumed) {
    Write-Host ""
    Write-Host "  설치 계획" -ForegroundColor White
    Write-Plan $vcReady 'VC++ 2015-2022 x64 런타임'
    Write-Plan ([bool]$py) ('Python 3.10 x64' + $(if ($py) { "  ($py)" } else { '' }))
    Write-Plan $false 'Python 패키지 (pyproj, sumolib, requests, numpy, scipy)' '확인'
    Write-Plan (-not $needDocker) 'Docker 엔진 (없으면 Docker Desktop + WSL 2 무인 설치)'
    Write-Plan $false '.env / URL 예약 / Windows 방화벽 규칙 / 로그인 시 자동 기동' '설정'
    Write-Plan $false 'Docker 3종 + 시뮬레이션 엔진 3종 기동, 상태 점검' '기동'
    Write-Host "    서버 주소 : $planHost   (변경: setup.bat -ServerHost <주소>)"
    if ($needDocker) {
        Write-Host ""
        Write-Host "  Docker Desktop 은 Docker Subscription Service Agreement 에 따라 제공됩니다." -ForegroundColor Yellow
        Write-Host "  직원 250명 초과 또는 연매출 1천만 달러 초과 조직의 업무용 사용은 유료 구독이 필요합니다." -ForegroundColor Yellow
        Write-Host "  https://www.docker.com/legal/docker-subscription-service-agreement/" -ForegroundColor Yellow
        Write-Host "  설치 중 재부팅이 필요할 수 있습니다. 재부팅 후 로그인하면 자동으로 이어서 진행합니다." -ForegroundColor Yellow
    }
    Write-Host ""
    if ($Unattended) {
        if ($needDocker -and -not $AcceptDockerLicense) {
            Fail 'Docker Desktop 설치가 필요합니다. 무인 설치는 -AcceptDockerLicense 로 라이선스 동의를 명시하세요.'
        }
    }
    else {
        $q = if ($needDocker) { 'Docker 라이선스에 동의하고 설치를 진행할까요?' } else { '설치를 진행할까요?' }
        if (-not (Confirm-Yes $q $true)) { Write-Host '  취소했습니다.'; Stop-Setup 0 }
        if ($needDocker) { $script:dockerLicenseAccepted = $true }
    }
}

# --- 1) 설정 ----------------------------------------------------------------
Write-Step 1 '설정 (.env / poc_manager.json)'

$dbIsEmpty = -not (Get-ChildItem -Path $dbDir -Force -ErrorAction SilentlyContinue | Select-Object -First 1)

if (-not (Test-Path $envFile)) {
    $lines = Get-Content $envExample -Encoding UTF8
    $exMap = Read-EnvMap $envExample
    $origin = Get-PublicOrigin $planHost $exMap['HTTPS_PORT']
    $dbPass = New-Secret
    $lines = Set-EnvValues $lines @{
        MYSQL_ROOT_PASSWORD        = (New-Secret)
        MYSQL_PASSWORD             = $dbPass
        DB_PASSWORD                = $dbPass
        SERVER_HOST                = $planHost
        PUBLIC_BASE_URL            = "$origin/simulation"
        ENV_DISCRETE_SIMULATOR_URL = $origin
    }
    Write-Utf8NoBom $envFile (($lines -join "`n") + "`n")
    Write-Ok "docker_setup\.env 생성 (서버 주소 $planHost, DB 비밀번호 무작위 생성)"
    if (-not $dbIsEmpty) {
        Write-Info "db\ 에 기존 데이터가 있습니다. 새 비밀번호는 기존 DB 계정과 다를 수 있습니다."
        Write-Info "기존 DB 를 쓸 경우 예전 서버의 docker_setup\.env 비밀번호 3줄을 옮겨 적으세요."
    }
}
else {
    $map = Read-EnvMap $envFile
    $updates = @{}

    # .env.example 을 그대로 복사해 둔 경우 : 빈 DB 라면 안전하게 채울 수 있다.
    $placeholder = @('MYSQL_ROOT_PASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD') |
                   Where-Object { -not $map[$_] -or $map[$_] -eq 'CHANGE_ME' }
    if ($placeholder) {
        if (-not $dbIsEmpty) {
            Fail ".env 의 DB 비밀번호가 비어 있거나 CHANGE_ME 입니다 ($($placeholder -join ', ')).`n       db\ 에 데이터가 있으므로 그 DB 를 만들 때 쓴 비밀번호를 직접 입력하세요."
        }
        $dbPass = New-Secret
        $updates['MYSQL_ROOT_PASSWORD'] = New-Secret
        $updates['MYSQL_PASSWORD'] = $dbPass
        $updates['DB_PASSWORD'] = $dbPass
        Write-Ok 'DB 비밀번호 자리표시자(CHANGE_ME)를 무작위 값으로 채웠습니다'
    }
    elseif ($map['DB_PASSWORD'] -ne $map['MYSQL_PASSWORD']) {
        Write-Info '.env 의 DB_PASSWORD 와 MYSQL_PASSWORD 가 다릅니다. node 가 DB 에 접속하지 못할 수 있습니다.'
    }

    if ($ServerHost -and $planHost -ne $map['SERVER_HOST']) {
        $origin = Get-PublicOrigin $planHost $map['HTTPS_PORT']
        $updates['SERVER_HOST'] = $planHost
        $updates['PUBLIC_BASE_URL'] = "$origin/simulation"
        $updates['ENV_DISCRETE_SIMULATOR_URL'] = $origin
        Write-Ok "서버 주소 변경 : $($map['SERVER_HOST']) -> $planHost"
        if (Test-Path (Join-Path $root 'web_conf\certs\server.crt')) {
            Write-Info '자체 서명 인증서는 이전 주소로 발급되어 있습니다. 새 주소로 다시 만들려면'
            Write-Info 'web_conf\certs\server.crt / server.key 를 삭제하고 setup.bat 을 다시 실행하세요.'
        }
    }

    if ($updates.Count -gt 0) {
        $lines = Set-EnvValues (Get-Content $envFile -Encoding UTF8) $updates
        Write-Utf8NoBom $envFile (($lines -join "`n") + "`n")
    }
    Write-Ok "기존 docker_setup\.env 사용 (서버 주소 $((Read-EnvMap $envFile)['SERVER_HOST']))"
}

$envMap  = Read-EnvMap $envFile
$publicBase = $envMap['PUBLIC_BASE_URL']
if (-not $publicBase) { $publicBase = (Get-PublicOrigin $envMap['SERVER_HOST'] $envMap['HTTPS_PORT']) + '/simulation' }

# poc_manager 가 모델에 넘기는 결과/파라미터 URL 의 기준 주소
$pocText = [IO.File]::ReadAllText($pocJson)
$pocNew  = [regex]::Replace($pocText, '("public_url"\s*:\s*")[^"]*(")', "`${1}$publicBase`${2}")
if ($pocNew -ne $pocText) {
    Write-Utf8NoBom $pocJson $pocNew
    Write-Ok "poc_manager.json public_url = $publicBase"
}
else {
    Write-Ok "poc_manager.json public_url 확인 ($publicBase)"
}

# --- 2) VC++ 재배포 패키지 ---------------------------------------------------
Write-Step 2 'VC++ 2015-2022 x64 재배포 패키지'

if (Test-VCRuntime) {
    Write-Ok '이미 설치됨'
}
else {
    $vc = Get-Installer $vcFile $vcUrl
    Write-Host "    설치 중..."
    $p = Start-Process -FilePath $vc -ArgumentList '/install', '/quiet', '/norestart' -Wait -PassThru
    # 0 = 성공, 3010 = 성공(재부팅 필요), 1638 = 더 새 버전이 이미 설치됨
    if (@(0, 3010, 1638) -notcontains $p.ExitCode) { Fail "VC++ 재배포 패키지 설치 실패 (종료 코드 $($p.ExitCode))" }
    Write-Ok "설치 완료 (종료 코드 $($p.ExitCode))"
}

# --- 3) Python 3.10 ---------------------------------------------------------
Write-Step 3 'Python 3.10 (x64)'

$py = Find-Python310
if ($py) {
    Write-Ok "이미 설치됨 : $py"
}
else {
    $inst = Get-Installer $pythonFile $pythonUrl
    # 서버에 py 런처가 이미 있으면(대개 더 새 버전) 런처는 설치하지 않는다.
    # 구버전 런처를 함께 설치하려다 전체 설치가 실패하는 경우를 막는다.
    $launcher = if (Get-Command py.exe -ErrorAction SilentlyContinue) { '0' } else { '1' }
    Write-Host "    설치 중 (모든 사용자, 수 분 소요)..."
    # PrependPath=0 : 서버에 다른 Python 이 있어도 기본 python 을 바꾸지 않는다.
    #                 엔진은 레지스트리로 3.10 을 찾고, 사용자는 py -3.10 으로 쓸 수 있다.
    $p = Start-Process -FilePath $inst -Wait -PassThru -ArgumentList @(
        '/quiet', 'InstallAllUsers=1', 'PrependPath=0', "Include_launcher=$launcher",
        "InstallLauncherAllUsers=$launcher", 'Include_test=0', 'Include_doc=0')
    if (@(0, 3010) -notcontains $p.ExitCode) { Fail "Python $pythonVersion 설치 실패 (종료 코드 $($p.ExitCode))" }
    $py = Find-Python310
    if (-not $py) { Fail "Python 3.10 설치 후에도 레지스트리에서 찾을 수 없습니다." }
    Write-Ok "설치 완료 : $py"
}

# --- 4) Python 패키지 --------------------------------------------------------
Write-Step 4 'Python 패키지 (sim_engine\requirements.txt)'

& $py -m pip --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    pip 가 없어 ensurepip 로 설치합니다."
    Invoke-Native $py @('-m', 'ensurepip', '--default-pip') | Out-Null
}

$pipArgs = @('-m', 'pip', 'install', '--disable-pip-version-check', '--no-warn-script-location', '-r', $reqFile)
$wheels = Join-Path $prereq 'wheels'
if (Test-Path $wheels) {
    Write-Host "    오프라인 설치 : $wheels"
    $pipArgs += @('--no-index', '--find-links', $wheels)
}
$code = Invoke-Native $py $pipArgs
if ($code -ne 0) { Fail "pip install 실패 (종료 코드 $code)" }

$code = Invoke-Native $py @('-c', "import sumolib, pyproj, requests, numpy, scipy; print('import OK : sumolib, pyproj, requests, numpy, scipy')")
if ($code -ne 0) { Fail 'Python 패키지 import 확인 실패' }
Write-Ok 'Python 패키지 준비 완료'

# --- 5) Docker --------------------------------------------------------------
Write-Step 5 'Docker'

$dockerInstalledNow = $false
if (-not (Find-Docker)) {
    if (-not $script:dockerLicenseAccepted) {
        Fail 'Docker Desktop 설치에는 라이선스 동의가 필요합니다. setup.bat 을 다시 실행해 동의하거나 -AcceptDockerLicense 를 지정하세요.'
    }

    # 5-1) WSL 2 에 필요한 Windows 기능
    $needReboot = $false
    foreach ($feat in 'Microsoft-Windows-Subsystem-Linux', 'VirtualMachinePlatform') {
        $f = Get-WindowsOptionalFeature -Online -FeatureName $feat -ErrorAction SilentlyContinue
        if (-not $f) { Write-Info "Windows 기능 $feat 를 찾을 수 없습니다 (WSL 2 미지원 Windows 일 수 있음)"; continue }
        if ($f.State -eq 'Enabled') { Write-Ok "$feat 사용 중"; continue }
        if ($f.State -eq 'EnablePending') { $needReboot = $true; Write-Ok "$feat 활성화됨 (재부팅 대기)"; continue }
        Write-Host "    Windows 기능 활성화 : $feat"
        try {
            $r = Enable-WindowsOptionalFeature -Online -FeatureName $feat -All -NoRestart -ErrorAction Stop
            if ($r.RestartNeeded) { $needReboot = $true }
            Write-Ok "$feat 활성화"
        }
        catch { Fail "$feat 활성화 실패 : $($_.Exception.Message)" }
    }

    # 5-2) WSL 최신화
    Update-Wsl

    # 5-3) Docker Desktop 무인 설치 (라이선스 동의는 위 설치 계획 단계에서 받았다)
    $inst = Get-Installer $dockerFile $dockerUrl
    Write-Host "    Docker Desktop 설치 중 (무인, 5~10분 소요)..."
    $p = Start-Process -FilePath $inst -ArgumentList 'install', '--quiet', '--accept-license', '--backend=wsl-2' -Wait -PassThru
    if ($p.ExitCode -ne 0) {
        Fail "Docker Desktop 설치 실패 (종료 코드 $($p.ExitCode)). 로그 : C:\ProgramData\DockerDesktop\install-log*.txt"
    }
    Write-Ok 'Docker Desktop 설치 완료'
    $dockerInstalledNow = $true
    Add-DockerUsers

    if ($needReboot) { Request-Reboot 'WSL 2 Windows 기능 활성화' }
    if (-not (Find-Docker)) { Request-Reboot 'Docker Desktop 설치 반영' }
}
Write-Ok ("Docker CLI : " + (Find-Docker))
Add-DockerUsers

if (-not (Wait-DockerEngine 5)) {
    # 첫 기동 실패의 흔한 원인은 오래된 WSL 이다. 한 번 고쳐 보고 다시 기다린다.
    Write-Info 'Docker 엔진이 응답하지 않아 WSL 업데이트 후 Docker Desktop 을 다시 시작합니다.'
    Update-Wsl
    Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    if (-not (Wait-DockerEngine 5)) {
        if ($dockerInstalledNow -and -not $Resumed) { Request-Reboot 'Docker 엔진 첫 기동' }
        Fail 'Docker 엔진에 연결할 수 없습니다. Docker Desktop 을 직접 열어 오류 메시지를 확인하세요.'
    }
}

# Linux 컨테이너 모드가 아니면 자동 전환한다.
$osType = Invoke-Capture 'docker info --format {{.OSType}}' | Select-Object -First 1
if ($osType -eq 'windows') {
    $cli = Join-Path $env:ProgramFiles 'Docker\Docker\DockerCli.exe'
    if (Test-Path $cli) {
        Write-Host "    Linux 컨테이너 모드로 전환합니다..."
        & $cli -SwitchLinuxEngine
        $deadline = (Get-Date).AddMinutes(3)
        do {
            Start-Sleep -Seconds 5
            $osType = Invoke-Capture 'docker info --format {{.OSType}}' | Select-Object -First 1
        } while ($osType -ne 'linux' -and (Get-Date) -lt $deadline)
    }
    if ($osType -ne 'linux') {
        Fail "Docker 가 Windows 컨테이너 모드입니다. 트레이 아이콘에서 'Switch to Linux containers' 후 다시 실행하세요."
    }
    Write-Ok 'Linux 컨테이너 모드로 전환'
}
Write-Ok ("Docker 엔진 실행 중 : " + (Invoke-Capture 'docker info --format {{.OperatingSystem}}' | Select-Object -First 1))

if ((Invoke-Quiet 'docker compose version') -ne 0 -and -not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Fail 'docker compose 를 찾을 수 없습니다. Docker Desktop 을 최신 버전으로 업데이트하세요.'
}

# --- 6) Docker 이미지 -------------------------------------------------------
Write-Step 6 'Docker 이미지'

$missing = @($dockerImages | Where-Object { (Invoke-Quiet "docker image inspect $_") -ne 0 })
if ($missing.Count -eq 0) {
    Write-Ok ("이미 있음 : " + ($dockerImages -join ', '))
}
else {
    $tar = Join-Path $prereq 'docker_images.tar'
    if (Test-Path $tar) {
        Write-Host "    오프라인 이미지 로드 : $tar (수 분 소요)"
        $code = Invoke-Native 'docker' @('load', '-i', $tar)
        if ($code -ne 0) { Fail "docker load 실패 (종료 코드 $code)" }
    }
    else {
        foreach ($img in $missing) {
            Write-Host "    내려받는 중 : $img"
            $code = Invoke-Native 'docker' @('pull', $img)
            if ($code -ne 0) { Fail "docker pull $img 실패. 인터넷이 없는 서버는 오프라인 패키지를 사용하세요." }
        }
    }
    $still = @($dockerImages | Where-Object { (Invoke-Quiet "docker image inspect $_") -ne 0 })
    if ($still.Count -gt 0) { Fail ("이미지가 준비되지 않았습니다 : " + ($still -join ', ')) }
    Write-Ok ("준비 완료 : " + ($dockerImages -join ', '))
}

# nginx 는 host.docker.internal 로 호스트의 시뮬레이션 엔진(8869/8870/8082/8084)에 접속한다.
# Docker Desktop / Rancher Desktop 은 이를 제공한다. 제공하지 않는 엔진이면 nginx 가 뜨지 못한다.
$hostIp = Get-HostGatewayIp
if ($hostIp) {
    Write-Ok "host.docker.internal = $hostIp (컨테이너 -> 호스트 엔진 경로)"
}
elseif ($envMap['COMPOSE_FILE'] -match 'linux') {
    Write-Ok 'host.docker.internal : .env 의 Linux 엔진용 오버라이드(COMPOSE_FILE) 사용'
}
else {
    Fail ("이 Docker 엔진은 host.docker.internal 을 제공하지 않아 nginx 가 시뮬레이션 엔진에 연결할 수 없습니다.`n" +
          "       Docker Desktop 또는 Rancher Desktop 을 사용하세요. (순수 Linux 엔진이면 .env 의 COMPOSE_FILE 주석 해제)")
}

# --- 7) Windows 설정 --------------------------------------------------------
Write-Step 7 'Windows 설정 (URL 예약 / 방화벽 규칙 / 자동 기동)'
try { & (Join-Path $deploy '01_windows_prepare.ps1') }
catch { Fail "Windows 설정 실패 : $($_.Exception.Message)" }

# --- Windows 예약 포트 정리 (Hyper-V / WSL2 WinNAT) ---
# 동적 포트 범위가 1024 부터로 바뀌어 있는 PC 에서는 WinNAT 가 그 안에서 포트 대역을 임의로
# 예약해 3307, 8081, 8869 같은 HyMS 포트가 "access permissions" 오류로 막힌다(실측 : 2026-10-08).
# 재부팅할 때마다 예약 위치가 바뀌므로 범위를 Windows 기본값으로 되돌려 근본적으로 피한다.
Write-Host "`n=== Windows 예약 포트 확인 ===" -ForegroundColor Cyan
$hymsPorts = Get-HymsHostPorts
$dyn = Get-DynamicPortRange
if ($dyn -and $dyn.Start -lt 49152 -and
    @($hymsPorts | Where-Object { $_ -ge $dyn.Start -and $_ -lt ($dyn.Start + $dyn.Count) }).Count -gt 0) {
    Write-Info ("TCP 동적 포트 범위가 {0}-{1} 이라 HyMS 포트가 예약될 수 있습니다. Windows 기본값(49152-65535)으로 되돌립니다." -f `
                $dyn.Start, ($dyn.Start + $dyn.Count - 1))
    $c4 = Invoke-Quiet 'netsh int ipv4 set dynamicportrange protocol=tcp startport=49152 numberofports=16384'
    $c6 = Invoke-Quiet 'netsh int ipv6 set dynamicportrange protocol=tcp startport=49152 numberofports=16384'
    if ($c4 -eq 0 -and $c6 -eq 0) { Write-Ok 'TCP 동적 포트 범위 = 49152-65535' }
    else { Write-Info "동적 포트 범위 변경 실패 (종료 코드 IPv4 $c4 / IPv6 $c6)" }
}
elseif ($dyn) {
    Write-Ok ("TCP 동적 포트 범위 {0}-{1}" -f $dyn.Start, ($dyn.Start + $dyn.Count - 1))
}
else {
    Write-Info 'TCP 동적 포트 범위를 확인하지 못했습니다 (계속 진행)'
}

$blocked = @(Get-ExcludedPortConflicts $hymsPorts)
$manual  = @($blocked | Where-Object { $_.Administered })
if ($manual) {
    Fail ("관리자가 직접 예약한 포트 대역이 HyMS 포트를 막고 있습니다 : " +
          (($manual | ForEach-Object { "$($_.Port) ($($_.Start)-$($_.End))" }) -join ', ') + "`n" +
          "       확인 : netsh int ipv4 show excludedportrange protocol=tcp`n" +
          "       해당 예약을 지우거나(netsh int ipv4 delete excludedportrange ...) .env 의 포트를 바꾼 뒤 다시 실행하세요.")
}
if ($blocked) {
    Write-Info ('Windows 예약 대역에 막힌 포트 : ' + (($blocked | ForEach-Object { "$($_.Port) ($($_.Start)-$($_.End))" }) -join ', '))
    Write-Host "    WinNAT 를 재시작해 예약 대역을 다시 잡게 합니다..."
    [void](Invoke-Quiet 'net stop winnat')
    [void](Invoke-Quiet 'net start winnat')
    $blocked = @(Get-ExcludedPortConflicts $hymsPorts)
    if ($blocked) {
        # 동적 포트 범위 변경은 재부팅 후 확실히 적용된다.
        Request-Reboot ('Windows 예약 포트 대역 재설정 (막힌 포트 : ' + (($blocked | ForEach-Object { $_.Port }) -join ', ') + ')')
    }
    Write-Ok 'HyMS 포트 예약 해제'
    # WinNAT 재시작 뒤 Docker 엔진이 계속 응답하는지 확인한다.
    if (-not (Wait-DockerEngine 3)) {
        Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
        if (-not (Wait-DockerEngine 5)) { Request-Reboot 'WinNAT 재시작 후 Docker 엔진 복구' }
    }
}
else {
    Write-Ok ('HyMS 포트(' + ($hymsPorts -join ', ') + ')가 Windows 예약 대역과 겹치지 않음')
}

# --- 웹 포트(80/443)를 점유한 VMware Workstation Server ---
# VMware Workstation 의 VMwareHostd(vmware-hostd.exe) 서비스가 443 을 쓰는 PC 가 많다(실측 : 2026-10-08).
# 원격 접속·공유 VM 용 서비스라 꺼도 이 PC 의 VM 실행에는 영향이 없다. 중지만 하면 다시 켜지므로
# 자동 시작도 끈다. 다른 프로그램(IIS 등)은 용도를 알 수 없어 건드리지 않고 기동 단계에서 안내만 한다.
if ((Get-ContainerState 'nginx') -ne 'running') {
    $webPorts = @($hymsPorts[0], $hymsPorts[1])
    $vmHold = @(Get-PortListeners $webPorts | Where-Object { $_.Process -eq 'vmware-hostd' })
    if ($vmHold) {
        Write-Info ("포트 {0} 을(를) VMware Workstation Server(서비스 VMwareHostd)가 사용 중입니다." -f `
                    (($vmHold | ForEach-Object { $_.Port } | Select-Object -Unique) -join ', '))
        Write-Info '원격 접속·공유 VM 용 서비스이며, 꺼도 이 PC 에서 VM 을 실행하는 데는 영향이 없습니다.'
        if (Confirm-Yes 'VMwareHostd 서비스를 중지하고 자동 시작을 끌까요?' $true) {
            try {
                Set-Service -Name 'VMwareHostd' -StartupType Disabled -ErrorAction Stop
                Stop-Service -Name 'VMwareHostd' -Force -ErrorAction Stop
            }
            catch { Fail "VMwareHostd 서비스를 끄지 못했습니다 : $($_.Exception.Message)" }
            $deadline = (Get-Date).AddSeconds(20)
            while (@(Get-PortListeners $webPorts | Where-Object { $_.Process -eq 'vmware-hostd' }).Count -gt 0 -and
                   (Get-Date) -lt $deadline) { Start-Sleep -Seconds 1 }
            Write-Ok 'VMwareHostd 중지 + 자동 시작 해제 (되돌리기 : Set-Service VMwareHostd -StartupType Automatic; Start-Service VMwareHostd)'
        }
        else {
            Write-Info '그대로 둡니다. docker_setup\.env 의 HTTPS_PORT 를 다른 값(예: 8443)으로 바꾼 뒤 다시 실행하세요.'
        }
    }
}

if ($NoAutoStart) {
    if (Get-ScheduledTask -TaskName $autoTaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $autoTaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Ok "로그인 시 자동 기동 작업 삭제 ($autoTaskName)"
    }
    else { Write-Ok '로그인 시 자동 기동 : 사용 안 함 (-NoAutoStart)' }
}
else {
    $startArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$(Join-Path $deploy '02_start_all.ps1')`" -AutoStart"
    try {
        Register-LogonTask $autoTaskName $startArgs 'HyMS_eins : 로그인 시 Docker 엔진을 기다린 뒤 전체 기동 (해제: setup.bat -NoAutoStart)'
        Write-Ok "로그인 시 자동 기동 등록 : 작업 스케줄러 '$autoTaskName' ($currentUser)"
    }
    catch { Write-Info "자동 기동 작업 등록 실패 : $($_.Exception.Message)  (재부팅 후 start.bat 으로 기동하세요)" }
}

if ($SkipStart) {
    Write-Host "`n=== -SkipStart : 설치만 완료했습니다. start.bat 으로 기동하세요. ===" -ForegroundColor Green
    Stop-Setup 0
}

# --- 8) 전체 기동 -----------------------------------------------------------
Write-Step 8 '전체 기동'

# 빈 db\ 로 새로 초기화되는데 다른 위치에서 쓰던 mariadb 컨테이너가 있으면
# (업그레이드 설치) 기존 데이터를 놓칠 수 있으므로 확인한다.
$dbIsEmpty = -not (Get-ChildItem -Path $dbDir -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
$oldDb = Get-ContainerState 'mariadb'
if ($dbIsEmpty -and $oldDb) {
    Write-Info '이미 mariadb 컨테이너가 있지만 이 폴더의 db\ 는 비어 있습니다.'
    Write-Info '계속하면 새 DB(기본 프로젝트 데이터)로 시작합니다. 기존 데이터를 이어 쓰려면'
    Write-Info '중단한 뒤 이전 설치 폴더의 db\ 와 docker_setup\.env 를 이 폴더로 복사하세요.'
    if (-not (Confirm-Yes '새 DB 로 계속할까요?' $true)) { Stop-Setup 0 }
}

# 이전에 실행 중이던 엔진이 있으면 새 설정(poc_manager.json 등)을 읽도록 재시작한다.
$running = Get-Process -Name 'atomic_model_manager', 'fDTSimServer', 'poc_manager' -ErrorAction SilentlyContinue
if ($running) {
    Write-Info ('실행 중인 엔진을 재시작합니다 : ' + (($running | ForEach-Object { $_.ProcessName } | Select-Object -Unique) -join ', '))
    & (Join-Path $deploy '99_stop_all.ps1') -Force -EnginesOnly | Out-Null
    Start-Sleep -Seconds 2
}

$nginxWasRunning = ((Get-ContainerState 'nginx') -eq 'running')

if ($dbIsEmpty) { Write-Host "    최초 기동 : DB 초기화(initdb)에 1~2분 걸릴 수 있습니다." }
$global:LASTEXITCODE = 0
try { & (Join-Path $deploy '02_start_all.ps1') }
catch { Fail "기동 실패 : $($_.Exception.Message)" }
if ($LASTEXITCODE -ne 0) { Fail "기동 실패 (02_start_all.ps1 종료 코드 $LASTEXITCODE)" }

# 컨테이너가 재생성되지 않은 업그레이드 설치에서도 바뀐 nginx 설정을 읽게 한다.
if ($nginxWasRunning) {
    if ((Invoke-Quiet 'docker exec nginx nginx -s reload') -eq 0) { Write-Ok 'nginx 설정 다시 읽기' }
}

# --- 9) 상태 점검 -----------------------------------------------------------
Write-Step 9 '상태 점검'
Start-Sleep -Seconds 5
& (Join-Path $deploy '03_health_check.ps1')
$healthFail = $LASTEXITCODE

# --- 완료 -------------------------------------------------------------------
$publicOrigin = Get-PublicOrigin $envMap['SERVER_HOST'] $envMap['HTTPS_PORT']
$localUrl = (Get-PublicOrigin 'localhost' $envMap['HTTPS_PORT']) + '/simulation/'

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
if ($healthFail -eq 0) { Write-Host "  설치 완료" -ForegroundColor Green }
else { Write-Host "  설치는 끝났지만 점검에서 실패 $healthFail 건이 있습니다 (위 [FAIL] 참고)" -ForegroundColor Yellow }
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  웹 UI (외부) : $publicOrigin/simulation/"
Write-Host "  웹 UI (로컬) : $localUrl"
Write-Host "  외부 연동    : $publicOrigin/api/sim/run?id=<webid>&projectname=<proj>&end_t=<sec>"
Write-Host ""
Write-Host "  운영 : start.bat (기동)  stop.bat (종료)  status.bat (점검)"
if (-not $NoAutoStart) { Write-Host "         재부팅 후에는 로그인하면 자동으로 기동됩니다 (logs\autostart.log)" }
Write-Host "  로그 : $logFile"
Write-Host ""
$crtPath = Join-Path $root 'web_conf\certs\server.crt'
$selfSigned = $true
if (Test-Path $crtPath) {
    try {
        $cert = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $crtPath
        $selfSigned = ($cert.Subject -eq $cert.Issuer)
    }
    catch { }
}
if ($selfSigned) {
    Write-Host "  [안내] 공인 인증서가 없으면 자체 서명 인증서를 씁니다. 브라우저에서 처음 한 번" -ForegroundColor Yellow
    Write-Host "         '고급 > 계속' 으로 예외를 승인해야 WebSocket(wss) 까지 연결됩니다." -ForegroundColor Yellow
    Write-Host "         공인 인증서는 web_conf\certs\server.crt / server.key 로 교체 후 stop.bat -> start.bat" -ForegroundColor Yellow
}

if (-not $NoBrowser -and -not $Unattended) {
    # explorer 를 거치면 관리자 권한이 아닌 일반 권한의 기본 브라우저로 열린다.
    Start-Process -FilePath 'explorer.exe' -ArgumentList $localUrl
}

Stop-Setup ([int]($healthFail -ne 0))
