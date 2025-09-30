# 🚨 URGENT: Fix "no such table: canva_settings" Error

## The Problem
Your production server is showing this error:
```
Error updating Canva settings: SqliteError: no such table: canva_settings
```

## The Solution (2 minutes to fix)

### Step 1: Upload the fix script to your EC2 server
```bash
# On your local machine, copy the fix script to your server
scp URGENT_PRODUCTION_DATABASE_FIX.cjs ec2-user@your-server:/home/ec2-user/PickNTrust/
```

### Step 2: Run the fix script on your EC2 server
```bash
# SSH into your server
ssh ec2-user@your-server

# Navigate to your project directory
cd /home/ec2-user/PickNTrust

# Run the urgent fix script
node URGENT_PRODUCTION_DATABASE_FIX.cjs
```

### Step 3: Restart your PM2 process
```bash
# Restart the backend to pick up the new database tables
pm2 restart pickntrust

# Check if it's running properly
pm2 logs pickntrust --lines 20
```

## Expected Output
You should see:
```
🚨 URGENT: Fixing missing canva_settings table in production...
📁 Database path: /home/ec2-user/PickNTrust/database.sqlite
✅ Connected to production database
🔧 Creating canva_settings table...
✅ canva_settings table created
✅ Default canva_settings inserted
✅ canva_posts table created
✅ canva_templates table created

📊 Verification - Tables created:
  ✅ canva_posts
  ✅ canva_settings
  ✅ canva_templates

📈 canva_settings records: 1

🎉 SUCCESS! Production database fixed.
🔄 Please restart your PM2 process:
   pm2 restart pickntrust

✅ The "no such table: canva_settings" error should now be resolved!
```

## Verification
After running the fix:

1. **Check the admin panel**: Go to your admin automation page
2. **Try to save settings**: The "canva_settings" error should be gone
3. **Check logs**: `pm2 logs pickntrust` should show no more database errors

## If the Script Fails
If for any reason the script fails, you can manually fix it:

```bash
# Connect to your database
sqlite3 database.sqlite

# Run this SQL command
CREATE TABLE IF NOT EXISTS canva_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled BOOLEAN DEFAULT 0,
  api_key TEXT,
  api_secret TEXT,
  default_template_id TEXT,
  auto_generate_captions BOOLEAN DEFAULT 1,
  auto_generate_hashtags BOOLEAN DEFAULT 1,
  default_caption TEXT,
  default_hashtags TEXT,
  platforms TEXT DEFAULT '[]',
  schedule_type TEXT DEFAULT 'immediate',
  schedule_delay_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO canva_settings (is_enabled, auto_generate_captions, auto_generate_hashtags, default_caption, default_hashtags, platforms, schedule_type, schedule_delay_minutes) 
VALUES (0, 1, 1, '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!', '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India', '["instagram","facebook"]', 'immediate', 0);

# Exit sqlite
.exit

# Restart PM2
pm2 restart pickntrust
```

## After the Fix
Once this is done:
- ✅ The "canva_settings" error will be resolved
- ✅ Your admin automation panel will work properly
- ✅ You can save Canva automation settings
- ✅ Manual caption/hashtag fields will work
- ✅ Platform connection status will display correctly

**This should take less than 2 minutes to fix!**
