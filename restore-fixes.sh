#!/bin/bash
# PERMANENT FIXES RESTORATION SCRIPT
# Run this if fixes get lost again

echo "🔧 Restoring all permanent fixes..."

# Copy fixed files from backup
cp PERMANENT-FIXES-BACKUP/prime-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/cue-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/travel-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/dealshub-bot.ts server/
cp PERMANENT-FIXES-BACKUP/loot-box-bot.ts server/
cp PERMANENT-FIXES-BACKUP/enhanced-telegram-manager.ts server/

echo "✅ All fixes restored from backup"
echo "🔄 Please restart the server: npm run dev"
