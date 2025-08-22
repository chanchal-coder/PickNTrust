# 🔧 Direct Database Fix - Add Missing default_title Column

Since the migration script isn't on your EC2 server, here are the direct commands to fix your database:

## Option 1: Direct SQL Commands (Recommended)

```bash
cd ~/PickNTrust

# Check if the column already exists
sqlite3 database.sqlite "PRAGMA table_info(canva_settings);" | grep default_title

# If no output (column doesn't exist), add it:
sqlite3 database.sqlite "ALTER TABLE canva_settings ADD COLUMN default_title TEXT;"

# Verify it was added:
sqlite3 database.sqlite "PRAGMA table_info(canva_settings);" | grep -E "(default_title|default_caption|default_hashtags)"

# Restart your server to pick up schema changes:
pm2 restart pickntrust-backend
```

## Option 2: Complete Table Recreation (If needed)

If the canva_settings table doesn't exist at all:

```bash
cd ~/PickNTrust

# Create the complete canva_settings table:
sqlite3 database.sqlite <<'EOF'
CREATE TABLE IF NOT EXISTS canva_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled INTEGER DEFAULT 0,
  api_key TEXT,
  api_secret TEXT,
  default_template_id TEXT,
  auto_generate_captions INTEGER DEFAULT 1,
  auto_generate_hashtags INTEGER DEFAULT 1,
  default_title TEXT,
  default_caption TEXT,
  default_hashtags TEXT,
  platforms TEXT DEFAULT '[]',
  schedule_type TEXT DEFAULT 'immediate',
  schedule_delay_minutes INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert default settings if none exist
INSERT OR IGNORE INTO canva_settings (
  id,
  is_enabled, 
  auto_generate_captions, 
  auto_generate_hashtags,
  default_title,
  default_caption,
  default_hashtags,
  platforms, 
  schedule_type, 
  schedule_delay_minutes,
  created_at,
  updated_at
) VALUES (
  1,
  0,
  1,
  1,
  '🛍️ Amazing {category} Deal: {title}',
  '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!',
  '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
  '["instagram", "facebook"]',
  'immediate',
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
EOF

# Restart server
pm2 restart pickntrust-backend
```

## Verification Commands

```bash
# Check the complete table structure:
sqlite3 database.sqlite ".schema canva_settings"

# Check all columns exist:
sqlite3 database.sqlite "PRAGMA table_info(canva_settings);" | grep -E "(default_title|default_caption|default_hashtags)"

# Check if default settings exist:
sqlite3 database.sqlite "SELECT id, default_title, default_caption FROM canva_settings LIMIT 1;"
```

## Expected Output

After running the fix, you should see:
```
default_title TEXT
default_caption TEXT  
default_hashtags TEXT
```

And the default settings should show:
```
1|🛍️ Amazing {category} Deal: {title}|🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!
```

## Next Steps

1. Run Option 1 commands above
2. Verify the column was added
3. Test your Canva automation - it should now work with the complete schema!

Your schema will now be perfect and match the requirements from the script you provided.
