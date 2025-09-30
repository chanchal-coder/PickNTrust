# 🎨 Complete Canva Automation Solution

## 🎯 Current Status

✅ **Schema Fixed**: All required fields (`default_title`, `default_caption`, `default_hashtags`) are now in the database  
❌ **Automation Issues**: Canva automation not working, only posting to Telegram

## 🔧 Complete Fix Commands

Run these commands on your EC2 server to fix all automation issues:

### Step 1: Diagnose Current Issues
```bash
cd ~/PickNTrust
node diagnose-canva-automation-issues.cjs
```

### Step 2: Fix All Automation Issues
```bash
cd ~/PickNTrust
node fix-canva-automation-complete.cjs
```

### Step 3: Manual Database Fixes (If Scripts Don't Work)
```bash
cd ~/PickNTrust

# Enable Canva automation
sqlite3 database.sqlite "UPDATE canva_settings SET is_enabled = 1 WHERE id = 1;"

# Ensure proper platform configuration
sqlite3 database.sqlite "UPDATE canva_settings SET platforms = '[\"facebook\", \"instagram\", \"whatsapp\", \"telegram\"]' WHERE id = 1;"

# Set default template ID
sqlite3 database.sqlite "UPDATE canva_settings SET default_template_id = 'DAGwhZPYsRg' WHERE id = 1;"

# Create missing tables
sqlite3 database.sqlite <<'EOF'
CREATE TABLE IF NOT EXISTS canva_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  design_id TEXT,
  status TEXT DEFAULT 'pending',
  platforms TEXT,
  error_message TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS canva_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'post',
  category TEXT,
  thumbnail_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

INSERT OR IGNORE INTO canva_templates (template_id, name, type, is_active)
VALUES ('DAGwhZPYsRg', 'Default Product Template', 'post', 1);
EOF
```

### Step 4: Restart Server with Environment Variables
```bash
cd ~/PickNTrust
pm2 restart pickntrust-backend --update-env
```

### Step 5: Verify Configuration
```bash
# Check Canva settings
sqlite3 database.sqlite "SELECT is_enabled, platforms, default_template_id FROM canva_settings LIMIT 1;"

# Check environment variables are loaded
pm2 show pickntrust-backend | grep -A 20 "Environment"

# Check server logs
pm2 logs pickntrust-backend --lines 50
```

## 🚨 Common Issues & Solutions

### Issue 1: "Canva automation disabled"
**Solution**: 
```bash
sqlite3 database.sqlite "UPDATE canva_settings SET is_enabled = 1 WHERE id = 1;"
```

### Issue 2: "Only posting to Telegram"
**Problem**: Platform configuration is wrong or social media APIs not configured  
**Solution**: 
```bash
# Fix platform configuration
sqlite3 database.sqlite "UPDATE canva_settings SET platforms = '[\"facebook\", \"instagram\", \"whatsapp\", \"telegram\"]' WHERE id = 1;"

# Check if social media credentials are set
grep -E "FACEBOOK|INSTAGRAM|WHATSAPP|TELEGRAM" .env
```

### Issue 3: "Canva API not working"
**Problem**: Canva credentials not loaded or invalid  
**Solution**:
```bash
# Check credentials are in environment
echo "CANVA_CLIENT_ID: $CANVA_CLIENT_ID"
echo "CANVA_CLIENT_SECRET: $CANVA_CLIENT_SECRET"

# If not loaded, restart PM2
pm2 restart pickntrust-backend --update-env
```

### Issue 4: "Environment variables not loaded"
**Solution**:
```bash
cd ~/PickNTrust
set -a; source .env; set +a
pm2 restart pickntrust-backend --update-env
```

## 🎯 Expected Results After Fix

### ✅ Database Configuration:
- `is_enabled = 1` (Canva automation enabled)
- `platforms = ["facebook", "instagram", "whatsapp", "telegram"]`
- `default_template_id = "DAGwhZPYsRg"`
- All default templates populated

### ✅ Automation Flow:
1. **Product/Blog/Video Created** → Triggers automation
2. **Canva API Called** → Creates design from template
3. **Content Generated** → Uses default templates with variables
4. **Multi-Platform Posting** → Posts to all configured platforms
5. **Fallback System** → Uses product image if Canva fails

### ✅ Multi-Platform Posting:
- **Facebook**: Professional posts with images
- **Instagram**: Story-ready content with hashtags
- **WhatsApp**: Channel-optimized messages
- **Telegram**: Group-friendly formatting

## 🧪 Testing the Fix

### Test 1: Create a Test Product
```bash
# Use your admin panel to create a new product
# Check PM2 logs for automation triggers
pm2 logs pickntrust-backend --lines 20
```

### Test 2: Check Automation Records
```bash
# Check if automation attempts are logged
sqlite3 database.sqlite "SELECT * FROM canva_posts ORDER BY created_at DESC LIMIT 5;"
```

### Test 3: Verify Multi-Platform Posting
- Check your social media accounts for new posts
- Verify content uses your professional templates
- Confirm all platforms received posts (not just Telegram)

## 🎉 Success Indicators

✅ **Canva automation enabled in database**  
✅ **All required tables exist**  
✅ **Professional templates configured**  
✅ **Multi-platform posting active**  
✅ **Environment variables loaded**  
✅ **Server restarted with new config**  

## 📞 If Issues Persist

1. **Check PM2 logs**: `pm2 logs pickntrust-backend`
2. **Verify database**: Run the diagnosis script
3. **Test manually**: Create a product and watch logs
4. **Check credentials**: Ensure all API keys are valid

Your Canva automation should now work perfectly with multi-platform posting! 🚀
