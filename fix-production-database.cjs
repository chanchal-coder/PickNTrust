const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Fixing production database schema...');

// Try both possible database locations
const possiblePaths = [
  path.join(__dirname, 'database.sqlite'),
  path.join(__dirname, 'sqlite.db'),
  '/home/ec2-user/PickNTrust/database.sqlite',
  '/home/ec2-user/PickNTrust/sqlite.db'
];

let dbPath = null;
for (const testPath of possiblePaths) {
  try {
    const fs = require('fs');
    if (fs.existsSync(testPath)) {
      dbPath = testPath;
      console.log(`Success Found database at: ${dbPath}`);
      break;
    }
  } catch (error) {
    // Continue searching
  }
}

if (!dbPath) {
  console.error('Error Could not find database file');
  process.exit(1);
}

const db = new Database(dbPath);

try {
  console.log('\n=== PRODUCTION DATABASE SCHEMA FIX ===\n');
  
  // 1. Check current products table structure
  console.log('1️⃣ Checking current products table structure:');
  const columns = db.prepare("PRAGMA table_info(products)").all();
  console.log('Current columns:');
  columns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // 2. Add missing columns to products table
  console.log('\n2️⃣ Adding missing columns to products table:');
  
  const missingColumns = [
    { name: 'is_service', type: 'INTEGER', default: '0' },
    { name: 'custom_fields', type: 'TEXT', default: 'NULL' },
    { name: 'has_timer', type: 'INTEGER', default: '0' },
    { name: 'timer_duration', type: 'INTEGER', default: 'NULL' },
    { name: 'timer_start_time', type: 'INTEGER', default: 'NULL' },
    { name: 'gender', type: 'TEXT', default: 'NULL' },
    { name: 'is_new', type: 'INTEGER', default: '0' }
  ];
  
  missingColumns.forEach(col => {
    const existingColumn = columns.find(c => c.name === col.name);
    if (!existingColumn) {
      try {
        const sql = `ALTER TABLE products ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`;
        db.prepare(sql).run();
        console.log(`   Success Added column: ${col.name} ${col.type}`);
      } catch (error) {
        console.log(`   Error Failed to add ${col.name}: ${error.message}`);
      }
    } else {
      console.log(`   Success Column ${col.name} already exists`);
    }
  });
  
  // 3. Create video_content table if missing
  console.log('\n3️⃣ Creating video_content table:');
  
  try {
    // Check if table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='video_content'").get();
    
    if (!tableExists) {
      const createVideoContentTable = `
        CREATE TABLE video_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          platform TEXT NOT NULL DEFAULT 'YouTube',
          category TEXT,
          tags TEXT,
          duration INTEGER,
          view_count INTEGER DEFAULT 0,
          is_featured INTEGER DEFAULT 0,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER
        )
      `;
      
      db.prepare(createVideoContentTable).run();
      console.log('   Success Created video_content table');
      
      // Create indexes
      db.prepare('CREATE INDEX idx_video_content_platform ON video_content(platform)').run();
      db.prepare('CREATE INDEX idx_video_content_category ON video_content(category)').run();
      db.prepare('CREATE INDEX idx_video_content_featured ON video_content(is_featured)').run();
      db.prepare('CREATE INDEX idx_video_content_created_at ON video_content(created_at)').run();
      console.log('   Success Created video_content indexes');
      
    } else {
      console.log('   Success video_content table already exists');
    }
  } catch (error) {
    console.log(`   Error Failed to create video_content table: ${error.message}`);
  }
  
  // 4. Fix timer column types if needed
  console.log('\n4️⃣ Checking timer column types:');
  
  const updatedColumns = db.prepare("PRAGMA table_info(products)").all();
  const timerStartTimeCol = updatedColumns.find(col => col.name === 'timer_start_time');
  
  if (timerStartTimeCol && timerStartTimeCol.type === 'TEXT') {
    console.log('   🔧 Converting timer_start_time from TEXT to INTEGER...');
    try {
      // Create backup
      db.prepare('CREATE TABLE products_backup AS SELECT * FROM products').run();
      
      // Update TEXT timestamps to INTEGER (Unix timestamps)
      db.prepare(`
        UPDATE products 
        SET timer_start_time = CASE 
          WHEN timer_start_time IS NOT NULL AND timer_start_time != '' 
          THEN strftime('%s', timer_start_time)
          ELSE NULL 
        END
      `).run();
      
      console.log('   Success Converted timer_start_time to INTEGER');
    } catch (error) {
      console.log(`   Error Failed to convert timer_start_time: ${error.message}`);
    }
  } else {
    console.log('   Success timer_start_time column type is correct');
  }
  
  // 5. Verify the fixes
  console.log('\n5️⃣ Verifying fixes:');
  
  // Test products table
  try {
    const testProduct = db.prepare(`
      INSERT INTO products (
        name, description, price, image_url, affiliate_url, category,
        rating, review_count, is_service, custom_fields, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Test Product',
      'Test Description',
      100,
      'https://example.com/image.jpg',
      'https://example.com/affiliate',
      'Test Category',
      4.5,
      100,
      0,
      '{}',
      Math.floor(Date.now() / 1000)
    );
    
    console.log(`   Success Products table test successful (ID: ${testProduct.lastInsertRowid})`);
    
    // Clean up test product
    db.prepare('DELETE FROM products WHERE id = ?').run(testProduct.lastInsertRowid);
    
  } catch (error) {
    console.log(`   Error Products table test failed: ${error.message}`);
  }
  
  // Test video_content table
  try {
    const testVideo = db.prepare(`
      INSERT INTO video_content (
        title, description, video_url, platform, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      'Test Video',
      'Test Description',
      'https://youtube.com/watch?v=test',
      'YouTube',
      Math.floor(Date.now() / 1000)
    );
    
    console.log(`   Success Video content table test successful (ID: ${testVideo.lastInsertRowid})`);
    
    // Clean up test video
    db.prepare('DELETE FROM video_content WHERE id = ?').run(testVideo.lastInsertRowid);
    
  } catch (error) {
    console.log(`   Error Video content table test failed: ${error.message}`);
  }
  
  // 6. Final schema verification
  console.log('\n6️⃣ Final schema verification:');
  
  const finalColumns = db.prepare("PRAGMA table_info(products)").all();
  console.log('Products table columns:');
  finalColumns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nAll tables:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  console.log('\nSuccess Production database schema fix completed!');
  console.log('\nRefresh Please restart the server to apply changes:');
  console.log('   pm2 restart all');
  
} catch (error) {
  console.error('Error Error fixing production database:', error.message);
} finally {
  db.close();
  console.log('\nDatabase connection closed');
}
