# =============================================================================
#  build_package.ps1  -  배포 패키지(zip) 생성  (개발 PC 에서 실행)
#
#  결과물 (기본 출력 폴더 <루트>\dist)
#    HyMS_eins_<버전>[_offline]\              배포 폴더
#    HyMS_eins_<버전>[_offline].zip           배포 파일
#    HyMS_eins_<버전>[_offline].zip.sha256    무결성 확인용 해시
#
#  사용자는 zip 을 영문 경로(예: C:\HyMS_eins)에 풀고 setup.bat 만 실행하면 된다.
#
#  패키지에 넣지 않는 것 (서버마다 달라야 하거나 운영 데이터인 것)
#    db\                       MariaDB 데이터 -> 최초 기동 시 initdb SQL 로 생성
#    docker_setup\.env         DB 비밀번호    -> setup 이 서버마다 무작위로 생성
#    web_conf\certs\server.*   인증서/개인키  -> nginx 가 자동 생성 또는 공인 인증서 배치
#    __pycache__, *.bak_*, .vs, logs, dist 등 개발 부산물
#    deploy\10_서버_설치_및_기동.ps1          -> setup.ps1 로 대체
#    deploy\01b_restapi_portproxy_fallback.ps1 -> 구 바이너리(루프백 바인딩)용 우회책
#    common_x64d.dll, cpprest_2_10d.dll        -> 디버그 빌드 (디버그 VC++ 런타임은 재배포 불가)
#
#  라이선스 : LICENSE, NOTICE, THIRD_PARTY_NOTICES.txt 가 없으면 중단한다.
#             디버그 VC++ 런타임(ucrtbased.dll 등)을 쓰는 DLL/EXE 가 섞이면 중단한다.
#
#  옵션
#    -Offline   폐쇄망용. 아래를 prereq\ 에 함께 넣는다 (약 +750MB)
#                 python-3.10.11-amd64.exe, vc_redist.x64.exe
#                 Python 패키지 wheel (sim_engine\requirements.txt, cp310 / win_amd64)
#                 Docker 이미지 (nginx:1.27, node:20-alpine, mariadb:11.4) docker save
#    -IncludeDockerInstaller
#               (-Offline 과 함께) Docker Desktop 설치 파일과 WSL 설치 파일(msi)도 넣는다
#               (약 +800MB). 인터넷이 전혀 없는 서버에서 Docker 까지 설치할 때 사용.
#               Docker Desktop 은 Docker 사 라이선스 대상이므로 사내/라이선스 범위 안에서만 배포한다.
#    -Version   버전 문자열 (기본: 오늘 날짜 yyyyMMdd)
#    -OutDir    출력 폴더 (기본: <루트>\dist)
#    -NoZip     폴더만 만들고 압축하지 않는다
#    -AllowDebugBinaries
#               디버그 빌드 DLL/EXE 검사를 경고로만 처리한다 (사내 시험용. 외부 배포 금지)
#
#  실행 : powershell -ExecutionPolicy Bypass -File .\build_package.ps1
#         powershell -ExecutionPolicy Bypass -File .\build_package.ps1 -Offline
# =============================================================================

param(
    [switch]$Offline,
    [switch]$IncludeDockerInstaller,
    [string]$Version = (Get-Date -Format 'yyyyMMdd'),
    [string]$OutDir,
    [switch]$NoZip,
    [switch]$AllowDebugBinaries
)

$ErrorActionPreference = 'Stop'

if ($IncludeDockerInstaller -and -not $Offline) { throw '-IncludeDockerInstaller 는 -Offline 과 함께 사용하세요.' }

$root = Split-Path -Parent $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $root 'dist' }
$OutDir = [IO.Path]::GetFullPath($OutDir)
$name   = "HyMS_eins_$Version" + $(if ($Offline) { '_offline' } else { '' })
$stage  = Join-Path $OutDir $name
$cache  = Join-Path $OutDir '_download_cache'

