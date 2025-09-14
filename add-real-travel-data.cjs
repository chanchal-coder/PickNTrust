const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🚀 Adding real travel data to travel_products table...');

// Note: travel_products table should already exist
// This script now populates the unified travel_products table
console.log('✅ Using existing travel_products table structure');

// Backup: Create travel_products table if it doesn't exist (should not be needed)
// travel_products table should already exist with proper schema
// This is just a safety check - the table structure is managed elsewhere
console.log('📋 Checking travel_products table exists...');
try {
  const tableCheck = db.prepare('SELECT COUNT(*) as count FROM travel_products LIMIT 1').get();
  console.log('✅ travel_products table is ready');
} catch (error) {
  console.log('❌ travel_products table not found - please run migration first');
  process.exit(1);
}

// Sample real travel deals data
const realTravelDeals = [
  // FLIGHTS - Featured
  {
    name: 'IndiGo Airlines',
    description: 'Book IndiGo flights with exclusive offers and discounts. India\'s favorite airline.',
    price: 'From ₹3,500',
    original_price: '₹4,500',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.goindigo.in/',
    category: 'flights',
    section_type: 'featured',
    route_type: 'domestic',
    airline: 'IndiGo',
    flight_class: 'Economy',
    display_order: 1
  },
  {
    name: 'Air India Express',
    description: 'Fly Air India Express for international destinations with great deals.',
    price: 'From ₹15,000',
    original_price: '₹18,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.airindiaexpress.in/',
    category: 'flights',
    section_type: 'featured',
    route_type: 'international',
    airline: 'Air India Express',
    flight_class: 'Economy',
    display_order: 2
  },
  {
    name: 'SpiceJet',
    description: 'Red Hot deals on SpiceJet flights. Book now and save more.',
    price: 'From ₹2,999',
    original_price: '₹4,200',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.spicejet.com/',
    category: 'flights',
    section_type: 'standard',
    route_type: 'domestic',
    airline: 'SpiceJet',
    flight_class: 'Economy',
    display_order: 1
  },

  // HOTELS - Featured
  {
    name: 'Taj Hotels',
    description: 'Experience luxury at Taj Hotels with premium amenities and world-class service.',
    price: 'From ₹8,000',
    original_price: '₹12,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.tajhotels.com/',
    category: 'hotels',
    section_type: 'featured',
    hotel_type: 'luxury',
    route_type: 'domestic',
    display_order: 1
  },
  {
    name: 'OYO Hotels',
    description: 'Comfortable stays at budget-friendly prices. Book OYO hotels nationwide.',
    price: 'From ₹1,200',
    original_price: '₹2,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.oyorooms.com/',
    category: 'hotels',
    section_type: 'standard',
    hotel_type: 'budget',
    route_type: 'domestic',
    display_order: 1
  },

  // BUS - Featured
  {
    name: 'RedBus',
    description: 'Book bus tickets online with RedBus. Safe, reliable, and comfortable travel.',
    price: 'From ₹500',
    original_price: '₹800',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.redbus.in/',
    category: 'bus',
    section_type: 'featured',
    route_type: 'domestic',
    bus_type: 'AC Sleeper',
    display_order: 1
  },
  {
    name: 'Volvo Bus Service',
    description: 'Premium Volvo bus service with luxury seating and AC comfort.',
    price: 'From ₹800',
    original_price: '₹1,200',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.abhibus.com/',
    category: 'bus',
    section_type: 'standard',
    route_type: 'domestic',
    bus_type: 'AC Seater',
    display_order: 1
  },

  // TRAIN - Featured
  {
    name: 'IRCTC Rail Connect',
    description: 'Book train tickets online through official IRCTC portal. Secure and reliable.',
    price: 'From ₹300',
    original_price: '₹500',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.irctc.co.in/',
    category: 'train',
    section_type: 'featured',
    route_type: 'domestic',
    train_class: '3AC',
    display_order: 1
  },

  // PACKAGES - Featured
  {
    name: 'Goa Beach Package',
    description: '3 Days 2 Nights Goa beach vacation with hotel stay and sightseeing.',
    price: 'From ₹15,000',
    original_price: '₹20,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.makemytrip.com/',
    category: 'packages',
    section_type: 'featured',
    route_type: 'domestic',
    package_type: 'beach',
    duration: '3 Days 2 Nights',
    display_order: 1
  },
  {
    name: 'Kerala Backwaters',
    description: 'Explore the serene backwaters of Kerala with houseboat stay and local cuisine.',
    price: 'From ₹12,000',
    original_price: '₹16,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.goibibo.com/',
    category: 'packages',
    section_type: 'destinations',
    route_type: 'domestic',
    package_type: 'cultural',
    duration: '4 Days 3 Nights',
    display_order: 1
  },

  // TOURS - Featured
  {
    name: 'Rajasthan Heritage Tour',
    description: 'Discover the royal heritage of Rajasthan with palace visits and cultural experiences.',
    price: 'From ₹25,000',
    original_price: '₹30,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.thrillophilia.com/',
    category: 'tours',
    section_type: 'featured',
    route_type: 'domestic',
    tour_type: 'cultural',
    duration: '7 Days 6 Nights',
    display_order: 1
  },

  // CRUISES - Featured
  {
    name: 'Mumbai to Goa Cruise',
    description: 'Luxury cruise experience from Mumbai to Goa with onboard entertainment.',
    price: 'From ₹18,000',
    original_price: '₹25,000',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.cordelia-cruises.com/',
    category: 'cruises',
    section_type: 'featured',
    route_type: 'domestic',
    cruise_type: 'luxury',
    duration: '2 Days 1 Night',
    display_order: 1
  },

  // CAR RENTAL - Featured
  {
    name: 'Zoomcar Self Drive',
    description: 'Rent a car for self-drive adventures. Choose from economy to luxury vehicles.',
    price: 'From ₹1,500/day',
    original_price: '₹2,000/day',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop',
    affiliate_url: 'https://www.zoomcar.com/',
    category: 'car-rental',
    section_type: 'featured',
    route_type: 'domestic',
    car_type: 'economy',
    display_order: 1
  }
];

