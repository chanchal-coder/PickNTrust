
#!/bin/bash

# Telegram Bot Conflict Prevention Startup Script

echo "Launch Starting PickNTrust with Telegram bot conflict prevention..."

# Kill any existing bot processes
echo "Refresh Cleaning up existing bot processes..."
pkill -f "node.*telegram" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Wait for cleanup
sleep 3

# Clear any bot locks
echo "Cleanup Clearing bot locks..."
rm -f /tmp/telegram_bot_*.lock 2>/dev/null || true

# Start the application
echo "Success Starting application..."
npm run dev
