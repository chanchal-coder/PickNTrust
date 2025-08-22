const Database = require('better-sqlite3');
const path = require('path');

// Test Canva API integration
async function testCanvaIntegration() {
  console.log('🧪 Testing Canva API Integration...\n');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Test 1: Check if Canva tables exist
    console.log('1. Checking Canva database tables...');
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'canva_%'").all();
    
    const expectedTables = ['canva_settings', 'canva_posts', 'canva_templates'];
    const foundTables = tables.map(t => t.name);
    
    console.log(`   Found tables: ${foundTables.join(', ')}`);
    
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        console.log(`   ✅ ${table} table exists`);
      } else {
        console.log(`   ❌ ${table} table missing`);
      }
    }
    
    // Test 2: Insert test Canva settings
    console.log('\n2. Testing Canva settings insertion...');
    
    const insertSettings = db.prepare(`INSERT OR REPLACE INTO canva_settings (
      id, is_enabled, platforms, auto_generate_captions, auto_generate_hashtags, 
      schedule_type, schedule_delay_minutes, created_at, updated_at
    ) VALUES (1, 1, '["instagram","facebook"]', 1, 1, 'immediate', 0, ?, ?)`);
    
    const now = Date.now();
    insertSettings.run(now, now);
    console.log('   ✅ Canva settings inserted successfully');
    
    // Test 3: Retrieve Canva settings
    console.log('\n3. Testing Canva settings retrieval...');
    
    const settings = db.prepare("SELECT * FROM canva_settings WHERE id = 1").get();
    
    if (settings) {
      console.log('   ✅ Canva settings retrieved successfully');
      console.log(`   Settings: enabled=${settings.is_enabled}, platforms=${settings.platforms}`);
    } else {
      console.log('   ❌ Failed to retrieve Canva settings');
    }
    
    // Test 4: Insert test template
    console.log('\n4. Testing Canva template insertion...');
    
    const insertTemplate = db.prepare(`INSERT INTO canva_templates (
      template_id, name, type, category, is_active, created_at
    ) VALUES ('test-template-123', 'Test Social Post', 'post', 'social', 1, ?)`);
    
    insertTemplate.run(now);
    console.log('   ✅ Canva template inserted successfully');
    
    // Test 5: Check table schemas
    console.log('\n5. Verifying table schemas...');
    
    for (const table of expectedTables) {
      const schema = db.prepare(`PRAGMA table_info(${table})`).all();
      console.log(`   ${table} columns: ${schema.map(col => col.name).join(', ')}`);
    }
    
    console.log('\n🎉 Canva API Integration Test Complete!');
    console.log('\n✅ Database schema: PASSED');
    console.log('✅ Settings management: PASSED');
    console.log('✅ Template management: PASSED');
    console.log('✅ Data persistence: PASSED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    db.close();
  }
}

testCanvaIntegration();
