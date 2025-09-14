const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Adding amazing banners for all navigation pages...');

try {
  const insertBanner = db.prepare(`
    INSERT INTO banners (title, subtitle, imageUrl, linkUrl, buttonText, page, isActive, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Navigation pages banners data
  const navigationBanners = [
    // Top Picks Page
    {
      title: 'Premium Top Picks',
      subtitle: 'Handpicked premium products chosen by our experts for exceptional quality!',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/products?featured=true',
      buttonText: 'Featured View Top Picks',
      page: 'top-picks'
    },
    
    // Services Page
    {
      title: '🔧 Premium Services',
      subtitle: 'Professional services and solutions tailored to meet your specific needs!',
      imageUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/services',
      buttonText: 'Launch Explore Services',
      page: 'services'
    },
    
    // Apps & AI Apps Page
    {
      title: 'Mobile Apps & AI Tools',
      subtitle: 'Cutting-edge applications and AI-powered tools to boost your productivity!',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/apps',
      buttonText: 'AI Discover Apps',
      page: 'apps'
    },
    
    // Categories Page
    {
      title: '📂 All Categories',
      subtitle: 'Browse through our comprehensive collection of product categories!',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/categories',
      buttonText: 'Search Browse Categories',
      page: 'categories'
    },
    
    // Blog Page
    {
      title: 'Blog Latest Insights',
      subtitle: 'Stay updated with our latest articles, tips, and industry insights!',
      imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/blog',
      buttonText: '📖 Read Articles',
      page: 'blog'
    },
    
    // Videos Page
    {
      title: 'Video Video Content',
      subtitle: 'Watch our curated collection of informative and entertaining videos!',
      imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/videos',
      buttonText: '▶️ Watch Videos',
      page: 'videos'
    },
    
    // Wishlist Page
    {
      title: '❤️ Your Wishlist',
      subtitle: 'Keep track of your favorite products and never miss out on great deals!',
      imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/wishlist',
      buttonText: '💝 View Wishlist',
      page: 'wishlist'
    },
    
    // Contact Page
    {
      title: '📞 Get in Touch',
      subtitle: 'Have questions? We\'re here to help! Reach out to our friendly support team.',
      imageUrl: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/contact',
      buttonText: '💬 Contact Us',
      page: 'contact'
    },
    
    // Prime Picks Page
    {
      title: '👑 Prime Picks',
      subtitle: 'Exclusive premium products with the highest ratings and customer satisfaction!',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/prime-picks',
      buttonText: '👑 View Prime Picks',
      page: 'prime-picks'
    },
    
    // Cue Picks Page
    {
      title: 'Target Cue Picks',
      subtitle: 'Smart recommendations based on your preferences and browsing history!',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/cue-picks',
      buttonText: 'Target See Recommendations',
      page: 'cue-picks'
    },
    
    // Value Picks Page
    {
      title: '💎 Value Picks',
      subtitle: 'Best value for money products with unbeatable prices and quality!',
      imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/value-picks',
      buttonText: 'Price 1 Value Products Available',
      page: 'value-picks'
    },
    
    // Click Picks Page
    {
      title: '🖱️ Click Picks',
      subtitle: 'Trending products that are getting the most clicks and attention!',
      imageUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/click-picks',
      buttonText: 'Hot See Trending',
      page: 'click-picks'
    },
    
    // Deals Hub Page
    {
      title: '🏷️ Deals Hub',
      subtitle: 'Amazing deals and discounts on your favorite products - limited time offers!',
      imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/deals',
      buttonText: 'Deal Shop Deals',
      page: 'deals'
    },
    
    // Global Picks Page
    {
      title: '🌍 Global Picks',
      subtitle: 'International products and brands from around the world!',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/global-picks',
      buttonText: '🌎 Explore Global',
      page: 'global-picks'
    },
    
    // Loot Box Page
    {
      title: 'Gift Loot Box',
      subtitle: 'Surprise yourself with mystery boxes filled with amazing products!',
      imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=400&fit=crop&q=80',
      linkUrl: '/loot-box',
      buttonText: '🎲 Open Loot Box',
      page: 'loot-box'
    }
  ];

  // Insert banners for each navigation page
  let insertedCount = 0;
  
  navigationBanners.forEach((banner, index) => {
    try {
      // Check if banner already exists for this page
      const existingBanner = db.prepare('SELECT id FROM banners WHERE page = ? AND title = ?').get(banner.page, banner.title);
      
      if (!existingBanner) {
        insertBanner.run(
          banner.title,
          banner.subtitle,
          banner.imageUrl,
          banner.linkUrl,
          banner.buttonText,
          banner.page,
          1, // isActive
          1  // display_order
        );
        insertedCount++;
        console.log(`Success Added banner for ${banner.page}: "${banner.title}"`);
      } else {
        console.log(`⏭️  Banner already exists for ${banner.page}: "${banner.title}"`);
      }
    } catch (error) {
      console.error(`Error Error adding banner for ${banner.page}:`, error.message);
    }
  });

  console.log(`\nCelebration Successfully processed ${navigationBanners.length} navigation banners!`);
  console.log(`Stats Inserted: ${insertedCount} new banners`);
  console.log(`Stats Skipped: ${navigationBanners.length - insertedCount} existing banners`);

  // Show all banners by page
  const allBanners = db.prepare('SELECT page, title, isActive FROM banners ORDER BY page, display_order').all();
  console.log('\n📋 Current banners by page:');
  
  const bannersByPage = {};
  allBanners.forEach(banner => {
    if (!bannersByPage[banner.page]) {
      bannersByPage[banner.page] = [];
    }
    bannersByPage[banner.page].push(banner);
  });
  
  Object.keys(bannersByPage).sort().forEach(page => {
    console.log(`\n📄 ${page}:`);
    bannersByPage[page].forEach(banner => {
      console.log(`   - "${banner.title}" (${banner.isActive ? 'Active' : 'Inactive'})`);
    });
  });

  console.log('\nTip Next steps:');
  console.log('   1. Banners are now available for all navigation pages');
  console.log('   2. Each page has a beautiful, responsive banner');
  console.log('   3. Manage banners through the admin panel');
  console.log('   4. Add more banners or customize existing ones');
  console.log('   5. Banners will auto-slide if multiple are active');

} catch (error) {
  console.error('Error Error adding navigation banners:', error);
} finally {
  db.close();
}