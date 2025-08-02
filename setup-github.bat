@echo off
echo =======================================
echo SIGMA HQ - GitHub Repository Setup
echo =======================================
echo.

echo Checking if Git is installed...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo [OK] Git is installed!
echo.

echo Initializing Git repository...
git init
if errorlevel 1 (
    echo [ERROR] Failed to initialize Git repository
    pause
    exit /b 1
)

echo [OK] Git repository initialized!
echo.

echo Adding all files to Git...
git add .
if errorlevel 1 (
    echo [ERROR] Failed to add files to Git
    pause
    exit /b 1
)

echo [OK] Files added to Git!
echo.

echo Making initial commit...
git commit -m "Initial commit: Vite + React + Firebase project setup"
if errorlevel 1 (
    echo [ERROR] Failed to make initial commit
    pause
    exit /b 1
)

echo [OK] Initial commit created!
echo.

echo =======================================
echo NEXT STEPS:
echo =======================================
echo 1. Go to https://github.com and create a new repository named 'sigma-hq'
echo 2. DO NOT initialize with README, .gitignore, or license
echo 3. Copy the repository URL (e.g., https://github.com/USERNAME/sigma-hq.git)
echo 4. Run these commands:
echo.
echo    git remote add origin YOUR_REPO_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 5. Set up GitHub Secrets (see GITHUB_SETUP.md for details)
echo =======================================
echo.
pause
