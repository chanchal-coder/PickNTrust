const Database = require('better-sqlite3');

console.log('🔍 Checking database schema...');

const db = new Database('./database.sqlite');

try {
    // Get all tables
    console.log('\n📋 Database Tables:');
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    `).all();
    
    tables.forEach(table => {
        console.log(`- ${table.name}`);
    });

    const hasChannelPosts = tables.some(t => t.name === 'channel_posts');

    // Check channel_posts table structure (only if present)
    console.log('\n\n📋 channel_posts table structure:');
    if (hasChannelPosts) {
      const channelPostsSchema = db.prepare(`PRAGMA table_info(channel_posts)`).all();
      channelPostsSchema.forEach(column => {
          console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });
    } else {
      console.log('  (table does not exist)');
    }
    
    // Check unified_content table structure
    console.log('\n\n📋 unified_content table structure:');
    const unifiedContentSchema = db.prepare(`PRAGMA table_info(unified_content)`).all();
    unifiedContentSchema.forEach(column => {
        console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Sample data from channel_posts (only if present)
    console.log('\n\n📋 Sample channel_posts data:');
    if (hasChannelPosts) {
      const samplePosts = db.prepare(`SELECT * FROM channel_posts LIMIT 3`).all();
      samplePosts.forEach((post, index) => {
          console.log(`\n${index + 1}. Post:`, post);
      });
    } else {
      console.log('  (table does not exist)');
    }
    
    // Sample data from unified_content
    console.log('\n\n📋 Sample unified_content data:');
    const sampleContent = db.prepare(`SELECT * FROM unified_content LIMIT 3`).all();
    sampleContent.forEach((content, index) => {
        console.log(`\n${index + 1}. Content:`, content);
    });
    
} catch (error) {
    console.error('❌ Error checking schema:', error);
} finally {
    db.close();
}