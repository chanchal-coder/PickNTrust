const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Check if admin_users table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'").all();
  console.log('admin_users table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    const users = db.prepare('SELECT username FROM admin_users').all();
    console.log('Admin users:', users);
  } else {
    console.log('admin_users table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}