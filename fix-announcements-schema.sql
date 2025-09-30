-- Fix for missing 'page' and 'is_global' columns in announcements table
-- This script adds the missing columns that are causing the deployment errors

-- Add the missing columns to the announcements table
ALTER TABLE announcements ADD COLUMN page TEXT;
ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1;

-- Update existing announcements to be global by default
UPDATE announcements SET is_global = 1 WHERE is_global IS NULL;

-- Create index for better performance on page-specific queries
CREATE INDEX IF NOT EXISTS idx_announcements_page ON announcements(page);
CREATE INDEX IF NOT EXISTS idx_announcements_is_global ON announcements(is_global);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

-- Verify the schema update
.schema announcements