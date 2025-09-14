const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== PRIME PICKS DATABASE ANALYSIS ===\n');
  
  // Check amazon_products table schema
  console.log('Amazon Products Table Schema:');
  const schema = db.prepare('PRAGMA table_info(amazon_products)').all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
  });
  
  // Check total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
  console.log(`\nTotal products in amazon_products: ${totalCount.count}`);
  
  // Check by content_type
  const contentTypes = db.prepare('SELECT content_type, COUNT(*) as count FROM amazon_products GROUP BY content_type').all();
  console.log('\nProducts by content_type:');
  contentTypes.forEach(ct => {
    console.log(`  ${ct.content_type || 'NULL'}: ${ct.count}`);
  });
  
  // Check recent products
  console.log('\nRecent products (last 5):');
  const recent = db.prepare('SELECT id, name, content_type, expires_at, created_at FROM amazon_products ORDER BY created_at DESC LIMIT 5').all();
  recent.forEach(p => {
    const createdDate = new Date(p.created_at * 1000).toLocaleString();
    const expiresDate = p.expires_at ? new Date(p.expires_at * 1000).toLocaleString() : 'Never';
    console.log(`  ID: ${p.id}`);
    console.log(`    Name: ${p.name ? p.name.substring(0, 60) + '...' : 'No name'}`);
    console.log(`    Content Type: ${p.content_type || 'NULL'}`);
    console.log(`    Created: ${createdDate}`);
    console.log(`    Expires: ${expiresDate}`);
    console.log('');
  });
  
  // Check current time vs expires_at
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(`Current timestamp: ${currentTime} (${new Date().toLocaleString()})`);
  
  const activeCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE content_type = "prime-picks" AND (expires_at > ? OR expires_at IS NULL)').get(currentTime);
  console.log(`Active prime-picks products (not expired): ${activeCount.count}`);
  
  const expiredCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE content_type = "prime-picks" AND expires_at <= ?').get(currentTime);
  console.log(`Expired prime-picks products: ${expiredCount.count}`);
  
  db.close();
  
} catch (error) {
  console.error('Error:', error.message);
}