const Database = require('better-sqlite3');

console.log('🔍 CHECKING MESSAGE SAVING TO DATABASE');
console.log('=====================================\n');

try {
  const db = new Database('database.sqlite');

  // Check products table structure
  console.log('📊 PRODUCTS TABLE STRUCTURE:');
  const tableInfo = db.prepare('PRAGMA table_info(products)').all();
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });

  // Check recent products
  console.log('\n📈 RECENT PRODUCTS (Last 10):');
  const recentProducts = db.prepare(`
    SELECT id, name, source, category, created_at, updated_at 
    FROM products 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  if (recentProducts.length > 0) {
    recentProducts.forEach(product => {
      const createdDate = new Date(product.created_at * 1000).toLocaleString();
      console.log(`   ID: ${product.id} | ${product.name} | Source: ${product.source} | Created: ${createdDate}`);
    });
  } else {
    console.log('   ❌ No products found in database');
  }

  // Check for telegram-sourced products specifically
  console.log('\n🤖 TELEGRAM-SOURCED PRODUCTS:');
  const telegramProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE source LIKE '%telegram%'
  `).get();

  console.log(`   Total telegram products: ${telegramProducts.count}`);

  // Check total products
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
  console.log(`   Total products: ${totalProducts.count}`);

  // Check if bot is configured to save messages
  console.log('\n🔧 BOT CONFIGURATION CHECK:');
  
  // Check if telegram_channels table exists
  try {
    const channelCount = db.prepare('SELECT COUNT(*) as count FROM telegram_channels').get();
    console.log(`   Telegram channels configured: ${channelCount.count}`);
    
    if (channelCount.count > 0) {
      const channels = db.prepare('SELECT channel_id, name, display_name FROM telegram_channels LIMIT 5').all();
      channels.forEach(channel => {
        console.log(`     - ${channel.display_name} (${channel.channel_id})`);
      });
    }
  } catch (error) {
    console.log('   ❌ telegram_channels table not found');
  }

  // Check bot_logs table for recent activity
  try {
    const recentLogs = db.prepare(`
      SELECT level, message, created_at 
      FROM bot_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    console.log('\n📋 RECENT BOT LOGS:');
    if (recentLogs.length > 0) {
      recentLogs.forEach(log => {
        const logDate = new Date(log.created_at * 1000).toLocaleString();
        console.log(`   [${log.level}] ${log.message} (${logDate})`);
      });
    } else {
      console.log('   ❌ No bot logs found');
    }
  } catch (error) {
    console.log('   ❌ bot_logs table not found');
  }

  db.close();
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}