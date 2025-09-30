// Reset announcements to clean state for testing
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔄 Resetting announcements to clean state...');

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
  
  console.log('\n🧹 Cleaning up...');
  
  // Deactivate all announcements
  const deactivateAll = db.prepare('UPDATE announcements SET is_active = 0');
  const deactivateResult = deactivateAll.run();
  console.log(`✅ Deactivated all announcements (${deactivateResult.changes} rows affected)`);
  
  // Delete test announcements (keep original ones)
  const deleteTest = db.prepare('DELETE FROM announcements WHERE id > 4');
  const deleteResult = deleteTest.run();
  console.log(`✅ Deleted test announcements (${deleteResult.changes} rows affected)`);
  
  // Reactivate the original "aaa" global announcement
  const reactivateAaa = db.prepare('UPDATE announcements SET is_active = 1 WHERE id = 3 AND message = ?');
  const aaaResult = reactivateAaa.run('aaa');
  console.log(`✅ Reactivated "aaa" global announcement (${aaaResult.changes} rows affected)`);
  
  // Commit transaction
  db.exec('COMMIT');
  
  console.log('\n📋 Clean state:');
  const after = db.prepare('SELECT id, message, page, is_global, is_active FROM announcements ORDER BY id').all();
  after.forEach(a => {
    const status = a.is_active ? '✅ Active' : '❌ Inactive';
    const type = a.is_global ? '🌐 Global' : `📄 Page: ${a.page || 'null'}`;
    console.log(`  ${status} | ID: ${a.id} | "${a.message}" | ${type}`);
  });
  
  console.log('\n✅ Reset completed!');
  console.log('📝 Now you can test the admin panel with the fixed logic');
  console.log('📝 "aaa" should show on all pages as global announcement');
  
} catch (error) {
  console.error('❌ Reset failed:', error.message);
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