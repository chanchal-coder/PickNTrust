#!/usr/bin/env node

const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 ULTIMATE DATABASE FIX - CANVA SETTINGS TABLE');
console.log('================================================\n');

// Function to execute command on remote server
function executeRemoteCommand(command) {
  console.log(`Refresh Executing: ${command}`);
  try {
    const result = execSync(`ssh ec2-user@your-server "cd /home/ec2-user/PickNTrust && ${command}"`, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return result;
  } catch (error) {
    console.error(`Error Command failed: ${error.message}`);
    return null;
  }
}

// Step 1: Check which database files exist on server
console.log('📋 Step 1: Checking database files on server...');
console.log('\nSearch Please run these commands on your server:');
console.log('ssh ec2-user@your-server');
console.log('cd /home/ec2-user/PickNTrust');
console.log('ls -la *.db *.sqlite');
console.log('');

// Step 2: Create the fix commands
console.log('🛠️ Step 2: Database fix commands to run on server:');
console.log('');

const commands = [
  '# Stop PM2 processes',
  'pm2 stop all',
  '',
  '# Check which database files exist',
  'ls -la *.db *.sqlite',
  '',
  '# Create canva_settings table in sqlite.db (main database)',
  'sqlite3 sqlite.db "DROP TABLE IF EXISTS canva_settings;"',
  '',
  'sqlite3 sqlite.db "CREATE TABLE canva_settings (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  is_enabled INTEGER DEFAULT 0,',
  '  api_key TEXT,',
  '  api_secret TEXT,',
  '  default_template_id TEXT,',
  '  auto_generate_captions INTEGER DEFAULT 1,',
  '  auto_generate_hashtags INTEGER DEFAULT 1,',
  '  default_caption TEXT,',
  '  default_hashtags TEXT,',
  '  platforms TEXT DEFAULT \'[]\',',
  '  schedule_type TEXT DEFAULT \'immediate\',',
  '  schedule_delay_minutes INTEGER DEFAULT 0,',
  '  created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')),',
  '  updated_at INTEGER DEFAULT (strftime(\'%s\', \'now\'))',
  ');"',
  '',
  '# Insert default settings',
  'sqlite3 sqlite.db "INSERT INTO canva_settings (',
  '  is_enabled, auto_generate_captions, auto_generate_hashtags,',
  '  default_caption, default_hashtags, platforms, schedule_type, schedule_delay_minutes',
  ') VALUES (',
  '  0, 1, 1,',
  '  \'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!\',',
  '  \'#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India\',',
  '  \'[\"instagram\",\"facebook\"]\', \'immediate\', 0',
  ');"',
  '',
  '# Create other Canva tables',
  'sqlite3 sqlite.db "CREATE TABLE IF NOT EXISTS canva_posts (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  content_type TEXT NOT NULL,',
  '  content_id INTEGER NOT NULL,',
  '  canva_design_id TEXT,',
  '  template_id TEXT,',
  '  caption TEXT,',
  '  hashtags TEXT,',
  '  platforms TEXT,',
  '  post_urls TEXT,',
  '  status TEXT DEFAULT \'pending\',',
  '  scheduled_at INTEGER,',
  '  posted_at INTEGER,',
  '  expires_at INTEGER,',
  '  created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')),',
  '  updated_at INTEGER DEFAULT (strftime(\'%s\', \'now\'))',
  ');"',
  '',
  'sqlite3 sqlite.db "CREATE TABLE IF NOT EXISTS canva_templates (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  template_id TEXT NOT NULL UNIQUE,',
  '  name TEXT NOT NULL,',
  '  type TEXT NOT NULL,',
  '  category TEXT,',
  '  thumbnail_url TEXT,',
  '  is_active INTEGER DEFAULT 1,',
  '  created_at INTEGER DEFAULT (strftime(\'%s\', \'now\'))',
  ');"',
  '',
  '# Verify tables were created',
  'sqlite3 sqlite.db ".tables" | grep canva',
  'sqlite3 sqlite.db "SELECT * FROM canva_settings;"',
  '',
  '# Restart PM2',
  'pm2 restart all',
  '',
  '# Check PM2 status',
  'pm2 status',
  '',
  '# Check logs for any errors',
  'pm2 logs --lines 10'
];

commands.forEach(cmd => console.log(cmd));

console.log('\nBlog COPY AND PASTE SCRIPT:');
console.log('========================');
console.log('#!/bin/bash');
console.log('cd /home/ec2-user/PickNTrust');
console.log('pm2 stop all');
console.log('sqlite3 sqlite.db "DROP TABLE IF EXISTS canva_settings;"');
console.log('sqlite3 sqlite.db "CREATE TABLE canva_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, is_enabled INTEGER DEFAULT 0, api_key TEXT, api_secret TEXT, default_template_id TEXT, auto_generate_captions INTEGER DEFAULT 1, auto_generate_hashtags INTEGER DEFAULT 1, default_caption TEXT, default_hashtags TEXT, platforms TEXT DEFAULT \'[]\', schedule_type TEXT DEFAULT \'immediate\', schedule_delay_minutes INTEGER DEFAULT 0, created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')), updated_at INTEGER DEFAULT (strftime(\'%s\', \'now\')));"');
console.log('sqlite3 sqlite.db "INSERT INTO canva_settings (is_enabled, auto_generate_captions, auto_generate_hashtags, default_caption, default_hashtags, platforms, schedule_type, schedule_delay_minutes) VALUES (0, 1, 1, \'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!\', \'#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India\', \'[\"instagram\",\"facebook\"]\', \'immediate\', 0);"');
console.log('sqlite3 sqlite.db "CREATE TABLE IF NOT EXISTS canva_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, content_type TEXT NOT NULL, content_id INTEGER NOT NULL, canva_design_id TEXT, template_id TEXT, caption TEXT, hashtags TEXT, platforms TEXT, post_urls TEXT, status TEXT DEFAULT \'pending\', scheduled_at INTEGER, posted_at INTEGER, expires_at INTEGER, created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')), updated_at INTEGER DEFAULT (strftime(\'%s\', \'now\')));"');
console.log('sqlite3 sqlite.db "CREATE TABLE IF NOT EXISTS canva_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, template_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type TEXT NOT NULL, category TEXT, thumbnail_url TEXT, is_active INTEGER DEFAULT 1, created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')));"');
console.log('sqlite3 sqlite.db "SELECT * FROM canva_settings;"');
console.log('pm2 restart all');
console.log('pm2 status');

console.log('\nTarget WHAT THIS FIXES:');
console.log('==================');
console.log('Success Creates canva_settings table in the correct database (sqlite.db)');
console.log('Success Adds default_caption and default_hashtags fields for manual templates');
console.log('Success Creates canva_posts and canva_templates tables');
console.log('Success Inserts default settings with manual caption/hashtag templates');
console.log('Success Restarts PM2 to apply changes');
console.log('Success Resolves "SqliteError: no such table: canva_settings" error');

console.log('\nAlert IMPORTANT:');
console.log('=============');
console.log('The server code is looking for canva_settings table but it doesn\'t exist.');
console.log('This script creates the table in sqlite.db (the database the server uses).');
console.log('After running this, the admin automation panel should work without errors.');

console.log('\nSuccess EXPECTED RESULT:');
console.log('==================');
console.log('- No more "SqliteError: no such table: canva_settings" errors');
console.log('- Admin automation panel loads successfully');
console.log('- Manual caption/hashtag fields appear when auto-generation is disabled');
console.log('- Settings can be saved without database errors');
console.log('- Platform connection status displays correctly');
