# Canva Template Management Database

## Overview

This document describes the database schema and setup for the Canva template management system that was created to support the frontend template management interface.

## Database Tables

### 1. `canva_settings`
Stores global Canva integration settings.

**Columns:**
- `id` - Primary key
- `is_enabled` - Whether Canva integration is enabled
- `api_key` - Canva API key
- `api_secret` - Canva API secret
- `default_template_id` - Default template ID (legacy)
- `auto_generate_captions` - Auto-generate captions setting
- `auto_generate_hashtags` - Auto-generate hashtags setting
- `default_caption` - Default caption text
- `default_hashtags` - Default hashtags
- `platforms` - JSON array of selected social media platforms
- `schedule_type` - 'immediate' or 'scheduled'
- `schedule_delay_minutes` - Delay in minutes for scheduled posts
- `enable_blog_posts` - Enable for blog posts
- `enable_videos` - Enable for video content
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### 2. `canva_platform_templates`
Stores platform-specific Canva templates.

**Columns:**
- `id` - Primary key
- `platform` - Platform identifier (instagram, instagram-reels, facebook, etc.)
- `template_id` - Canva template ID
- `is_default` - Whether this is the default template for the platform
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Supported Platforms:**
- `instagram` - Instagram posts
- `instagram-reels` - Instagram Reels
- `facebook` - Facebook posts
- `twitter` - Twitter/X posts
- `whatsapp` - WhatsApp messages
- `telegram` - Telegram messages
- `youtube` - YouTube videos
- `youtube-shorts` - YouTube Shorts

### 3. `canva_extra_templates`
Stores additional templates not tied to specific platforms.

**Columns:**
- `id` - Primary key
- `template_id` - Canva template ID
- `name` - Optional template name
- `description` - Optional template description
- `is_default` - Whether this is the default extra template
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Database Setup

### Files Created:

1. **`shared/schema.ts`** - Updated with Canva table definitions
2. **`migrations/create-canva-tables.sql`** - PostgreSQL migration script
3. **`setup-canva-database.cjs`** - Database setup script
4. **`init-canva-db.cjs`** - SQLite table initialization
5. **`migrate-canva-columns.cjs`** - Column migration script
6. **`test-canva-db.cjs`** - Database testing script
7. **`check-db-structure.cjs`** - Database structure inspection

### Setup Process:

1. **Schema Definition**: Added TypeScript schema definitions to `shared/schema.ts`
2. **Table Creation**: Created SQLite tables using `init-canva-db.cjs`
3. **Column Migration**: Added missing columns using `migrate-canva-columns.cjs`
4. **Testing**: Verified functionality with `test-canva-db.cjs`

## Current Database State

✅ **Tables Created:**
- `canva_settings` - Global settings
- `canva_platform_templates` - Platform-specific templates
- `canva_extra_templates` - Additional templates
- `canva_posts` - Post tracking (existing)
- `canva_templates` - Template metadata (existing)

✅ **Sample Data:**
- Default settings record with sample caption and hashtags
- Sample platform templates for testing
- Sample extra templates for testing

✅ **Indexes:**
- Platform-based indexing for fast queries
- Default template indexing for quick lookups

## Integration with Frontend

The database schema supports all the features implemented in the frontend:

### Template Management:
- ✅ Platform-specific templates (8 platforms supported)
- ✅ Extra templates with names and descriptions
- ✅ Default template selection (nullable for flexibility)
- ✅ Add/delete template functionality

### Settings Management:
- ✅ Global Canva API configuration
- ✅ Default captions and hashtags
- ✅ Platform selection
- ✅ Auto-generation toggles
- ✅ Scheduling options

### Data Types:
- ✅ JSON arrays for platform lists
- ✅ Boolean flags for toggles
- ✅ Text fields for templates and content
- ✅ Timestamps for tracking

## Usage Examples

### Query Default Templates:
```sql
SELECT platform, template_id 
FROM canva_platform_templates 
WHERE is_default = 1;
```

### Get Settings:
```sql
SELECT * FROM canva_settings LIMIT 1;
```

### Add New Template:
```sql
INSERT INTO canva_platform_templates 
(platform, template_id, is_default) 
VALUES ('instagram', 'NEW_TEMPLATE_ID', 0);
```

### Update Default Template:
```sql
-- First, unset current default
UPDATE canva_platform_templates 
SET is_default = 0 
WHERE platform = 'instagram' AND is_default = 1;

-- Then set new default
UPDATE canva_platform_templates 
SET is_default = 1 
WHERE id = ?;
```

## Next Steps

1. **API Integration**: Create API endpoints to connect frontend to database
2. **Data Validation**: Add proper validation for template IDs and settings
3. **Error Handling**: Implement robust error handling for database operations
4. **Backup Strategy**: Set up regular database backups
5. **Performance Monitoring**: Monitor query performance as data grows

## Testing

Run the test suite to verify database functionality:

```bash
node test-canva-db.cjs
```

This will:
- ✅ Verify all tables exist
- ✅ Test CRUD operations
- ✅ Validate data integrity
- ✅ Check default settings
- ✅ Confirm template management works

## Maintenance

### Check Database Structure:
```bash
node check-db-structure.cjs
```

### Re-run Migration:
```bash
node migrate-canva-columns.cjs
```

### Initialize Fresh Database:
```bash
node init-canva-db.cjs
```

---

**Status: ✅ COMPLETE**

The Canva template management database is fully set up and tested. All frontend features are supported by the database schema, and sample data has been inserted for testing purposes.