@echo off
echo Stopping Kitkuhar Development Environment...
echo.

REM Stop and remove development containers
echo Stopping all development services...
docker-compose -f docker-compose.dev.yml down

echo.
echo Development environment stopped successfully!
echo.
pause