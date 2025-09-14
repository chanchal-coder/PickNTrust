-- Migration to add page targeting fields to announcements table
-- Run this SQL script to update the existing database

-- Add page field for page-specific announcements
ALTER TABLE announcements ADD COLUMN page TEXT;

-- Add isGlobal field for global announcements (default to true for existing announcements)
ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1;

-- Update existing announcements to be global by default
UPDATE announcements SET is_global = 1 WHERE is_global IS NULL;

-- Create index for better performance on page filtering
CREATE INDEX IF NOT EXISTS idx_announcements_page ON announcements(page, is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_global ON announcements(is_global, is_active);

-- Verify the changes
SELECT 'Migration completed successfully. New columns added:' as status;
SELECT 'page, is_global' as new_columns;