#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 CHECKING DATABASE AND SCHEMA...\n');

try {
  // 1. Check current database structure
  console.log('📁 Step 1: Checking current database structure...');
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  console.log(`Database path: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database file does not exist!');
    process.exit(1);
  }

  const db = new Database(dbPath);
  console.log('✅ Connected to database');

  // Check all tables
  console.log('\n📋 Current tables in database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });

  // Check if canva_settings table exists
  const canvaSettingsExists = tables.some(table => table.name === 'canva_settings');
  console.log(`\n🎨 canva_settings table exists: ${canvaSettingsExists ? '✅ YES' : '❌ NO'}`);

  if (canvaSettingsExists) {
    console.log('\n📊 canva_settings table structure:');
    const columns = db.prepare("PRAGMA table_info(canva_settings)").all();
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

    console.log('\n📄 Current canva_settings data:');
    const data = db.prepare("SELECT * FROM canva_settings").all();
    console.log(data);
  }

  db.close();

  // 2. Check schema files
  console.log('\n📁 Step 2: Checking schema files...');
  
  const schemaPath = path.join(process.cwd(), 'shared', 'sqlite-schema.ts');
  if (fs.existsSync(schemaPath)) {
    console.log('✅ Found shared/sqlite-schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (schemaContent.includes('canvaSettings')) {
      console.log('✅ canvaSettings table defined in schema');
      
      // Check if it has the new fields
      if (schemaContent.includes('defaultCaption') && schemaContent.includes('defaultHashtags')) {
        console.log('✅ Manual caption/hashtag fields found in schema');
      } else {
        console.log('❌ Manual caption/hashtag fields MISSING from schema');
        console.log('🔧 This is likely the root cause of the issue!');
      }
    } else {
      console.log('❌ canvaSettings table NOT defined in schema');
      console.log('🔧 This is the root cause of the issue!');
    }
  } else {
    console.log('❌ shared/sqlite-schema.ts not found');
  }

  // 3. Check storage.ts
  const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
  if (fs.existsSync(storagePath)) {
    console.log('✅ Found server/storage.ts');
    const storageContent = fs.readFileSync(storagePath, 'utf8');
    
    if (storageContent.includes('updateCanvaSettings')) {
      console.log('✅ updateCanvaSettings method found');
      
      if (storageContent.includes('default_caption') && storageContent.includes('default_hashtags')) {
        console.log('✅ Manual caption/hashtag fields handled in storage');
      } else {
        console.log('❌ Manual caption/hashtag fields NOT handled in storage');
      }
    } else {
      console.log('❌ updateCanvaSettings method not found');
    }
  } else {
    console.log('❌ server/storage.ts not found');
  }

  console.log('\n🎯 DIAGNOSIS:');
  console.log('The error "no such table: canva_settings" suggests that:');
  console.log('1. Either the table doesn\'t exist in the database');
  console.log('2. OR the Drizzle ORM schema doesn\'t define the table');
  console.log('3. OR there\'s a mismatch between schema and database');
  
  console.log('\n🔧 SOLUTION NEEDED:');
  console.log('1. Add canvaSettings table to shared/sqlite-schema.ts');
  console.log('2. Include defaultCaption and defaultHashtags fields');
  console.log('3. Run database migration to create the table');
  console.log('4. Update storage.ts to use the new schema');

} catch (error) {
  console.error('❌ Error checking database and schema:', error);
  process.exit(1);
}
