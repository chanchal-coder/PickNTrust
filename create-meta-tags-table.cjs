const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

// Create meta_tags table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS meta_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  purpose TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

try {
  db.exec(createTableQuery);
  console.log('✅ meta_tags table created successfully');
  
  // Check if table was created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meta_tags'").all();
  console.log('📋 Table verification:', tables.length > 0 ? 'meta_tags table exists' : 'Table creation failed');
  
  // Show table structure
  const tableInfo = db.prepare("PRAGMA table_info(meta_tags)").all();
  console.log('📊 Table structure:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
} catch (error) {
  console.error('❌ Error creating table:', error);
} finally {
  db.close();
}