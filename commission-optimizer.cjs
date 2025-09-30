const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Target Commission Optimization System');
console.log('=' .repeat(50));

try {
  // 1. Create commission optimization logic
  console.log('\nPrice 1. Setting up commission optimization system...');
  
  // Update affiliate networks with realistic commission rates
  const affiliateNetworks = [
    { name: 'Amazon Associates', commission: 4.0, priority: 85, baseUrl: 'https://amazon.in', tag_format: 'tag=YOUR_AMAZON_TAG' },
    { name: 'EarnKaro', commission: 6.5, priority: 95, baseUrl: 'https://earnkaro.com', tag_format: 'ref=YOUR_EARNKARO_ID' },
    { name: 'Flipkart Affiliate', commission: 3.5, priority: 75, baseUrl: 'https://flipkart.com', tag_format: 'affid=YOUR_FLIPKART_ID' },
    { name: 'CashKaro', commission: 5.8, priority: 90, baseUrl: 'https://cashkaro.com', tag_format: 'u=YOUR_CASHKARO_ID' },
    { name: 'Myntra Partner', commission: 5.0, priority: 70, baseUrl: 'https://myntra.com', tag_format: 'utm_source=YOUR_MYNTRA_ID' },
    { name: 'Nykaa Affiliate', commission: 6.0, priority: 80, baseUrl: 'https://nykaa.com', tag_format: 'nykaa_aff=YOUR_NYKAA_ID' }
  ];
  
  // Update existing networks with commission rates
  affiliateNetworks.forEach(network => {
    const existing = db.prepare('SELECT id FROM affiliate_networks WHERE name LIKE ?').get(`%${network.name.split(' ')[0]}%`);
    if (existing) {
      db.prepare(`
        UPDATE affiliate_networks 
        SET commission_rate = ?, priority_score = ? 
        WHERE id = ?
      `).run(network.commission, network.priority, existing.id);
      console.log(`Success Updated ${network.name}: ${network.commission}% commission`);
    } else {
      // Create new affiliate network
      const result = db.prepare(`
        INSERT INTO affiliate_networks (name, base_url, commission_rate, priority_score, is_active) 
        VALUES (?, ?, ?, ?, 1)
      `).run(network.name, network.baseUrl, network.commission, network.priority);
      console.log(`Success Created ${network.name}: ${network.commission}% commission`);
    }
  });
  
  // 2. Create commission optimization function
  console.log('\n🔧 2. Creating commission optimization functions...');
  
  // Function to find best commission source for a product
  function findBestCommissionSource(productName, productUrl) {
    // Get all available affiliate networks sorted by commission rate
    const networks = db.prepare(`
      SELECT id, name, commission_rate, priority_score 
      FROM affiliate_networks 
      WHERE is_active = 1 
      ORDER BY commission_rate DESC, priority_score DESC
    `).all();
    
    // Determine which networks support this product based on URL or name
    const supportedNetworks = networks.filter(network => {
      const networkName = network.name.toLowerCase();
      const url = productUrl.toLowerCase();
      const name = productName.toLowerCase();
      
      // Check if product is available on this network
      if (networkName.includes('amazon') && (url.includes('amazon') || name.includes('amazon'))) return true;
      if (networkName.includes('flipkart') && (url.includes('flipkart') || name.includes('flipkart'))) return true;
      if (networkName.includes('earnkaro')) return true; // EarnKaro supports multiple stores
      if (networkName.includes('cashkaro')) return true; // CashKaro supports multiple stores
      if (networkName.includes('myntra') && (url.includes('myntra') || name.includes('fashion'))) return true;
      if (networkName.includes('nykaa') && (url.includes('nykaa') || name.includes('beauty'))) return true;
      
      return false;
    });
    
    // Return the network with highest commission rate
    return supportedNetworks.length > 0 ? supportedNetworks[0] : networks[0];
  }
  
  // Function to convert affiliate link
  function convertAffiliateLink(originalUrl, targetNetwork) {
    const networkName = targetNetwork.name.toLowerCase();
    
    // Amazon link conversion
    if (networkName.includes('amazon')) {
      if (originalUrl.includes('amazon.')) {
        // Add/replace affiliate tag
        const baseUrl = originalUrl.split('?')[0];
        return `${baseUrl}?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325`;
      }
    }
    
    // EarnKaro link conversion (supports multiple stores)
    if (networkName.includes('earnkaro')) {
      // EarnKaro universal link format
      const encodedUrl = encodeURIComponent(originalUrl);
      return `https://earnkaro.com/deals/loot?url=${encodedUrl}&ref=YOUR_EARNKARO_ID`;
    }
    
    // CashKaro link conversion
    if (networkName.includes('cashkaro')) {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `https://cashkaro.com/deals/redirect?url=${encodedUrl}&u=YOUR_CASHKARO_ID`;
    }
    
    // Flipkart link conversion
    if (networkName.includes('flipkart')) {
      if (originalUrl.includes('flipkart.com')) {
        return originalUrl.includes('?') 
          ? `${originalUrl}&affid=YOUR_FLIPKART_ID` 
          : `${originalUrl}?affid=YOUR_FLIPKART_ID`;
      }
    }
    
    // Myntra link conversion
    if (networkName.includes('myntra')) {
      if (originalUrl.includes('myntra.com')) {
        return originalUrl.includes('?') 
          ? `${originalUrl}&utm_source=YOUR_MYNTRA_ID` 
          : `${originalUrl}?utm_source=YOUR_MYNTRA_ID`;
      }
    }
    
    // Nykaa link conversion
    if (networkName.includes('nykaa')) {
      if (originalUrl.includes('nykaa.com')) {
        return originalUrl.includes('?') 
          ? `${originalUrl}&nykaa_aff=YOUR_NYKAA_ID` 
          : `${originalUrl}?nykaa_aff=YOUR_NYKAA_ID`;
      }
    }
    
    // Return original URL if no conversion available
    return originalUrl;
  }
  
  // 3. Optimize existing products
  console.log('\nRefresh 3. Optimizing existing products for best commission...');
  
  const products = db.prepare(`
    SELECT id, name, affiliate_url, affiliate_network_id 
    FROM products 
    WHERE affiliate_url IS NOT NULL 
    LIMIT 10
  `).all();
  
  let optimizedCount = 0;
  
  products.forEach(product => {
    const bestNetwork = findBestCommissionSource(product.name, product.affiliate_url);
    const optimizedUrl = convertAffiliateLink(product.affiliate_url, bestNetwork);
    
    // Update product with best commission network and optimized URL
    if (bestNetwork.id !== product.affiliate_network_id || optimizedUrl !== product.affiliate_url) {
      db.prepare(`
        UPDATE products 
        SET affiliate_network_id = ?, affiliate_url = ? 
        WHERE id = ?
      `).run(bestNetwork.id, optimizedUrl, product.id);
      
      console.log(`Success Optimized "${product.name.substring(0, 40)}..."`);
      console.log(`   Network: ${bestNetwork.name} (${bestNetwork.commission_rate}% commission)`);
      optimizedCount++;
    }
  });
  
  // 4. Create sample multi-source products
  console.log('\nDeal 4. Creating sample multi-source products...');
  
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro Max 256GB - Latest Model',
      description: 'Latest iPhone with advanced camera system and A17 Pro chip',
      category: 'Electronics & Gadgets',
      originalUrl: 'https://amazon.in/iphone-15-pro-max',
      price: 134900,
      originalPrice: 139900,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80'
    },
    {
      name: 'Samsung Galaxy S24 Ultra 512GB',
      description: 'Premium Android smartphone with S Pen and advanced AI features',
      category: 'Electronics & Gadgets', 
      originalUrl: 'https://flipkart.com/samsung-galaxy-s24-ultra',
      price: 124999,
      originalPrice: 129999,
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80'
    },
    {
      name: 'Nike Air Max 270 Running Shoes',
      description: 'Comfortable running shoes with Air Max technology',
      category: 'Fashion & Clothing',
      originalUrl: 'https://myntra.com/nike-air-max-270',
      price: 8995,
      originalPrice: 12995,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'
    }
  ];
  
  sampleProducts.forEach(product => {
    // Find best commission network for this product
    const bestNetwork = findBestCommissionSource(product.name, product.originalUrl);
    const optimizedUrl = convertAffiliateLink(product.originalUrl, bestNetwork);
    
    // Calculate discount
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    // Check if product already exists
    const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name);
    
    if (!existing) {
      const result = db.prepare(`
        INSERT INTO products (
          name, description, price, original_price, category,
          affiliate_network_id, affiliate_url, image_url,
          discount, is_featured, display_pages, rating, review_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        product.name,
        product.description,
        product.price,
        product.originalPrice,
        product.category,
        bestNetwork.id,
        optimizedUrl,
        product.imageUrl,
        discount,
        JSON.stringify(['home', 'browse-categories']),
        '4.5', // Default rating
        1250   // Default review count
      );
      
      console.log(`Success Created: ${product.name}`);
      console.log(`   Best Network: ${bestNetwork.name} (${bestNetwork.commission_rate}% commission)`);
      console.log(`   Optimized URL: ${optimizedUrl.substring(0, 60)}...`);
    }
  });
  
  // 5. Create commission tracking entries
  console.log('\nStats 5. Setting up commission tracking...');
  
  const allProducts = db.prepare(`
    SELECT p.id, p.name, p.price, an.commission_rate 
    FROM products p 
    JOIN affiliate_networks an ON p.affiliate_network_id = an.id 
    WHERE p.affiliate_network_id IS NOT NULL
    LIMIT 5
  `).all();
  
  allProducts.forEach(product => {
    const estimatedEarnings = (parseFloat(product.price) * product.commission_rate / 100).toFixed(2);
    
    const existing = db.prepare('SELECT id FROM commission_tracking WHERE product_id = ?').get(product.id);
    
    if (!existing) {
      db.prepare(`
        INSERT INTO commission_tracking (
          product_id, affiliate_network_id, commission_rate, estimated_earnings
        ) SELECT ?, affiliate_network_id, ?, ? FROM products WHERE id = ?
      `).run(product.id, product.commission_rate, estimatedEarnings, product.id);
      
      console.log(`Success Tracking: ${product.name.substring(0, 30)}... (₹${estimatedEarnings} potential)`);
    }
  });
  
  console.log('\nTarget COMMISSION OPTIMIZATION COMPLETE!');
  console.log('=' .repeat(50));
  console.log(`Success Optimized ${optimizedCount} existing products`);
  console.log('Success Created sample multi-source products');
  console.log('Success Set up commission tracking system');
  console.log('Success Configured affiliate network priorities');
  
  console.log('\nTip SYSTEM FEATURES:');
  console.log('Refresh Automatic best commission selection');
  console.log('Link Smart affiliate link conversion');
  console.log('Stats Commission tracking and analytics');
  console.log('Target Revenue optimization for every product');
  
  console.log('\n📈 COMMISSION RATES:');
  const finalNetworks = db.prepare(`
    SELECT name, commission_rate, priority_score 
    FROM affiliate_networks 
    WHERE is_active = 1 
    ORDER BY commission_rate DESC
  `).all();
  
  finalNetworks.forEach(network => {
    console.log(`Price ${network.name}: ${network.commission_rate}% (Priority: ${network.priority_score})`);
  });
  
} catch (error) {
  console.error('Error Error setting up commission optimization:', error.message);
} finally {
  db.close();
}