// Check current announcements in database
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 Checking current announcements in database...');

try {
  const announcements = db.prepare(`
    SELECT id, message, page, is_global, is_active 
    FROM announcements 
    WHERE is_active = 1
    ORDER BY id
  `).all();
  
  console.log('\n📋 Active Announcements:');
  console.log('=' .repeat(60));
  
  if (announcements.length === 0) {
    console.log('❌ No active announcements found');
  } else {
    announcements.forEach(a => {
      console.log(`ID: ${a.id}`);
      console.log(`Message: "${a.message}"`);
      console.log(`Page: ${a.page || 'null'}`);
      console.log(`IsGlobal: ${a.is_global}`);
      console.log(`Active: ${a.is_active}`);
      console.log('-'.repeat(40));
    });
  }
  
  // Also check all announcements (including inactive)
  const allAnnouncements = db.prepare(`
    SELECT id, message, page, is_global, is_active 
    FROM announcements 
    ORDER BY id
  `).all();
  
  console.log('\n📋 All Announcements (including inactive):');
  console.log('=' .repeat(60));
  
  allAnnouncements.forEach(a => {
    const status = a.is_active ? '✅ Active' : '❌ Inactive';
    const type = a.is_global ? '🌐 Global' : `📄 Page: ${a.page || 'null'}`;
    console.log(`${status} | ID: ${a.id} | "${a.message}" | ${type}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
  console.log('\n🔒 Database connection closed');
}