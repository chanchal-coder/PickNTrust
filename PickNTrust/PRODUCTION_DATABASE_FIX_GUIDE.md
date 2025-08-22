# Production Database Fix Guide

## Issue Summary
The production server is failing with database schema errors:
```
SqliteError: no such column: "is_for_products"
SqliteError: no such column: "displayOrder"
```

## Root Cause
The categories table in production is missing required columns that were added in recent updates:
- `displayOrder` (for category ordering)
- `isForProducts` (for category type filtering)
- `isForServices` (for service category filtering)

## Solution Steps

### Step 1: Stop PM2 Processes
```bash
pm2 stop all
```

### Step 2: Run Database Migration
```bash
cd /home/ec2-user/PickNTrust
node fix-production-categories.cjs
```

### Step 3: Verify Database Schema
```bash
# Check if the script ran successfully
# The script should output:
# ✅ Added displayOrder column
# ✅ Added isForProducts column  
# ✅ Added isForServices column
# ✅ Sample categories: [list of categories]
```

### Step 4: Restart PM2 Processes
```bash
pm2 restart all
```

### Step 5: Monitor Logs
```bash
pm2 logs --lines 50
```

## Expected Results

After running the fix:
1. Categories API should work: `/api/categories`
2. Frontend should display categories properly
3. Admin panel should show category management
4. Gender categorization should work for Fashion products

## Manual Database Fix (Alternative)

If the script doesn't work, manually run these SQL commands:

```sql
-- Connect to SQLite database
sqlite3 sqlite.db

-- Add missing columns
ALTER TABLE categories ADD COLUMN displayOrder INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN isForProducts INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN isForServices INTEGER DEFAULT 0;

-- Update existing categories
UPDATE categories SET displayOrder = id * 10 WHERE displayOrder = 0;
UPDATE categories SET isForProducts = 1 WHERE isForProducts IS NULL;
UPDATE categories SET isForServices = 0 WHERE isForServices IS NULL;

-- Verify the fix
SELECT id, name, displayOrder, isForProducts, isForServices FROM categories LIMIT 5;

-- Exit SQLite
.exit
```

## Verification Commands

```bash
# Check if categories API works
curl http://localhost:5173/api/categories

# Check PM2 status
pm2 status

# Check application logs
pm2 logs pickntrust-backend --lines 20
```

## Files Modified

The following files contain the complete gender categorization fix:

1. **client/src/pages/category.tsx** - Gender normalization in frontend
2. **server/storage.ts** - Gender normalization in backend
3. **server/routes.ts** - Case-insensitive gender filtering
4. **shared/sqlite-schema.ts** - Complete database schema
5. **fix-production-categories.cjs** - Database migration script

## Gender Categorization Features

Once fixed, the system will support:
- Products added to "Fashion & Clothing" with gender="men" appear under Men tab
- Case-insensitive gender filtering (men/Men, women/Women, etc.)
- Category ordering with drag-and-drop in admin panel
- Mobile responsive footer layout

## Troubleshooting

If issues persist:

1. **Check database file exists:**
   ```bash
   ls -la *.db *.sqlite
   ```

2. **Check database permissions:**
   ```bash
   chmod 664 sqlite.db
   ```

3. **Manually inspect database:**
   ```bash
   sqlite3 sqlite.db ".schema categories"
   ```

4. **Check Node.js dependencies:**
   ```bash
   npm list better-sqlite3
   ```

## Contact
If the fix doesn't work, provide these logs:
- `pm2 logs pickntrust-backend --lines 50`
- `sqlite3 sqlite.db ".schema categories"`
- Output from `node fix-production-categories.cjs`
