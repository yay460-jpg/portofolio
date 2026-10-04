@echo off
setlocal
set "MODULE_ROOT=%~dp0.."
set "MINE_SERVICES_DB=%MODULE_ROOT%\Database\Mine-Services-Database-A3.xlsx"
set "MINE_SERVICES_URL=http://127.0.0.1:8765/"
set "MINE_SERVICES_ENTRY=/lithosite-Mine-Services/Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v35-STAGE24.html"

cd /d "%MODULE_ROOT%"

if not exist "%MINE_SERVICES_DB%" (
  echo.
  echo ERROR: Offline database not found:
  echo %MINE_SERVICES_DB%
  echo.
  pause
  exit /b 2
)

curl.exe --silent --fail "%MINE_SERVICES_URL%health" >nul 2>&1
if not errorlevel 1 (
  start "" "%MINE_SERVICES_URL%"
  exit /b 0
)

echo Starting Lithosite Mine Services Desktop Host...
start "Lithosite Mine Services Host" /D "%MODULE_ROOT%" python desktop-host\server.py

set /a ATTEMPTS=0
:wait_for_host
set /a ATTEMPTS+=1
timeout /t 1 /nobreak >nul
curl.exe --silent --fail "%MINE_SERVICES_URL%health" >nul 2>&1
if not errorlevel 1 goto open_ui
if %ATTEMPTS% GEQ 30 (
  echo.
  echo ERROR: Mine Services Desktop Host did not become ready.
  echo Check the "Lithosite Mine Services Host" window for the error.
  pause
  exit /b 1
)
goto wait_for_host

:open_ui
start "" "%MINE_SERVICES_URL%"
exit /b 0
