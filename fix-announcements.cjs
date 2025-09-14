// Fix the current announcement issues
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔧 Fixing announcement issues...');

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');
  
  console.log('📋 Current state:');
  const before = db.prepare('SELECT id, message, page, is_global, is_active FROM announcements ORDER BY id').all();
  before.forEach(a => {
    const status = a.is_active ? '✅ Active' : '❌ Inactive';
    const type = a.is_global ? '🌐 Global' : `📄 Page: ${a.page || 'null'}`;
    console.log(`  ${status} | ID: ${a.id} | "${a.message}" | ${type}`);
  });
  
  console.log('\n🔄 Applying fixes...');
  
  // Fix 1: Reactivate "aaa" as global announcement
  const reactivateAaa = db.prepare('UPDATE announcements SET is_active = 1 WHERE id = 3 AND message = ?');
  const aaaResult = reactivateAaa.run('aaa');
  console.log(`✅ Reactivated "aaa" as global announcement (${aaaResult.changes} rows affected)`);
  
  // Fix 2: Deactivate "wwww" since it was incorrectly created as global
  const deactivateWww = db.prepare('UPDATE announcements SET is_active = 0 WHERE id = 4 AND message = ?');
  const wwwResult = deactivateWww.run('wwww');
  console.log(`✅ Deactivated incorrect "wwww" announcement (${wwwResult.changes} rows affected)`);
  
  // Commit transaction
  db.exec('COMMIT');
  
  console.log('\n📋 Fixed state:');
  const after = db.prepare('SELECT id, message, page, is_global, is_active FROM announcements ORDER BY id').all();
  after.forEach(a => {
    const status = a.is_active ? '✅ Active' : '❌ Inactive';
    const type = a.is_global ? '🌐 Global' : `📄 Page: ${a.page || 'null'}`;
    console.log(`  ${status} | ID: ${a.id} | "${a.message}" | ${type}`);
  });
  
  console.log('\n✅ Fixes applied successfully!');
  console.log('📝 Now "aaa" should show on all pages as a global announcement');
  console.log('📝 The admin panel bug has been fixed for future announcements');
  
} catch (error) {
  console.error('❌ Error applying fixes:', error.message);
  try {
    db.exec('ROLLBACK');
    console.log('🔄 Transaction rolled back');
  } catch (rollbackError) {
    console.error('❌ Rollback failed:', rollbackError.message);
  }
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}