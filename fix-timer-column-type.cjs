const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Fixing timer_start_time column type mismatch...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  db.exec('BEGIN TRANSACTION');
  
  // Check current column type
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const timerColumn = columns.find(col => col.name === 'timer_start_time');
  
  console.log(`Current timer_start_time column type: ${timerColumn.type}`);
  
  if (timerColumn.type === 'TEXT') {
    console.log('Converting timer_start_time from TEXT to INTEGER...');
    
    // Create a new table with correct schema
    db.exec(`
      CREATE TABLE products_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        image_url TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        affiliate_network_id INTEGER,
        category TEXT NOT NULL,
        gender TEXT,
        rating NUMERIC NOT NULL,
        review_count INTEGER NOT NULL,
        discount INTEGER,
        is_new INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        is_service INTEGER DEFAULT 0,
        custom_fields TEXT,
        has_timer INTEGER DEFAULT 0,
        timer_duration INTEGER,
        timer_start_time INTEGER, -- Changed from TEXT to INTEGER
        created_at INTEGER DEFAULT (strftime('%s', 'now')) -- Also fix created_at to be consistent
      )
    `);
    
    // Copy data from old table to new table, converting timestamps
    db.exec(`
      INSERT INTO products_new (
        id, name, description, price, original_price, image_url, affiliate_url,
        affiliate_network_id, category, gender, rating, review_count, discount,
        is_new, is_featured, is_service, custom_fields, has_timer, timer_duration,
        timer_start_time, created_at
      )
      SELECT 
        id, name, description, price, original_price, image_url, affiliate_url,
        affiliate_network_id, category, gender, rating, review_count, discount,
        is_new, is_featured, is_service, custom_fields, has_timer, timer_duration,
        CASE 
          WHEN timer_start_time IS NOT NULL AND timer_start_time != '' 
          THEN strftime('%s', timer_start_time)
          ELSE NULL 
        END as timer_start_time,
        CASE 
          WHEN created_at IS NOT NULL AND created_at != '' 
          THEN strftime('%s', created_at)
          ELSE strftime('%s', 'now')
        END as created_at
      FROM products
    `);
    
    // Drop old table and rename new one
    db.exec('DROP TABLE products');
    db.exec('ALTER TABLE products_new RENAME TO products');
    
    console.log('Success Successfully converted timer_start_time to INTEGER');
  } else {
    console.log('Success timer_start_time column type is already correct');
  }
  
  // Also fix blog_posts and video_content tables if they have the same issue
  const blogColumns = db.prepare("PRAGMA table_info(blog_posts)").all();
  const blogTimerColumn = blogColumns.find(col => col.name === 'timer_start_time');
  
  if (blogTimerColumn && blogTimerColumn.type === 'TEXT') {
    console.log('Fixing blog_posts timer_start_time column...');
    
    db.exec(`
      CREATE TABLE blog_posts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        image_url TEXT,
        video_url TEXT,
        published_at INTEGER,
        created_at INTEGER,
        read_time TEXT,
        slug TEXT NOT NULL,
        has_timer INTEGER,
        timer_duration INTEGER,
        timer_start_time INTEGER
      )
    `);
    
    db.exec(`
      INSERT INTO blog_posts_new SELECT 
        id, title, excerpt, content, category, tags, image_url, video_url,
        published_at, created_at, read_time, slug, has_timer, timer_duration,
        CASE 
          WHEN timer_start_time IS NOT NULL AND timer_start_time != '' 
          THEN strftime('%s', timer_start_time)
          ELSE NULL 
        END as timer_start_time
      FROM blog_posts
    `);
    
    db.exec('DROP TABLE blog_posts');
    db.exec('ALTER TABLE blog_posts_new RENAME TO blog_posts');
    
    console.log('Success Fixed blog_posts timer_start_time column');
  }
  
  db.exec('COMMIT');
  
  // Verify the fix
  const newColumns = db.prepare("PRAGMA table_info(products)").all();
  const newTimerColumn = newColumns.find(col => col.name === 'timer_start_time');
  console.log(`New timer_start_time column type: ${newTimerColumn.type}`);
  
  console.log('Success Database schema fix completed successfully!');
  
} catch (error) {
  try {
    db.exec('ROLLBACK');
  } catch (rollbackError) {
    console.error('Error Error during rollback:', rollbackError.message);
  }
  console.error('Error Error fixing schema:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('Database connection closed');
}
