@echo off
ECHO ==== IdeaSynergy Deployment Script for Windows ====

REM Check if .env file exists, create if not
IF NOT EXIST .env (
  ECHO Creating .env file...
  (
    ECHO # Server configuration
    ECHO PORT=3001
    ECHO.
    ECHO # IBM Cloud API credentials
    ECHO IBM_API_KEY=your_ibm_api_key_here
    ECHO.
    ECHO # Vosk model path (optional, will use default location if not specified)
    ECHO # VOSK_MODEL_PATH=./model
    ECHO.
    ECHO # WebSocket URL for frontend to connect to
    ECHO VITE_WEBSOCKET_URL=ws://localhost:3001/ws
  ) > .env
  ECHO Please edit .env file with your IBM API key before continuing.
  PAUSE
  EXIT /B
)

REM Build the application
ECHO Building application...
CALL npm run build

REM Check for Vosk model
ECHO Checking for Vosk model...
IF NOT EXIST ".\model\final.mdl" (
  ECHO Vosk model not found. Would you like to download it? (Y/N)
  CHOICE /C YN /M "Download model:"
  
  IF ERRORLEVEL 2 GOTO SKIP_MODEL
  IF ERRORLEVEL 1 (
    node --experimental-modules --es-module-specifier-resolution=node -e "import('./dist/server/download-model.js').then(m => m.downloadModel())"
  )
)

:SKIP_MODEL

REM Start the application
ECHO Starting IdeaSynergy...
CALL npm run start