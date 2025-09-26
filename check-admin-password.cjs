const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

try {
  const db = new Database('./database.sqlite');
  
  // Check admin user password
  const adminUser = db.prepare('SELECT username, password FROM admin_users WHERE username = ?').get('admin');
  
  if (!adminUser) {
    console.log('❌ Admin user not found');
    db.close();
    return;
  }
  
  console.log('✅ Admin user found:', adminUser.username);
  console.log('Password hash exists:', !!adminUser.password);
  
  // Test password verification with the default password
  const testPassword = 'pickntrust2025';
  
  if (adminUser.password) {
    const isValid = bcrypt.compareSync(testPassword, adminUser.password);
    console.log(`Password verification for "${testPassword}":`, isValid ? '✅ Valid' : '❌ Invalid');
  } else {
    console.log('❌ No password hash found in database');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}