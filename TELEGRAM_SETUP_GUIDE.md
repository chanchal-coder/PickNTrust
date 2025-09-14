# 🤖 Telegram Integration Setup Guide - Prime Picks

## 📋 Overview

This guide will help you set up Telegram integration for your Prime Picks page with Amazon Associates affiliate links.

## 🚀 Step 1: Create Telegram Bot

### 1.1 Create Bot with BotFather
1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Choose a name: `PickNTrust Prime Picks Bot`
4. Choose a username: `pickntrust_prime_bot` (must end with 'bot')
5. **Save the bot token** - you'll need this!

### 1.2 Get Your Bot Token
After creating the bot, BotFather will give you a token like:
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## 🎯 Step 2: Create Prime Picks Channel

### 2.1 Create Channel (Public or Private)
1. In Telegram, create a new channel
2. Name it: `Prime Picks Deals` (or your preferred name)
3. **Choose channel type:**
   - **🌐 Public Channel:** Set username like `your_prime_picks`
   - **🔒 Private Channel:** No username needed (more secure)

### 2.2 Get Channel ID
**For Private Channels (Recommended for Security):**
1. Add your bot to the channel as admin
2. Send a test message in the channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for your channel ID (negative number like `-1001234567890`)
5. Copy this ID for configuration

**For Public Channels:**
- Use the username format: `@your_channel_username`

### 2.3 Add Bot as Admin
1. Go to your channel settings
2. Click "Administrators"
3. Click "Add Administrator"
4. Search for your bot username
5. Give it **"Post Messages"** permission

## ⚙️ Step 3: Configure Environment

### 3.1 Edit .env.telegram File
Open the `.env.telegram` file and update these values:

**For Private Channel (Recommended):**
```env
# Telegram Bot Token (from BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Prime Picks Channel Configuration (Private Channel)
PRIME_PICKS_CHANNEL_ID=-1001234567890
PRIME_PICKS_CHANNEL_USERNAME=your_prime_picks
PRIME_PICKS_CHANNEL_PRIVATE=true

# Amazon Associates Configuration
AMAZON_ASSOCIATE_TAG=your-amazon-tag-20
AMAZON_COOKIE_LIFE_HOURS=24

# Admin Chat ID (for notifications)
ADMIN_CHAT_ID=your_telegram_user_id

# Environment & Safety
TELEGRAM_ENV=production
TELEGRAM_SAFE_MODE=true
TELEGRAM_MAX_RETRIES=3
```

**For Public Channel:**
```env
# Telegram Bot Token (from BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Prime Picks Channel Configuration (Public Channel)
PRIME_PICKS_CHANNEL_ID=@your_prime_picks
PRIME_PICKS_CHANNEL_USERNAME=your_prime_picks
PRIME_PICKS_CHANNEL_PRIVATE=false

# Amazon Associates Configuration
AMAZON_ASSOCIATE_TAG=your-amazon-tag-20
AMAZON_COOKIE_LIFE_HOURS=24

# Admin Chat ID (for notifications)
ADMIN_CHAT_ID=your_telegram_user_id

# Environment & Safety
TELEGRAM_ENV=production
TELEGRAM_SAFE_MODE=true
TELEGRAM_MAX_RETRIES=3
```

### 3.2 Get Your Admin Chat ID (Optional)
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for your user ID in the response
4. Add it to `ADMIN_CHAT_ID`

## 🔗 Step 4: Amazon Associates Setup

### 4.1 Get Your Associate Tag
1. Log into Amazon Associates
2. Go to "Account Settings"
3. Find your "Associate ID" (e.g., `yourname-20`)
4. Add it to `AMAZON_ASSOCIATE_TAG`

## 🧪 Step 5: Test the Integration

### 5.1 Start Your Server
```bash
npm run dev
```

### 5.2 Test Bot Connection
1. Send `/start` to your bot in a private message
2. You should get a response confirming the bot is running

### 5.3 Test Channel Integration
Post this test message in your Prime Picks channel:

```
🔥 Test Product - Apple AirPods Pro
💰 Price: $199.99
✨ Amazing sound quality!
📦 Free shipping
https://amazon.com/dp/B0BDHWDR12
#electronics #featured
```

