#!/bin/bash
# Bot Restart Script - Fix Polling Conflicts
# Run this script to restart bots without conflicts

echo "🔄 Restarting PickNTrust Bot System..."
echo "======================================"

# Kill any existing Node.js processes
echo "🛑 Stopping existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true
sleep 2

# Clear any webhook conflicts
echo "🧹 Clearing webhook conflicts..."
node fix-bot-polling-conflicts.cjs

# Wait a moment
sleep 3

# Start the server
echo "🚀 Starting server..."
npm run dev

echo "✅ Bot system restarted!"
echo "📱 Test posting URLs in Telegram channels"
