# 🚀 Affiliate Automation System - Complete Setup Guide

## ✅ System Status: READY FOR CONFIGURATION

Your affiliate automation system has been successfully implemented! Here's how to get it running:

## 📋 Quick Setup Checklist

- [x] ✅ Google Sheets API integration installed
- [x] ✅ Affiliate link generation engine created
- [x] ✅ Smart categorization system built
- [x] ✅ API endpoints configured
- [x] ✅ Database schema updated
- [ ] 🔧 Google Sheets credentials setup
- [ ] 🔧 Environment variables configured
- [ ] 🔧 Google Sheets created with proper structure
- [ ] 🔧 Test with sample products

## 🔧 Step 1: Google Sheets API Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create Service Account credentials
5. Download the JSON credentials file

### 1.2 Configure Credentials
```bash
# Copy your credentials file
cp /path/to/your/credentials.json ./google-credentials.json

# Make sure it's in .gitignore (already added)
echo "google-credentials.json" >> .gitignore
```

## 📊 Step 2: Create Google Sheets

### 2.1 Create New Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet named "PickNTrust Affiliate Automation"
3. Copy the Spreadsheet ID from URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 2.2 Create Required Sheets

#### Sheet 1: "Inbox" (Product Input)
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| product_url | title | category | image_url | description | tags | processing_status | updated_at | affiliate_link |
| https://amazon.com/dp/B08N5WRWNW | iPhone Case | electronics | https://image.jpg | Premium case | trending | pending | | |
| https://myntra.com/shirts/roadster/123 | Casual Shirt | fashion | https://image.jpg | Stylish wear | viral | pending | | |

#### Sheet 2: "Commissions" (Affiliate Rules)
| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| merchant_pattern | category_pattern | affiliate_program | commission_rate | cookie_days | priority | active | direct_affiliate | template_url | notes | updated_at |
| amazon.com | * | amazon_associates | 4% | 24 | 1 | TRUE | FALSE | https://amazon.com/dp/{ASIN}?tag=pickntrust03-21 | Amazon products | 2025-01-28 |
| myntra.com | fashion | earnkaro | 8% | 30 | 1 | TRUE | FALSE | https://earnkaro.com/api/redirect?id=4530348&url={URL} | Fashion items | 2025-01-28 |
| revid.ai | apps | lemon_squeezy | 30% | 60 | 1 | TRUE | TRUE | https://revid.ai?aff=bl2W8D | AI video tool | 2025-01-28 |
| deodap.com | * | deodap | 15% | 30 | 1 | TRUE | TRUE | {URL} | Direct supplier | 2025-01-28 |

#### Sheet 3: "Analytics" (Performance Tracking)
| A | B | C | D | E |
|---|---|---|---|---|
| product_id | clicks | conversions | revenue | last_updated |

### 2.3 Share with Service Account
1. Click "Share" button in Google Sheets
2. Add your service account email (from credentials JSON)
3. Give "Editor" permissions

## ⚙️ Step 3: Environment Configuration

### 3.1 Update .env File
```bash
# Add these to your .env file
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json

# Affiliate Program IDs
AMAZON_ASSOCIATE_TAG=pickntrust03-21
EARNKARO_ID=4530348
LEMON_SQUEEZY_CODE=bl2W8D
CUELINKS_TOKEN=your_cuelinks_token_here

# Automation Settings
SYNC_INTERVAL_MINUTES=5
ENABLE_SOCIAL_POSTING=true
ENABLE_CANVA_GENERATION=true
```

### 3.2 Restart Server
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

## 🧪 Step 4: Testing

### 4.1 Run Automated Tests
```bash
node test-affiliate-automation.cjs
```

### 4.2 Test API Endpoints
```bash
# Check health
curl http://localhost:5000/api/affiliate/health

# Check status
curl http://localhost:5000/api/affiliate/status

# Manual sync
curl -X POST http://localhost:5000/api/affiliate/sync

# Get products by page
curl http://localhost:5000/api/products/by-page/todays_top_picks
```

## 🎯 Step 5: Add Sample Products

### 5.1 Add to Google Sheets Inbox
Add these sample products to test:

