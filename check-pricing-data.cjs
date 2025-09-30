// Check pricing data for existing service/app products
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('=== UNIFIED_CONTENT SCHEMA ===');
  const schema = db.prepare('PRAGMA table_info(unified_content)').all();
  schema.forEach(col => console.log(`${col.name} (${col.type})`));
  
  console.log('\n=== SERVICE/APP PRODUCTS PRICING DATA ===');
  console.log('');
  
  const products = db.prepare(`
    SELECT id, title, is_service, is_ai_app, price, original_price,
           pricing_type, monthly_price, yearly_price, is_free, price_description
    FROM unified_content 
    WHERE is_active = 1 AND (is_service = 1 OR is_ai_app = 1) 
    ORDER BY id DESC 
    LIMIT 8
  `).all();
  
  products.forEach(p => {
    console.log(`\nID: ${p.id} - ${p.title}`);
    console.log(`  Type: ${p.is_service ? 'Service' : ''} ${p.is_ai_app ? 'AI App' : ''}`);
    console.log(`  Direct Fields:`);
    console.log(`    Price: ${p.price}, Original: ${p.original_price}`);
    console.log(`    Pricing Type: ${p.pricing_type}, Monthly: ${p.monthly_price}, Yearly: ${p.yearly_price}`);
    console.log(`    Is Free: ${p.is_free}, Description: ${p.price_description}`);
    
    // Check what would be used for pricing tags
    const hasServicePricing = p.pricing_type || p.monthly_price || p.yearly_price || p.is_free;
    console.log(`    Has Service Pricing Data: ${!!hasServicePricing}`);
    
    console.log('  ---');
  });
  
  db.close();
  console.log('\n✅ Analysis complete');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}