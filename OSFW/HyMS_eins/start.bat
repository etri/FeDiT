@echo off
rem  HyMS_eins : start Docker containers and simulation engines (administrator).
fltmc >nul 2>&1 && goto :admin
powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" || pause
exit /b
:admin
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\02_start_all.ps1"
echo.
pause
