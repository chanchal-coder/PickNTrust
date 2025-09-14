const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Creating widgets table...');

try {
  // Create the widgets table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      target_page TEXT NOT NULL,
      position TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      max_width TEXT,
      custom_css TEXT,
      show_on_mobile BOOLEAN DEFAULT 1,
      show_on_desktop BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ Widgets table created successfully!');
  
  // Verify the table was created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'").all();
  if (tables.length > 0) {
    console.log('✅ Widgets table verified in database');
  } else {
    console.log('❌ Widgets table not found after creation');
  }
  
} catch (error) {
  console.error('❌ Error creating widgets table:', error);
} finally {
  db.close();
  console.log('Database connection closed.');
}