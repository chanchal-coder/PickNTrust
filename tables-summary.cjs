const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('📊 WEBSITE DATABASE TABLES OVERVIEW');
  console.log('===================================');
  console.log('');
  
  // Group tables by category
  const categories = {
    'Core Content': [],
    'User Management': [],
    'Bot & Automation': [],
    'Analytics & Tracking': [],
    'Configuration': [],
    'Other': []
  };
  
  tables.forEach(table => {
    const name = table.name;
    let count = 0;
    
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
      count = result.count;
    } catch (error) {
      count = 'Error';
    }
    
    const tableInfo = `${name} (${count} records)`;
    
    // Categorize tables
    if (name.includes('unified_content') || name.includes('product') || name.includes('content') || name.includes('banner') || name.includes('video') || name.includes('category')) {
      categories['Core Content'].push(tableInfo);
    } else if (name.includes('admin') || name.includes('user') || name.includes('auth')) {
      categories['User Management'].push(tableInfo);
    } else if (name.includes('bot') || name.includes('telegram') || name.includes('channel') || name.includes('webhook')) {
      categories['Bot & Automation'].push(tableInfo);
    } else if (name.includes('analytics') || name.includes('tracking') || name.includes('click') || name.includes('affiliate')) {
      categories['Analytics & Tracking'].push(tableInfo);
    } else if (name.includes('config') || name.includes('setting') || name.includes('widget') || name.includes('network')) {
      categories['Configuration'].push(tableInfo);
    } else {
      categories['Other'].push(tableInfo);
    }
  });
  
  // Display categorized tables
  Object.entries(categories).forEach(([category, tableList]) => {
    if (tableList.length > 0) {
      console.log(`🔹 ${category}:`);
      tableList.forEach(table => console.log(`   • ${table}`));
      console.log('');
    }
  });
  
  console.log(`📈 Total tables: ${tables.length}`);
  
  // Show key statistics
  console.log('\n🎯 KEY STATISTICS:');
  console.log('==================');
  
  const keyTables = [
    'unified_content',
    'admin_users', 
    'channel_posts',
    'bot_messages',
    'affiliate_analytics'
  ];
  
  keyTables.forEach(tableName => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`• ${tableName}: ${result.count} records`);
    } catch (error) {
      // Table doesn't exist
    }
  });
  
  db.close();
  
} catch (error) {
  console.error('Error:', error.message);
}