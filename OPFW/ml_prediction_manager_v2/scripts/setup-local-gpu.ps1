$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$projectRoot = Split-Path $PSScriptRoot -Parent
$venvPath = Join-Path $projectRoot '.venv'
$pythonPath = Join-Path $venvPath 'Scripts/python.exe'
if (-not (Test-Path $pythonPath)) {
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) { throw 'Virtualenv creation failed' }
}
& $pythonPath -m pip install -r (Join-Path $projectRoot 'requirements-local-gpu.txt')
if ($LASTEXITCODE -ne 0) { throw 'GPU dependencies failed to install' }
# Do not edit system/WSL settings or credentials. Keep the active test profile local.
$profileFile = Join-Path $projectRoot 'scripts/profiles/local-rtx3050.env.example'
Get-Content $profileFile | ForEach-Object {
    if ($_ -match '^([A-Z][A-Z0-9_]*)=(.+)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
Push-Location $projectRoot
try {
    & $pythonPath scripts/gpu-smoke-test.py --require-gpu
    if ($LASTEXITCODE -ne 0) { throw 'GPU smoke test failed' }
} finally { Pop-Location }