# setup.ps1 과 같은 값이어야 한다.
$dockerImages = @('nginx:1.27', 'node:20-alpine', 'mariadb:11.4')
$downloads = @(
    @{ File = 'python-3.10.11-amd64.exe'; Url = 'https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe' },
    @{ File = 'vc_redist.x64.exe';        Url = 'https://aka.ms/vs/17/release/vc_redist.x64.exe' }
)

function Write-Step([string]$msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }

# 네이티브 명령 실행. PS 5.1 의 stderr -> NativeCommandError 문제를 피하려고 Continue 로 감싼다.
function Invoke-Native([string]$exe, [string[]]$arguments) {
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $exe @arguments 2>&1 | ForEach-Object { Write-Host "    $_" }
        return $LASTEXITCODE
    }
    finally { $ErrorActionPreference = $old }
}

Write-Host "=== HyMS_eins 배포 패키지 생성 ===" -ForegroundColor Cyan
Write-Host "  원본 : $root"
Write-Host "  출력 : $stage"
Write-Host ("  종류 : " + $(if ($Offline) { '오프라인 (prereq 포함)' } else { '온라인 (설치 시 인터넷에서 수신)' }))

# --- 1) 원본 점검 -----------------------------------------------------------
Write-Step '1) 원본 점검'

$required = @(
    'setup.bat', 'start.bat', 'stop.bat', 'status.bat', 'README.txt',
    'LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.txt', 'sim_engine\projects\route_sim\DATA_LICENSE.txt',
    'deploy\setup.ps1', 'deploy\common.ps1', 'deploy\01_windows_prepare.ps1', 'deploy\02_start_all.ps1',
    'deploy\03_health_check.ps1', 'deploy\99_stop_all.ps1',
    'docker_setup\docker-compose.yaml', 'docker_setup\.env.example',
    'docker_setup\initdb\01_model_designer.sql',
    'web_conf\default.conf', 'web_conf\api_locations.conf', 'web_root\index.html',
    'app_root\index.js', 'app_root\node_modules\express\package.json',
    'sim_engine\fDTSimServer.exe', 'sim_engine\atomic_model_manager.exe', 'sim_engine\poc_manager.exe',
    'sim_engine\model_cap_python.exe', 'sim_engine\model_cap_dll.exe', 'sim_engine\python310.dll',
    'sim_engine\poc_manager.json', 'sim_engine\requirements.txt'
)
$missing = $required | Where-Object { -not (Test-Path (Join-Path $root $_)) }
if ($missing) { throw ("원본에 필요한 파일이 없습니다:`n  " + ($missing -join "`n  ")) }
Write-Ok '필수 파일'

# poc_manager 포트와 nginx upstream 이 어긋나면 /api/... 가 502/404 가 된다 (2026-10 실제 발생).
$pocPort = [regex]::Match((Get-Content (Join-Path $root 'sim_engine\poc_manager.json') -Raw), '"port"\s*:\s*(\d+)').Groups[1].Value
$conf    = Get-Content (Join-Path $root 'web_conf\default.conf') -Raw
$ngxPoc  = [regex]::Match($conf, 'upstream\s+poc_rest\s*\{\s*server\s+[^:;]+:(\d+)').Groups[1].Value
if ($pocPort -ne $ngxPoc) {
    throw "포트 불일치 : poc_manager.json port=$pocPort, default.conf upstream poc_rest=$ngxPoc"
}
Write-Ok "poc_manager 포트 일치 ($pocPort)"

if ((Get-Content (Join-Path $root 'NOTICE') -Raw) -match '<COPYRIGHT HOLDER>') {
    Write-Host '  [WARN] NOTICE 의 <COPYRIGHT HOLDER> 를 저작권자(기관명)로 바꾸세요.' -ForegroundColor Yellow
}

