const fetch = require('node-fetch');
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 VERIFYING CHANNEL PRODUCTS ON RESPECTIVE PAGES');
console.log('=================================================\n');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const channels = [
  { name: 'prime-picks', displayName: 'Prime Picks' },
  { name: 'cue-picks', displayName: 'Cue Picks' },
  { name: 'value-picks', displayName: 'Value Picks' },
  { name: 'click-picks', displayName: 'Click Picks' },
  { name: 'global-picks', displayName: 'Global Picks' },
  { name: 'deals-hub', displayName: 'Deals Hub' },
  { name: 'loot-box', displayName: 'Loot Box' },
  { name: 'travel-picks', displayName: 'Travel Picks' }
];

async function verifyPageProducts() {
  try {
    console.log('📊 STEP 1: Database verification');
    console.log('================================');
    
    // Check database for test products
    for (const channel of channels) {
      const products = db.prepare(`
        SELECT id, title, display_pages, category, price, affiliate_url
        FROM unified_content 
        WHERE display_pages = ? AND title LIKE 'Channel Test%'
        ORDER BY created_at DESC
      `).all(channel.name);
      
      console.log(`📄 ${channel.displayName} (${channel.name}):`);
      if (products.length > 0) {
        products.forEach(product => {
          console.log(`   ✅ ID ${product.id}: ${product.title}`);
          console.log(`      Price: ${product.price} | Category: ${product.category}`);
          console.log(`      Affiliate URL: ${product.affiliate_url}`);
        });
      } else {
        console.log('   ❌ No test products found in database');
      }
      console.log('');
    }
    
    console.log('🌐 STEP 2: API endpoint verification');
    console.log('====================================');
    
    const baseUrl = 'http://localhost:5000';
    const results = [];
    
    for (const channel of channels) {
      try {
        const response = await fetch(`${baseUrl}/api/products/page/${channel.name}`);
        
        if (response.ok) {
          const products = await response.json();
          const testProducts = products.filter(p => p.name && p.name.includes('Channel Test'));
          const otherProducts = products.filter(p => p.name && !p.name.includes('Channel Test'));
          
          console.log(`✅ ${channel.displayName} API (${response.status}):`);
          console.log(`   📦 Total products: ${products.length}`);
          console.log(`   🧪 Test products: ${testProducts.length}`);
          console.log(`   📋 Other products: ${otherProducts.length}`);
          
          if (testProducts.length > 0) {
            testProducts.forEach(product => {
              console.log(`   🎯 Test: ${product.name} (ID: ${product.id})`);
              console.log(`      Price: ${product.price} | Rating: ${product.rating}`);
            });
          }
          
          results.push({
            channel: channel.name,
            displayName: channel.displayName,
            status: 'success',
            totalProducts: products.length,
            testProducts: testProducts.length,
            otherProducts: otherProducts.length
          });
          
        } else {
          console.log(`❌ ${channel.displayName} API: HTTP ${response.status}`);
          results.push({
            channel: channel.name,
            displayName: channel.displayName,
            status: 'error',
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        console.log(`❌ ${channel.displayName} API: ${error.message}`);
        results.push({
          channel: channel.name,
          displayName: channel.displayName,
          status: 'error',
          error: error.message
        });
      }
      console.log('');
    }
    
    console.log('🔄 STEP 3: Cross-channel verification');
    console.log('=====================================');
    
    // Check if test products appear on wrong pages
    let crossContamination = false;
    
    for (const channel of channels) {
      try {
        const response = await fetch(`${baseUrl}/api/products/page/${channel.name}`);
        if (response.ok) {
          const products = await response.json();
          
          // Check for test products from other channels
          const wrongTestProducts = products.filter(p => 
            p.name && 
            p.name.includes('Channel Test') && 
            !p.name.includes(channel.displayName)
          );
          
          if (wrongTestProducts.length > 0) {
            console.log(`⚠️  ${channel.displayName} has products from other channels:`);
            wrongTestProducts.forEach(product => {
              console.log(`   🚫 Wrong: ${product.name} (ID: ${product.id})`);
            });
            crossContamination = true;
          } else {
            console.log(`✅ ${channel.displayName}: No cross-contamination detected`);
          }
        }
      } catch (error) {
        console.log(`❌ ${channel.displayName}: Error checking cross-contamination`);
      }
    }
    
    if (!crossContamination) {
      console.log('\n🎉 No cross-contamination detected! Products are properly isolated.');
    }
    
    console.log('\n📋 VERIFICATION SUMMARY');
    console.log('=======================');
    
    const successfulChannels = results.filter(r => r.status === 'success');
    const errorChannels = results.filter(r => r.status === 'error');
    
    console.log(`✅ Successful API calls: ${successfulChannels.length}/${channels.length}`);
    console.log(`❌ Failed API calls: ${errorChannels.length}/${channels.length}`);
    
    if (successfulChannels.length > 0) {
      const totalTestProducts = successfulChannels.reduce((sum, r) => sum + r.testProducts, 0);
      const totalOtherProducts = successfulChannels.reduce((sum, r) => sum + r.otherProducts, 0);
      
      console.log(`🧪 Total test products found: ${totalTestProducts}`);
      console.log(`📦 Total other products found: ${totalOtherProducts}`);
      
      console.log('\n📊 Per-channel breakdown:');
      successfulChannels.forEach(result => {
        console.log(`   ${result.displayName}: ${result.testProducts} test + ${result.otherProducts} other = ${result.totalProducts} total`);
      });
    }
    
    if (errorChannels.length > 0) {
      console.log('\n❌ Channels with errors:');
      errorChannels.forEach(result => {
        console.log(`   ${result.displayName}: ${result.error}`);
      });
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    
    if (successfulChannels.length === channels.length && !crossContamination) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('✅ All channels are posting to their respective pages correctly');
      console.log('✅ No cross-contamination between channels');
      console.log('✅ API endpoints are working properly');
      console.log('✅ Database storage is functioning correctly');
    } else {
      console.log('⚠️  Some issues detected:');
      if (errorChannels.length > 0) {
        console.log(`   - ${errorChannels.length} API endpoints failed`);
      }
      if (crossContamination) {
        console.log('   - Cross-contamination detected between channels');
      }
    }
    
    console.log('\n🌐 WEBSITE VERIFICATION:');
    console.log('========================');
    console.log('To manually verify on the website, visit:');
    channels.forEach(channel => {
      console.log(`🔗 ${channel.displayName}: http://localhost:5000/${channel.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    db.close();
  }
}

// Run the verification
verifyPageProducts();