### 5.4 Check Results
1. Check your website's Prime Picks page
2. The product should appear automatically
3. The Amazon link should have your affiliate tag
4. Check server logs for confirmation

## 📱 Step 6: Usage Instructions

### 6.1 Post Format
For best results, format your channel posts like this:

```
🔥 [Product Name]
💰 Price: $XX.XX (Was $YY.YY)
✨ [Key features/benefits]
📦 [Shipping info]
[Amazon URL]
#category #featured (optional)
```

### 6.2 Supported Features
- **Price extraction**: Supports $, ₹, € currencies
- **Discount calculation**: Automatically calculates from "Was $XX" format
- **Category detection**: Based on keywords in description
- **Featured products**: Use `#featured` hashtag
- **Auto-expiry**: Products expire after 24 hours (configurable)

### 6.3 Example Posts

**Electronics:**
```
🔥 Sony WH-1000XM4 Headphones
💰 Price: $279.99 (Was $349.99)
✨ Industry-leading noise cancellation
📱 30-hour battery life
📦 Free Prime delivery
https://amazon.com/dp/B0863TXGM3
#electronics #featured
```

**Fashion:**
```
🛍️ Nike Air Max 270 Sneakers
💰 Price: $89.99 (Was $150.00)
✨ Comfortable all-day wear
👟 Multiple colors available
📦 Free returns
https://amazon.com/dp/B07KDQX5TD
#fashion
```

## 🔧 Troubleshooting

### Common Issues

**Bot not responding:**
- Check if `TELEGRAM_BOT_TOKEN` is correct
- Ensure bot is added as admin to channel
- Check server logs for errors

**Products not appearing:**
- Verify channel username matches `PRIME_PICKS_CHANNEL_USERNAME`
- Ensure Amazon URL is included in post
- Check database for inserted products

**Affiliate links not working:**
- Verify `AMAZON_ASSOCIATE_TAG` is correct
- Test affiliate links manually
- Check Amazon Associates account status

### Debug Commands

**Check bot status:**
```bash
# In server logs, look for:
🤖 Telegram bot initialized successfully
✅ Telegram listeners configured for Prime Picks
```

**Test database:**
```bash
# Check if products are being created
SELECT * FROM products WHERE source = 'telegram-prime-picks' ORDER BY created_at DESC LIMIT 5;
```

## 🛡️ Database Safety Features

### Enhanced Protection
Your website database is fully protected from any Telegram-related errors:

**✅ Data Validation:**
- All product data is validated before insertion
- Length limits enforced (name: 255 chars, description: 2000 chars)
- Price range validation ($0 - $999,999)
- URL format validation
- Duplicate detection and prevention

**✅ Error Isolation:**
- Telegram errors never affect your main website
- Failed operations are retried automatically (3 attempts)
- Database transactions ensure data integrity
- Exponential backoff for retry attempts

**✅ Safe Operations:**
- All database operations are wrapped in try-catch blocks
- Failed insertions don't crash the system
- Auto-cleanup runs safely every hour
- Admin notifications for all database events

**✅ Monitoring & Alerts:**
- Real-time error notifications to admin
- Success confirmations for all operations
- Database integrity status in all messages
- Self-healing system with automatic recovery

## 🎉 Success Indicators

✅ **Bot responds to `/start` command**  
✅ **Channel posts create products automatically**  
✅ **Affiliate links include your tag**  
✅ **Products appear on Prime Picks page**  
✅ **Products auto-expire after 24 hours**  
✅ **Admin notifications work (if configured)**  
✅ **Database safety confirmations in logs**  
✅ **Error isolation working (no crashes)**  

## 🚀 Next Steps

Once Prime Picks is working:
1. **Add more channels** for other pages (Value Picks, Fashion, etc.)
2. **Customize categories** and keywords
3. **Set up monitoring** and analytics
4. **Scale to multiple affiliate programs**

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test each component individually
4. Ensure all permissions are correctly configured

---

**🎯 Your Prime Picks Telegram integration is now ready! Start posting deals and watch them automatically appear on your website with affiliate links! 🚀💰**