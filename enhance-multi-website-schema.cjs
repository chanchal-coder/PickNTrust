const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔧 Enhancing Database Schema for Multi-Website System');
console.log('=' .repeat(60));

try {
  // 1. Add commission and priority fields to affiliate_networks table
  console.log('\nStats 1. Enhancing affiliate_networks table...');
  
  const affiliateTableInfo = db.prepare('PRAGMA table_info(affiliate_networks)').all();
  const hasCommissionRate = affiliateTableInfo.some(col => col.name === 'commission_rate');
  const hasPriority = affiliateTableInfo.some(col => col.name === 'priority_score');
  
  if (!hasCommissionRate) {
    db.prepare('ALTER TABLE affiliate_networks ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0.00').run();
    console.log('Success Added commission_rate column');
  }
  
  if (!hasPriority) {
    db.prepare('ALTER TABLE affiliate_networks ADD COLUMN priority_score INTEGER DEFAULT 50').run();
    console.log('Success Added priority_score column');
  }
  
  // Update existing affiliate networks with commission rates
  const affiliateNetworks = [
    { name: 'Amazon Associates', commission: 4.50, priority: 85 },
    { name: 'Flipkart Affiliate', commission: 3.00, priority: 75 },
    { name: 'Myntra Partner', commission: 5.00, priority: 70 },
    { name: 'Nykaa Affiliate', commission: 6.00, priority: 65 },
    { name: 'Ajio Partner', commission: 4.00, priority: 60 }
  ];
  
  affiliateNetworks.forEach(network => {
    const existing = db.prepare('SELECT id FROM affiliate_networks WHERE name LIKE ?').get(`%${network.name.split(' ')[0]}%`);
    if (existing) {
      db.prepare('UPDATE affiliate_networks SET commission_rate = ?, priority_score = ? WHERE id = ?')
        .run(network.commission, network.priority, existing.id);
      console.log(`Success Updated ${network.name}: ${network.commission}% commission, priority ${network.priority}`);
    }
  });
  
  // 2. Add product deduplication fields to products table
  console.log('\nRefresh 2. Adding product deduplication fields...');
  
  const productTableInfo = db.prepare('PRAGMA table_info(products)').all();
  const hasProductHash = productTableInfo.some(col => col.name === 'product_hash');
  const hasDuplicateGroup = productTableInfo.some(col => col.name === 'duplicate_group_id');
  const hasIsPrimary = productTableInfo.some(col => col.name === 'is_primary_source');
  const hasAlternativeSources = productTableInfo.some(col => col.name === 'alternative_sources');
  
  if (!hasProductHash) {
    db.prepare('ALTER TABLE products ADD COLUMN product_hash TEXT').run();
    console.log('Success Added product_hash column');
  }
  
  if (!hasDuplicateGroup) {
    db.prepare('ALTER TABLE products ADD COLUMN duplicate_group_id TEXT').run();
    console.log('Success Added duplicate_group_id column');
  }
  
  if (!hasIsPrimary) {
    db.prepare('ALTER TABLE products ADD COLUMN is_primary_source INTEGER DEFAULT 1').run();
    console.log('Success Added is_primary_source column');
  }
  
  if (!hasAlternativeSources) {
    db.prepare('ALTER TABLE products ADD COLUMN alternative_sources TEXT').run();
    console.log('Success Added alternative_sources column (JSON)');
  }
  
  // 3. Create product_sources table for tracking multiple sources
  console.log('\nGlobal 3. Creating product_sources table...');
  
  const productSourcesExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='product_sources'
  `).get();
  
  if (!productSourcesExists) {
    db.prepare(`
      CREATE TABLE product_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        affiliate_network_id INTEGER NOT NULL,
        source_url TEXT NOT NULL,
        price DECIMAL(10,2),
        original_price DECIMAL(10,2),
        availability_status TEXT DEFAULT 'in_stock',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (affiliate_network_id) REFERENCES affiliate_networks(id)
      )
    `).run();
    console.log('Success Created product_sources table');
  }
  
  // 4. Create commission_tracking table
  console.log('\nPrice 4. Creating commission_tracking table...');
  
  const commissionTrackingExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='commission_tracking'
  `).get();
  
  if (!commissionTrackingExists) {
    db.prepare(`
      CREATE TABLE commission_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        affiliate_network_id INTEGER NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        estimated_earnings DECIMAL(10,2),
        click_count INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        last_click DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (affiliate_network_id) REFERENCES affiliate_networks(id)
      )
    `).run();
    console.log('Success Created commission_tracking table');
  }
  
  // 5. Create browse_categories table for different display
  console.log('\n📂 5. Creating browse_categories configuration...');
  
  const browseCategoriesExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='browse_categories_config'
  `).get();
  
  if (!browseCategoriesExists) {
    db.prepare(`
      CREATE TABLE browse_categories_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        display_type TEXT DEFAULT 'grid', -- grid, list, carousel
        products_per_row INTEGER DEFAULT 4,
        show_commission_info INTEGER DEFAULT 0,
        show_price_comparison INTEGER DEFAULT 1,
        sort_by TEXT DEFAULT 'commission_desc', -- commission_desc, price_asc, rating_desc
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `).run();
    console.log('Success Created browse_categories_config table');
  }
  
  // 6. Insert default browse categories configurations
  console.log('\n⚙️ 6. Setting up default browse categories configurations...');
  
  const categories = db.prepare('SELECT id, name FROM categories WHERE is_for_products = 1 LIMIT 10').all();
  
  categories.forEach(category => {
    const existingConfig = db.prepare('SELECT id FROM browse_categories_config WHERE category_id = ?').get(category.id);
    
    if (!existingConfig) {
      db.prepare(`
        INSERT INTO browse_categories_config 
        (category_id, display_type, products_per_row, show_commission_info, show_price_comparison, sort_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(category.id, 'grid', 4, 1, 1, 'commission_desc');
      
      console.log(`Success Added browse config for: ${category.name}`);
    }
  });
  
  // 7. Create sample multi-website products
  console.log('\nDeal 7. Creating sample multi-website products...');
  
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      description: 'Latest iPhone with advanced camera system',
      category: 'Electronics & Gadgets',
      sources: [
        { network: 'Amazon', price: 134900, originalPrice: 139900, commission: 4.5, url: 'https://amazon.in/iphone-15-pro-max' },
        { network: 'Flipkart', price: 135900, originalPrice: 139900, commission: 3.0, url: 'https://flipkart.com/iphone-15-pro-max' }
      ]
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone with S Pen',
      category: 'Electronics & Gadgets',
      sources: [
        { network: 'Amazon', price: 124999, originalPrice: 129999, commission: 4.5, url: 'https://amazon.in/galaxy-s24-ultra' },
        { network: 'Flipkart', price: 126999, originalPrice: 129999, commission: 3.0, url: 'https://flipkart.com/galaxy-s24-ultra' }
      ]
    }
  ];
  
  sampleProducts.forEach(product => {
    // Find the best commission source
    const bestSource = product.sources.reduce((best, current) => 
      current.commission > best.commission ? current : best
    );
    
    // Create product hash for deduplication
    const productHash = Buffer.from(product.name.toLowerCase().replace(/[^a-z0-9]/g, '')).toString('base64').substring(0, 16);
    
    // Insert main product with best commission source
    const amazonNetwork = db.prepare('SELECT id FROM affiliate_networks WHERE name LIKE \'%Amazon%\'').get();
    const flipkartNetwork = db.prepare('SELECT id FROM affiliate_networks WHERE name LIKE \'%Flipkart%\'').get();
    
    if (amazonNetwork || flipkartNetwork) {
      const primaryNetworkId = bestSource.network === 'Amazon' ? amazonNetwork?.id : flipkartNetwork?.id;
      
      if (primaryNetworkId) {
        const existingProduct = db.prepare('SELECT id FROM products WHERE product_hash = ?').get(productHash);
        
        if (!existingProduct) {
          const insertResult = db.prepare(`
            INSERT INTO products (
              name, description, price, original_price, category, 
              affiliate_network_id, affiliate_url, product_hash, 
              is_primary_source, alternative_sources, display_pages
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          `).run(
            product.name,
            product.description,
            bestSource.price,
            bestSource.originalPrice,
            product.category,
            primaryNetworkId,
            bestSource.url,
            productHash,
            JSON.stringify(product.sources.filter(s => s.network !== bestSource.network)),
            JSON.stringify(['home', 'browse-categories'])
          );
          
          console.log(`Success Created multi-website product: ${product.name} (Primary: ${bestSource.network})`);
          
          // Insert all sources into product_sources table
          product.sources.forEach(source => {
            const networkId = source.network === 'Amazon' ? amazonNetwork?.id : flipkartNetwork?.id;
            if (networkId) {
              db.prepare(`
                INSERT INTO product_sources 
                (product_id, affiliate_network_id, source_url, price, original_price, is_primary) 
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(
                insertResult.lastInsertRowid,
                networkId,
                source.url,
                source.price,
                source.originalPrice,
                source.network === bestSource.network ? 1 : 0
              );
            }
          });
        }
      }
    }
  });
  
  console.log('\nTarget MULTI-WEBSITE SYSTEM SETUP COMPLETE!');
  console.log('=' .repeat(60));
  console.log('Success Enhanced affiliate_networks with commission rates');
  console.log('Success Added product deduplication fields');
  console.log('Success Created product_sources tracking table');
  console.log('Success Created commission_tracking table');
  console.log('Success Created browse_categories_config table');
  console.log('Success Added sample multi-website products');
  
  console.log('\nStats SYSTEM CAPABILITIES:');
  console.log('Refresh Smart product deduplication');
  console.log('Price Commission-based source selection');
  console.log('Global Multiple affiliate network support');
  console.log('📈 Performance tracking and analytics');
  console.log('🎨 Customizable browse categories display');
  
} catch (error) {
  console.error('Error Error enhancing schema:', error.message);
} finally {
  db.close();
}