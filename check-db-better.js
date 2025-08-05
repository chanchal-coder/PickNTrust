import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.join(__dirname, 'sqlite.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  console.log('Connected to the SQLite database.');
  
  // Check if admin_users table exists and get its contents
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  console.log('Tables in database:', tables);
  
  // Check if admin_users table exists
  const adminTableExists = tables.some(table => table.name === 'admin_users');
  console.log('Admin users table exists:', adminTableExists);
  
  if (adminTableExists) {
    const adminUsers = db.prepare("SELECT * FROM admin_users LIMIT 5;").all();
    console.log('Admin users:', adminUsers);
  }
  
  db.close();
  console.log('Database connection closed.');
} catch (error) {
  console.error('Error accessing database:', error.message);
}
