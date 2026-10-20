@echo off
rem  HyMS_eins : health check (administrator).
fltmc >nul 2>&1 && goto :admin
powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" || pause
exit /b
:admin
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\03_health_check.ps1"
echo.
pause
