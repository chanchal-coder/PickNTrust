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
  
  // Insert a test announcement
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (
      message, is_active, text_color, background_color, font_size, font_weight,
      text_decoration, font_style, animation_speed, text_border_width,
      text_border_style, text_border_color, banner_border_width,
      banner_border_style, banner_border_color, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertAnnouncement.run(
    '🎉 Welcome to PickTrustDeals! Get 20% off on all electronics today only! 🎉', // message
    1, // is_active (true)
    '#ffffff', // text_color
    '#3b82f6', // background_color
    '16px', // font_size
    'bold', // font_weight
    'none', // text_decoration
    'normal', // font_style
    '30', // animation_speed
    '0px', // text_border_width
    'solid', // text_border_style
    '#000000', // text_border_color
    '0px', // banner_border_width
    'solid', // banner_border_style
    '#000000', // banner_border_color
    new Date().toISOString() // created_at
  );
  
  console.log('Inserted announcement with ID:', result.lastInsertRowid);
  
  // Query all announcements
  const announcements = db.prepare("SELECT * FROM announcements").all();
  console.log('All announcements:', announcements);
  
  // Query active announcements
  const activeAnnouncements = db.prepare("SELECT * FROM announcements WHERE is_active = 1").all();
  console.log('Active announcements:', activeAnnouncements);
  
  db.close();
  console.log('Database connection closed.');
} catch (error) {
  console.error('Error inserting announcement:', error.message);
}
