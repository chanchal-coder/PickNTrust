const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Check admin_users table structure
  const tableInfo = db.prepare("PRAGMA table_info(admin_users)").all();
  console.log('📊 admin_users table structure:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check all data in admin_users table
  const users = db.prepare('SELECT * FROM admin_users').all();
  console.log('\n👥 Admin users data:');
  users.forEach(user => {
    console.log('   User:', JSON.stringify(user, null, 2));
  });
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}