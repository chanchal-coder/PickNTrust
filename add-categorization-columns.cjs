const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 ADDING CATEGORIZATION COLUMNS TO UNIFIED_CONTENT');
console.log('==================================================');

try {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  console.log('✅ Connected to database:', dbPath);
  
  // Check current table structure
  console.log('\n1. Checking current table structure...');
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  const columnNames = tableInfo.map(col => col.name);
  console.log('Current columns:', columnNames);
  
  // Check if columns already exist
  const hasIsService = columnNames.includes('is_service');
  const hasIsAIApp = columnNames.includes('is_ai_app');
  
  console.log('\n2. Adding missing categorization columns...');
  
  if (!hasIsService) {
    console.log('➕ Adding is_service column...');
    db.prepare('ALTER TABLE unified_content ADD COLUMN is_service INTEGER DEFAULT 0').run();
    console.log('✅ Added is_service column');
  } else {
    console.log('✅ is_service column already exists');
  }
  
  if (!hasIsAIApp) {
    console.log('➕ Adding is_ai_app column...');
    db.prepare('ALTER TABLE unified_content ADD COLUMN is_ai_app INTEGER DEFAULT 0').run();
    console.log('✅ Added is_ai_app column');
  } else {
    console.log('✅ is_ai_app column already exists');
  }
  
  // Add processing_status and visibility columns if they don't exist
  const hasProcessingStatus = columnNames.includes('processing_status');
  const hasVisibility = columnNames.includes('visibility');
  const hasSourcePlatform = columnNames.includes('source_platform');
  
  if (!hasProcessingStatus) {
    console.log('➕ Adding processing_status column...');
    db.prepare('ALTER TABLE unified_content ADD COLUMN processing_status TEXT DEFAULT "active"').run();
    console.log('✅ Added processing_status column');
  }
  
  if (!hasVisibility) {
    console.log('➕ Adding visibility column...');
    db.prepare('ALTER TABLE unified_content ADD COLUMN visibility TEXT DEFAULT "public"').run();
    console.log('✅ Added visibility column');
  }
  
  if (!hasSourcePlatform) {
    console.log('➕ Adding source_platform column...');
    db.prepare('ALTER TABLE unified_content ADD COLUMN source_platform TEXT').run();
    console.log('✅ Added source_platform column');
  }
  
  // Verify the updated table structure
  console.log('\n3. Verifying updated table structure...');
  const updatedTableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Updated unified_content columns:');
  updatedTableInfo.forEach(col => {
    const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
    const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
    console.log(`  - ${col.name}: ${col.type} ${nullable}${defaultVal}`);
  });
  
  // Test insert to verify schema compatibility
  console.log('\n4. Testing schema compatibility...');
  const testInsertSQL = `
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_platform, source_id,
      affiliate_platform, rating, review_count, discount, currency,
      is_active, is_featured, is_service, is_ai_app, display_order, display_pages,
      has_timer, timer_duration, timer_start_time, processing_status,
      visibility, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const testValues = [
    'Test Categorization Product',
    'Test product for categorization system',
    '999',
    '1499',
    'https://via.placeholder.com/300x300?text=Test',
    'https://example.com/test-product',
    'product',
    'test-page',
    'test-category',
    'telegram',
    'telegram',
    'test-channel',
    'amazon',
    '4.0',
    100,
    33,
    'INR',
    1, // is_active
    0, // is_featured
    0, // is_service
    0, // is_ai_app
    0, // display_order
    JSON.stringify(['test-page']),
    0, // has_timer
    null, // timer_duration
    null, // timer_start_time
    'active', // processing_status
    'public', // visibility
    Math.floor(Date.now() / 1000), // created_at
    Math.floor(Date.now() / 1000)  // updated_at
  ];
  
  const result = db.prepare(testInsertSQL).run(...testValues);
  console.log(`✅ Test insert successful (ID: ${result.lastInsertRowid})`);
  
  // Clean up test record
  db.prepare('DELETE FROM unified_content WHERE id = ?').run(result.lastInsertRowid);
  console.log('✅ Test record cleaned up');
  
  db.close();
  
  console.log('\n🎉 CATEGORIZATION COLUMNS ADDED SUCCESSFULLY!');
  console.log('==============================================');
  console.log('✅ is_service column added for service products');
  console.log('✅ is_ai_app column added for AI/app products');
  console.log('✅ Schema is compatible with bot insertion logic');
  console.log('✅ Ready for smart categorization implementation');
  
} catch (error) {
  console.error('❌ Error adding categorization columns:', error.message);
  console.error('Stack trace:', error.stack);
}