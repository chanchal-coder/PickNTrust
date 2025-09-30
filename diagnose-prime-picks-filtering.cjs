// DIAGNOSE PRIME PICKS PRODUCT FILTERING ISSUE
// Check why API returns 0 products when database has products

const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

console.log('Search DIAGNOSING PRIME PICKS PRODUCT FILTERING ISSUE');
console.log('=' .repeat(60));

async function diagnosePrimePicksFiltering() {
  const db = new sqlite3.Database('database.sqlite');
  
  try {
    console.log('\n1. Stats DATABASE ANALYSIS...');
    
    // Check total products
    const totalProducts = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM amazon_products', (err, row) => {
        resolve(err ? 0 : row.count);
      });
    });
    
    console.log(`Products Total products in database: ${totalProducts}`);
    
    // Check products by content_type
    const contentTypes = await new Promise((resolve) => {
      db.all(`
        SELECT content_type, COUNT(*) as count 
        FROM amazon_products 
        GROUP BY content_type
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    console.log('\n📋 Products by content_type:');
    contentTypes.forEach(ct => {
      console.log(`   ${ct.content_type || 'NULL'}: ${ct.count} products`);
    });
    
    // Check Prime Picks products specifically
    const primePicksProducts = await new Promise((resolve) => {
      db.all(`
        SELECT id, name, content_type, source, created_at 
        FROM amazon_products 
        WHERE content_type = 'prime-picks'
        ORDER BY created_at DESC
        LIMIT 5
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    console.log(`\nTarget Prime Picks products (content_type='prime-picks'): ${primePicksProducts.length}`);
    primePicksProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
      console.log(`      content_type: '${product.content_type}'`);
      console.log(`      source: '${product.source}'`);
    });
    
    // Check products with wrong content_type
    const wrongContentType = await new Promise((resolve) => {
      db.all(`
        SELECT id, name, content_type, source 
        FROM amazon_products 
        WHERE source LIKE '%prime-picks%' AND content_type != 'prime-picks'
        LIMIT 5
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    console.log(`\nError Products with wrong content_type: ${wrongContentType.length}`);
    wrongContentType.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      content_type: '${product.content_type}' (should be 'prime-picks')`);
      console.log(`      source: '${product.source}'`);
    });
    
    console.log('\n2. Global API TESTING...');
    
    // Test Prime Picks API
    try {
      const response = await axios.get('http://localhost:5000/api/products/page/prime-picks');
      console.log(`Success API Response Status: ${response.status}`);
      console.log(`Products API Returns: ${response.data.length} products`);
      
      if (response.data.length > 0) {
        console.log('\n📋 API Products:');
        response.data.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - ₹${product.price}`);
        });
      } else {
        console.log('Error API returns empty array - this is the problem!');
      }
      
    } catch (error) {
      console.log(`Error API Error: ${error.message}`);
    }
    
    console.log('\n3. Search FILTERING LOGIC ANALYSIS...');
    
    // Check what the storage.ts filtering logic would return
    const activeProducts = await new Promise((resolve) => {
      db.all(`
        SELECT * FROM amazon_products 
        WHERE content_type = 'prime-picks'
        AND (expires_at IS NULL OR expires_at > ${Math.floor(Date.now() / 1000)})
        ORDER BY created_at DESC
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });
    
    console.log(`Search Active Prime Picks products (not expired): ${activeProducts.length}`);
    
    if (activeProducts.length === 0) {
      console.log('\nAlert ISSUE FOUND: No active Prime Picks products!');
      console.log('   Possible causes:');
      console.log('   1. All products have expired (expires_at < current time)');
      console.log('   2. Products have wrong content_type');
      console.log('   3. Products have NULL content_type');
      
      // Check expiration times
      const expiredProducts = await new Promise((resolve) => {
        db.all(`
          SELECT id, name, expires_at, content_type
          FROM amazon_products 
          WHERE content_type = 'prime-picks'
          AND expires_at IS NOT NULL
          AND expires_at <= ${Math.floor(Date.now() / 1000)}
        `, (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      
      console.log(`\n⏰ Expired Prime Picks products: ${expiredProducts.length}`);
      if (expiredProducts.length > 0) {
        console.log('   Recent expired products:');
        expiredProducts.slice(0, 3).forEach((product, index) => {
          const expiredDate = new Date(product.expires_at * 1000);
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      Expired: ${expiredDate.toLocaleString()}`);
        });
      }
    }
    
    console.log('\n4. Tip SOLUTION RECOMMENDATIONS...');
    
    if (primePicksProducts.length === 0 && wrongContentType.length > 0) {
      console.log('🔧 FIX NEEDED: Update wrong content_type to "prime-picks"');
      console.log('   Run: UPDATE amazon_products SET content_type = "prime-picks" WHERE source LIKE "%prime-picks%"');
    } else if (primePicksProducts.length > 0 && activeProducts.length === 0) {
      console.log('🔧 FIX NEEDED: Products are expired, extend expiration time');
      console.log('   Run: UPDATE amazon_products SET expires_at = NULL WHERE content_type = "prime-picks"');
    } else if (primePicksProducts.length > 0 && activeProducts.length > 0) {
      console.log('🔧 ISSUE: Database has products but API returns 0 - check storage.ts filtering logic');
    } else {
      console.log('🔧 FIX NEEDED: No Prime Picks products exist - test autoposting by posting Amazon URL');
    }
    
    console.log('\nStats SUMMARY:');
    console.log(`   Database products: ${totalProducts}`);
    console.log(`   Prime Picks products: ${primePicksProducts.length}`);
    console.log(`   Active Prime Picks: ${activeProducts.length}`);
    console.log(`   API returns: ${response?.data?.length || 0}`);
    console.log(`   Wrong content_type: ${wrongContentType.length}`);
    
  } catch (error) {
    console.error('Error Diagnosis failed:', error);
  } finally {
    db.close();
  }
}

// Run diagnosis
diagnosePrimePicksFiltering().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Prime Picks filtering diagnosis completed');
}).catch(error => {
  console.error('Error Fatal error:', error);
});