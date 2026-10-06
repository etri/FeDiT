# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
<#
.SYNOPSIS
    예제 JSON 하나를 Windows 실행 파일로 돌리고 성공 여부를 판정한다.

.DESCRIPTION
    1. 입력 JSON에 입자 설정(particle_generation)이 있으면 LBM_DEM, 없으면 LBM 실행 파일을 쓴다.
       -Engine 으로 직접 고를 수도 있다.
    2. release\windows\<엔진>\ 폴더가 없으면 같은 폴더의 .7z 묶음을 Windows 내장 tar로 푼다.
    3. runs\<yyMMdd_HHmmss>_<JSON 이름>\ 작업 폴더를 새로 만들고 JSON과 JSON이 참조하는 STL을 복사한다.
    4. 작업 폴더에서 실행 파일을 돌린다. 화면 출력은 run.log, 오류 출력은 run.err.log 에 남는다.
    5. 판정: 종료 코드 0이고 로그의 마지막 결과 코드 줄이 "RC : 0" 이면 성공이다.
       LBM_DEM은 계산이 발산해도 종료 코드 0으로 끝날 수 있으므로, 로그에 nan/inf가 있으면 실패로 본다.
    6. 판정과 결과 파일 요약을 result.json 에 남기고, 성공이면 종료 코드 0, 실패면 1로 끝난다.

.EXAMPLE
    pwsh -File scripts\run_case.ps1 examples\03_concentration_diffusion\03_concentration_diffusion.json
.EXAMPLE
    pwsh -File scripts\run_case.ps1 examples\05_fluid_dem\05_fluid_dem_short.json -TimeoutMin 10
#>
param(
    [Parameter(Mandatory, Position = 0)][string]$Json,
    [ValidateSet('Auto', 'LBM', 'LBM_DEM')][string]$Engine = 'Auto',
    [int]$TimeoutMin = 120
)

$ErrorActionPreference = 'Stop'
$moduleRoot = Split-Path $PSScriptRoot -Parent
$jsonPath = (Resolve-Path $Json).Path
$jsonText = Get-Content $jsonPath -Raw -Encoding utf8

# 1) 엔진 선택
if ($Engine -eq 'Auto') {
    $Engine = if ($jsonText -match '"particle_generation"') { 'LBM_DEM' } else { 'LBM' }
}
$exeName = @{ LBM = 'LBM_Runtime.exe'; LBM_DEM = 'LBM_DEM_Runtime.exe' }[$Engine]
$releaseDir = Join-Path $moduleRoot 'release\windows'
$exe = Join-Path $releaseDir "$Engine\$exeName"

# 2) 실행 파일 준비
if (-not (Test-Path $exe)) {
    $archive = Join-Path $releaseDir "NFLOW_$($Engine)_windows_x64.7z"
    if (-not (Test-Path $archive)) { throw "실행 파일도 묶음도 없습니다: $archive" }
    Write-Host "묶음을 풉니다: $archive"
    & "$env:SystemRoot\System32\tar.exe" -xf $archive -C $releaseDir
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $exe)) {
        throw "묶음을 풀지 못했습니다. 7-Zip 등으로 $archive 를 $releaseDir 에 직접 풀어 주세요."
    }
}

# 3) 작업 폴더
$name = [IO.Path]::GetFileNameWithoutExtension($jsonPath)
$runDir = Join-Path $moduleRoot ("runs\{0}_{1}" -f (Get-Date -Format 'yyMMdd_HHmmss'), $name)
New-Item -ItemType Directory -Path $runDir | Out-Null
Copy-Item $jsonPath $runDir
$srcDir = Split-Path $jsonPath -Parent
$stls = @([regex]::Matches($jsonText, '"([^"]+\.stl)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($s in $stls) {
    $p = Join-Path $srcDir $s
    if (-not (Test-Path $p)) { throw "JSON이 참조하는 STL이 없습니다: $p" }
    Copy-Item $p $runDir
}

# 4) 실행
Write-Host "실행: $Engine $([IO.Path]::GetFileName($jsonPath))  ->  $runDir"
$log = Join-Path $runDir 'run.log'
$err = Join-Path $runDir 'run.err.log'
$sw = [Diagnostics.Stopwatch]::StartNew()
$p = Start-Process -FilePath $exe -ArgumentList ([IO.Path]::GetFileName($jsonPath)) -WorkingDirectory $runDir `
    -RedirectStandardOutput $log -RedirectStandardError $err -NoNewWindow -PassThru
$timedOut = -not $p.WaitForExit($TimeoutMin * 60 * 1000)
if ($timedOut) { $p.Kill($true); $p.WaitForExit() }
$sw.Stop()
$exitCode = if ($timedOut) { $null } else { $p.ExitCode }

# 5) 판정
$text = ((Get-Content $log, $err -Raw -ErrorAction SilentlyContinue) -join "`n") -replace '\x1b\[[0-9;]*m', ''
$rcLines = [regex]::Matches($text, 'RC : (-?\d+), ([^\r\n]*)')
$lastRc = if ($rcLines.Count) { $rcLines[$rcLines.Count - 1] } else { $null }
$nanLines = @($text -split "`n" | Where-Object { $_ -match '(?i)\b(nan|inf)\b|diverg' })

if ($timedOut) {
    $status = 'failed'; $message = "제한 시간 $TimeoutMin 분을 넘겨 중단했습니다."
}
elseif ($exitCode -eq 0 -and $lastRc -and [int]$lastRc.Groups[1].Value -eq 0) {
    if ($Engine -eq 'LBM_DEM' -and $nanLines.Count) {
        $status = 'failed'; $message = "로그에 nan/inf가 있습니다($($nanLines.Count)줄). 계산이 발산했을 수 있습니다."
    }
    else {
        $status = 'completed'; $message = '해석이 끝났습니다.'
    }
}
elseif ($lastRc) {
    $status = 'failed'; $message = "결과 코드 RC $($lastRc.Groups[1].Value): $($lastRc.Groups[2].Value.Trim())"
}
else {
    $status = 'failed'; $message = "종료 코드 $exitCode, 결과 코드 줄이 없습니다."
}

# 6) 결과 요약
$inputs = @([IO.Path]::GetFileName($jsonPath)) + $stls
$outFiles = @(Get-ChildItem $runDir -Recurse -File | Where-Object {
        $_.DirectoryName -ne $runDir -or ($inputs -notcontains $_.Name -and $_.Name -notin @('run.log', 'run.err.log', 'result.json'))
    })
$result = [ordered]@{
    json          = [IO.Path]::GetFileName($jsonPath)
    engine        = $Engine
    status        = $status
    message       = $message
    exit_code     = $exitCode
    seconds       = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    nan_inf_lines = $nanLines.Count
    output_files  = $outFiles.Count
    output_MB     = [math]::Round(($outFiles | Measure-Object Length -Sum).Sum / 1MB, 1)
    run_dir       = $runDir
}
$result | ConvertTo-Json | Set-Content (Join-Path $runDir 'result.json') -Encoding utf8
$result | ConvertTo-Json
if ($status -ne 'completed') { exit 1 }