$composeText = Get-Content (Join-Path $root 'docker_setup\docker-compose.yaml') -Raw
foreach ($img in $dockerImages) {
    if ($composeText -notmatch ('image:\s*' + [regex]::Escape($img) + '\s')) {
        throw "docker-compose.yaml 에 image: $img 가 없습니다. build_package.ps1 / setup.ps1 의 이미지 목록을 맞추세요."
    }
}
Write-Ok ('compose 이미지 일치 : ' + ($dockerImages -join ', '))

# --- 2) 파일 복사 -----------------------------------------------------------
Write-Step '2) 파일 복사'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$excludeDirs = @(
    (Join-Path $root 'db'), (Join-Path $root 'dist'), (Join-Path $root 'logs'), (Join-Path $root 'prereq'),
    (Join-Path $root 'deploy\새 폴더'), $OutDir,
    '__pycache__', '.vs', '.git', '.claude', 'db_backup_*'
)
$excludeFiles = @(
    '.env', 'server.crt', 'server.key', '*.bak_*', '*.pyc', '*.pdb', '*.log', 'images_backup_*.tar',
    '10_서버_설치_및_기동.ps1', '01b_restapi_portproxy_fallback.ps1',
    'common_x64d.dll', 'cpprest_2_10d.dll', '.gitignore'
)
$rcArgs = @($root, $stage, '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NP', '/XD') + $excludeDirs + @('/XF') + $excludeFiles
& robocopy @rcArgs | Where-Object { $_ -match '\S' } | ForEach-Object { Write-Host "    $_" }
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 (종료 코드 $LASTEXITCODE)" }

# 빈 폴더 보장 : db\ 는 MariaDB 바인드 마운트 대상, certs\ 는 인증서 자동 생성 위치
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'db') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'web_conf\certs') | Out-Null

# 비밀 정보가 섞여 들어가지 않았는지 마지막으로 확인
$leak = Get-ChildItem $stage -Recurse -Force -File -Include '.env', 'server.key', 'server.crt' -ErrorAction SilentlyContinue
if ($leak) { throw ("패키지에 비밀 파일이 포함되었습니다:`n  " + (($leak | ForEach-Object FullName) -join "`n  ")) }
Write-Ok '복사 완료 (db, .env, 인증서, 개발 부산물 제외)'

# 디버그 빌드 확인 : 디버그 VC++ 런타임은 Microsoft 가 재배포를 허용하지 않고, 대상 서버에서 실행되지도 않는다.
# 가져오기(import) 테이블의 DLL 이름은 ASCII 로 들어 있으므로 문자열 검색으로 충분하다.
$debugCrt = '(?i)(ucrtbased|vcruntime140d|vcruntime140_1d|msvcp140d|concrt140d|common_x64d|cpprest_2_10d)\.dll'
$debugBins = Get-ChildItem $stage -Recurse -File -Include '*.dll', '*.exe' | Where-Object {
    [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($_.FullName)) -match $debugCrt
}
if ($debugBins) {
    $list = ($debugBins | ForEach-Object { $_.FullName.Substring($stage.Length + 1) }) -join "`n  "
    if ($AllowDebugBinaries) {
        Write-Host "  [WARN] 디버그 빌드 바이너리 $($debugBins.Count) 개 (외부 배포 금지):`n  $list" -ForegroundColor Yellow
    }
    else {
        throw "디버그 빌드 바이너리가 있습니다. Release x64 로 다시 빌드하세요 (사내 시험용은 -AllowDebugBinaries):`n  $list"
    }
}
else { Write-Ok '디버그 빌드 바이너리 없음' }

