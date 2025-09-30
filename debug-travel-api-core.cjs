const Database = require('better-sqlite3');
const express = require('express');
const app = express();

console.log('🔍 COMPREHENSIVE TRAVEL API DEBUGGING');
console.log('='.repeat(60));

// Step 1: Test database connection and table structure
console.log('\n📋 Step 1: Database Connection & Structure');
try {
  const db = new Database('database.sqlite');
  console.log('✅ Database connection successful');
  
  // Check if travel_products table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='travel_products'").all();
  if (tables.length === 0) {
    console.log('❌ CRITICAL: travel_products table does not exist!');
    console.log('Available tables:');
    const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    allTables.forEach(t => console.log(`  - ${t.name}`));
    db.close();
    process.exit(1);
  }
  
  console.log('✅ travel_products table exists');
  
  // Check table schema
  const schema = db.prepare("PRAGMA table_info(travel_products)").all();
  console.log('\n📊 Table Schema:');
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check data count
  const count = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`\n📊 Total records: ${count.count}`);
  
  if (count.count === 0) {
    console.log('❌ CRITICAL: No data in travel_products table!');
    db.close();
    process.exit(1);
  }
  
  // Test the exact API query
  console.log('\n📋 Step 2: Testing API Query');
  const apiQuery = `
    SELECT 
      id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, subcategory, travel_type as travelType, partner, route, duration, valid_till as validTill,
      rating, review_count as reviewCount, discount,
      is_featured as isFeatured, is_new as isNew,
      category_icon, category_color, source,
      created_at as createdAt, updated_at as updatedAt
    FROM travel_products 
    WHERE processing_status = 'active'
  `;
  
  console.log('Query:', apiQuery.trim());
  
  try {
    const results = db.prepare(apiQuery).all();
    console.log(`✅ Query successful! Found ${results.length} records`);
    
    if (results.length > 0) {
      console.log('\n📋 Sample Record:');
      const sample = results[0];
      Object.keys(sample).forEach(key => {
        console.log(`  ${key}: ${sample[key]}`);
      });
      
      // Test ID formatting
      console.log('\n📋 Step 3: Testing ID Formatting');
      const formattedId = `travel_picks_${sample.id}`;
      console.log(`Original ID: ${sample.id}`);
      console.log(`Formatted ID: ${formattedId}`);
      
      // Test icon availability
      console.log('\n📋 Step 4: Testing Icon Data');
      console.log(`Category Icon: ${sample.category_icon || 'MISSING'}`);
      console.log(`Subcategory: ${sample.subcategory}`);
      console.log(`Travel Type: ${sample.travelType}`);
    }
    
  } catch (queryError) {
    console.log('❌ CRITICAL: API Query Failed!');
    console.log('Error:', queryError.message);
    console.log('Stack:', queryError.stack);
    
    // Try simpler queries to isolate the issue
    console.log('\n🔍 Trying simpler queries...');
    
    try {
      const simple1 = db.prepare('SELECT COUNT(*) as count FROM travel_products WHERE processing_status = "active"').get();
      console.log(`✅ Simple count query works: ${simple1.count} active records`);
    } catch (e) {
      console.log('❌ Simple count query failed:', e.message);
    }
    
    try {
      const simple2 = db.prepare('SELECT id, name FROM travel_products LIMIT 1').all();
      console.log('✅ Basic select works:', simple2);
    } catch (e) {
      console.log('❌ Basic select failed:', e.message);
    }
    
    try {
      const simple3 = db.prepare('SELECT category_icon FROM travel_products LIMIT 1').all();
      console.log('✅ Icon field accessible:', simple3);
    } catch (e) {
      console.log('❌ Icon field issue:', e.message);
    }
  }
  
  db.close();
  
} catch (dbError) {
  console.log('❌ CRITICAL: Database connection failed!');
  console.log('Error:', dbError.message);
  console.log('Stack:', dbError.stack);
  process.exit(1);
}

// Step 5: Test Express server simulation
console.log('\n📋 Step 5: Testing Express Server Simulation');
try {
  app.get('/test-travel-deals', (req, res) => {
    try {
      const db = new Database('database.sqlite');
      
      const query = `
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, subcategory, travel_type as travelType, partner, route, duration, valid_till as validTill,
          rating, review_count as reviewCount, discount,
          is_featured as isFeatured, is_new as isNew,
          category_icon, category_color, source,
          created_at as createdAt, updated_at as updatedAt
        FROM travel_products 
        WHERE processing_status = 'active'
      `;
      
      const travelDeals = db.prepare(query).all();
      
      const formattedDeals = travelDeals.map((deal) => ({
        ...deal,
        id: `travel_picks_${deal.id}`,
        source: 'travel-picks',
        networkBadge: 'Travel Picks',
        imageUrl: deal.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        affiliateUrl: deal.affiliateUrl || '#',
        travelType: deal.travelType || deal.subcategory,
        partner: deal.partner || 'Travel Partner',
        validTill: deal.validTill,
        route: deal.route,
        duration: deal.duration
      }));
      
      db.close();
      res.json(formattedDeals);
      
    } catch (error) {
      console.log('❌ Express simulation error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
  const server = app.listen(3001, () => {
    console.log('✅ Test server started on port 3001');
    
    // Test the endpoint
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/test-travel-deals',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (Array.isArray(result)) {
            console.log(`✅ Test endpoint works! Found ${result.length} deals`);
            if (result.length > 0) {
              console.log('Sample deal:', {
                id: result[0].id,
                name: result[0].name,
                subcategory: result[0].subcategory,
                category_icon: result[0].category_icon
              });
            }
          } else {
            console.log('❌ Test endpoint returned error:', result);
          }
        } catch (e) {
          console.log('❌ Test endpoint response parse error:', e.message);
          console.log('Raw response:', data);
        }
        server.close();
        console.log('\n🎯 DIAGNOSIS COMPLETE!');
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Test request error:', e.message);
      server.close();
    });
    
    req.end();
  });
  
} catch (serverError) {
  console.log('❌ Express server simulation failed:', serverError.message);
}

console.log('\n✅ Core diagnostic script completed.');