```
https://amazon.com/dp/B08N5WRWNW | iPhone 13 Case | electronics | https://m.media-amazon.com/images/I/61example.jpg | Premium protective case | trending
https://myntra.com/shirts/roadster/roadster-men-blue-regular-fit-casual-shirt/1234567/buy | Casual Shirt | fashion | https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/1234567/2021/1/example.jpg | Stylish casual wear | viral
https://revid.ai | AI Video Generator | apps | https://revid.ai/logo.png | Create viral videos with AI | featured
```

### 5.2 Watch Automation Work
1. Add products to Inbox sheet
2. Wait 5 minutes for auto-sync OR trigger manual sync
3. Check processing_status column updates
4. Verify affiliate links generated
5. Check your website for new products

## 📊 How It Works

### Automation Flow
```
1. Products added to Google Sheets "Inbox"
   ↓
2. System reads products every 5 minutes
   ↓
3. Extracts merchant domain (amazon.com, myntra.com, etc.)
   ↓
4. Finds best commission rule from "Commissions" sheet
   ↓
5. Generates affiliate link with your IDs
   ↓
6. Determines target page based on category/tags
   ↓
7. Saves to database with affiliate info
   ↓
8. Triggers Canva design generation
   ↓
9. Posts to social media (if enabled)
   ↓
10. Updates Google Sheets with status
```

### Smart Categorization
- **DeoDap products** → Lootbox page
- **Viral/trending/featured + apps** → Apps & AI Apps (featured)
- **Viral/trending/featured + services** → Cards & Services (featured)
- **Viral/trending/featured + other** → Today's Top Picks
- **Apps/AI category** → Apps & AI Apps section
- **Services category** → Cards & Services section
- **Everything else** → Respective category pages

### Commission Selection Logic
1. **Direct affiliate rules first** (direct_affiliate = TRUE)
2. **Highest commission rate** among matching rules
3. **Priority order** (lower number = higher priority)
4. **Longest cookie window** as tiebreaker

## 🎛️ Management & Control

### API Endpoints
- `GET /api/affiliate/health` - System health check
- `GET /api/affiliate/status` - Current status and stats
- `POST /api/affiliate/sync` - Trigger manual sync
- `POST /api/affiliate/auto-sync/start` - Start auto-sync
- `POST /api/affiliate/auto-sync/stop` - Stop auto-sync
- `GET /api/products/by-page/{page}` - Get products by target page

### Google Sheets Management
- **Add products**: Just add rows to Inbox sheet
- **Update commission rates**: Edit Commissions sheet
- **Pause processing**: Set active = FALSE in Commissions
- **Monitor performance**: Check Analytics sheet

## 🔧 Troubleshooting

### Common Issues

**"Google Sheets ID not configured"**
- Add GOOGLE_SHEETS_ID to .env file
- Restart server

**"Permission denied" on Google Sheets**
- Share spreadsheet with service account email
- Give Editor permissions

**"No affiliate program found"**
- Check merchant_pattern in Commissions sheet
- Ensure active = TRUE
- Verify category_pattern matches

**Products not appearing on website**
- Check processing_status in Inbox sheet
- Verify targetPage assignment
- Check database for saved products

### Debug Commands
```bash
# Check server logs
npm run dev

# Test specific endpoint
curl -v http://localhost:5000/api/affiliate/health

# Check database
sqlite3 database.sqlite "SELECT * FROM products WHERE affiliateProgram IS NOT NULL LIMIT 5;"
```

## 🎊 Success Indicators

✅ **System Working When:**
- Health check shows all environment variables configured
- Status shows "initialized: true" and "autoSyncEnabled: true"
- Manual sync returns "success: true"
- Products appear in Inbox with "processed" status
- Affiliate links generated correctly
- Products visible on website in correct sections

## 🚀 Next Steps

1. **Scale Up**: Add more affiliate programs to Commissions sheet
2. **Optimize**: Monitor Analytics sheet for best performers
3. **Automate More**: Set up social media API keys
4. **Monitor**: Set up alerts for failed processing
5. **Expand**: Add more product sources and categories

## 💡 Pro Tips

- **Use wildcards**: `*.amazon.com` matches all Amazon domains
- **Priority matters**: Lower numbers = higher priority
- **Test first**: Use manual sync to test new rules
- **Monitor performance**: Check Analytics sheet regularly
- **Backup sheets**: Make copies of your Google Sheets

---

🎯 **Your affiliate automation system is ready! Start by setting up Google Sheets and adding your first products.**