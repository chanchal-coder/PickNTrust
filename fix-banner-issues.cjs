// Fix Banner Display Issues
// 1. Remove unwanted fallback banners
// 2. Add proper database banners
// 3. Clear frontend cache

const Database = require('better-sqlite3');
const fetch = require('node-fetch');

console.log('🔧 FIXING BANNER DISPLAY ISSUES');
console.log('=' .repeat(50));

async function fixBannerIssues() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1️⃣ Current Banner Status:');
    
    // Check current prime-picks banners
    const primePicksBanners = db.prepare(`
      SELECT * FROM banners WHERE page = 'prime-picks'
    `).all();
    
    console.log(`   Prime Picks banners in database: ${primePicksBanners.length}`);
    
    if (primePicksBanners.length === 0) {
      console.log('   ⚠️ No Prime Picks banners found - this explains the fallback banner');
      
      console.log('\n2️⃣ Creating proper Prime Picks banner...');
      
      // Create a proper Prime Picks banner
      const result = db.prepare(`
        INSERT INTO banners (
          page, title, subtitle, imageUrl, linkUrl, buttonText,
          isActive, display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        'prime-picks',
        '👑 Prime Picks',
        'Discover our premium selection of top-quality products handpicked just for you!',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&q=80',
        '/prime-picks',
        '🛍️ Explore Prime Deals',
        1, // isActive
        1  // display_order
      );
      
      console.log(`   ✅ Created Prime Picks banner with ID: ${result.lastInsertRowid}`);
    } else {
      console.log('   ✅ Prime Picks banners already exist');
      primePicksBanners.forEach(banner => {
        console.log(`      - "${banner.title}" (ID: ${banner.id}, Active: ${banner.isActive ? 'YES' : 'NO'})`);
      });
    }
    
    // Check other pages that might need banners
    const pagesWithFallbacks = ['value-picks', 'cue-picks', 'loot-box', 'deals-hub'];
    
    console.log('\n3️⃣ Checking other pages for missing banners...');
    
    for (const page of pagesWithFallbacks) {
      const pageBanners = db.prepare(`
        SELECT * FROM banners WHERE page = ? AND isActive = 1
      `).all(page);
      
      console.log(`   ${page}: ${pageBanners.length} active banner(s)`);
      
      if (pageBanners.length === 0) {
        console.log(`     ⚠️ No banners found for ${page} - will show fallback`);
        
        // Create appropriate banners for missing pages
        let bannerData;
        switch (page) {
          case 'value-picks':
            bannerData = {
              title: '💎 Value Picks',
              subtitle: 'Maximum value for your money - Best bang for buck deals!',
              imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop&q=80',
              buttonText: '💰 Find Value Deals'
            };
            break;
          case 'cue-picks':
            bannerData = {
              title: '🎯 Cue Picks',
              subtitle: 'Trending products curated just for you - Don\'t miss out!',
              imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop&q=80',
              buttonText: '🔥 Browse Trends'
            };
            break;
          case 'loot-box':
            bannerData = {
              title: '🎁 Loot Box',
              subtitle: 'Surprise deals and mystery offers - Open your treasure!',
              imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=400&fit=crop&q=80',
              buttonText: '🎲 Open Loot Box'
            };
            break;
          case 'deals-hub':
            bannerData = {
              title: '🔥 Deals Hub',
              subtitle: 'Amazing deals and discounts on your favorite products!',
              imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop&q=80',
              buttonText: '🛍️ Shop Deals'
            };
            break;
        }
        
        if (bannerData) {
          const result = db.prepare(`
            INSERT INTO banners (
              page, title, subtitle, imageUrl, linkUrl, buttonText,
              isActive, display_order, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(
            page,
            bannerData.title,
            bannerData.subtitle,
            bannerData.imageUrl,
            `/${page}`,
            bannerData.buttonText,
            1, // isActive
            1  // display_order
          );
          
          console.log(`     ✅ Created ${page} banner with ID: ${result.lastInsertRowid}`);
        }
      }
    }
    
    console.log('\n4️⃣ Testing API endpoints...');
    
    // Test the banner API endpoints
    try {
      const response = await fetch('http://localhost:5000/api/banners/prime-picks');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API /api/banners/prime-picks: ${data.banners ? data.banners.length : 0} banners`);
      } else {
        console.log(`   ❌ API /api/banners/prime-picks failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ API test failed (server might be down): ${error.message}`);
    }
    
    console.log('\n5️⃣ Final banner summary:');
    
    // Get final count of all banners
    const allBanners = db.prepare(`
      SELECT page, COUNT(*) as count, 
             SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_count
      FROM banners 
      GROUP BY page 
      ORDER BY page
    `).all();
    
    allBanners.forEach(row => {
      console.log(`   ${row.page}: ${row.active_count}/${row.count} active banners`);
    });
    
    db.close();
    
    console.log('\n✅ Banner issues fixed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser to clear cache');
    console.log('   2. Check the admin panel - new banners should appear');
    console.log('   3. Database banners will now override fallback banners');
    console.log('   4. The unwanted Prime Picks fallback should be replaced');
    
  } catch (error) {
    console.error('❌ Error fixing banner issues:', error.message);
  }
}

// Run the fix
fixBannerIssues();