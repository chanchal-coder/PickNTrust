# 🚀 Social Media Auto-Posting Setup Guide

**Your Canva automation system now supports REAL social media posting!**

## 📋 Overview

Your system can now automatically post to:
- ✅ **Instagram** (Business accounts)
- ✅ **Facebook** (Pages)
- ✅ **Twitter** (via API v2)
- ✅ **LinkedIn** (Company pages)

When you add products, services, blogs, or videos through the admin panel, the system will:
1. **Generate content** (captions, hashtags)
2. **Select templates** for each platform
3. **Post automatically** to configured social media accounts
4. **Track results** and handle errors gracefully

---

## 🔑 Step 1: Get API Credentials

### Instagram Business API

1. **Go to [Facebook Developer Console](https://developers.facebook.com/)**
2. **Create a new app** or use existing
3. **Add "Instagram Basic Display" product**
4. **Configure Instagram Basic Display settings**
5. **Get long-lived access token**
6. **Get your Instagram Business Account ID**

**Required credentials:**
```
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### Facebook Pages API

1. **Go to [Facebook Developer Console](https://developers.facebook.com/)**
2. **Create a new app** or use existing
3. **Add "Facebook Login" product**
4. **Use Graph API Explorer** to get page access token
5. **Get your Facebook Page ID**

**Required credentials:**
```
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
```

### Twitter API v2

1. **Go to [Twitter Developer Portal](https://developer.twitter.com/)**
2. **Create a developer account**
3. **Create a new app**
4. **Generate API keys and access tokens**
5. **Enable "Read and Write" permissions**

**Required credentials:**
```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

### LinkedIn Company Pages API

1. **Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)**
2. **Create a new app**
3. **Add "Share on LinkedIn" and "Marketing Developer Platform" products**
4. **Get OAuth 2.0 access token**
5. **Get your LinkedIn Organization/Company ID**

**Required credentials:**
```
LINKEDIN_ACCESS_TOKEN=your_oauth_access_token
LINKEDIN_ORGANIZATION_ID=your_organization_id
```

---

## ⚙️ Step 2: Configure Environment Variables

### Option A: Create/Update .env file

1. **Create or edit `.env` file** in your project root
2. **Add your credentials:**

```env
# Social Media API Credentials

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here

# Facebook
FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Twitter
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here

# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token_here
LINKEDIN_ORGANIZATION_ID=your_linkedin_organization_id_here
```

### Option B: Use the template

1. **Copy the template file:**
   ```bash
   cp .env.social-media .env
   ```

2. **Edit `.env` file** and replace placeholder values with your real credentials

---

## 🔄 Step 3: Restart Your Server

**Stop and restart your development server** to load the new environment variables:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Step 4: Test the Integration

### Test 1: Check Credentials Status

1. **Open your browser** and go to: `http://localhost:5000`
2. **Access admin panel** (use password: `pickntrust2025`)
3. **Check API status** by visiting:
   ```
   http://localhost:5000/api/admin/social-media/status?password=pickntrust2025
   ```

### Test 2: Test Individual Platform

**Test each platform separately:**

```bash
# Test Instagram
curl -X POST http://localhost:5000/api/admin/social-media/test-credentials \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025","platform":"instagram"}'

# Test Facebook
curl -X POST http://localhost:5000/api/admin/social-media/test-credentials \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025","platform":"facebook"}'

# Test Twitter
curl -X POST http://localhost:5000/api/admin/social-media/test-credentials \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025","platform":"twitter"}'

# Test LinkedIn
curl -X POST http://localhost:5000/api/admin/social-media/test-credentials \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025","platform":"linkedin"}'
```

### Test 3: Add a Product and Watch It Post

1. **Go to admin panel**
2. **Add a new product** with:
   - Name: "Test Social Media Product"
   - Description: "Testing automatic social media posting"
   - Price: 2999
   - Category: "Electronics"
   - Image URL: Any product image
   - Password: `pickntrust2025`

3. **Watch server logs** for posting results
4. **Check your social media accounts** for the new posts

---

## 📊 Step 5: Monitor and Manage Posts

### View Posting Status

**Check posting analytics:**
```
http://localhost:5000/api/admin/social-media/status?password=pickntrust2025
```

### Retry Failed Posts

**If some posts failed, retry them:**
```bash
curl -X POST http://localhost:5000/api/admin/social-media/retry-failed \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025"}'
```

### Process Pending Posts

**Manually trigger posting for pending posts:**
```bash
curl -X POST http://localhost:5000/api/admin/social-media/post-pending \
  -H "Content-Type: application/json" \
  -d '{"password":"pickntrust2025"}'
```

---

## 🔧 Troubleshooting

### Common Issues

**❌ "Credentials not configured"**
- Check your `.env` file has the correct variable names
- Restart your server after adding credentials
- Verify no typos in environment variable names

**❌ "Access token expired"**
- Instagram/Facebook: Generate new long-lived tokens
- Twitter: Check if your app permissions are correct
- LinkedIn: Refresh your OAuth token

**❌ "API rate limit exceeded"**
- Wait for the rate limit to reset
- Consider spacing out your posts
- Check platform-specific rate limits

**❌ "Post creation failed"**
- Verify image URLs are accessible
- Check caption length limits (Twitter: 280 chars)
- Ensure content complies with platform policies

### Debug Mode

**Enable detailed logging** by checking server console output when:
- Adding products through admin panel
- Making API calls to social media endpoints
- Processing pending posts

---

## 🎯 How It Works

### Automatic Flow

1. **User adds content** (product/service/blog/video) via admin panel
2. **Canva automation triggers** and generates:
   - Platform-specific captions
   - Relevant hashtags
   - Template selection
3. **Social media poster attempts** to post to all configured platforms
4. **Results are logged** in database with status:
   - `pending`: Waiting to be posted
   - `posted`: Successfully posted
   - `failed`: Failed to post (with error message)

### Database Tracking

**All posts are tracked in `canva_posts` table:**
- `social_media_post_id`: Platform's post ID (for tracking)
- `error_message`: Error details if posting failed
- `posted_at`: Timestamp when successfully posted
- `status`: Current status (pending/posted/failed)

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment variables** in production
3. **Rotate tokens regularly**
4. **Monitor API usage** and rate limits
5. **Keep tokens secure** and never share publicly
6. **Use least privilege** - only request necessary permissions

---

## 🎉 Success!

**Once configured, your system will:**
- ✅ Automatically post to social media when content is added
- ✅ Handle errors gracefully without breaking content creation
- ✅ Track all posting attempts and results
- ✅ Provide detailed analytics and status monitoring
- ✅ Support manual retry of failed posts
- ✅ Work with your existing Canva automation templates

**Your PickNTrust platform now has full social media automation! 🚀**

---

## 📞 Support

If you encounter issues:
1. Check server console logs for detailed error messages
2. Verify API credentials are correct and not expired
3. Test individual platforms using the test endpoints
4. Check platform-specific API documentation for updates
5. Monitor rate limits and usage quotas

**Happy posting! 📱✨**
