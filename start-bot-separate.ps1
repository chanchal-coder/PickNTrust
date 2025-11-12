<#
  Start the Telegram bot as a separate process on Windows using PM2.
  - Keeps the web server untouched
  - Reads/writes the existing database.sqlite
  - Requires MASTER_BOT_TOKEN and optional channel IDs in .env or environment

  Usage:
    - Run in project root: ./start-bot-separate.ps1
    - Stop: pm2 stop pickntrust-bot
    - Status: pm2 status
#>

param()

Write-Host "🚀 Starting PickNTrust bot as separate process (Windows)" -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

function Ensure-Command($cmd, $install) {
  try {
    $null = & $cmd --version
    return $true
  } catch {
    Write-Host "⚠️  $cmd not found. Installing..." -ForegroundColor Yellow
    & $install
    return $true
  }
}

# Ensure Node.js and PM2
Ensure-Command node { Write-Host "Please install Node.js from https://nodejs.org/"; throw "Node.js required" }
Ensure-Command pm2 { npm install -g pm2 }

# Load .env if present
if (Test-Path ".env") {
  Write-Host "📦 Loading .env" -ForegroundColor DarkCyan
  Get-Content .env | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }
    $parts = $_.Split('=')
    $key = $parts[0].Trim()
    $val = ($parts[1..($parts.Length-1)] -join '=').Trim()
    [System.Environment]::SetEnvironmentVariable($key, $val)
  }
}

# Basic env check
if (-not $env:MASTER_BOT_TOKEN) {
  Write-Host "❌ MASTER_BOT_TOKEN not set. Set it in .env or environment." -ForegroundColor Red
  throw "MASTER_BOT_TOKEN required"
}

Write-Host "✅ Environment OK. Starting bot via PM2..." -ForegroundColor Green

# Start bot
pm2 start start-bot-fixed.cjs --name pickntrust-bot
pm2 save

Write-Host "✅ Bot started. Use 'pm2 status' to verify and 'pm2 logs pickntrust-bot' for logs." -ForegroundColor Green
Write-Host "🛑 Stop with 'pm2 stop pickntrust-bot'" -ForegroundColor Yellow