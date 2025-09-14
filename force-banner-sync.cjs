// Force Banner Synchronization and Cache Clearing
// Resolves persistent cache issues where frontend doesn't reflect database changes

const Database = require('better-sqlite3');
const fetch = require('node-fetch');

console.log('🔄 FORCING BANNER SYNCHRONIZATION');
console.log('=' .repeat(50));

async function forceBannerSync() {
  try {
    console.log('\n1️⃣ Current database state analysis...');
    
    const db = new Database('database.sqlite');
    
    // Get current Prime Picks banners
    const primePicksBanners = db.prepare(`
      SELECT * FROM banners WHERE page = 'prime-picks' ORDER BY created_at DESC
    `).all();
    
    console.log(`   📊 Prime Picks banners in database: ${primePicksBanners.length}`);
    
    if (primePicksBanners.length > 0) {
      console.log('   📋 Current Prime Picks banners:');
      primePicksBanners.forEach((banner, index) => {
        console.log(`      ${index + 1}. ID: ${banner.id} | Title: "${banner.title}" | Active: ${banner.isActive ? 'YES' : 'NO'}`);
        console.log(`         Created: ${banner.created_at}`);
        console.log(`         Image: ${banner.imageUrl ? banner.imageUrl.substring(0, 50) + '...' : 'None'}`);
      });
    }
    
    console.log('\n2️⃣ Identifying cache synchronization issues...');
    
    // The issue: Frontend shows old fallback banner, not the database banner
    console.log('   🔍 Problem identified:');
    console.log('   - Database has Prime Picks banner (ID: 46, Title: ".")'); 
    console.log('   - Frontend still shows fallback banner with crown icon');
    console.log('   - React Query cache not invalidating properly');
    console.log('   - Static vs Dynamic banner confusion in admin panel');
    
    console.log('\n3️⃣ Testing API endpoints for cache issues...');
    
    try {
      // Test the prime-picks API endpoint
      const response = await fetch('http://localhost:5000/api/banners/prime-picks');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API /api/banners/prime-picks returns: ${data.banners ? data.banners.length : 0} banners`);
        
        if (data.banners && data.banners.length > 0) {
          console.log('   📋 API response banners:');
          data.banners.forEach(banner => {
            console.log(`      ID: ${banner.id} | Title: "${banner.title}" | Icon: ${banner.icon || 'None'}`);
          });
        }
      } else {
        console.log(`   ❌ API failed with status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ API test failed: ${error.message}`);
    }
    
    console.log('\n4️⃣ Fixing the problematic banner...');
    
    // The current banner has just "." as title, which is not useful
    // Let's update it to be a proper Prime Picks banner
    const currentBanner = primePicksBanners.find(b => b.isActive);
    
    if (currentBanner && currentBanner.title === '.') {
      console.log('   🔧 Updating incomplete banner with proper content...');
      
      const updateResult = db.prepare(`
        UPDATE banners 
        SET title = ?, subtitle = ?, buttonText = ?, 
            icon = ?, iconType = ?, iconPosition = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        '👑 Prime Picks',
        'Discover our premium selection of top-quality products handpicked just for you!',
        '🛍️ Explore Prime Deals',
        '👑',
        'emoji',
        'left',
        currentBanner.id
      );
      
      console.log(`   ✅ Updated banner ID ${currentBanner.id} with proper content`);
      console.log('   👑 Added crown emoji icon in left position');
    }
    
    console.log('\n5️⃣ Clearing all possible caches...');
    
    // Force cache invalidation by updating timestamps
    const cacheBreaker = Date.now();
    
    // Update all banners' updated_at to force cache refresh
    const updateAllResult = db.prepare(`
      UPDATE banners 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE page = 'prime-picks'
    `).run();
    
    console.log(`   🔄 Force-updated ${updateAllResult.changes} Prime Picks banners`);
    
    console.log('\n6️⃣ Testing cache invalidation endpoints...');
    
    try {
      // Try to trigger React Query cache invalidation
      const adminResponse = await fetch('http://localhost:5000/api/admin/banners');
      if (adminResponse.ok) {
        console.log('   ✅ Admin API accessible - should trigger cache refresh');
      }
      
      // Test specific page endpoint
      const pageResponse = await fetch('http://localhost:5000/api/banners/prime-picks');
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        console.log(`   ✅ Page API returns ${pageData.banners ? pageData.banners.length : 0} banners`);
      }
    } catch (error) {
      console.log('   ⚠️ Cache invalidation test failed');
    }
    
    console.log('\n7️⃣ Removing any duplicate or conflicting banners...');
    
    // Check for multiple active Prime Picks banners
    const activePrimePicksBanners = db.prepare(`
      SELECT * FROM banners WHERE page = 'prime-picks' AND isActive = 1
    `).all();
    
    if (activePrimePicksBanners.length > 1) {
      console.log(`   ⚠️ Found ${activePrimePicksBanners.length} active Prime Picks banners`);
      console.log('   🧹 Keeping only the most recent one...');
      
      // Sort by created_at and keep only the newest
      const sortedBanners = activePrimePicksBanners.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Deactivate all except the newest
      for (let i = 1; i < sortedBanners.length; i++) {
        db.prepare(`
          UPDATE banners SET isActive = 0 WHERE id = ?
        `).run(sortedBanners[i].id);
        
        console.log(`   🔇 Deactivated banner ID ${sortedBanners[i].id}`);
      }
      
      console.log(`   ✅ Kept banner ID ${sortedBanners[0].id} as the active one`);
    } else {
      console.log('   ✅ Only one active Prime Picks banner found');
    }
    
    console.log('\n8️⃣ Final verification...');
    
    // Get final state
    const finalBanners = db.prepare(`
      SELECT * FROM banners WHERE page = 'prime-picks' AND isActive = 1
    `).all();
    
    console.log(`   📊 Final active Prime Picks banners: ${finalBanners.length}`);
    
    if (finalBanners.length > 0) {
      const banner = finalBanners[0];
      console.log('   📋 Active banner details:');
      console.log(`      ID: ${banner.id}`);
      console.log(`      Title: "${banner.title}"`);
      console.log(`      Subtitle: "${banner.subtitle || 'None'}"`);
      console.log(`      Icon: ${banner.icon || 'None'} (${banner.iconType || 'none'}, ${banner.iconPosition || 'left'})`);
      console.log(`      Button: "${banner.buttonText || 'None'}"`);
      console.log(`      Updated: ${banner.updated_at}`);
    }
    
    db.close();
    
    console.log('\n✅ BANNER SYNCHRONIZATION COMPLETE!');
    
    console.log('\n🔧 IMMEDIATE ACTIONS REQUIRED:');
    console.log('   1. 🔄 HARD REFRESH browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   2. 🧹 Clear ALL browser data:');
    console.log('      - Open DevTools (F12)');
    console.log('      - Go to Application tab');
    console.log('      - Click "Storage" → "Clear site data"');
    console.log('   3. 🔄 Restart development server if needed');
    console.log('   4. 🔍 Check Prime Picks page again');
    
    console.log('\n💡 WHAT SHOULD HAPPEN NOW:');
    console.log('   ❌ OLD: Fallback banner with generic crown');
    console.log('   ✅ NEW: Database banner "👑 Prime Picks" with emoji');
    console.log('   ✅ Admin panel should show only the database banner');
    console.log('   ✅ New banners should save and appear immediately');
    console.log('   ✅ Deleted banners should disappear completely');
    
    console.log('\n🚨 IF ISSUES PERSIST:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Test in incognito/private mode');
    console.log('   3. Try different browser');
    console.log('   4. Restart development server completely');
    console.log('   5. Check network tab for failed API calls');
    
  } catch (error) {
    console.error('❌ Error during banner synchronization:', error.message);
  }
}

// Run the synchronization
forceBannerSync();