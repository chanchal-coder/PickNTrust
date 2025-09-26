import Database from 'better-sqlite3';
const db = new Database('database.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables.map(t => t.name));
  
  // Check if specific tables exist
  const hasChannelPosts = tables.some(t => t.name === 'channel_posts');
  const hasAffiliateConversions = tables.some(t => t.name === 'affiliate_conversions');
  const hasAmazonProducts = tables.some(t => t.name === 'amazon_products');
  const hasProducts = tables.some(t => t.name === 'products');
  
  console.log('Has channel_posts table:', hasChannelPosts);
  console.log('Has affiliate_conversions table:', hasAffiliateConversions);
  console.log('Has amazon_products table:', hasAmazonProducts);
  console.log('Has products table:', hasProducts);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}