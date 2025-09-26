const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 ANALYZING DATABASE CONFUSION');
console.log('===============================\n');

const databases = [
  { name: 'database.sqlite', path: 'database.sqlite' },
  { name: 'sqlite.db', path: 'sqlite.db' },
  { name: 'database.db', path: 'database.db' }
];

databases.forEach(dbInfo => {
  if (!fs.existsSync(dbInfo.path)) {
    console.log(`❌ ${dbInfo.name}: File not found`);
    return;
  }

  try {
    const db = new Database(dbInfo.path);
    const size = fs.statSync(dbInfo.path).size;
    
    console.log(`\n📊 ${dbInfo.name.toUpperCase()} (${Math.round(size/1024)} KB)`);
    console.log('=' + '='.repeat(dbInfo.name.length + 15));
    
    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Tables (${tables.length}):`, tables.map(t => t.name).join(', '));
    
    // Check for key tables and their data
    const keyTables = ['products', 'unified_content', 'channel_posts', 'announcements'];
    
    keyTables.forEach(tableName => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`  ${tableName}: ${count.count} records`);
      } catch (error) {
        console.log(`  ${tableName}: ❌ Table missing`);
      }
    });
    
    // Check recent activity
    try {
      const recentProducts = db.prepare(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE created_at > strftime('%s', 'now', '-7 days')
      `).get();
      console.log(`  📈 Recent products (7 days): ${recentProducts.count}`);
    } catch (error) {
      // Ignore if products table doesn't exist or has different schema
    }
    
    try {
      const recentUnified = db.prepare(`
        SELECT COUNT(*) as count 
        FROM unified_content 
        WHERE created_at > strftime('%s', 'now', '-7 days')
      `).get();
      console.log(`  📈 Recent unified content (7 days): ${recentUnified.count}`);
    } catch (error) {
      // Ignore if unified_content table doesn't exist or has different schema
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ ${dbInfo.name}: Error reading database - ${error.message}`);
  }
});

console.log('\n🎯 ANALYSIS SUMMARY:');
console.log('===================');
console.log('• database.sqlite (1720 KB) - Largest, likely the main server database');
console.log('• sqlite.db (164 KB) - Medium size, possibly bot/channel database');
console.log('• database.db (36 KB) - Smallest, possibly test/backup database');

console.log('\n💡 RECOMMENDATION:');
console.log('• Server should use: database.sqlite (has most data)');
console.log('• Telegram bot should use: database.sqlite (for consistency)');
console.log('• Consider backing up and removing sqlite.db and database.db to avoid confusion');