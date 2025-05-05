#!/bin/bash

echo "=== Starting IdeaSynergy Build Process for Render ==="

# Install Vite globally first to ensure it's available
echo "Installing Vite globally..."
npm install -g vite

# Install all dependencies
echo "Installing dependencies..."
npm install

# Make sure Vite is installed in the project specifically
echo "Ensuring Vite is installed in the project..."
npm install --save vite

# Run TypeScript compilation
echo "Running TypeScript compilation..."
npx tsc || true

# Build frontend
echo "Building frontend with Vite..."
npx vite build

# Build server
echo "Building server..."
npx tsc -p tsconfig.server.json || true

# Fix module paths for ES modules
echo "Fixing module paths..."
node ./scripts/fix-module-paths.js

echo "=== Build process completed ==="