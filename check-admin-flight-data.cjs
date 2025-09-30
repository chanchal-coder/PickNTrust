const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 ADMIN FLIGHT DATA DETAILS');
console.log('='.repeat(50));

try {
  // Get the admin-added flight record
  const adminFlight = db.prepare(`
    SELECT * FROM travel_products 
    WHERE source = 'admin_form' AND category = 'flights'
    ORDER BY created_at DESC LIMIT 1
  `).get();
  
  if (adminFlight) {
    console.log('\n✅ ADMIN ADDED FLIGHT DATA:');
    console.log('='.repeat(30));
    
    // Basic Information
    console.log('📋 BASIC INFO:');
    console.log(`   ID: ${adminFlight.id}`);
    console.log(`   Name: ${adminFlight.name}`);
    console.log(`   Description: ${adminFlight.description || 'Not provided'}`);
    console.log(`   Price: ₹${adminFlight.price}`);
    console.log(`   Original Price: ₹${adminFlight.original_price || 'Not provided'}`);
    console.log(`   Currency: ${adminFlight.currency}`);
    
    // Travel Details
    console.log('\n✈️ TRAVEL DETAILS:');
    console.log(`   Category: ${adminFlight.category}`);
    console.log(`   Subcategory: ${adminFlight.subcategory}`);
    console.log(`   Travel Type: ${adminFlight.travel_type || 'Not specified'}`);
    console.log(`   Route: ${adminFlight.route || 'Not specified'}`);
    console.log(`   Duration: ${adminFlight.duration || 'Not specified'}`);
    console.log(`   Partner: ${adminFlight.partner || 'Not specified'}`);
    
    // URLs and Images
    console.log('\n🔗 LINKS & MEDIA:');
    console.log(`   Image URL: ${adminFlight.image_url || 'Not provided'}`);
    console.log(`   Affiliate URL: ${adminFlight.affiliate_url || 'Not provided'}`);
    console.log(`   Original URL: ${adminFlight.original_url || 'Not provided'}`);
    
    // Ratings and Reviews
    console.log('\n⭐ RATINGS:');
    console.log(`   Rating: ${adminFlight.rating || 'Not rated'}`);
    console.log(`   Review Count: ${adminFlight.review_count || 0}`);
    console.log(`   Discount: ${adminFlight.discount || 0}%`);
    
    // Status and Metadata
    console.log('\n📊 STATUS & METADATA:');
    console.log(`   Processing Status: ${adminFlight.processing_status}`);
    console.log(`   Is Featured: ${adminFlight.is_featured ? 'Yes' : 'No'}`);
    console.log(`   Is New: ${adminFlight.is_new ? 'Yes' : 'No'}`);
    console.log(`   Source: ${adminFlight.source}`);
    console.log(`   Content Type: ${adminFlight.content_type || 'Not specified'}`);
    console.log(`   Affiliate Network: ${adminFlight.affiliate_network || 'Not specified'}`);
    
    // Category Styling
    console.log('\n🎨 STYLING:');
    console.log(`   Category Icon: ${adminFlight.category_icon || 'Default'}`);
    console.log(`   Category Color: ${adminFlight.category_color || 'Default'}`);
    
    // Timestamps
    console.log('\n⏰ TIMESTAMPS:');
    console.log(`   Created: ${new Date(adminFlight.created_at * 1000).toLocaleString()}`);
    console.log(`   Updated: ${new Date(adminFlight.updated_at * 1000).toLocaleString()}`);
    if (adminFlight.expires_at) {
      console.log(`   Expires: ${new Date(adminFlight.expires_at * 1000).toLocaleString()}`);
    } else {
      console.log(`   Expires: Never`);
    }
    
    // Additional Fields
    console.log('\n📝 ADDITIONAL INFO:');
    console.log(`   Valid Till: ${adminFlight.valid_till || 'Not specified'}`);
    console.log(`   Display Order: ${adminFlight.display_order || 0}`);
    
  } else {
    console.log('❌ No admin-added flight data found');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Flight data check completed!');