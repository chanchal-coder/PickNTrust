const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Adding missing columns to production database...');

// Production database path (based on logs showing sqlite.db)
const dbPath = path.join(__dirname, 'sqlite.db');

try {
  const db = new Database(dbPath);
  
  console.log(`Success Connected to database: ${dbPath}`);
  
  // Get current table structure
  console.log('\n📋 Current products table structure:');
  const currentColumns = db.prepare("PRAGMA table_info(products)").all();
  currentColumns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  // Define missing columns that need to be added
  const columnsToAdd = [
    { name: 'is_service', sql: 'ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0' },
    { name: 'custom_fields', sql: 'ALTER TABLE products ADD COLUMN custom_fields TEXT' },
    { name: 'has_timer', sql: 'ALTER TABLE products ADD COLUMN has_timer INTEGER DEFAULT 0' },
    { name: 'timer_duration', sql: 'ALTER TABLE products ADD COLUMN timer_duration INTEGER' },
    { name: 'timer_start_time', sql: 'ALTER TABLE products ADD COLUMN timer_start_time INTEGER' },
    { name: 'gender', sql: 'ALTER TABLE products ADD COLUMN gender TEXT' },
    { name: 'is_new', sql: 'ALTER TABLE products ADD COLUMN is_new INTEGER DEFAULT 0' },
    { name: 'affiliate_network_id', sql: 'ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER' }
  ];
  
  console.log('\n🔧 Adding missing columns:');
  
  let addedCount = 0;
  
  columnsToAdd.forEach(column => {
    const exists = currentColumns.find(col => col.name === column.name);
    
    if (!exists) {
      try {
        db.prepare(column.sql).run();
        console.log(`   Success Added: ${column.name}`);
        addedCount++;
      } catch (error) {
        console.log(`   Error Failed to add ${column.name}: ${error.message}`);
      }
    } else {
      console.log(`   ⏭️  Already exists: ${column.name}`);
    }
  });
  
  // Create video_content table if it doesn't exist
  console.log('\n📺 Checking video_content table:');
  
  const videoTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='video_content'").get();
  
  if (!videoTableExists) {
    try {
      const createVideoTable = `
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
      
      db.prepare(createVideoTable).run();
      console.log('   Success Created video_content table');
      
      // Add indexes
      db.prepare('CREATE INDEX idx_video_content_platform ON video_content(platform)').run();
      db.prepare('CREATE INDEX idx_video_content_featured ON video_content(is_featured)').run();
      console.log('   Success Added video_content indexes');
      
    } catch (error) {
      console.log(`   Error Failed to create video_content table: ${error.message}`);
    }
  } else {
    console.log('   ⏭️  video_content table already exists');
  }
  
  // Verify the changes
  console.log('\nSuccess Verification - Updated products table structure:');
  const updatedColumns = db.prepare("PRAGMA table_info(products)").all();
  updatedColumns.forEach(col => {
    const isNew = !currentColumns.find(c => c.name === col.name);
    console.log(`   ${isNew ? '🆕' : '  '} ${col.name}: ${col.type}`);
  });
  
  // Test the fix by trying to insert a product with is_service
  console.log('\n🧪 Testing the fix:');
  try {
    const testInsert = db.prepare(`
      INSERT INTO products (
        name, description, price, image_url, affiliate_url, category,
        rating, review_count, is_service, custom_fields, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = testInsert.run(
      'Test Service Product',
      'Testing is_service column',
      0,
      'https://example.com/test.jpg',
      'https://example.com/test',
      'Credit Cards',
      4.5,
      100,
      1, // is_service = true
      '{"serviceType":"test"}',
      Math.floor(Date.now() / 1000)
    );
    
    console.log(`   Success Successfully inserted test service product (ID: ${result.lastInsertRowid})`);
    
    // Clean up test data
    db.prepare('DELETE FROM products WHERE id = ?').run(result.lastInsertRowid);
    console.log('   Cleanup Cleaned up test data');
    
  } catch (error) {
    console.log(`   Error Test failed: ${error.message}`);
  }
  
  db.close();
  
  console.log(`\nCelebration Successfully added ${addedCount} missing columns!`);
  console.log('\nRefresh Next steps:');
  console.log('1. Restart PM2: pm2 restart all');
  console.log('2. Check logs: pm2 logs --lines 10');
  console.log('3. Test admin panel - try adding a product');
  
} catch (error) {
  console.error('Error Error:', error.message);
  console.log('\nTip Troubleshooting:');
  console.log('- Make sure you are in the correct directory');
  console.log('- Check if sqlite.db file exists');
  console.log('- Ensure you have write permissions');
}
