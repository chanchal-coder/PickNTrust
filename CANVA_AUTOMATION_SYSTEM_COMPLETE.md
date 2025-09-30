# 🎨 Complete Canva AI Automation System

## 🎯 System Overview

This system automates social media marketing by integrating Canva's design API with your PickNTrust platform to create and distribute professional marketing content across multiple social platforms.

## 🔄 Complete Workflow

```
[Admin Panel]
     │
     ▼
[Admin Saves Canva Settings]
(template ID, AI usage, captions, hashtags, schedule, platforms)
     │
     ▼
[Admin Adds Product or Service]
- Product → title, image, price/discount, affiliate/original link
- Service → title, image, plan type (Free / Monthly / Yearly), link
     │
     ▼
[Backend Reads Admin Canva Settings + Data]
     │
     ▼
[Canva API Integration]
   - Fill template with item details
   - CTA button → PicknTrust redirect link (pickntrust.com/d/{id}) if expires - pickntrust website
   - Price shown as:
       • "₹999 (50% off)" for products
       • "Free" or "₹499/month" for services
   - Footer → "Visit PicknTrust.com for more deals & services!"
     │
     ▼
[Design Saved in Canva Cloud + ID stored in DB]
     │
     ▼
[Backend Auto-Posts to Social Media]
   - Instagram → Feed ("link in bio") + Story (swipe-up)
   - Facebook → Post with working link
   - Twitter/X → Tweet with link
   - Pinterest → Pin with link
   - WhatsApp/Telegram → Message with image + link
   - YouTube → Short/Community Post with link
     │
     ▼
[PicknTrust Redirect Link Handling]
   - If active → redirect to product/service original link
   - If expired (e.g. 24h deal) → redirect to PicknTrust homepage
     │
     ▼
[Always Valid Links Across All Platforms]
```

## 🔑 Why Canva API & Secret Fields Are Needed

### **Canva Client ID & Secret Purpose:**

1. **Authentication**: Required to authenticate with Canva's API servers
2. **Design Creation**: Allows backend to programmatically create designs from templates
3. **Template Access**: Enables access to your Canva Pro templates and brand assets
4. **Automation**: Powers the automatic design generation without manual intervention
5. **Cloud Storage**: Designs are saved in Canva's cloud and accessible via API

### **Backend API Flow:**

```javascript
// 1. Admin saves settings
POST /api/canva/settings
{
  templateId: "DAFxxxxxx",
  platforms: ["instagram", "facebook", "whatsapp", "telegram", "youtube"],
  aiCaptions: true,
  schedule: "immediate"
}

// 2. Admin adds product
POST /api/products
{
  title: "Amazing Headphones",
  price: "999",
  originalPrice: "1999",
  link: "https://affiliate-link.com"
}

// 3. Backend automatically triggers Canva design creation
// Uses CANVA_CLIENT_ID & CANVA_CLIENT_SECRET to authenticate
const canvaResponse = await fetch('https://api.canva.com/rest/v1/designs', {
  headers: {
    'Authorization': `Bearer ${accessToken}`, // Generated using client credentials
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template_id: settings.templateId,
    elements: {
      title: "Amazing Headphones",
      price: "₹999 (50% off)",
      cta_link: "https://pickntrust.com/d/123",
      footer: "Visit PicknTrust.com for more deals!"
    }
  })
});

// 4. Design created, now auto-post to social platforms
await postToAllPlatforms(designId, caption, hashtags);
```

## 📱 Social Platform Integration

### **Instagram**
- **Feed Post**: Image with "Link in bio" caption
- **Story**: Swipe-up link (if business account)

### **Facebook** 
- **Post**: Direct link with image
- **Engagement**: Auto-responds to comments

### **Twitter/X**
- **Tweet**: Image with shortened link
- **Thread**: Multi-tweet for longer content

### **Pinterest**
- **Pin**: Direct link to product/service
- **Board**: Organized by category

