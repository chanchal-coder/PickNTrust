import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.join(__dirname, 'sqlite.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  console.log('Connected to the SQLite database.');
  
  // Check if announcements table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='announcements'").all();
  console.log('Announcements table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Get all announcements
    const allAnnouncements = db.prepare("SELECT * FROM announcements").all();
    console.log('All announcements:', allAnnouncements);
    
    // Get active announcements
    const activeAnnouncements = db.prepare("SELECT * FROM announcements WHERE is_active = 1").all();
    console.log('Active announcements:', activeAnnouncements);
  } else {
    console.log('No announcements table found.');
  }

  // Fetch categories from API
  fetch('http://localhost:3001/api/categories')
    .then(response => response.json())
    .then(data => {
      console.log('Categories from API:', data);
    })
    .catch(error => {
      console.error('Error fetching categories:', error);
    });

  db.close();
  console.log('Database connection closed.');
} catch (error) {
  console.error('Error checking database:', error.message);
}
