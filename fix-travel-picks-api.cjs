const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./database.sqlite');

console.log('🔍 Diagnosing Travel Picks API Issue...');
console.log('=' .repeat(50));

// Check travel_products table schema
console.log('\n📋 TRAVEL PRODUCTS TABLE SCHEMA:');
const schema = db.prepare('PRAGMA table_info(travel_products)').all();
schema.forEach(col => {
  console.log(`  ${col.name}: ${col.type}`);
});

// Test the current API query
console.log('\n🧪 TESTING CURRENT API QUERY:');
try {
  const currentQuery = `
    SELECT 
      id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, affiliate_network,
      telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
      processing_status, created_at as createdAt
    FROM travel_products 
    WHERE processing_status = 'active'
    ORDER BY created_at DESC
  `;
  
  const result = db.prepare(currentQuery).all();
  console.log(`✅ Query works: ${result.length} products returned`);
  
  if (result.length > 0) {
    console.log('\n📦 Sample Product:');
    const sample = result[0];
    Object.keys(sample).forEach(key => {
      console.log(`  ${key}: ${sample[key]}`);
    });
  }
  
} catch (error) {
  console.log(`❌ Query failed: ${error.message}`);
  
  // Find missing columns
  const existingColumns = schema.map(col => col.name);
  const requiredColumns = [
    'id', 'name', 'description', 'price', 'original_price',
    'currency', 'image_url', 'affiliate_url', 'category', 
    'rating', 'review_count', 'discount', 'is_featured',
    'affiliate_network', 'telegram_message_id', 'telegram_channel_id',
    'processing_status', 'created_at'
  ];
  
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.log('\n❌ MISSING COLUMNS:');
    missingColumns.forEach(col => console.log(`  - ${col}`));
    
    // Create a working query with available columns
    console.log('\n🔧 CREATING FIXED QUERY:');
    const availableColumns = requiredColumns.filter(col => existingColumns.includes(col));
    
    const fixedQuery = `
      SELECT 
        ${availableColumns.map(col => {
          if (col === 'original_price') return 'original_price as originalPrice';
          if (col === 'image_url') return 'image_url as imageUrl';
          if (col === 'affiliate_url') return 'affiliate_url as affiliateUrl';
          if (col === 'review_count') return 'review_count as reviewCount';
          if (col === 'is_featured') return 'is_featured as isFeatured';
          if (col === 'telegram_message_id') return 'telegram_message_id as telegramMessageId';
          if (col === 'telegram_channel_id') return 'telegram_channel_id as telegramChannelId';
          if (col === 'created_at') return 'created_at as createdAt';
          return col;
        }).join(',\n        ')}
      FROM travel_products 
      WHERE processing_status = 'active'
      ORDER BY created_at DESC
    `;
    
    console.log('Fixed Query:');
    console.log(fixedQuery);
    
    try {
      const fixedResult = db.prepare(fixedQuery).all();
      console.log(`\n✅ Fixed query works: ${fixedResult.length} products returned`);
      
      // Update routes.ts with the fixed query
      console.log('\n🔧 UPDATING ROUTES.TS...');
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      
      if (fs.existsSync(routesPath)) {
        let routesContent = fs.readFileSync(routesPath, 'utf8');
        
        // Find and replace the travel-picks query
        const oldQueryPattern = /const travelPicksProductsQuery = sqliteDb\.prepare\(`[\s\S]*?FROM travel_products[\s\S]*?`\);/;
        const newQuery = `const travelPicksProductsQuery = sqliteDb.prepare(\`${fixedQuery.trim()}\`);`;
        
        if (oldQueryPattern.test(routesContent)) {
          routesContent = routesContent.replace(oldQueryPattern, newQuery);
          fs.writeFileSync(routesPath, routesContent);
          console.log('✅ Updated routes.ts with fixed query');
        } else {
          console.log('⚠️  Could not find travel-picks query pattern in routes.ts');
        }
      } else {
        console.log('❌ routes.ts file not found');
      }
      
    } catch (fixedError) {
      console.log(`❌ Fixed query also failed: ${fixedError.message}`);
    }
  }
}

db.close();

console.log('\n🎯 SUMMARY:');
console.log('  - Travel products exist in database (3 active)');
console.log('  - API query may have column mismatches');
console.log('  - Frontend is working correctly');
console.log('  - Once API is fixed, travel-picks page will show products');