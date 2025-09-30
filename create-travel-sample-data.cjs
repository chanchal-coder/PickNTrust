const fetch = require('node-fetch');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Create travel_deals table if it doesn't exist
function createTravelTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS travel_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      originalPrice TEXT,
      currency TEXT DEFAULT 'INR',
      imageUrl TEXT NOT NULL,
      affiliateUrl TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      rating TEXT,
      reviewCount TEXT,
      discount TEXT,
      isNew INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0,
      hasTimer INTEGER DEFAULT 0,
      timerDuration INTEGER,
      timerStartTime TEXT,
      displayPages TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      hasLimitedOffer INTEGER DEFAULT 0,
      limitedOfferText TEXT,
      content_type TEXT DEFAULT 'travel',
      source TEXT DEFAULT 'manual',
      networkBadge TEXT,
      travelType TEXT,
      partner TEXT,
      validTill TEXT,
      route TEXT,
      duration TEXT,
      sectionType TEXT,
      routeType TEXT,
      airline TEXT,
      departure TEXT,
      arrival TEXT,
      location TEXT,
      city TEXT,
      amenities TEXT,
      hotelType TEXT,
      roomType TEXT,
      cancellation TEXT,
      isBrand INTEGER DEFAULT 0,
      flightClass TEXT,
      stops TEXT
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ travel_deals table created/verified');
}

