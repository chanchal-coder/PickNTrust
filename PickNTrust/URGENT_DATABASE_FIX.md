# 🚨 URGENT: Production Database Fix Required

## Current Issue
The production server is failing because the database schema is missing critical columns:
- `is_service` column missing from products table
- `video_content` table missing entirely
- Several other service-related columns missing

## Quick Fix Instructions

### Step 1: Upload the fix script to production server
```bash
# Copy fix-production-database.cjs to your production server
scp fix-production-database.cjs ec2-user@your-server:/home/ec2-user/PickNTrust/
```

### Step 2: Run the database fix on production
```bash
# SSH into your production server
ssh ec2-user@your-server

# Navigate to project directory
cd /home/ec2-user/PickNTrust

# Run the database fix
node fix-production-database.cjs
```

### Step 3: Restart the server
```bash
# Restart PM2 processes to apply changes
pm2 restart all

# Check if errors are resolved
pm2 logs --lines 20
```

## What the fix will do:
✅ Add missing `is_service` column to products table
✅ Add missing `custom_fields` column for service data
✅ Create missing `video_content` table
✅ Add timer-related columns
✅ Fix column type mismatches

## Expected Result:
After running the fix, you should see:
- ✅ No more "table products has no column named is_service" errors
- ✅ No more "no such table: video_content" errors  
- ✅ Admin panel can add products and services successfully
- ✅ All API endpoints return 200 instead of 500

## Verification:
After the fix, try adding a product through the admin panel - it should work without errors.
