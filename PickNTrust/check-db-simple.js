const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 Checking Database Setup...\n');

try {
  // Check if database file exists
  const dbExists = fs.existsSync('sqlite.db');
  console.log(`Database file exists: ${dbExists ? '✅ Yes' : '❌ No'}`);
  
  if (!dbExists) {
    console.log('Creating new database...');
  }
  
  // Open database connection
  const db = new Database('sqlite.db');
  console.log('✅ Database connection established');
  
  // Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`\n📊 Found ${tables.length} tables:`);
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Check products table
  try {
    const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get();
    console.log(`\n📦 Products table: ${productCount.count} records`);
  } catch (error) {
    console.log('❌ Products table not accessible:', error.message);
  }
  
  // Check blog_posts table
  try {
    const blogCount = db.prepare("SELECT COUNT(*) as count FROM blog_posts").get();
    console.log(`📝 Blog posts table: ${blogCount.count} records`);
  } catch (error) {
    console.log('❌ Blog posts table not accessible:', error.message);
  }
  
  // Check announcements table
  try {
    const announcementCount = db.prepare("SELECT COUNT(*) as count FROM announcements").get();
    console.log(`📢 Announcements table: ${announcementCount.count} records`);
  } catch (error) {
    console.log('❌ Announcements table not accessible:', error.message);
  }
  
  db.close();
  console.log('\n✅ Database check completed successfully');
  
} catch (error) {
  console.error('❌ Database check failed:', error.message);
}
