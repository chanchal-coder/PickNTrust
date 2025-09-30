// Diagnose Prime Picks processing issue
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Diagnosing Prime Picks Issue\n');
  
  // Check recent Prime Picks products
  console.log('Products Recent Prime Picks Products:');
  const primeProducts = db.prepare('SELECT id, name, price, created_at, telegram_message_id FROM amazon_products ORDER BY created_at DESC LIMIT 5').all();
  
  if (primeProducts.length === 0) {
    console.log('Error No Prime Picks products found in database');
  } else {
    primeProducts.forEach((p, i) => {
      const createdDate = new Date(p.created_at * 1000);
      console.log(`   ${i+1}. ID: ${p.id}`);
      console.log(`      Name: ${p.name.substring(0, 60)}...`);
      console.log(`      Price: ₹${p.price}`);
      console.log(`      Created: ${createdDate.toLocaleString()}`);
      console.log(`      Telegram ID: ${p.telegram_message_id}`);
      console.log('');
    });
  }
  
  // Check recent CueLinks products for comparison
  console.log('Products Recent CueLinks Products (for comparison):');
  const cueProducts = db.prepare('SELECT id, name, price, created_at FROM cuelinks_products ORDER BY created_at DESC LIMIT 3').all();
  
  if (cueProducts.length === 0) {
    console.log('Error No CueLinks products found');
  } else {
    cueProducts.forEach((p, i) => {
      console.log(`   ${i+1}. ID: ${p.id}, Name: ${p.name.substring(0, 50)}..., Price: ₹${p.price}`);
    });
  }
  
  // Check if there are any recent products at all
  const recentTime = Math.floor(Date.now() / 1000) - (60 * 60); // Last hour
  const recentPrimeProducts = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE created_at > ?').get(recentTime);
  const recentCueProducts = db.prepare('SELECT COUNT(*) as count FROM cuelinks_products WHERE created_at > ?').get(recentTime);
  
  console.log('\n⏰ Recent Activity (Last Hour):');
  console.log(`   Prime Picks: ${recentPrimeProducts.count} new products`);
  console.log(`   CueLinks: ${recentCueProducts.count} new products`);
  
  db.close();
  
  console.log('\nTarget Possible Issues:');
  if (primeProducts.length === 0) {
    console.log('1. Error Prime Picks bot is not processing messages at all');
    console.log('2. Error Prime Picks bot may not be receiving messages from Telegram');
    console.log('3. Error Channel ID mismatch - bot listening to wrong channel');
    console.log('4. Error Bot permissions issue - not admin in Prime Picks channel');
  } else if (recentPrimeProducts.count === 0) {
    console.log('1. Warning Prime Picks bot was working before but stopped recently');
    console.log('2. Warning Recent messages not being processed');
    console.log('3. Warning Check if you posted to the correct Prime Picks channel');
  } else {
    console.log('1. Success Prime Picks bot appears to be working');
    console.log('2. Success Check if your message was posted to the correct channel');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Verify you posted to @PNT_Amazon channel (ID: -1003086697099)');
  console.log('2. Check that @pntamazon_bot is admin in the channel');
  console.log('3. Ensure the message contains a valid Amazon URL');
  console.log('4. Check server logs for Prime Picks processing messages');
  
} catch (error) {
  console.error('Error Database error:', error.message);
}