// Insert travel products into unified table
const insertDeal = db.prepare(`
  INSERT INTO travel_products (
    name, description, price, original_price, currency,
    image_url, affiliate_url, category, subcategory,
    route_type, departure, arrival, duration,
    airline, flight_class, hotel_type, bus_type,
    train_class, package_type, tour_type, cruise_type, car_type,
    is_featured, display_order, processing_status, source, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let addedCount = 0;

realTravelDeals.forEach(deal => {
  try {
    insertDeal.run(
      deal.name, deal.description, deal.price, deal.original_price, deal.currency,
      deal.image_url, deal.affiliate_url, deal.category, deal.section_type,
      deal.route_type, deal.departure, deal.arrival, deal.duration,
      deal.airline, deal.flight_class, deal.hotel_type, deal.bus_type,
      deal.train_class, deal.package_type, deal.tour_type, deal.cruise_type, deal.car_type,
      deal.section_type === 'featured' ? 1 : 0, deal.display_order,
      'active', 'sample_data', Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)
    );
    addedCount++;
    console.log(`✅ Added: ${deal.name} (${deal.category}/${deal.section_type})`);
  } catch (error) {
    console.error(`❌ Failed to add ${deal.name}:`, error.message);
  }
});

console.log(`\n🎉 Successfully added ${addedCount} real travel deals to the database!`);
console.log('\n📊 Summary by category:');

// Show summary
const summary = db.prepare(`
  SELECT category, subcategory, COUNT(*) as count 
  FROM travel_products 
  WHERE processing_status = 'active' 
  GROUP BY category, subcategory 
  ORDER BY category, subcategory
`).all();

summary.forEach(row => {
  console.log(`   ${row.category}/${row.subcategory}: ${row.count} deals`);
});

console.log('\n🚀 Travel deals are now ready! You can:');
console.log('   1. Start the server: npm run dev');
console.log('   2. Visit: http://localhost:5000/travel-picks');
console.log('   3. Add more deals via the admin interface');

db.close();