@echo off
echo Starting Kitkuhar Development Environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Copy dev environment file if .env doesn't exist
if not exist .env (
    if exist .env.dev (
        echo Copying .env.dev to .env for development...
        copy .env.dev .env >nul
    ) else (
        echo WARNING: No .env file found. Please create one based on .env.example
        pause
        exit /b 1
    )
)

echo Starting backend services (database + redis + backend)...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

REM Check backend health
:check_backend
echo Checking backend health...
curl -f http://localhost:8000/api/monitoring/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend not ready yet, waiting...
    timeout /t 5 /nobreak >nul
    goto check_backend
)

echo Backend is ready!
echo.

REM Start frontend
echo Starting frontend development server...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo =================================================
echo Development Environment Started Successfully!
echo =================================================
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Backend Docs: http://localhost:8000/docs
echo Database: localhost:5432 (user: kitkuhar_user, db: kitkuhar_dev)
echo Redis: localhost:6379
echo.
echo Press Ctrl+C to stop the frontend server.
echo To stop all services, run: docker-compose -f docker-compose.dev.yml down
echo =================================================
echo.

npm run dev