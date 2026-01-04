@echo off
echo [INFO] Searching for process causing port 8000 conflict...

:: Find PID of process listening on port 8000 and kill it
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo [INFO] Killing process %%a...
    taskkill /f /pid %%a
)

echo.
echo [INFO] Starting Python HTTP Server...
echo [INFO] Opening Browser...
start http://localhost:8000

:: Start Server
python -m http.server 8000
pause
