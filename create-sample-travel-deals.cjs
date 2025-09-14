/**
 * Create Sample Travel Deals
 * Adds sample travel products to the travel_deals table for testing
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('Launch Creating sample travel deals...');

// Create travel_deals table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS travel_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    originalPrice TEXT,
    currency TEXT DEFAULT 'INR',
    imageUrl TEXT NOT NULL,
    affiliateUrl TEXT NOT NULL,
    originalUrl TEXT,
    category TEXT DEFAULT 'travel',
    subcategory TEXT,
    travelType TEXT,
    partner TEXT,
    validTill TEXT,
    route TEXT,
    duration TEXT,
    rating REAL,
    reviewCount INTEGER,
    source TEXT DEFAULT 'sample_data',
    telegramMessageId INTEGER,
    telegramChannelId INTEGER,
    processingStatus TEXT DEFAULT 'active',
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Sample travel deals data
const sampleDeals = [
  // Flights
  {
    name: 'Delhi to Mumbai Flight - IndiGo',
    description: 'Non-stop flight from Delhi to Mumbai with IndiGo Airlines',
    price: '4500',
    originalPrice: '6000',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
    affiliateUrl: 'https://example.com/flight1',
    travelType: 'flights',
    partner: 'IndiGo',
    route: 'DEL → BOM',
    duration: '2h 15m',
    rating: 4.2,
    reviewCount: 1250
  },
  {
    name: 'Bangalore to Goa Flight - SpiceJet',
    description: 'Direct flight from Bangalore to Goa with SpiceJet',
    price: '3200',
    originalPrice: '4500',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
    affiliateUrl: 'https://example.com/flight2',
    travelType: 'flights',
    partner: 'SpiceJet',
    route: 'BLR → GOI',
    duration: '1h 30m',
    rating: 4.0,
    reviewCount: 890
  },
  
  // Hotels
  {
    name: 'Taj Hotel Mumbai - Luxury Stay',
    description: 'Premium luxury hotel in the heart of Mumbai',
    price: '8500',
    originalPrice: '12000',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    affiliateUrl: 'https://example.com/hotel1',
    travelType: 'hotels',
    partner: 'Taj Hotels',
    duration: '1 night',
    rating: 4.8,
    reviewCount: 2340
  },
  {
    name: 'OYO Rooms Goa Beach Resort',
    description: 'Comfortable beachside accommodation in Goa',
    price: '2500',
    originalPrice: '3500',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    affiliateUrl: 'https://example.com/hotel2',
    travelType: 'hotels',
    partner: 'OYO',
    duration: '1 night',
    rating: 4.1,
    reviewCount: 567
  },
  
  // Packages
  {
    name: 'Kerala Backwaters 3D/2N Package',
    description: 'Complete Kerala backwaters experience with houseboat stay',
    price: '15000',
    originalPrice: '20000',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    affiliateUrl: 'https://example.com/package1',
    travelType: 'packages',
    partner: 'Kerala Tourism',
    duration: '3 days 2 nights',
    rating: 4.6,
    reviewCount: 1890
  },
  {
    name: 'Rajasthan Royal Heritage Tour',
    description: '7-day royal heritage tour covering Jaipur, Udaipur, Jodhpur',
    price: '35000',
    originalPrice: '45000',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    affiliateUrl: 'https://example.com/package2',
    travelType: 'packages',
    partner: 'Rajasthan Tourism',
    duration: '7 days 6 nights',
    rating: 4.7,
    reviewCount: 2100
  },
  
  // Tours
  {
    name: 'Agra Taj Mahal Day Tour',
    description: 'Same day Agra tour with Taj Mahal and Agra Fort visit',
    price: '2800',
    originalPrice: '3500',
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400',
    affiliateUrl: 'https://example.com/tour1',
    travelType: 'tours',
    partner: 'Golden Triangle Tours',
    duration: '12 hours',
    rating: 4.5,
    reviewCount: 3200
  },
  
  // Bus
  {
    name: 'Delhi to Manali Volvo Bus',
    description: 'Comfortable AC Volvo bus service from Delhi to Manali',
    price: '1200',
    originalPrice: '1500',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
    affiliateUrl: 'https://example.com/bus1',
    travelType: 'bus',
    partner: 'RedBus',
    route: 'Delhi → Manali',
    duration: '14 hours',
    rating: 4.0,
    reviewCount: 890
  },
  
  // Train
  {
    name: 'Mumbai to Goa Konkan Railway',
    description: 'Scenic train journey through Konkan coast',
    price: '800',
    originalPrice: '1000',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400',
    affiliateUrl: 'https://example.com/train1',
    travelType: 'train',
    partner: 'Indian Railways',
    route: 'Mumbai → Goa',
    duration: '8 hours',
    rating: 4.3,
    reviewCount: 1560
  },
  
  // Car Rental
  {
    name: 'Self Drive Car Rental - Goa',
    description: 'Rent a car for exploring Goa at your own pace',
    price: '2000',
    originalPrice: '2500',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    affiliateUrl: 'https://example.com/car1',
    travelType: 'car-rental',
    partner: 'Zoomcar',
    duration: '24 hours',
    rating: 4.2,
    reviewCount: 670
  },
  
  // Cruises
  {
    name: 'Mumbai to Goa Cruise',
    description: 'Luxury cruise experience from Mumbai to Goa',
    price: '25000',
    originalPrice: '30000',
    imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400',
    affiliateUrl: 'https://example.com/cruise1',
    travelType: 'cruises',
    partner: 'Jalesh Cruises',
    duration: '3 days 2 nights',
    rating: 4.4,
    reviewCount: 450
  },
  
  // Tickets
  {
    name: 'Wonderla Bangalore Entry Tickets',
    description: 'Full day access to Wonderla amusement park',
    price: '1200',
    originalPrice: '1500',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    affiliateUrl: 'https://example.com/ticket1',
    travelType: 'tickets',
    partner: 'Wonderla',
    duration: '1 day',
    rating: 4.6,
    reviewCount: 2890
  }
];

// Insert sample deals
const insertStmt = db.prepare(`
  INSERT INTO travel_deals (
    name, description, price, originalPrice, currency, imageUrl, affiliateUrl,
    category, subcategory, travelType, partner, route, duration, rating, reviewCount, source
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let insertedCount = 0;

for (const deal of sampleDeals) {
  try {
    const result = insertStmt.run(
      deal.name,
      deal.description,
      deal.price,
      deal.originalPrice,
      'INR',
      deal.imageUrl,
      deal.affiliateUrl,
      'travel',
      deal.travelType,
      deal.travelType,
      deal.partner,
      deal.route || null,
      deal.duration,
      deal.rating,
      deal.reviewCount,
      'sample_data'
    );
    
    insertedCount++;
    console.log(`Success Added: ${deal.name} (ID: ${result.lastInsertRowid})`);
  } catch (error) {
    console.error(`Error Error adding ${deal.name}:`, error.message);
  }
}

// Get counts by category
const counts = db.prepare(`
  SELECT travelType, COUNT(*) as count 
  FROM travel_deals 
  WHERE processingStatus = 'active'
  GROUP BY travelType
`).all();

console.log('\nStats Travel Deals Summary:');
counts.forEach(({ travelType, count }) => {
  console.log(`   ${travelType}: ${count} deals`);
});

const totalCount = db.prepare('SELECT COUNT(*) as total FROM travel_deals WHERE processingStatus = "active"').get();
console.log(`\nCelebration Successfully created ${insertedCount} sample travel deals!`);
console.log(`📈 Total active travel deals: ${totalCount.total}`);
console.log('\nLaunch Your travel picks page should now show these deals!');

db.close();