### **WhatsApp Business**
- **Channel**: Broadcast to subscribers
- **Status**: 24-hour story format

### **Telegram**
- **Channel**: Public channel posts
- **Bot**: Direct messages to subscribers

### **YouTube**
- **Shorts**: Video creative for products
- **Community Posts**: Image posts with polls
- **Description Links**: Product/service links

## 🔗 Smart Redirect System

### **PicknTrust Redirect Links:**
```
https://pickntrust.com/d/123 → Product Link (if active)
https://pickntrust.com/d/123 → Homepage (if expired)
```

### **Link Expiration Logic:**
```javascript
app.get('/d/:id', async (req, res) => {
  const item = await db.getItem(req.params.id);
  
  if (item.expiresAt && new Date() > item.expiresAt) {
    // Expired - redirect to homepage
    return res.redirect('https://pickntrust.com');
  }
  
  // Active - redirect to original link
  res.redirect(item.originalLink);
});
```

## 🎛️ Admin Control Panel

### **Canva Settings Tab:**
- Template ID selection
- Platform toggles (Instagram, Facebook, WhatsApp, Telegram, YouTube, etc.)
- AI caption generation toggle
- Hashtag preferences
- Posting schedule (immediate/scheduled)
- Brand customization options

### **Content Creation:**
- Product/Service forms automatically trigger design creation
- Preview generated designs before posting
- Manual override for captions/hashtags
- Bulk operations for multiple items

## 🔧 Technical Implementation

### **Database Schema:**
```sql
-- Canva Settings
CREATE TABLE canva_settings (
  id INTEGER PRIMARY KEY,
  template_id TEXT,
  platforms TEXT, -- JSON array
  ai_captions BOOLEAN,
  ai_hashtags BOOLEAN,
  schedule_type TEXT,
  is_active BOOLEAN
);

-- Canva Posts (tracking)
CREATE TABLE canva_posts (
  id INTEGER PRIMARY KEY,
  content_type TEXT, -- 'product', 'service', 'blog'
  content_id INTEGER,
  design_id TEXT, -- Canva design ID
  platforms_posted TEXT, -- JSON array
  created_at DATETIME,
  expires_at DATETIME
);

-- Social Platform Results
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY,
  canva_post_id INTEGER,
  platform TEXT,
  post_url TEXT,
  status TEXT, -- 'success', 'failed'
  error_message TEXT,
  posted_at DATETIME
);
```

### **Environment Variables Required:**
```bash
# Canva API Credentials
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here

# Social Platform API Keys
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
TWITTER_API_KEY=your_twitter_key
PINTEREST_ACCESS_TOKEN=your_pinterest_token
WHATSAPP_BUSINESS_TOKEN=your_whatsapp_token
TELEGRAM_BOT_TOKEN=your_telegram_token
YOUTUBE_API_KEY=your_youtube_key

# Website Configuration
WEBSITE_URL=https://pickntrust.com
REDIRECT_BASE_URL=https://pickntrust.com/d/
```

## 🚀 Benefits

1. **Automated Marketing**: No manual design or posting required
2. **Consistent Branding**: All posts use your Canva templates
3. **Multi-Platform Reach**: Single action posts to all platforms
4. **Smart Link Management**: Links always work, even after expiration
5. **Analytics Ready**: Track performance across all platforms
6. **Time Saving**: Hours of manual work reduced to seconds
7. **Professional Quality**: Canva's design tools ensure high-quality visuals

## 📊 Success Metrics

- **Design Generation**: Automatic creation from templates
- **Multi-Platform Posting**: 6+ social platforms simultaneously
- **Link Management**: 100% uptime for redirect links
- **Engagement Tracking**: Monitor performance across platforms
- **Time Efficiency**: 95% reduction in manual posting time

---

**Status**: 🔧 **IN DEVELOPMENT** - Implementing complete automation system  
**Next**: Fix settings saving, add WhatsApp/Telegram/YouTube integration  
**Goal**: Full automation from product creation to social media distribution
