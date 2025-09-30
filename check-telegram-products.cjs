const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

try {
  const telegram = db.prepare('SELECT * FROM unified_content WHERE source_type = ? ORDER BY created_at DESC LIMIT 5').all('telegram');
  
  console.log('=== TELEGRAM PRODUCTS ANALYSIS ===');
  console.log('Total Telegram products found:', telegram.length);
  console.log('');
  
  if (telegram.length === 0) {
    console.log('❌ No products found with source_type = "telegram"');
    console.log('This indicates that Telegram messages are not being processed correctly.');
    
    // Check what source types exist
    const sources = db.prepare('SELECT DISTINCT source_type, COUNT(*) as count FROM unified_content GROUP BY source_type').all();
    console.log('\nExisting source types:');
    sources.forEach(s => console.log(`- ${s.source_type}: ${s.count} products`));
  } else {
    telegram.forEach((p, i) => {
      console.log(`--- Telegram Product ${i + 1} ---`);
      console.log('Title:', p.title);
      console.log('Description:', p.description);
      console.log('Price:', p.price);
      console.log('Original Price:', p.original_price);
      console.log('Image URL:', p.image_url);
      console.log('Affiliate URL:', p.affiliate_url);
      console.log('Source ID:', p.source_id);
      console.log('Display Pages:', p.display_pages);
      console.log('Created:', new Date(p.created_at * 1000).toLocaleString());
      console.log('');
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}

console.log('\nSuccess Database check completed!');