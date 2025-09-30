const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Fixing display_pages format in unified_content table...\n');

try {
  // First, let's see what we're working with
  console.log('📊 Current display_pages formats:');
  const currentFormats = db.prepare(`
    SELECT display_pages, COUNT(*) as count 
    FROM unified_content 
    GROUP BY display_pages
  `).all();
  
  currentFormats.forEach(row => {
    console.log(`  "${row.display_pages}" - ${row.count} entries`);
  });
  
  console.log('\n🔄 Converting string formats to JSON arrays...');
  
  // Get all entries with string format (not starting with '[')
  const stringEntries = db.prepare(`
    SELECT id, display_pages 
    FROM unified_content 
    WHERE display_pages NOT LIKE '[%'
  `).all();
  
  console.log(`Found ${stringEntries.length} entries with string format`);
  
  // Convert each string to JSON array format
  const updateStmt = db.prepare(`
    UPDATE unified_content 
    SET display_pages = ? 
    WHERE id = ?
  `);
  
  let converted = 0;
  
  for (const entry of stringEntries) {
    try {
      // Convert string to JSON array
      const jsonArray = JSON.stringify([entry.display_pages]);
      updateStmt.run(jsonArray, entry.id);
      console.log(`  ✅ Converted "${entry.display_pages}" → ${jsonArray}`);
      converted++;
    } catch (error) {
      console.log(`  ❌ Failed to convert entry ${entry.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Successfully converted ${converted} entries`);
  
  // Verify the results
  console.log('\n📊 Updated display_pages formats:');
  const updatedFormats = db.prepare(`
    SELECT display_pages, COUNT(*) as count 
    FROM unified_content 
    GROUP BY display_pages
  `).all();
  
  updatedFormats.forEach(row => {
    console.log(`  "${row.display_pages}" - ${row.count} entries`);
  });
  
  // Test specific pages
  console.log('\n🧪 Testing specific page queries:');
  
  const testPages = ['prime-picks', 'cue-picks', 'loot-box'];
  
  for (const page of testPages) {
    const jsonQuery = `["${page}"]`;
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE display_pages = ?
    `).get(jsonQuery);
    
    console.log(`  ${page}: ${count.count} entries (JSON format: ${jsonQuery})`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}