// Sample travel data for different categories and sections
const travelData = {
  flights: {
    featured: [
      {
        name: 'IndiGo - Delhi to Mumbai',
        description: 'Premium airline with on-time performance',
        price: '4500',
        originalPrice: '6000',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.goindigo.in/booking',
        category: 'flights',
        subcategory: 'domestic',
        rating: '4.2',
        reviewCount: '1250',
        discount: '25',
        isFeatured: 1,
        sectionType: 'featured',
        routeType: 'domestic',
        airline: 'IndiGo',
        departure: 'Delhi (DEL)',
        arrival: 'Mumbai (BOM)',
        duration: '2h 15m',
        flightClass: 'Economy',
        stops: 'Non-stop'
      },
      {
        name: 'Air India - Mumbai to London',
        description: 'International flights with premium service',
        price: '45000',
        originalPrice: '55000',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.airindia.in/booking',
        category: 'flights',
        subcategory: 'international',
        rating: '4.0',
        reviewCount: '890',
        discount: '18',
        isFeatured: 1,
        sectionType: 'featured',
        routeType: 'international',
        airline: 'Air India',
        departure: 'Mumbai (BOM)',
        arrival: 'London (LHR)',
        duration: '9h 30m',
        flightClass: 'Business',
        stops: 'Non-stop'
      }
    ],
    standard: [
      {
        name: 'SpiceJet - Bangalore to Chennai',
        description: 'Budget airline with good connectivity',
        price: '3200',
        originalPrice: '4000',
        imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.spicejet.com/booking',
        category: 'flights',
        subcategory: 'domestic',
        rating: '3.8',
        reviewCount: '650',
        discount: '20',
        sectionType: 'standard',
        routeType: 'domestic',
        airline: 'SpiceJet',
        departure: 'Bangalore (BLR)',
        arrival: 'Chennai (MAA)',
        duration: '1h 25m',
        flightClass: 'Economy',
        stops: 'Non-stop'
      }
    ],
    destinations: [
      {
        name: 'Goa Flights',
        description: 'Multiple airlines to Goa',
        price: '3500',
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.makemytrip.com/flights/goa',
        category: 'flights',
        sectionType: 'destinations',
        location: 'Goa',
        city: 'Goa'
      }
    ]
  },
  hotels: {
    featured: [
      {
        name: 'The Taj Mahal Palace, Mumbai',
        description: 'Experience unparalleled luxury at this iconic heritage hotel overlooking the Arabian Sea. Built in 1903, this architectural marvel combines old-world charm with modern sophistication. Enjoy world-class dining, rejuvenating spa treatments, and impeccable service that has hosted royalty and celebrities for over a century.',
        price: '15000',
        originalPrice: '20000',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.tajhotels.com/booking',
        category: 'hotels',
        rating: '4.8',
        reviewCount: '2100',
        discount: '25',
        isFeatured: 1,
        sectionType: 'featured',
        location: 'Mumbai',
        city: 'Mumbai',
        hotelType: 'Luxury',
        roomType: 'Deluxe Room',
        amenities: 'WiFi,Pool,Spa,Restaurant,Gym',
        cancellation: 'Free cancellation till 24 hours'
      },
      {
        name: 'ITC Grand Chola, Chennai',
        description: 'Discover South Indian grandeur at this magnificent hotel inspired by the great Chola dynasty. This award-winning property features opulent interiors, multiple dining venues serving authentic regional cuisine, a world-class spa, and state-of-the-art business facilities perfect for both leisure and corporate travelers.',
        price: '12000',
        originalPrice: '16000',
        imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.itchotels.in/booking',
        category: 'hotels',
        rating: '4.6',
        reviewCount: '1800',
        discount: '25',
        isFeatured: 1,
        sectionType: 'featured',
        location: 'Chennai',
        city: 'Chennai',
        hotelType: 'Business',
        roomType: 'Executive Suite',
        amenities: 'WiFi,Pool,Business Center,Restaurant',
        cancellation: 'Free cancellation till 48 hours'
      }
    ],
    standard: [
      {
        name: 'Hotel Sunshine, Goa',
        description: 'Beach resort with modern amenities',
        price: '5000',
        originalPrice: '7000',
        imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.booking.com/hotel-sunshine-goa',
        category: 'hotels',
        rating: '4.2',
        reviewCount: '950',
        discount: '29',
        sectionType: 'standard',
        location: 'Goa',
        city: 'Goa',
        hotelType: 'Resort',
        roomType: 'Sea View Room',
        amenities: 'WiFi,Pool,Beach Access,Restaurant'
      }
    ],
    destinations: [
      {
        name: 'Kerala Hotels',
        description: 'Backwater resorts and hill stations',
        price: '4000',
        imageUrl: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.makemytrip.com/hotels/kerala',
        category: 'hotels',
        sectionType: 'destinations',
        location: 'Kerala',
        city: 'Kerala'
      }
    ]
  },
  tours: {
    featured: [
      {
        name: 'Golden Triangle Tour - 7 Days',
        description: 'Embark on India\'s most iconic journey covering Delhi, Agra, and Jaipur. This comprehensive tour includes visits to the majestic Taj Mahal, the historic Red Fort, Jaipur\'s Pink City attractions, and Amber Fort. Experience rich Mughal and Rajput heritage with expert guides, luxury accommodations, and authentic cultural experiences including traditional cuisine and local crafts.',
        price: '25000',
        originalPrice: '35000',
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.incredibleindia.org/golden-triangle',
        category: 'tours',
        rating: '4.7',
        reviewCount: '1200',
        discount: '29',
        isFeatured: 1,
        sectionType: 'featured',
        duration: '7 days 6 nights',
        location: 'Delhi-Agra-Jaipur'
      },
      {
        name: 'Rajasthan Heritage Tour - 10 Days',
        description: 'Discover the royal splendor of Rajasthan with this extensive heritage tour covering magnificent palaces, ancient forts, and the golden Thar Desert. Visit Udaipur\'s Lake Palace, Jodhpur\'s Blue City, Jaisalmer\'s golden fort, and experience camel safaris, traditional folk performances, and stay in heritage hotels that were once royal residences.',
        price: '40000',
        originalPrice: '50000',
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.rajasthantourism.gov.in/heritage-tour',
        category: 'tours',
        rating: '4.5',
        reviewCount: '800',
        discount: '20',
        isFeatured: 1,
        sectionType: 'featured',
        duration: '10 days 9 nights',
        location: 'Rajasthan'
      }
    ],
    standard: [
      {
        name: 'Shimla Manali Package - 5 Days',
        description: 'Hill station tour with adventure activities',
        price: '15000',
        originalPrice: '20000',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.himachaltourism.gov.in/shimla-manali',
        category: 'tours',
        rating: '4.3',
        reviewCount: '600',
        discount: '25',
        sectionType: 'standard',
        duration: '5 days 4 nights',
        location: 'Himachal Pradesh'
      }
    ],
    destinations: [
      {
        name: 'Kashmir Tours',
        description: 'Paradise on earth packages',
        price: '20000',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.jktourism.jk.gov.in/kashmir-tours',
        category: 'tours',
        sectionType: 'destinations',
        location: 'Kashmir',
        city: 'Srinagar'
      }
    ]
  },
  cruises: {
    featured: [
      {
        name: 'Cordelia Cruises - Mumbai to Goa',
        description: 'Luxury cruise with entertainment and dining',
        price: '18000',
        originalPrice: '25000',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.cordeliacruises.com/booking',
        category: 'cruises',
        rating: '4.4',
        reviewCount: '450',
        discount: '28',
        isFeatured: 1,
        sectionType: 'featured',
        duration: '3 days 2 nights',
        route: 'Mumbai - Goa - Mumbai',
        partner: 'Cordelia Cruises'
      }
    ],
    standard: [
      {
        name: 'Angriya Cruise - Mumbai to Goa',
        description: 'Overnight cruise with comfortable cabins',
        price: '12000',
        originalPrice: '15000',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.angriya.com/booking',
        category: 'cruises',
        rating: '4.1',
        reviewCount: '320',
        discount: '20',
        sectionType: 'standard',
        duration: '1 night',
        route: 'Mumbai - Goa',
        partner: 'Angriya'
      }
    ],
    destinations: [
      {
        name: 'Arabian Sea Cruises',
        description: 'Various cruise options',
        price: '10000',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
        affiliateUrl: 'https://www.makemytrip.com/cruises/arabian-sea',
        category: 'cruises',
        sectionType: 'destinations',
        location: 'Arabian Sea'
      }
    ]
  }
};

