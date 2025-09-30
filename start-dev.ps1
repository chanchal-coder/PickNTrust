# PickNTrust Development Server Startup Script
# This script ensures consistent server startup and handles common issues

Write-Host "Starting PickNTrust Development Environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "Environment file found" -ForegroundColor Green
} else {
    Write-Host ".env file not found - some features may not work" -ForegroundColor Yellow
}

# Kill any existing processes on ports 5000 and 5173
Write-Host "Checking for existing processes..." -ForegroundColor Yellow

$processes5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($processes5000) {
    Write-Host "Stopping existing process on port 5000..." -ForegroundColor Yellow
    Stop-Process -Id $processes5000.OwningProcess -Force -ErrorAction SilentlyContinue
}

$processes5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($processes5173) {
    Write-Host "Stopping existing process on port 5173..." -ForegroundColor Yellow
    Stop-Process -Id $processes5173.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Wait a moment for ports to be released
Start-Sleep -Seconds 2

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check client dependencies
if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install client dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend is integrated with backend" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev