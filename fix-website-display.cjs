const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Fixing Website Display Issue...\n');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('📊 Current status distribution:');
const statusCounts = db.prepare(`
  SELECT status, COUNT(*) as count 
  FROM unified_content 
  GROUP BY status
`).all();

statusCounts.forEach(row => {
  console.log(`  ${row.status}: ${row.count} entries`);
});

console.log('\n🔄 Updating entries from "active" to "published"...');

// Update all active entries to published status
const updateResult = db.prepare(`
  UPDATE unified_content 
  SET status = 'published' 
  WHERE status = 'active' AND is_active = 1
`).run();

console.log(`✅ Updated ${updateResult.changes} entries to "published" status`);

console.log('\n📊 New status distribution:');
const newStatusCounts = db.prepare(`
  SELECT status, COUNT(*) as count 
  FROM unified_content 
  GROUP BY status
`).all();

newStatusCounts.forEach(row => {
  console.log(`  ${row.status}: ${row.count} entries`);
});

console.log('\n🌐 Checking website display readiness:');
const displayReady = db.prepare(`
  SELECT COUNT(*) as count
  FROM unified_content 
  WHERE status = 'published' AND is_active = 1
`).get();

console.log(`✅ ${displayReady.count} entries now ready for website display`);

// Show sample of what will be displayed
console.log('\n📋 Sample entries that will now appear on website:');
const sampleEntries = db.prepare(`
  SELECT id, title, page_type, is_featured, created_at
  FROM unified_content 
  WHERE status = 'published' AND is_active = 1
  ORDER BY created_at DESC
  LIMIT 5
`).all();

sampleEntries.forEach(entry => {
  console.log(`  🌐 ID: ${entry.id} | ${entry.page_type} | ${entry.title?.substring(0, 50)}... | Featured: ${entry.is_featured}`);
});

db.close();

console.log('\n✅ Website display issue fixed!');
console.log('💡 The website should now show the updated content.');
console.log('🔄 Refresh your browser to see the changes.');