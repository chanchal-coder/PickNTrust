const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== DATABASE TABLES ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(t => console.log('- ' + t.name));
  
  console.log('\n=== CHECKING CUE-PICKS DATA ===');
  
  // Check unified_content for cue-picks
  try {
    const cuePicksCount = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE "%cue-picks%"').get();
    console.log('Cue-picks products in unified_content:', cuePicksCount.count);
    
    if (cuePicksCount.count > 0) {
      console.log('\nRecent cue-picks products in unified_content:');
      const recentProducts = db.prepare('SELECT id, title, category, created_at FROM unified_content WHERE display_pages LIKE "%cue-picks%" ORDER BY created_at DESC LIMIT 5').all();
      recentProducts.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id}, Title: ${p.title?.substring(0, 50)}..., Category: ${p.category}`);
      });
    }
  } catch (e) {
    console.log('unified_content table does not exist or error:', e.message);
  }
  
  // Check cue_picks_products table
  try {
    const cuePicksTableCount = db.prepare('SELECT COUNT(*) as count FROM cue_picks_products').get();
    console.log('\nProducts in cue_picks_products:', cuePicksTableCount.count);
    
    if (cuePicksTableCount.count > 0) {
      console.log('Recent products in cue_picks_products:');
      const recentProducts = db.prepare('SELECT id, name, category, createdAt FROM cue_picks_products ORDER BY createdAt DESC LIMIT 5').all();
      recentProducts.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id}, Name: ${p.name?.substring(0, 50)}..., Category: ${p.category}`);
      });
    }
  } catch (e) {
    console.log('cue_picks_products table does not exist');
  }
  
  // Check cuelinks_products table
  try {
    const cuelinksCount = db.prepare('SELECT COUNT(*) as count FROM cuelinks_products').get();
    console.log('\nProducts in cuelinks_products:', cuelinksCount.count);
    
    if (cuelinksCount.count > 0) {
      console.log('Recent products in cuelinks_products:');
      const recentProducts = db.prepare('SELECT id, name, category, created_at FROM cuelinks_products ORDER BY created_at DESC LIMIT 5').all();
      recentProducts.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id}, Name: ${p.name?.substring(0, 50)}..., Category: ${p.category}`);
      });
    }
  } catch (e) {
    console.log('cuelinks_products table does not exist');
  }
  
  db.close();
  console.log('\n✅ Database check completed');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}