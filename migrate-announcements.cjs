// Migration script to add page targeting fields to announcements table
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Starting announcements table migration...');

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(announcements)").all();
  const hasPageColumn = tableInfo.some(col => col.name === 'page');
  const hasIsGlobalColumn = tableInfo.some(col => col.name === 'is_global');
  
  if (hasPageColumn && hasIsGlobalColumn) {
    console.log('✅ Migration already completed. Columns already exist.');
    process.exit(0);
  }
  
  // Begin transaction
  db.exec('BEGIN TRANSACTION');
  
  // Add page column if it doesn't exist
  if (!hasPageColumn) {
    console.log('📝 Adding page column...');
    db.exec('ALTER TABLE announcements ADD COLUMN page TEXT');
  }
  
  // Add is_global column if it doesn't exist
  if (!hasIsGlobalColumn) {
    console.log('📝 Adding is_global column...');
    db.exec('ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1');
  }
  
  // Update existing announcements to be global by default
  console.log('📝 Updating existing announcements to be global...');
  const updateResult = db.exec('UPDATE announcements SET is_global = 1 WHERE is_global IS NULL');
  
  // Create indexes for better performance
  console.log('📝 Creating performance indexes...');
  db.exec('CREATE INDEX IF NOT EXISTS idx_announcements_page ON announcements(page, is_active)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_announcements_global ON announcements(is_global, is_active)');
  
  // Commit transaction
  db.exec('COMMIT');
  
  console.log('✅ Migration completed successfully!');
  console.log('📊 New columns added: page, is_global');
  
  // Verify the changes
  const updatedTableInfo = db.prepare("PRAGMA table_info(announcements)").all();
  console.log('📋 Updated table structure:');
  updatedTableInfo.forEach(col => {
    if (col.name === 'page' || col.name === 'is_global') {
      console.log(`   ✅ ${col.name}: ${col.type} (${col.dflt_value ? 'default: ' + col.dflt_value : 'nullable'})`);
    }
  });
  
  // Check existing announcements
  const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get();
  console.log(`📈 Total announcements in database: ${announcementCount.count}`);
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  try {
    db.exec('ROLLBACK');
    console.log('🔄 Transaction rolled back');
  } catch (rollbackError) {
    console.error('❌ Rollback failed:', rollbackError.message);
  }
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}