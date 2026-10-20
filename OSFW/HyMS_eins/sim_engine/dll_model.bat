rem  dll_model.bat - launched by atomic_model_manager (cmd.exe /C dll_model.bat %*)
rem  args: %1=file_path(project dir)  %2=project_name  %3=model_file_name
rem        %4=model_name  %5=model_id  %6=server_ip
rem
rem  Uses %~dp0 (this script's own folder) instead of %CD%. model_cap_dll.exe calls
rem  LoadLibrary() with the bare file name, so the model folder MUST be on PATH.
rem  With %CD% that silently broke whenever atomic_model_manager.exe was started with
rem  a working directory other than sim_engine, and the only symptom was
rem  "Error : Loading DLL File!!".
SET PATH=%PATH%;%~dp0projects\%1;%~dp0
if not exist "%~dp0projects\%1\%3" echo [ERROR] model file not found: %~dp0projects\%1\%3
"%~dp0model_cap_dll.exe" %*
