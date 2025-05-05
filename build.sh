#!/bin/bash

echo "=== Starting IdeaSynergy Build Process for Render ==="

# Install all dependencies
echo "Installing dependencies..."
npm install

# Run TypeScript compilation
echo "Running TypeScript compilation..."
npx tsc || true

# Build frontend
echo "Building frontend..."
npx vite build

# Build server
echo "Building server..."
npx tsc -p tsconfig.server.json || true

# Fix module paths for ES modules
echo "Fixing module paths..."
node ./scripts/fix-module-paths.js

echo "=== Build process completed ==="