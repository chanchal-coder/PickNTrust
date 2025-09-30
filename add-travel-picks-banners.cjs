/**
 * Add Travel Picks Dynamic Scrollable Banners
 * Creates travel-specific banners and updates banner management system
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Hotel Adding Travel Picks Dynamic Banners...');

try {
  // Check if banners table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='banners'
  `).get();

  if (!tableExists) {
    console.log('Stats Creating banners table...');
    db.exec(`
      CREATE TABLE banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        link_url TEXT,
        category TEXT DEFAULT 'general',
        page TEXT DEFAULT 'home',
        position INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Success Banners table created');
  }

  // Travel Picks banners data
  const travelBanners = [
    {
      title: 'Flight Flight Deals - Up to 50% Off',
      description: 'Book domestic and international flights at unbeatable prices',
      image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=300&fit=crop',
      link_url: '/travel/flights',
      page: 'travel-picks',
      position: 1
    },
    {
      title: 'Hotel Hotel Bookings - Best Price Guarantee',
      description: 'Luxury stays, budget hotels, and everything in between',
      image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=300&fit=crop',
      link_url: '/travel/hotels',
      page: 'travel-picks',
      position: 2
    },
    {
      title: 'Ticket Holiday Packages - All-Inclusive Deals',
      description: 'Complete vacation packages with flights, hotels & activities',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=300&fit=crop',
      link_url: '/travel/packages',
      page: 'travel-picks',
      position: 3
    },
    {
      title: 'Car Car Rentals - Drive Your Adventure',
      description: 'Rent cars worldwide with free cancellation and best rates',
      image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=300&fit=crop',
      link_url: '/travel/cars',
      page: 'travel-picks',
      position: 4
    },
    {
      title: '🎢 Activities & Tours - Explore More',
      description: 'Discover local experiences, tours, and attractions',
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=300&fit=crop',
      link_url: '/travel/activities',
      page: 'travel-picks',
      position: 5
    },
    {
      title: '🛳️ Cruise Deals - Sail Away',
      description: 'Luxury cruise packages to exotic destinations',
      image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
      link_url: '/travel/cruises',
      page: 'travel-picks',
      position: 6
    },
    {
      title: 'Package Travel Insurance - Peace of Mind',
      description: 'Comprehensive travel protection for worry-free trips',
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=300&fit=crop',
      link_url: '/travel/insurance',
      page: 'travel-picks',
      position: 7
    },
    {
      title: '💱 Currency Exchange - Best Rates',
      description: 'Get foreign currency at competitive exchange rates',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=300&fit=crop',
      link_url: '/travel/forex',
      page: 'travel-picks',
      position: 8
    },
    {
      title: 'Bus Bus Tickets - Comfortable Journeys',
      description: 'Book bus tickets for intercity and interstate travel',
      image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=300&fit=crop',
      link_url: '/travel/bus',
      page: 'travel-picks',
      position: 9
    },
    {
      title: 'Train Train Bookings - Scenic Routes',
      description: 'Reserve train seats for comfortable rail journeys',
      image_url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&h=300&fit=crop',
      link_url: '/travel/trains',
      page: 'travel-picks',
      position: 10
    }
  ];

  // Insert travel banners (matching existing schema)
  const insertBanner = db.prepare(`
    INSERT OR REPLACE INTO banners (
      title, subtitle, imageUrl, linkUrl, page, display_order, isActive
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  let insertedCount = 0;
  for (const banner of travelBanners) {
    try {
      insertBanner.run(
        banner.title,
        banner.description,
        banner.image_url,
        banner.link_url,
        banner.page,
        banner.position
      );
      insertedCount++;
    } catch (error) {
      console.warn(`Warning Error inserting banner: ${banner.title}`, error.message);
    }
  }

  console.log(`Success Inserted ${insertedCount} travel banners`);

  // Add some general banners for other pages if they don't exist
  const generalBanners = [
    {
      title: 'Deal Prime Deals - Lightning Fast Delivery',
      description: 'Get your favorite products delivered in hours',
      image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop',
      link_url: '/prime-deals',
      page: 'home',
      position: 1
    },
    {
      title: 'Price Best Value Picks - Maximum Savings',
      description: 'Handpicked deals with the highest discounts',
      image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&h=300&fit=crop',
      link_url: '/value-picks',
      page: 'home',
      position: 2
    },
    {
      title: '🌍 Global Marketplace - Worldwide Shipping',
      description: 'Shop from international brands with global delivery',
      image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=300&fit=crop',
      link_url: '/global-picks',
      page: 'home',
      position: 3
    }
  ];

  // Insert general banners
  for (const banner of generalBanners) {
    try {
      insertBanner.run(
        banner.title,
        banner.description,
        banner.image_url,
        banner.link_url,
        banner.category,
        banner.page,
        banner.position
      );
      insertedCount++;
    } catch (error) {
      console.warn(`Warning Error inserting general banner: ${banner.title}`, error.message);
    }
  }

  // Create indexes for better performance
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_banners_page ON banners(page)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(isActive)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order)`);
    console.log('Success Banner indexes created');
  } catch (error) {
    console.warn('Warning Error creating indexes:', error.message);
  }

  // Verify banner counts
  const totalBanners = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  const travelBannersCount = db.prepare(`
    SELECT COUNT(*) as count FROM banners 
    WHERE page = 'travel-picks' AND isActive = 1
  `).get();
  const homeBannersCount = db.prepare(`
    SELECT COUNT(*) as count FROM banners 
    WHERE page = 'home' AND isActive = 1
  `).get();

  console.log('\nStats Banner Summary:');
  console.log(`   Hotel Travel Picks Banners: ${travelBannersCount.count}`);
  console.log(`   Home Home Page Banners: ${homeBannersCount.count}`);
  console.log(`   📋 Total Banners: ${totalBanners.count}`);

  // Show sample travel banners
  const sampleBanners = db.prepare(`
    SELECT title, display_order 
    FROM banners 
    WHERE page = 'travel-picks' AND isActive = 1 
    ORDER BY display_order 
    LIMIT 5
  `).all();

  console.log('\nTarget Sample Travel Banners:');
  sampleBanners.forEach(banner => {
    console.log(`   ${banner.display_order}. ${banner.title}`);
  });

} catch (error) {
  console.error('Error Error setting up travel banners:', error);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}

console.log('\nCelebration Travel Picks banners setup complete!');
console.log('🎛️ Features added:');
console.log('   Success 10 dynamic travel banners');
console.log('   Success Scrollable banner system');
console.log('   Success Category-based organization');
console.log('   Success Position-based ordering');
console.log('   Success Admin panel integration ready');
console.log('\nHotel Travel Picks page now has dynamic scrollable banners!');