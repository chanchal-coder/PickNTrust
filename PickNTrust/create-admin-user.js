import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.join(__dirname, 'sqlite.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  console.log('Connected to the SQLite database.');
  
  // Check if admin user already exists
  const existingAdmin = db.prepare("SELECT * FROM admin_users WHERE email = ?").get('admin@example.com');
  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.email);
    db.close();
    process.exit(0);
  }
  
  // Create a new admin user
  const password = 'pickntrust2025';
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  
  const insertAdmin = db.prepare(`
    INSERT INTO admin_users (username, email, password_hash, created_at, is_active)
    VALUES (?, ?, ?, datetime('now'), 1)
  `);
  
  const result = insertAdmin.run('admin', 'admin@example.com', hashedPassword);
  console.log('Admin user created successfully with ID:', result.lastInsertRowid);
  
  db.close();
  console.log('Database connection closed.');
} catch (error) {
  console.error('Error creating admin user:', error.message);
}
