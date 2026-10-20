rem  python_model.bat - launched by atomic_model_manager (cmd.exe /C python_model.bat %*)
rem  args: %1=file_path(project dir)  %2=project_name  %3=model_file_name
rem        %4=model_name  %5=model_id  %6=server_ip
SET PATH=%PATH%;%~dp0projects\%1;%~dp0
if not exist "%~dp0projects\%1\%3" echo [ERROR] model file not found: %~dp0projects\%1\%3
"%~dp0model_cap_python.exe" %*
