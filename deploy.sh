#!/bin/bash

# IdeaSynergy Deployment Script
echo "====================================================="
echo "          IdeaSynergy Deployment Script              "
echo "====================================================="

# Set default environment
ENVIRONMENT=${1:-production}

# Check for dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "NPM is required but not installed. Aborting."; exit 1; }

# Check if .env file exists, create if not
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Server configuration
PORT=3001

# IBM Cloud API credentials
IBM_API_KEY=your_ibm_api_key_here

# WebSocket URL for frontend to connect to
VITE_WEBSOCKET_URL=ws://localhost:3001/ws

# Notion API Key (for future integration)
# NOTION_API_KEY=your_notion_api_key_here
# NOTION_DATABASE_ID=your_notion_database_id_here
EOF
  echo -e "\n\033[33mWarning: Please edit .env file with your IBM API key before continuing.\033[0m"
  read -p "Would you like to continue with deployment anyway? (y/n): " continue_deployment
  if [ "$continue_deployment" != "y" ]; then
    echo "Deployment aborted. Please update your .env file and run this script again."
    exit 1
  fi
fi

# Install dependencies
echo -e "\n\033[36mInstalling dependencies...\033[0m"
npm install

# Run TypeScript checks
echo -e "\n\033[36mRunning TypeScript checks...\033[0m"
npm run tsc || {
  echo -e "\033[31mTypeScript check failed.\033[0m"
  read -p "Would you like to continue with deployment anyway? (y/n): " continue_deployment
  if [ "$continue_deployment" != "y" ]; then
    echo "Deployment aborted due to TypeScript errors."
    exit 1
  fi
}

# Build the application with the safe method to avoid module errors
echo -e "\n\033[36mBuilding application...\033[0m"
npm run build:safe || {
  echo -e "\033[31mBuild failed.\033[0m"
  exit 1
}

# Ensure server JavaScript modules have proper file extension references
echo -e "\n\033[36mVerifying server module configuration...\033[0m"
if [ -f "dist/server/index.js" ]; then
  sed -i 's/from ".\/ai";/from ".\/ai.js";/g' dist/server/index.js
  sed -i 's/from ".\/transcription";/from ".\/transcription.js";/g' dist/server/index.js
  echo "Module paths updated for ES module compatibility."
fi

# Create a package.json file in the dist/server directory to specify module type
if [ ! -f "dist/server/package.json" ]; then
  echo -e "\n\033[36mCreating module configuration for server...\033[0m"
  cat > dist/server/package.json << EOF
{
  "name": "ideasynergy-server",
  "type": "module",
  "private": true
}
EOF
fi

# Check if we're in production mode
if [ "$ENVIRONMENT" == "production" ]; then
  echo -e "\n\033[36mPreparing for production deployment...\033[0m"
  # Check for Docker
  if command -v docker >/dev/null 2>&1; then
    read -p "Would you like to build and run as a Docker container? (y/n): " use_docker
    if [ "$use_docker" = "y" ]; then
      echo -e "\n\033[36mBuilding Docker image...\033[0m"
      docker build -t ideasynergy:latest .
      
      echo -e "\n\033[36mStarting Docker container...\033[0m"
      docker run -p 3001:3001 --env-file .env ideasynergy:latest
      exit 0
    fi
  fi
fi

# Start the application
echo -e "\n\033[36mStarting IdeaSynergy...\033[0m"
if [ "$ENVIRONMENT" == "development" ]; then
  echo "Starting in development mode..."
  npm run dev:server
else
  echo "Starting in production mode..."
  npm run server
fi