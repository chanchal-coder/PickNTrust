const Database = require('better-sqlite3');
const path = require('path');

console.log('Creating video_content table...');

// Use consistent database filename with absolute path
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Begin transaction for atomicity
  db.exec('BEGIN TRANSACTION');
  
  // Create video_content table with proper constraints and data integrity
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS video_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL UNIQUE, -- Prevent duplicate videos
      thumbnail_url TEXT,
      platform TEXT NOT NULL CHECK (platform IN (
        'youtube', 'instagram', 'tiktok', 'vimeo', 'facebook', 
        'dailymotion', 'twitch', 'any-website', 'file-upload'
      )), -- Enforce canonical platform values
      category TEXT NOT NULL,
      tags TEXT, -- JSON array format: ["tag1", "tag2"]
      duration INTEGER, -- Duration in seconds for consistency
      has_timer INTEGER DEFAULT 0 CHECK (has_timer IN (0, 1)), -- Boolean constraint
      timer_duration INTEGER, -- Duration in seconds
      timer_start_time INTEGER, -- Unix timestamp in seconds
      created_at INTEGER DEFAULT (strftime('%s', 'now')), -- Unix timestamp
      updated_at INTEGER DEFAULT (strftime('%s', 'now')) -- Track updates
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success video_content table created successfully');
  
  // Create indexes for common queries
  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_video_content_platform ON video_content(platform)',
    'CREATE INDEX IF NOT EXISTS idx_video_content_category ON video_content(category)', 
    'CREATE INDEX IF NOT EXISTS idx_video_content_created_at ON video_content(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_video_content_has_timer ON video_content(has_timer)',
    'CREATE INDEX IF NOT EXISTS idx_video_content_timer_start ON video_content(timer_start_time)'
  ];
  
  createIndexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  console.log('Success Indexes created successfully');
  
  // Create trigger to update updated_at timestamp
  const createTriggerSQL = `
    CREATE TRIGGER IF NOT EXISTS update_video_content_updated_at
    AFTER UPDATE ON video_content
    FOR EACH ROW
    BEGIN
      UPDATE video_content SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
    END
  `;
  
  db.exec(createTriggerSQL);
  console.log('Success Update trigger created successfully');
  
  // Commit transaction
  db.exec('COMMIT');
  
  // Verify table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('Video content table columns:', tableInfo.map(col => `${col.name} (${col.type})`));
  
  // Show indexes
  const indexes = db.prepare("PRAGMA index_list(video_content)").all();
  console.log('Table indexes:', indexes.map(idx => idx.name));
  
} catch (error) {
  // Rollback on error
  try {
    db.exec('ROLLBACK');
  } catch (rollbackError) {
    console.error('Error Error during rollback:', rollbackError.message);
  }
  console.error('Error Error creating video_content table:', error.message);
  console.error('Full error details:', error);
  process.exit(1);
} finally {
  db.close();
  console.log('Database connection closed');
}
