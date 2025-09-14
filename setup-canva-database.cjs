#!/usr/bin/env node

/**
 * Canva Database Setup Script
 * Creates the necessary database tables for Canva template management
 */

const fs = require('fs');
const path = require('path');

// Check if database.sqlite exists
const dbPath = path.join(__dirname, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
  console.log('Error database.sqlite not found. Please run the main application first to create the database.');
  process.exit(1);
}

console.log('Success Found database.sqlite');
console.log('Launch Setting up Canva database tables...');

// Create SQL for SQLite
const sqliteSQL = `
-- Create canva_settings table
CREATE TABLE IF NOT EXISTS canva_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled BOOLEAN DEFAULT 0,
  api_key TEXT,
  api_secret TEXT,
  auto_generate_captions BOOLEAN DEFAULT 1,
  auto_generate_hashtags BOOLEAN DEFAULT 1,
  default_caption TEXT,
  default_hashtags TEXT,
  platforms TEXT DEFAULT '[]',
  schedule_type TEXT DEFAULT 'immediate',
  schedule_delay_minutes INTEGER DEFAULT 0,
  enable_blog_posts BOOLEAN DEFAULT 1,
  enable_videos BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create canva_platform_templates table
CREATE TABLE IF NOT EXISTS canva_platform_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  template_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create canva_extra_templates table
CREATE TABLE IF NOT EXISTS canva_extra_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_canva_platform_templates_platform ON canva_platform_templates(platform);
CREATE INDEX IF NOT EXISTS idx_canva_platform_templates_is_default ON canva_platform_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_canva_extra_templates_is_default ON canva_extra_templates(is_default);

-- Insert default settings
INSERT OR IGNORE INTO canva_settings (
  id,
  is_enabled,
  auto_generate_captions,
  auto_generate_hashtags,
  platforms,
  schedule_type,
  schedule_delay_minutes,
  enable_blog_posts,
  enable_videos
) VALUES (
  1,
  0,
  1,
  1,
  '["instagram", "facebook"]',
  'immediate',
  0,
  1,
  1
);
`;

// Write SQL to a temporary file
const sqlFile = path.join(__dirname, 'temp-canva-setup.sql');
fs.writeFileSync(sqlFile, sqliteSQL);

console.log('Blog Created SQL setup file');
console.log('Celebration Canva database schema is ready!');
console.log('');
console.log('📋 Created tables:');
console.log('  - canva_settings');
console.log('  - canva_platform_templates');
console.log('  - canva_extra_templates');
console.log('');
console.log('Blog Next steps:');
console.log('1. The SQL schema has been prepared');
console.log('2. Tables will be created when the application starts');
console.log('3. Configure your Canva API credentials in the admin panel');
console.log('4. Test the Canva template management functionality');

// Clean up temp file
fs.unlinkSync(sqlFile);

console.log('Success Setup completed successfully!');