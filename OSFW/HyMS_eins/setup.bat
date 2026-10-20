@echo off
rem ==========================================================================
rem  HyMS_eins one-click setup  (see README.txt)
rem
rem  Installs VC++ runtime, Python 3.10 + packages, WSL 2 + Docker Desktop,
rem  Docker images, URL ACL / Windows firewall rules, logon auto-start,
rem  then starts all services and runs a health check.
rem  Administrator rights are requested automatically (UAC). If a reboot is
rem  needed, setup resumes automatically after you log on again.
rem
rem  Options are passed through to deploy\setup.ps1, e.g.
rem    setup.bat -ServerHost sim.example.com
rem    setup.bat -Unattended -AcceptDockerLicense -ServerHost 10.0.0.5
rem    setup.bat -NoAutoStart
rem ==========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\setup.ps1" %*
