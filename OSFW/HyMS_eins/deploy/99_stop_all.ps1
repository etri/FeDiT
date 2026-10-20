# =============================================================================
#  99_stop_all.ps1
#  HyMS_eins 전체 종료 (Docker 컨테이너 + 네이티브 엔진 프로세스)
#
#  주의 : MariaDB 컨테이너를 중지합니다. 실행 중인 시뮬레이션이 있으면 중단됩니다.
#  실행 : powershell -ExecutionPolicy Bypass -File .\99_stop_all.ps1
#  옵션 : -Force        확인 질문 없이 진행
#         -EnginesOnly  네이티브 엔진만 종료하고 Docker 컨테이너는 유지
# =============================================================================

param(
    [switch]$Force,
    [switch]$EnginesOnly
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'common.ps1')

Write-Host "=== HyMS_eins 종료 ===" -ForegroundColor Cyan
if (-not $Force) {
    $target = if ($EnginesOnly) { '시뮬레이션 엔진을' } else { 'Docker 컨테이너와 시뮬레이션 엔진을 모두' }
    $ans = Read-Host "$target 중지합니다. 계속할까요? (y/N)"
    if ($ans -ne 'y' -and $ans -ne 'Y') {
        Write-Host "취소했습니다." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`n--- 네이티브 엔진 종료 ---" -ForegroundColor Cyan
foreach ($n in @('poc_manager', 'fDTSimServer', 'atomic_model_manager', 'model_cap_dll', 'model_cap_python', 'model_cap_matlab')) {
    $p = Get-Process -Name $n -ErrorAction SilentlyContinue
    if ($p) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction Stop
            Write-Host ("  중지: {0} (PID {1})" -f $n, ($p.Id -join ',')) -ForegroundColor Green
        }
        catch {
            Write-Host ("  [실패] {0} (PID {1}) : {2}" -f $n, ($p.Id -join ','), $_.Exception.Message) -ForegroundColor Red
            Write-Host "         관리자 권한으로 실행된 엔진은 관리자 권한으로만 종료할 수 있습니다." -ForegroundColor Yellow
        }
    }
}

if ($EnginesOnly) {
    Write-Host "`n=== 완료 (엔진만 종료) ===" -ForegroundColor Green
    exit 0
}

Write-Host "`n--- Docker 컨테이너 종료 ---" -ForegroundColor Cyan
if (Test-DockerReady) {
    [void](Invoke-Compose @('down'))
}
else {
    Write-Host "  Docker 엔진이 실행 중이 아니어서 건너뜁니다." -ForegroundColor Yellow
}

Write-Host "`n=== 완료 ===" -ForegroundColor Green
