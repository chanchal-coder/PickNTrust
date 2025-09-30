# 🤖 Create New Telegram Bot Token - Fix 409 Conflict

## Problem
The current bot token `8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE` is experiencing persistent 409 conflicts that cannot be resolved by killing processes or clearing webhooks.

## Solution: Create New Bot Token

### Step 1: Create New Bot with BotFather
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "PickNTrust Master Bot v2")
4. Choose a username (e.g., "pickntrust_master_v2_bot")
5. Copy the new bot token

### Step 2: Update Environment Variables
Replace the current token in `.env` file:

```bash
# OLD TOKEN (causing conflicts)
# MASTER_BOT_TOKEN=8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE

# NEW TOKEN (replace with your new token)
MASTER_BOT_TOKEN=YOUR_NEW_BOT_TOKEN_HERE
```

### Step 3: Add Bot to Channels
The new bot needs to be added to all channels:

1. **Prime Picks Channel** (@pntamazon)
   - Add bot as admin with message posting permissions
   
2. **Cue Links Channel** (@pickntrustcue)
   - Add bot as admin with message posting permissions
   
3. **Value Picks Channel** (@pntearnkaro)
   - Add bot as admin with message posting permissions
   
4. **Click Picks Channel** (@pntclickpicks)
   - Add bot as admin with message posting permissions
   
5. **Global Picks Channel** (@pntglobalpicks)
   - Add bot as admin with message posting permissions
   
6. **Deals Hub Channel** (@pntdealshub)
   - Add bot as admin with message posting permissions
   
7. **Loot Box Channel** (@DeodapPNT)
   - Add bot as admin with message posting permissions

### Step 4: Test the New Bot
After updating the token and adding to channels:

```bash
# Test the new bot
node start-bot-manually.cjs

# Send a test message
node send-test-message.cjs
```

## Why This Fixes the Issue

- **Fresh Token**: No existing connections or conflicts
- **Clean State**: Telegram servers have no memory of this token
- **Immediate Resolution**: Should work without any polling conflicts

## Alternative: Revoke Current Token
If you prefer to keep the same bot:
1. Go to @BotFather
2. Send `/mybots`
3. Select your current bot
4. Choose "API Token"
5. Select "Revoke current token"
6. Get the new token and update `.env`

This will invalidate all existing connections and resolve the conflict.