# --- 3) 오프라인 구성요소 ---------------------------------------------------
if ($Offline) {
    Write-Step '3) 오프라인 구성요소 (prereq\)'
    $pre = Join-Path $stage 'prereq'
    New-Item -ItemType Directory -Force -Path $pre, $cache | Out-Null

    # 3-1) 설치 파일 (다운로드 캐시 재사용)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    foreach ($d in $downloads) {
        $cached = Join-Path $cache $d.File
        if (-not (Test-Path $cached)) {
            Write-Host "    다운로드 : $($d.Url)"
            Invoke-WebRequest -Uri $d.Url -OutFile "$cached.part" -UseBasicParsing
            Move-Item "$cached.part" $cached -Force
        }
        Copy-Item $cached (Join-Path $pre $d.File)
        Write-Ok $d.File
    }

    # 3-2) Python wheel : 대상 서버(Python 3.10 / win_amd64) 기준으로 받는다.
    $pyCmd = $null
    if (Get-Command py -ErrorAction SilentlyContinue) {
        if ((Invoke-Native 'py' @('-3.10', '--version')) -eq 0) { $pyCmd = @('py', '-3.10') }
    }
    if (-not $pyCmd) {
        if (Get-Command python -ErrorAction SilentlyContinue) { $pyCmd = @('python') }
        else { throw 'pip download 에 쓸 Python 을 찾을 수 없습니다 (py -3.10 권장).' }
    }
    $wheelDir = Join-Path $pre 'wheels'
    $pipArgs = @()
    if ($pyCmd.Count -gt 1) { $pipArgs += $pyCmd[1..($pyCmd.Count - 1)] }
    $pipArgs += @('-m', 'pip', 'download', '--disable-pip-version-check',
                  '-r', (Join-Path $root 'sim_engine\requirements.txt'), '-d', $wheelDir,
                  '--only-binary=:all:', '--platform', 'win_amd64',
                  '--python-version', '3.10', '--implementation', 'cp', '--abi', 'cp310')
    Write-Host "    pip download (cp310 / win_amd64)..."
    $code = Invoke-Native $pyCmd[0] $pipArgs
    if ($code -ne 0) { throw "pip download 실패 (종료 코드 $code)" }
    Write-Ok ("wheels : " + ((Get-ChildItem $wheelDir -Filter *.whl).Count) + " 개")

    # 3-3) Docker 이미지
    foreach ($img in $dockerImages) {
        $code = Invoke-Native 'docker' @('image', 'inspect', '--format', '{{.Id}}', $img)
        if ($code -ne 0) {
            Write-Host "    docker pull $img"
            $code = Invoke-Native 'docker' @('pull', $img)
            if ($code -ne 0) { throw "docker pull $img 실패" }
        }
    }
    $tar = Join-Path $pre 'docker_images.tar'
    Write-Host "    docker save -> $tar (수 분 소요)"
    $code = Invoke-Native 'docker' (@('save', '-o', $tar) + $dockerImages)
    if ($code -ne 0) {
        # containerd 이미지 저장소는 멀티 플랫폼 이미지 저장 시 플랫폼 지정이 필요할 수 있다.
        $code = Invoke-Native 'docker' (@('save', '--platform', 'linux/amd64', '-o', $tar) + $dockerImages)
        if ($code -ne 0) { throw "docker save 실패 (종료 코드 $code)" }
    }
    Write-Ok ("docker_images.tar ({0:N0} MB)" -f ((Get-Item $tar).Length / 1MB))

    # 3-4) Docker Desktop / WSL 설치 파일 (선택)
    if ($IncludeDockerInstaller) {
        $dd = Join-Path $cache 'Docker Desktop Installer.exe'
        if (-not (Test-Path $dd)) {
            Write-Host "    다운로드 : Docker Desktop Installer.exe (약 600MB)"
            Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' `
                -OutFile "$dd.part" -UseBasicParsing
            Move-Item "$dd.part" $dd -Force
        }
        Copy-Item $dd (Join-Path $pre 'Docker Desktop Installer.exe')
        Write-Ok 'Docker Desktop Installer.exe'

        # WSL 최신 릴리스 msi (setup 이 prereq\wsl*.msi 를 찾아 무인 설치한다)
        $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/microsoft/WSL/releases/latest' `
                   -Headers @{ 'User-Agent' = 'hyms-build-package' } -UseBasicParsing
        $asset = $rel.assets | Where-Object { $_.name -match '^wsl\..*x64\.msi$' } | Select-Object -First 1
        if (-not $asset) { throw "WSL 릴리스($($rel.tag_name))에서 x64 msi 를 찾지 못했습니다." }
        $wslCached = Join-Path $cache $asset.name
        if (-not (Test-Path $wslCached)) {
            Write-Host "    다운로드 : $($asset.name)"
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "$wslCached.part" -UseBasicParsing
            Move-Item "$wslCached.part" $wslCached -Force
        }
        Copy-Item $wslCached (Join-Path $pre $asset.name)
        Write-Ok $asset.name
    }
}
else {
    Write-Step '3) 오프라인 구성요소 : 생략 (-Offline 로 포함 가능)'
}

