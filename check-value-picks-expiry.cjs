const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const currentTime = Math.floor(Date.now() / 1000);
console.log('Current timestamp:', currentTime);
console.log('Current date:', new Date(currentTime * 1000).toISOString());
console.log('');

const products = db.prepare('SELECT id, name, expires_at, processing_status FROM value_picks_products').all();

console.log('Value Picks Products Expiry Check:');
console.log('==========================================');

products.forEach(p => {
  const expired = p.expires_at && p.expires_at < currentTime;
  const expiryDate = p.expires_at ? new Date(p.expires_at * 1000).toISOString() : 'Never';
  console.log(`Product ${p.id}: ${p.name}`);
  console.log(`  Status: ${p.processing_status}`);
  console.log(`  Expires: ${expiryDate}`);
  console.log(`  Expired: ${expired}`);
  console.log('');
});

// Test the exact query used in the API
const apiQuery = db.prepare(`
  SELECT COUNT(*) as count
  FROM value_picks_products 
  WHERE processing_status = 'active' 
  AND (expires_at IS NULL OR expires_at > ?)
`);

const activeCount = apiQuery.get(currentTime);
console.log(`Active products (API query): ${activeCount.count}`);

db.close();