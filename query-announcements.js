import Database from 'better-sqlite3';
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
  
  // Query all announcements
  const announcements = db.prepare("SELECT * FROM announcements").all();
  console.log('All announcements:', announcements);
  
  // Query active announcements
  const activeAnnouncements = db.prepare("SELECT * FROM announcements WHERE is_active = 1").all();
  console.log('Active announcements:', activeAnnouncements);
  
  db.close();
  console.log('Database connection closed.');
} catch (error) {
  console.error('Error querying announcements:', error.message);
}