// Insert travel data
function insertTravelData() {
  const insertSQL = `
    INSERT INTO travel_deals (
      name, description, price, originalPrice, currency, imageUrl, affiliateUrl,
      category, subcategory, rating, reviewCount, discount, isFeatured, sectionType,
      routeType, airline, departure, arrival, duration, flightClass, stops,
      location, city, hotelType, roomType, amenities, cancellation,
      route, partner, displayPages, content_type, source
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;
  
  const stmt = db.prepare(insertSQL);
  let totalInserted = 0;
  
  Object.keys(travelData).forEach(category => {
    Object.keys(travelData[category]).forEach(sectionType => {
      travelData[category][sectionType].forEach(item => {
        const values = [
          item.name,
          item.description || '',
          item.price,
          item.originalPrice || null,
          item.currency || 'INR',
          item.imageUrl,
          item.affiliateUrl,
          item.category,
          item.subcategory || null,
          item.rating || null,
          item.reviewCount || null,
          item.discount || null,
          item.isFeatured || 0,
          item.sectionType,
          item.routeType || null,
          item.airline || null,
          item.departure || null,
          item.arrival || null,
          item.duration || null,
          item.flightClass || null,
          item.stops || null,
          item.location || null,
          item.city || null,
          item.hotelType || null,
          item.roomType || null,
          item.amenities || null,
          item.cancellation || null,
          item.route || null,
          item.partner || null,
          JSON.stringify(['travel-picks']),
          'travel',
          'sample_data'
        ];
        
        try {
          stmt.run(values);
          totalInserted++;
          console.log(`✅ Added ${category} ${sectionType}: ${item.name}`);
        } catch (error) {
          console.error(`❌ Error adding ${item.name}:`, error.message);
        }
      });
    });
  });
  
  console.log(`\n🎉 Successfully inserted ${totalInserted} travel deals!`);
}

// Main function
async function createSampleTravelData() {
  try {
    console.log('🚀 Creating sample travel data...');
    
    // Create table
    createTravelTable();
    
    // Clear existing sample data
    db.exec("DELETE FROM travel_deals WHERE source = 'sample_data'");
    console.log('🧹 Cleared existing sample data');
    
    // Insert new sample data
    insertTravelData();
    
    // Verify data
    const count = db.prepare('SELECT COUNT(*) as count FROM travel_deals').get();
    console.log(`\n📊 Total travel deals in database: ${count.count}`);
    
    // Show breakdown by category and section
    const breakdown = db.prepare(`
      SELECT category, sectionType, COUNT(*) as count 
      FROM travel_deals 
      WHERE source = 'sample_data'
      GROUP BY category, sectionType
      ORDER BY category, sectionType
    `).all();
    
    console.log('\n📋 Data breakdown:');
    breakdown.forEach(row => {
      console.log(`   ${row.category} (${row.sectionType}): ${row.count} items`);
    });
    
    console.log('\n✅ Sample travel data created successfully!');
    console.log('🌐 Visit http://localhost:5000/travel-picks?category=flights to see your cards!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    db.close();
  }
}

// Run the script
createSampleTravelData();