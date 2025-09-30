const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== POPULATING NAVIGATION PAGES ===\n');
  
  // Sample products for different pages
  const sampleProducts = [
    // Cue Picks - Smart selections
    {
      title: "Smart Fitness Tracker with AI Coaching",
      description: "Advanced fitness tracker with AI-powered coaching and health insights",
      price: 149.99,
      category: "Fitness",
      display_pages: '["cue-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/06B6D4/white?text=Fitness+Tracker'
    },
    {
      title: "Intelligent Home Security Camera",
      description: "AI-powered security camera with smart detection and alerts",
      price: 199.99,
      category: "Security",
      display_pages: '["cue-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/06B6D4/white?text=Security+Camera'
    },
    
    // Value Picks - Best value for money
    {
      title: "Budget Wireless Earbuds - Great Sound",
      description: "High-quality wireless earbuds at an unbeatable price",
      price: 29.99,
      category: "Audio",
      display_pages: '["value-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Earbuds'
    },
    {
      title: "Affordable Smartphone Stand",
      description: "Adjustable phone stand perfect for video calls and streaming",
      price: 12.99,
      category: "Accessories",
      display_pages: '["value-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Phone+Stand'
    },
    
    // Click Picks - Most popular
    {
      title: "Trending Gaming Mouse RGB",
      description: "Popular gaming mouse with customizable RGB lighting",
      price: 79.99,
      category: "Gaming",
      display_pages: '["click-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Gaming+Mouse'
    },
    {
      title: "Viral TikTok LED Strip Lights",
      description: "Color-changing LED strips that are trending on social media",
      price: 24.99,
      category: "Lighting",
      display_pages: '["click-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=LED+Strips'
    },
    
    // Global Picks - International products
    {
      title: "Japanese Matcha Tea Set",
      description: "Authentic matcha tea set imported from Japan",
      price: 89.99,
      category: "Food & Beverage",
      display_pages: '["global-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/10B981/white?text=Matcha+Set'
    },
    {
      title: "German Engineering Tool Kit",
      description: "Precision tools made in Germany for professionals",
      price: 159.99,
      category: "Tools",
      display_pages: '["global-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/10B981/white?text=Tool+Kit'
    },
    
    // Travel Picks - Travel essentials
    {
      title: "Compact Travel Backpack 40L",
      description: "Lightweight travel backpack perfect for carry-on",
      price: 119.99,
      category: "Travel",
      display_pages: '["travel-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Travel+Backpack'
    },
    {
      title: "Universal Travel Adapter",
      description: "All-in-one travel adapter with USB-C and wireless charging",
      price: 39.99,
      category: "Travel",
      display_pages: '["travel-picks"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/3B82F6/white?text=Travel+Adapter'
    },
    
    // Deals Hub - Hot deals
    {
      title: "Flash Sale: Premium Headphones 50% OFF",
      description: "Limited time offer on premium noise-canceling headphones",
      price: 99.99,
      original_price: 199.99,
      category: "Audio",
      display_pages: '["deals-hub"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/EF4444/white?text=Headphones+SALE'
    },
    {
      title: "Daily Deal: Smart Watch Bundle",
      description: "Smart watch with extra bands and screen protector",
      price: 149.99,
      original_price: 249.99,
      category: "Wearables",
      display_pages: '["deals-hub"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/EF4444/white?text=Smart+Watch'
    },
    
    // Loot Box - Mystery items
    {
      title: "Tech Mystery Box - Surprise Gadgets",
      description: "Mystery box containing 3-5 tech gadgets worth $100+",
      price: 49.99,
      category: "Mystery",
      display_pages: '["loot-box"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Mystery+Box'
    },
    {
      title: "Gaming Loot Crate - Random Items",
      description: "Surprise gaming accessories and collectibles",
      price: 34.99,
      category: "Gaming",
      display_pages: '["loot-box"]',
      processing_status: 'active',
      image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=Gaming+Loot'
    }
  ];
  
  // Insert products
  const insertStmt = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, category, 
      display_pages, processing_status, image_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
        product.processing_status,
        product.image_url
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
      AND processing_status = 'active'
    `).get(page);
    console.log(`  ${page}: ${count.count} products`);
  });
  
  db.close();
  console.log('\n✅ Database populated successfully!');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}