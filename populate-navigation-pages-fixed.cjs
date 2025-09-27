const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');
  
  console.log('=== POPULATING NAVIGATION PAGES (FIXED) ===\n');
  
  // Sample products for different pages with all required fields
  const sampleProducts = [
    // Cue Picks - Smart selections
    {
      title: "Smart Fitness Tracker with AI Coaching",
      description: "Advanced fitness tracker with AI-powered coaching and health insights",
      price: "₹14,999",
      category: "Fitness",
      display_pages: '["cue-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/06B6D4/white?text=Fitness+Tracker',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ456/ref=sr_1_1?keywords=fitness+tracker&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'cue-picks',
      source_type: 'manual'
    },
    {
      title: "Intelligent Home Security Camera",
      description: "AI-powered security camera with smart detection and alerts",
      price: "₹19,999",
      category: "Security",
      display_pages: '["cue-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/06B6D4/white?text=Security+Camera',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ789/ref=sr_1_1?keywords=security+camera&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'cue-picks',
      source_type: 'manual'
    },
    
    // Value Picks - Best value for money
    {
      title: "Budget Wireless Earbuds - Great Sound",
      description: "High-quality wireless earbuds at an unbeatable price",
      price: "₹2,999",
      category: "Audio",
      display_pages: '["value-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Earbuds',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ101/ref=sr_1_1?keywords=wireless+earbuds&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'value-picks',
      source_type: 'manual'
    },
    {
      title: "Affordable Smartphone Stand",
      description: "Adjustable phone stand perfect for video calls and streaming",
      price: "₹1,299",
      category: "Accessories",
      display_pages: '["value-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Phone+Stand',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ102/ref=sr_1_1?keywords=phone+stand&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'value-picks',
      source_type: 'manual'
    },
    
    // Click Picks - Most popular
    {
      title: "Trending Gaming Mouse RGB",
      description: "Popular gaming mouse with customizable RGB lighting",
      price: "₹7,999",
      category: "Gaming",
      display_pages: '["click-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Gaming+Mouse',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ103/ref=sr_1_1?keywords=gaming+mouse&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'click-picks',
      source_type: 'manual'
    },
    {
      title: "Viral TikTok LED Strip Lights",
      description: "Color-changing LED strips that are trending on social media",
      price: "₹2,499",
      category: "Lighting",
      display_pages: '["click-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=LED+Strips',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ104/ref=sr_1_1?keywords=led+strip&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'click-picks',
      source_type: 'manual'
    },
    
    // Global Picks - International products
    {
      title: "Japanese Matcha Tea Set",
      description: "Authentic matcha tea set imported from Japan",
      price: "₹8,999",
      category: "Food & Beverage",
      display_pages: '["global-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/10B981/white?text=Matcha+Set',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ105/ref=sr_1_1?keywords=matcha+tea+set&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'global-picks',
      source_type: 'manual'
    },
    {
      title: "German Engineering Tool Kit",
      description: "Precision tools made in Germany for professionals",
      price: "₹15,999",
      category: "Tools",
      display_pages: '["global-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/10B981/white?text=Tool+Kit',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ106/ref=sr_1_1?keywords=tool+kit&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'global-picks',
      source_type: 'manual'
    },
    
    // Travel Picks - Travel essentials
    {
      title: "Compact Travel Backpack 40L",
      description: "Lightweight travel backpack perfect for carry-on",
      price: "₹11,999",
      category: "Travel",
      display_pages: '["travel-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Travel+Backpack',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ107/ref=sr_1_1?keywords=travel+backpack&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'travel-picks',
      source_type: 'manual'
    },
    {
      title: "Universal Travel Adapter",
      description: "All-in-one travel adapter with USB-C and wireless charging",
      price: "₹3,999",
      category: "Travel",
      display_pages: '["travel-picks"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Travel+Adapter',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ108/ref=sr_1_1?keywords=travel+adapter&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'travel-picks',
      source_type: 'manual'
    },
    
    // Deals Hub - Hot deals
    {
      title: "Flash Sale: Premium Headphones 50% OFF",
      description: "Limited time offer on premium noise-canceling headphones",
      price: "₹9,999",
      original_price: "₹19,999",
      category: "Audio",
      display_pages: '["deals-hub"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/EF4444/white?text=Headphones+SALE',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ109/ref=sr_1_1?keywords=headphones&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'deals-hub',
      source_type: 'manual'
    },
    {
      title: "Daily Deal: Smart Watch Bundle",
      description: "Smart watch with extra bands and screen protector",
      price: "₹14,999",
      original_price: "₹24,999",
      category: "Wearables",
      display_pages: '["deals-hub"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/EF4444/white?text=Smart+Watch',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ110/ref=sr_1_1?keywords=smart+watch&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'deals-hub',
      source_type: 'manual'
    },
    
    // Loot Box - Mystery items
    {
      title: "Tech Mystery Box - Surprise Gadgets",
      description: "Mystery box containing 3-5 tech gadgets worth ₹10,000+",
      price: "₹4,999",
      category: "Mystery",
      display_pages: '["loot-box"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Mystery+Box',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ111/ref=sr_1_1?keywords=mystery+box&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'loot-box',
      source_type: 'manual'
    },
    {
      title: "Gaming Loot Crate - Random Items",
      description: "Surprise gaming accessories and collectibles",
      price: "₹3,499",
      category: "Gaming",
      display_pages: '["loot-box"]',
      processing_status: 'processed',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Gaming+Loot',
      affiliate_url: 'https://www.amazon.in/dp/B08XYZ112/ref=sr_1_1?keywords=gaming+accessories&tag=pickntrust03-21',
      content_type: 'product',
      page_type: 'loot-box',
      source_type: 'manual'
    }
  ];
  
  // Insert products with all required fields
  const insertStmt = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, category, 
      display_pages, status, image_url, affiliate_url,
      content_type, page_type, source_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  let insertedCount = 0;
  
  sampleProducts.forEach(product => {
    try {
      insertStmt.run(
        product.title,
        product.description,
        product.price,
        product.original_price || product.price,
        product.category,
        product.display_pages,
        product.processing_status || 'active',
        product.image_url,
        product.affiliate_url,
        product.content_type,
        product.page_type,
        product.source_type
      );
      insertedCount++;
      console.log(`✓ Added: ${product.title}`);
    } catch (error) {
      console.error(`✗ Failed to add ${product.title}:`, error.message);
    }
  });
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Successfully added ${insertedCount} products`);
  
  // Verify the results
  console.log('\nVerifying products by page:');
  const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'travel-picks', 'deals-hub', 'loot-box'];
  
  pages.forEach(page => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%' 
      AND status = 'active'
    `).get(page);
    console.log(`  ${page}: ${count.count} products`);
  });
  
  db.close();
  console.log('\n✅ Database populated successfully!');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}