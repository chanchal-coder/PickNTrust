# PickNTrust Development Server - Separate Frontend/Backend
# This script runs frontend on port 5173 and backend on port 5000

Write-Host "🚀 Starting PickNTrust with Separate Frontend/Backend..." -ForegroundColor Green

# Function to start backend
function Start-Backend {
    Write-Host "🔧 Starting Backend Server (Port 5000)..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WindowStyle Normal
}

# Kill existing processes
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow

$processes5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($processes5000) {
    Stop-Process -Id $processes5000.OwningProcess -Force -ErrorAction SilentlyContinue
}

$processes5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($processes5173) {
    Stop-Process -Id $processes5173.OwningProcess -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

# Start both servers
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host "📍 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Close the PowerShell windows to stop servers" -ForegroundColor Yellow