# --- 4) 버전 정보 -----------------------------------------------------------
Write-Step '4) 버전 정보'
$exeInfo = Get-ChildItem (Join-Path $stage 'sim_engine') -Filter *.exe | Sort-Object Name |
           ForEach-Object { "  {0,-28} {1:yyyy-MM-dd HH:mm}" -f $_.Name, $_.LastWriteTime }
$verText = @(
    "HyMS_eins $Version$(if ($Offline) { ' (offline)' })",
    "build    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') on $env:COMPUTERNAME",
    "ports    : web 80/443, poc_manager 8082, fDTSimServer REST 8084, WS 8869/8870",
    "images   : $($dockerImages -join ', ')",
    "python   : 3.10 x64 + sim_engine\requirements.txt",
    "",
    "sim_engine binaries"
) + $exeInfo
[IO.File]::WriteAllLines((Join-Path $stage 'VERSION.txt'), $verText, (New-Object Text.UTF8Encoding $true))
$verText | ForEach-Object { Write-Host "    $_" }

# --- 5) 압축 ----------------------------------------------------------------
if ($NoZip) {
    Write-Step '5) 압축 : -NoZip 지정으로 생략'
}
else {
    Write-Step '5) 압축'
    Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
    $zip = "$stage.zip"
    if (Test-Path $zip) { Remove-Item $zip -Force }
    # ZipFile.CreateFromDirectory 는 Windows PowerShell(.NET Framework)에서 항목 경로를
    # '\' 로 기록해 일부 압축 도구에서 폴더 구조가 깨진다. 항목을 직접 '/' 경로로 쓴다.
    # 최상위 폴더(HyMS_eins_<버전>)를 포함하고, 빈 폴더(db\ 등)도 항목으로 남긴다.
    $base = Split-Path $stage -Leaf
    $fs = [IO.File]::Open($zip, [IO.FileMode]::CreateNew)
    $archive = New-Object IO.Compression.ZipArchive($fs, [IO.Compression.ZipArchiveMode]::Create, $false, [Text.Encoding]::UTF8)
    try {
        foreach ($item in Get-ChildItem $stage -Recurse -Force) {
            $rel = $base + '/' + $item.FullName.Substring($stage.Length + 1).Replace('\', '/')
            if ($item.PSIsContainer) {
                if (-not (Get-ChildItem $item.FullName -Force | Select-Object -First 1)) { [void]$archive.CreateEntry("$rel/") }
            }
            else {
                [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $item.FullName, $rel, [IO.Compression.CompressionLevel]::Optimal)
            }
        }
    }
    finally {
        $archive.Dispose()
        $fs.Dispose()
    }
    $hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    Set-Content -Path "$zip.sha256" -Value "$hash  $(Split-Path $zip -Leaf)" -Encoding ASCII
    Write-Ok ("{0} ({1:N1} MB)" -f $zip, ((Get-Item $zip).Length / 1MB))
    Write-Ok "SHA256 $hash"
}

$size = (Get-ChildItem $stage -Recurse -File | Measure-Object Length -Sum).Sum
Write-Host ("`n=== 완료 : {0} ({1:N1} MB, 압축 전) ===" -f $stage, ($size / 1MB)) -ForegroundColor Green
Write-Host "  배포 : zip 을 서버의 영문 경로(예: C:\HyMS_eins)에 풀고 setup.bat 실행"
