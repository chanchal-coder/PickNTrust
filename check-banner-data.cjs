// Check current banner data in database
const Database = require('better-sqlite3');

console.log('🔍 CHECKING BANNER DATA');
console.log('=' .repeat(50));

try {
  const db = new Database('database.sqlite');
  
  // Check if banners table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='banners'
  `).get();
  
  if (!tableExists) {
    console.log('❌ Banners table does not exist!');
    db.close();
    return;
  }
  
  console.log('✅ Banners table exists');
  
  // Get all banners
  const banners = db.prepare(`
    SELECT id, page, title, subtitle, imageUrl, linkUrl, buttonText, 
           isActive, display_order, created_at, updated_at 
    FROM banners 
    ORDER BY page, display_order
  `).all();
  
  console.log(`\n📊 Total banners in database: ${banners.length}`);
  
  if (banners.length === 0) {
    console.log('⚠️ No banners found in database');
  } else {
    console.log('\n📋 Banner Details:');
    banners.forEach((banner, index) => {
      console.log(`\n${index + 1}. Banner ID: ${banner.id}`);
      console.log(`   Page: ${banner.page}`);
      console.log(`   Title: ${banner.title}`);
      console.log(`   Subtitle: ${banner.subtitle || 'None'}`);
      console.log(`   Image URL: ${banner.imageUrl || 'None'}`);
      console.log(`   Link URL: ${banner.linkUrl || 'None'}`);
      console.log(`   Button Text: ${banner.buttonText || 'None'}`);
      console.log(`   Active: ${banner.isActive ? 'YES' : 'NO'}`);
      console.log(`   Display Order: ${banner.display_order}`);
      console.log(`   Created: ${banner.created_at}`);
      console.log(`   Updated: ${banner.updated_at}`);
    });
  }
  
  // Check for prime-picks specific banners
  const primePicksBanners = banners.filter(b => b.page === 'prime-picks');
  console.log(`\n🎯 Prime Picks banners: ${primePicksBanners.length}`);
  
  if (primePicksBanners.length > 0) {
    console.log('\n👑 Prime Picks Banner Details:');
    primePicksBanners.forEach(banner => {
      console.log(`   ID: ${banner.id} | Title: "${banner.title}" | Active: ${banner.isActive ? 'YES' : 'NO'}`);
    });
  }
  
  // Check active banners by page
  const activeBannersByPage = {};
  banners.filter(b => b.isActive).forEach(banner => {
    if (!activeBannersByPage[banner.page]) {
      activeBannersByPage[banner.page] = [];
    }
    activeBannersByPage[banner.page].push(banner);
  });
  
  console.log('\n🟢 Active banners by page:');
  Object.keys(activeBannersByPage).forEach(page => {
    console.log(`   ${page}: ${activeBannersByPage[page].length} active banner(s)`);
    activeBannersByPage[page].forEach(banner => {
      console.log(`     - "${banner.title}" (ID: ${banner.id})`);
    });
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error checking banner data:', error.message);
}

console.log('\n✅ Banner data check completed!');