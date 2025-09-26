const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');
  
  // Check for test messages in unified_content
  const testEntries = db.prepare(`
    SELECT * FROM unified_content 
    WHERE title LIKE '%Test Product%' 
       OR title LIKE '%Product from Telegram%'
       OR description LIKE '%test%'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Found ${testEntries.length} test entries in unified_content:`);
  
  testEntries.forEach((item, i) => {
    console.log(`${i+1}. Title: ${item.title}`);
    console.log(`   Page: ${item.page_type || 'N/A'}`);
    console.log(`   Display Pages: ${item.display_pages || 'N/A'}`);
    console.log(`   Source: ${item.source_platform} - ${item.source_id}`);
    console.log(`   Created: ${new Date(item.created_at * 1000).toLocaleString()}`);
    console.log('   ---');
  });
  
  // Also check recent entries (last 10)
  const recentEntries = db.prepare(`
    SELECT * FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log('\nLast 10 entries in unified_content:');
  recentEntries.forEach((item, i) => {
    console.log(`${i+1}. ${item.title} - ${item.page_type} - ${new Date(item.created_at * 1000).toLocaleString()}`);
  });
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}