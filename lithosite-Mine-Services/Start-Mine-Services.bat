@echo off
setlocal
call "%~dp0desktop-host\start-mine-services.bat"
exit /b %errorlevel%
