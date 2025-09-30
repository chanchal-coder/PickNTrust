/**
 * Setup Bot Affiliate Tags System
 * Creates dynamic affiliate tag management for 8-bot system
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🏷️ Setting up Bot Affiliate Tags system...');

try {
  // Create bot_affiliate_tags table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS bot_affiliate_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_name TEXT NOT NULL,
      network_name TEXT NOT NULL,
      affiliate_tag TEXT NOT NULL,
      tag_type TEXT DEFAULT 'url', -- 'url', 'parameter', 'wrapper'
      priority INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT 1,
      commission_rate REAL DEFAULT 0,
      success_rate REAL DEFAULT 100,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(bot_name, network_name, affiliate_tag)
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success Bot affiliate tags table created successfully');
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_bot_tags_bot_name ON bot_affiliate_tags(bot_name)',
    'CREATE INDEX IF NOT EXISTS idx_bot_tags_active ON bot_affiliate_tags(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_bot_tags_priority ON bot_affiliate_tags(priority)',
    'CREATE INDEX IF NOT EXISTS idx_bot_tags_network ON bot_affiliate_tags(network_name)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Bot affiliate tags indexes created successfully');
  
  // Insert default tags for existing bots
  const defaultTags = [
    // Prime Picks Bot (Amazon)
    {
      bot_name: 'prime-picks',
      network_name: 'Amazon Associates',
      affiliate_tag: 'tag=pickntrust03-21',
      tag_type: 'parameter',
      priority: 1,
      commission_rate: 4.0
    },
    {
      bot_name: 'prime-picks',
      network_name: 'Amazon Backup',
      affiliate_tag: 'tag=pickntrust-backup',
      tag_type: 'parameter',
      priority: 2,
      commission_rate: 3.5
    },
    
    // Click Picks Bot (Multi-CPC)
    {
      bot_name: 'click-picks',
      network_name: 'CueLinks',
      affiliate_tag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      tag_type: 'wrapper',
      priority: 1,
      commission_rate: 6.5
    },
    {
      bot_name: 'click-picks',
      network_name: 'EarnKaro',
      affiliate_tag: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
      tag_type: 'wrapper',
      priority: 2,
      commission_rate: 4.0
    },
    {
      bot_name: 'click-picks',
      network_name: 'INRDeals',
      affiliate_tag: 'id=sha678089037',
      tag_type: 'parameter',
      priority: 3,
      commission_rate: 3.5
    },
    
    // Cue Picks Bot
    {
      bot_name: 'cue-picks',
      network_name: 'CueLinks Primary',
      affiliate_tag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      tag_type: 'wrapper',
      priority: 1,
      commission_rate: 6.5
    },
    
    // Value Picks Bot
    {
      bot_name: 'value-picks',
      network_name: 'EarnKaro Primary',
      affiliate_tag: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
      tag_type: 'wrapper',
      priority: 1,
      commission_rate: 4.0
    },
    
    // Global Picks Bot (Multi-region)
    {
      bot_name: 'global-picks',
      network_name: 'CueLinks Global',
      affiliate_tag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      tag_type: 'wrapper',
      priority: 1,
      commission_rate: 6.5
    },
    {
      bot_name: 'global-picks',
      network_name: 'Amazon International',
      affiliate_tag: 'tag=pickntrust03-21',
      tag_type: 'parameter',
      priority: 2,
      commission_rate: 4.0
    },
    
    // Travel Picks Bot
    {
      bot_name: 'travel-picks',
      network_name: 'MakeMyTrip',
      affiliate_tag: 'utm_source=pickntrust&utm_campaign=travel',
      tag_type: 'parameter',
      priority: 1,
      commission_rate: 3.5
    },
    {
      bot_name: 'travel-picks',
      network_name: 'Booking.com',
      affiliate_tag: 'aid=1234567',
      tag_type: 'parameter',
      priority: 2,
      commission_rate: 4.0
    },
    
    // DealsHub Bot
    {
      bot_name: 'dealshub',
      network_name: 'INRDeals Primary',
      affiliate_tag: 'id=sha678089037',
      tag_type: 'parameter',
      priority: 1,
      commission_rate: 3.5
    },
    
    // Loot Box Bot
    {
      bot_name: 'lootbox',
      network_name: 'Deodap',
      affiliate_tag: 'ref=pickntrust',
      tag_type: 'parameter',
      priority: 1,
      commission_rate: 5.0
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO bot_affiliate_tags (
      bot_name, network_name, affiliate_tag, tag_type, priority, commission_rate
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let insertedCount = 0;
  defaultTags.forEach(tag => {
    const result = insertStmt.run(
      tag.bot_name,
      tag.network_name,
      tag.affiliate_tag,
      tag.tag_type,
      tag.priority,
      tag.commission_rate
    );
    if (result.changes > 0) insertedCount++;
  });
  
  console.log(`Success Inserted ${insertedCount} default affiliate tags`);
  
  // Verify the setup
  const totalTags = db.prepare('SELECT COUNT(*) as count FROM bot_affiliate_tags').get();
  console.log(`Stats Total affiliate tags in system: ${totalTags.count}`);
  
  // Show tags by bot
  const tagsByBot = db.prepare(`
    SELECT bot_name, COUNT(*) as tag_count, 
           GROUP_CONCAT(network_name, ', ') as networks
    FROM bot_affiliate_tags 
    WHERE is_active = 1 
    GROUP BY bot_name
  `).all();
  
  console.log('\nAI Tags by Bot:');
  tagsByBot.forEach(bot => {
    console.log(`   ${bot.bot_name}: ${bot.tag_count} tags (${bot.networks})`);
  });
  
} catch (error) {
  console.error('Error Error setting up bot affiliate tags:', error);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}

console.log('\nCelebration Bot Affiliate Tags system setup complete!');
console.log('🎛️ Bots can now use dynamic affiliate tag management');
console.log('Stats Admin panel will show tag management interface');
console.log('Refresh All 3 methods (Telegram/Scraping/API) will use these tags');