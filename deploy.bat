@echo off
echo =============================================
echo           IdeaSynergy Deployment Script
echo =============================================

:: Set default environment to production
set ENVIRONMENT=production

:: Parse command line arguments
if "%1"=="development" set ENVIRONMENT=development

:: Check if .env file exists, create if not
if not exist .env (
  echo Creating .env file...
  echo # Server configuration > .env
  echo PORT=3001 >> .env
  echo # IBM Cloud API credentials >> .env
  echo IBM_API_KEY=your_ibm_api_key_here >> .env
  echo # WebSocket URL for frontend to connect to >> .env
  echo VITE_WEBSOCKET_URL=ws://localhost:3001/ws >> .env
  echo # Notion API Key (for future integration) >> .env
  echo # NOTION_API_KEY=your_notion_api_key_here >> .env
  echo # NOTION_DATABASE_ID=your_notion_database_id_here >> .env
  
  echo WARNING: Please edit .env file with your IBM API key before continuing.
  set /p continue_deployment=Would you like to continue with deployment anyway? (y/n): 
  if not "%continue_deployment%"=="y" (
    echo Deployment aborted. Please update your .env file and run this script again.
    exit /b 1
  )
)

:: Install dependencies
echo.
echo Installing dependencies...
call npm install

:: Run TypeScript checks
echo.
echo Running TypeScript checks...
call npm run tsc
if %ERRORLEVEL% neq 0 (
  echo TypeScript check failed.
  set /p continue_deployment=Would you like to continue with deployment anyway? (y/n): 
  if not "%continue_deployment%"=="y" (
    echo Deployment aborted due to TypeScript errors.
    exit /b 1
  )
)

:: Build the application with the safe method to avoid module errors
echo.
echo Building application...
call npm run build:safe
if %ERRORLEVEL% neq 0 (
  echo Build failed.
  exit /b 1
)

:: Start the application
echo.
echo Starting IdeaSynergy...
if "%ENVIRONMENT%"=="development" (
  echo Starting in development mode...
  call npm run dev:server
) else (
  echo Starting in production mode...
  call npm run server
)