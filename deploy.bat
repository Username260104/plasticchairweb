@echo off
echo [INFO] Starting deployment sequence...

:: 1. Add all changes
echo [INFO] Adding changes...
git add .

:: 2. Commit changes
set "timestamp=%date% %time%"
echo [INFO] Committing changes (Timestamp: %timestamp%)...
git commit -m "Auto deploy: %timestamp%"

:: 3. Push to GitHub
echo [INFO] Pushing to GitHub...
git push origin main

echo.
if %content% EQU 0 (
    echo [SUCCESS] Deployment completed successfully!
    echo Your changes will be live in a few minutes.
) else (
    echo [ERROR] Something went wrong using git push. Please check the error messages above.
)

pause
