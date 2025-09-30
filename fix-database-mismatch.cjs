const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 FIXING DATABASE MISMATCH FOR CHANNEL POSTS');
console.log('===============================================');

// Step 1: Identify which databases exist
const hasDbSqlite = fs.existsSync('database.sqlite');
const hasSqliteDb = fs.existsSync('sqlite.db');
const hasDbDb = fs.existsSync('database.db');

console.log('\n📁 Database Files Found:');
console.log(`  database.sqlite: ${hasDbSqlite ? '✅' : '❌'}`);
console.log(`  sqlite.db: ${hasSqliteDb ? '✅' : '❌'}`);
console.log(`  database.db: ${hasDbDb ? '✅' : '❌'}`);

// Step 2: Server uses database.sqlite, bot uses sqlite.db
const serverDb = hasDbSqlite ? new Database('database.sqlite') : null;
const botDb = hasSqliteDb ? new Database('sqlite.db') : null;

if (!serverDb) {
  console.log('❌ Server database (database.sqlite) not found!');
  process.exit(1);
}

if (!botDb) {
  console.log('❌ Bot database (sqlite.db) not found!');
  process.exit(1);
}

try {
  // Step 3: Check if channel_posts exists in bot database
  const botTables = botDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const hasChannelPostsInBot = botTables.some(t => t.name === 'channel_posts');
  
  console.log(`\n🤖 Bot database has channel_posts: ${hasChannelPostsInBot ? '✅' : '❌'}`);
  
  if (hasChannelPostsInBot) {
    // Get the schema from bot database
    const botSchema = botDb.prepare('PRAGMA table_info(channel_posts)').all();
    console.log('\n📋 Bot channel_posts schema:');
    botSchema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Get data count from bot database
    const botCount = botDb.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
    console.log(`\n📊 Bot database has ${botCount.count} channel posts`);
  }
  
  // Step 4: Check if channel_posts exists in server database
  const serverTables = serverDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const hasChannelPostsInServer = serverTables.some(t => t.name === 'channel_posts');
  
  console.log(`🖥️ Server database has channel_posts: ${hasChannelPostsInServer ? '✅' : '❌'}`);
  
  // Step 5: Create channel_posts table in server database if it doesn't exist
  if (!hasChannelPostsInServer) {
    console.log('\n🔨 Creating channel_posts table in server database...');
    
    serverDb.exec(`
      CREATE TABLE IF NOT EXISTS channel_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        website_page TEXT NOT NULL,
        message_id INTEGER NOT NULL,
        original_text TEXT NOT NULL,
        processed_text TEXT NOT NULL,
        extracted_urls TEXT,
        is_processed INTEGER DEFAULT 0,
        is_posted INTEGER DEFAULT 0,
        processing_error TEXT,
        telegram_timestamp INTEGER,
        processed_at INTEGER,
        posted_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    console.log('✅ channel_posts table created in server database');
  }
  
  // Step 6: Migrate data from bot database to server database
  if (hasChannelPostsInBot) {
    console.log('\n🔄 Migrating channel posts from bot to server database...');
    
    // Get all data from bot database
    const botData = botDb.prepare('SELECT * FROM channel_posts').all();
    
    if (botData.length > 0) {
      // Clear existing data in server database to avoid duplicates
      serverDb.prepare('DELETE FROM channel_posts').run();
      
      // Insert data into server database
      const insertStmt = serverDb.prepare(`
        INSERT INTO channel_posts (
          id, channel_id, channel_name, website_page, message_id,
          original_text, processed_text, extracted_urls, is_processed,
          is_posted, processing_error, telegram_timestamp, processed_at,
          posted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let migrated = 0;
      for (const row of botData) {
        insertStmt.run(
          row.id, row.channel_id, row.channel_name, row.website_page,
          row.message_id, row.original_text, row.processed_text,
          row.extracted_urls, row.is_processed, row.is_posted,
          row.processing_error, row.telegram_timestamp, row.processed_at,
          row.posted_at, row.created_at
        );
        migrated++;
      }
      
      console.log(`✅ Migrated ${migrated} channel posts to server database`);
    } else {
      console.log('ℹ️ No channel posts to migrate');
    }
  }
  
  // Step 7: Verify the fix
  const finalCount = serverDb.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
  console.log(`\n🎉 Server database now has ${finalCount.count} channel posts`);
  
  // Step 8: Update bot configuration to use the same database as server
  console.log('\n⚠️ IMPORTANT: Update telegram-bot.ts to use database.sqlite instead of sqlite.db');
  console.log('   This will ensure future channel posts go directly to the server database.');
  
} catch (error) {
  console.error('❌ Error during migration:', error);
} finally {
  if (serverDb) serverDb.close();
  if (botDb) botDb.close();
}

console.log('\n✅ Database mismatch fix completed!');