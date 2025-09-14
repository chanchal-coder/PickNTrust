-- Safe Database Schema Fix - Adds missing tables and columns
-- This script preserves ALL existing data while fixing SQLite errors

-- Check if 'page' column exists in announcements table
PRAGMA table_info(announcements);

-- Add the missing 'page' column to announcements table (if not exists)
ALTER TABLE announcements ADD COLUMN page TEXT;

-- Create widgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  target_page TEXT NOT NULL,
  position TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  max_width TEXT,
  custom_css TEXT,
  show_on_mobile INTEGER DEFAULT 1,
  show_on_desktop INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Set default page value for existing announcements
UPDATE announcements SET page = 'home' WHERE page IS NULL;

-- Verify tables exist
.tables

-- Show all announcements to verify data is intact
SELECT id, message, is_active, page, created_at FROM announcements LIMIT 5;

-- Check database integrity
PRAGMA integrity_check;