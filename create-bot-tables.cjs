const Database = require('better-sqlite3');
const fs = require('fs');

// Check for both possible database file names
const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
console.log(`Using SQLite database: ${dbFile}`);

const db = new Database(dbFile);

console.log('Creating bot-related tables...');

try {
  // Create telegram_channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      affiliate_platform TEXT NOT NULL,
      affiliate_tag TEXT,
      affiliate_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ Created telegram_channels table');

  // Create bot_transformations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_transformations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL REFERENCES telegram_channels(channel_id),
      message_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      transformed_text TEXT NOT NULL,
      original_urls TEXT NOT NULL,
      transformed_urls TEXT NOT NULL,
      affiliate_platform TEXT NOT NULL,
      transformation_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ Created bot_transformations table');

  // Create bot_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      channel_id TEXT,
      message_id INTEGER,
      error TEXT,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ Created bot_logs table');

  // Create bot_stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL REFERENCES telegram_channels(channel_id),
      date TEXT NOT NULL,
      messages_processed INTEGER DEFAULT 0,
      urls_transformed INTEGER DEFAULT 0,
      errors_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ Created bot_stats table');

  // Insert initial channel data
  const channels = [
    {
      channel_id: '-1002955338551',
      name: 'prime-picks',
      display_name: 'Prime Picks',
      affiliate_platform: 'amazon',
      affiliate_tag: 'tag=pickntrust03-21'
    },
    {
      channel_id: '-1002982344997',
      name: 'cue-picks',
      display_name: 'Cuelinks PNT',
      affiliate_platform: 'cuelinks',
      affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D'
    },
    {
      channel_id: '-1003017626269',
      name: 'value-picks',
      display_name: 'Value Picks EK',
      affiliate_platform: 'earnkaro'
    },
    {
      channel_id: '-1002981205504',
      name: 'click-picks',
      display_name: 'Click Picks',
      affiliate_platform: 'multiple'
    },
    {
      channel_id: '-1002902496654',
      name: 'global-picks',
      display_name: 'Global Picks',
      affiliate_platform: 'multiple'
    },
    {
      channel_id: '-1003047967930',
      name: 'travel-picks',
      display_name: 'Travel Picks',
      affiliate_platform: 'multiple'
    },
    {
      channel_id: '-1003029983162',
      name: 'deals-hub',
      display_name: 'Dealshub PNT',
      affiliate_platform: 'inrdeals',
      affiliate_tag: 'id=sha678089037'
    },
    {
      channel_id: '-1002991047787',
      name: 'loot-box',
      display_name: 'Deodap pnt',
      affiliate_platform: 'deodap',
      affiliate_tag: 'ref=sicvppak'
    }
  ];

  const insertChannel = db.prepare(`
    INSERT OR REPLACE INTO telegram_channels 
    (channel_id, name, display_name, affiliate_platform, affiliate_tag, affiliate_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  for (const channel of channels) {
    insertChannel.run(
      channel.channel_id,
      channel.name,
      channel.display_name,
      channel.affiliate_platform,
      channel.affiliate_tag || null,
      channel.affiliate_url || null
    );
    console.log(`✅ Inserted/Updated channel: ${channel.display_name}`);
  }

  console.log('\n🎉 Bot database tables created and initialized successfully!');
  console.log(`📊 Total channels configured: ${channels.length}`);
  
} catch (error) {
  console.error('❌ Error creating bot tables:', error);
  process.exit(1);
} finally {
  db.close();
}