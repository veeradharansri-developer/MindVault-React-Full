#!/usr/bin/env bash
# exit on error
set -o errexit

# Build frontend
echo "Building React frontend..."
cd frontend_react
npm install
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend_api/requirements.txt
