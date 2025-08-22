# 🔗 Social Media Platform Connection Guide

## 🎯 Overview

To enable Canva automation posting, you need to connect each social media platform by obtaining API credentials and configuring them in your system. Here's how to connect each platform:

## 📱 Platform Setup Instructions

### 1. 🟣 Instagram Connection

#### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → Choose "Business" type
3. Fill in app details and create

#### Step 2: Add Instagram Basic Display
1. In your Facebook app, go to "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display

#### Step 3: Get Credentials
1. **App ID** → Copy this as `INSTAGRAM_APP_ID`
2. **App Secret** → Copy this as `INSTAGRAM_APP_SECRET`
3. Add Instagram Test User (your Instagram account)
4. Generate User Token → Copy as `INSTAGRAM_ACCESS_TOKEN`

#### Step 4: Get Instagram Business Account ID
1. Use Graph API Explorer: `https://developers.facebook.com/tools/explorer/`
2. Query: `me/accounts` to get your page
3. Query: `{page-id}?fields=instagram_business_account`
4. Copy the Instagram Business Account ID as `INSTAGRAM_ACCOUNT_ID`

```bash
# Add to .env file:
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
```

---

### 2. 🔵 Facebook Connection

#### Step 1: Use Same Facebook App (from Instagram setup)

#### Step 2: Add Pages Permission
1. In Facebook App → App Review → Permissions and Features
2. Request `pages_manage_posts`, `pages_read_engagement`

#### Step 3: Get Page Access Token
1. Go to Graph API Explorer
2. Select your app and get User Access Token
3. Query: `me/accounts` to get your page access token
4. Copy Page ID and Page Access Token

```bash
# Add to .env file:
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
```

---

### 3. 🐦 Twitter/X Connection

#### Step 1: Create Twitter Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for developer account
3. Create a new project/app

#### Step 2: Get API Keys
1. In your Twitter app → Keys and Tokens
2. Generate API Key & Secret
3. Generate Access Token & Secret
4. Generate Bearer Token

```bash
# Add to .env file:
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

---

### 4. 📌 Pinterest Connection

#### Step 1: Create Pinterest App
1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create new app
3. Fill in app details

#### Step 2: Get Access Token
1. Go to your Pinterest app settings
2. Generate Access Token
3. Get your Board ID (from Pinterest board URL)

```bash
# Add to .env file:
PINTEREST_ACCESS_TOKEN=your_pinterest_access_token
PINTEREST_BOARD_ID=your_pinterest_board_id
```

---

### 5. 💚 WhatsApp Business Connection

#### Step 1: Set Up WhatsApp Business API
1. Go to [Facebook Business](https://business.facebook.com/)
2. Create Business Manager account
3. Add WhatsApp Business API

#### Step 2: Get Phone Number ID
1. In Facebook Business → WhatsApp → API Setup
2. Copy Phone Number ID
3. Generate Access Token

#### Step 3: Create Message Templates
1. Go to WhatsApp Manager → Message Templates
2. Create template named `product_promotion` with:
   - Header: Image
   - Body: Text with variable
   - Button: URL button with variable

```bash
# Add to .env file:
WHATSAPP_BUSINESS_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_CHANNEL_ID=your_whatsapp_channel_id
```

---

### 6. 🔵 Telegram Connection

#### Step 1: Create Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy the Bot Token

#### Step 2: Create Telegram Channel
1. Create a new Telegram channel
2. Add your bot as admin
3. Get channel username (e.g., `@pickntrust`)

#### Step 3: Get Channel ID
1. Send a message to your channel
2. Visit: `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates`
3. Find your channel ID in the response

```bash
# Add to .env file:
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@your_channel_username
```

---

### 7. 🔴 YouTube Connection

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable YouTube Data API v3

#### Step 2: Create Credentials
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Download credentials JSON

#### Step 3: Get Access Token
1. Use OAuth 2.0 flow to get access token
2. Get your YouTube Channel ID from YouTube Studio

```bash
# Add to .env file:
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_ACCESS_TOKEN=your_youtube_access_token
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

---

## 🔧 Complete .env Configuration

After setting up all platforms, your `.env` file should look like this:

```bash
# Canva API (Required)
CANVA_CLIENT_ID=your_canva_client_id
CANVA_CLIENT_SECRET=your_canva_client_secret

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id

# Facebook
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id

# Twitter/X
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Pinterest
PINTEREST_ACCESS_TOKEN=your_pinterest_access_token
PINTEREST_BOARD_ID=your_pinterest_board_id

# WhatsApp Business
WHATSAPP_BUSINESS_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_CHANNEL_ID=your_whatsapp_channel_id

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@your_channel_username

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_ACCESS_TOKEN=your_youtube_access_token
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
YOUTUBE_CHANNEL_ID=your_youtube_channel_id

# Website Configuration
WEBSITE_URL=https://pickntrust.com
```

## 🧪 Testing Connections

After adding all credentials, test each platform:

1. **Go to Admin Panel** → Automation tab
2. **Turn ON Canva Automation**
3. **Select platforms** you want to test
4. **Click "Test Automation"** button
5. **Check each platform** for successful posts

## 🔍 Troubleshooting

### Common Issues:

1. **"API credentials not configured"**
   - Check if environment variables are set correctly
   - Restart your server after adding .env variables

2. **"Access token expired"**
   - Regenerate access tokens from respective platforms
   - Update .env file with new tokens

3. **"Permission denied"**
   - Check if your app has required permissions
   - For Facebook/Instagram: Review app permissions
   - For Twitter: Check API access level

4. **"Channel/Page not found"**
   - Verify channel IDs and page IDs are correct
   - Ensure bots/apps are added as admins

## 🚀 Ready to Use!

Once all platforms are connected:
- ✅ Each platform toggle will work
- ✅ Canva will know exactly where to post
- ✅ Auto-posting will work seamlessly
- ✅ Links will redirect properly

Your social media automation system is now fully connected and ready for production use!
