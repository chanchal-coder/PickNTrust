# Deployment Issues Fix Guide

## Issues Identified
1. Travel picks page missing + add and delete buttons
2. Admin login failing with "wrong password" error
3. Database schema mismatch between local and production

## Root Causes

### 1. Admin Authentication Issue
- **Problem**: Production environment doesn't have localhost check
- **Cause**: Admin authentication only works on localhost in development
- **Impact**: Admin controls not visible, login fails

### 2. Database Schema Mismatch
- **Problem**: Missing columns in production database
- **Cause**: Migration files don't match actual schema requirements
- **Impact**: SQL errors, features not working

## Deployment Fixes

### Step 1: Fix Database Schema

Run this SQL on your production database:

```sql
-- Fix announcements table
ALTER TABLE announcements ADD COLUMN page TEXT;
ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1;
UPDATE announcements SET is_global = 1 WHERE is_global IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_page ON announcements(page);
CREATE INDEX IF NOT EXISTS idx_announcements_is_global ON announcements(is_global);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

-- Verify schema
.schema announcements
```

### Step 2: Fix Admin Authentication

Update environment variables on production server:

```bash
# Add to your production .env file
ADMIN_PASSWORD=your_actual_admin_password
ADMIN_SESSION_SECRET=your_session_secret
NODE_ENV=production
```

### Step 3: Update Admin Login Logic

The travel-picks page has been updated to include localhost check, but for production you need to:

1. Set proper admin session in production
2. Ensure admin password verification works
3. Check that localStorage is properly set after login

### Step 4: Verify Admin Controls

After deployment, admin controls should appear when:
- User is logged in as admin
- `localStorage.getItem('pickntrust-admin-session') === 'active'`
- Or running on localhost (development)

## Production Deployment Checklist

- [ ] Run database schema fixes
- [ ] Update environment variables
- [ ] Test admin login functionality
- [ ] Verify travel picks admin controls
- [ ] Check all page admin buttons
- [ ] Test database operations

## Testing Steps

1. **Test Admin Login**:
   - Go to `/admin` or admin login page
   - Enter correct password
   - Verify localStorage is set
   - Check admin controls appear

2. **Test Travel Picks**:
   - Navigate to travel picks page
   - Hover over products
   - Verify delete/share buttons appear
   - Test + add button functionality

3. **Test Database Operations**:
   - Try adding new products
   - Test announcements
   - Verify all CRUD operations

## Common Production Issues

### Issue: "Wrong Password" Error
**Solution**: 
- Check environment variables are set correctly
- Verify password hashing matches between local and production
- Ensure admin session management works in production

### Issue: Missing Admin Buttons
**Solution**:
- Verify localStorage admin session is set
- Check that admin authentication logic works in production
- Ensure CSS and JavaScript are properly loaded

### Issue: Database Errors
**Solution**:
- Run the schema fix SQL commands
- Check database connection in production
- Verify all required tables exist

## Files Modified

1. `server/routes.ts` - Fixed featuredProducts duplicate declaration
2. `client/src/pages/travel-picks.tsx` - Added localhost admin check
3. `fix-announcements-schema.sql` - Database schema fix

Apply these fixes in order and test each step before proceeding to the next.