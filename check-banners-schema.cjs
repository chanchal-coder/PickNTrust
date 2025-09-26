const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('📋 Banners table schema:');
  const schema = db.prepare('PRAGMA table_info(banners)').all();
  schema.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });
  
  console.log('\n🔍 Checking if banners table exists...');
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'").get();
  
  if (tableExists) {
    console.log('✅ Banners table exists');
    
    console.log('\n📊 Sample banner data:');
    const sampleBanners = db.prepare('SELECT * FROM banners LIMIT 3').all();
    sampleBanners.forEach(banner => {
      console.log(`   ID: ${banner.id} | Title: ${banner.title} | Page: ${banner.page}`);
    });
  } else {
    console.log('❌ Banners table does not exist');
  }
  
  db.close();
  console.log('\n✅ Schema check completed');
} catch (error) {
  console.error('❌ Error checking banners schema:', error.message);
}