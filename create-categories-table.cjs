const Database = require('better-sqlite3');

console.log('📂 Creating dynamic categories management system...');

try {
  const db = new Database('database.sqlite');
  
  // Create categories table for dynamic category management
  console.log('📋 Creating categories table...');
  
  const createCategoriesTableSQL = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT, -- Font Awesome icon class
      color TEXT DEFAULT '#3B82F6', -- Hex color for category card
      image_url TEXT,
      
      -- Category metadata
      category_type TEXT DEFAULT 'product', -- 'product', 'service', 'app', 'ai-app'
      parent_category_id INTEGER,
      display_order INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      
      -- Auto-creation tracking
      auto_created BOOLEAN DEFAULT 0,
      created_by_page TEXT, -- Which page created this category
      first_product_id INTEGER, -- ID of first product that created this category
      
      -- Product counts for each page
      prime_picks_count INTEGER DEFAULT 0,
      click_picks_count INTEGER DEFAULT 0,
      cue_picks_count INTEGER DEFAULT 0,
      value_picks_count INTEGER DEFAULT 0,
      global_picks_count INTEGER DEFAULT 0,
      deals_hub_count INTEGER DEFAULT 0,
      loot_box_count INTEGER DEFAULT 0,
      apps_count INTEGER DEFAULT 0,
      top_picks_count INTEGER DEFAULT 0,
      services_count INTEGER DEFAULT 0,
      total_products_count INTEGER DEFAULT 0,
      
      -- Expiration management
      has_active_products BOOLEAN DEFAULT 1,
      last_product_added INTEGER, -- Timestamp of last product added
      auto_delete_when_empty BOOLEAN DEFAULT 1,
      
      -- SEO and display
      meta_title TEXT,
      meta_description TEXT,
      keywords TEXT,
      
      -- Timestamps
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      
      FOREIGN KEY (parent_category_id) REFERENCES categories(id)
    )
  `;
  
  db.exec(createCategoriesTableSQL);
  console.log('Success categories table created successfully');
  
  // Create category_products junction table for many-to-many relationship
  console.log('📋 Creating category_products junction table...');
  
  const createCategoryProductsTableSQL = `
    CREATE TABLE IF NOT EXISTS category_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_table TEXT NOT NULL, -- 'prime_picks_products', 'apps_products', etc.
      page_name TEXT NOT NULL, -- 'prime-picks', 'apps', etc.
      
      -- Product metadata for quick access
      product_name TEXT,
      product_price TEXT,
      product_image_url TEXT,
      product_expires_at INTEGER,
      
      -- Timestamps
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(category_id, product_id, product_table)
    )
  `;
  
  db.exec(createCategoryProductsTableSQL);
  console.log('Success category_products junction table created successfully');
  
  // Check if categories table has slug column
  console.log('Search Checking table structure...');
  const categoriesColumns = db.prepare("PRAGMA table_info(categories)").all();
  const hasSlugColumn = categoriesColumns.some(col => col.name === 'slug');
  
  console.log(`Categories table has ${categoriesColumns.length} columns`);
  console.log(`Has slug column: ${hasSlugColumn}`);
  
  // Create indexes for better performance
  console.log('Stats Creating indexes...');
  
  const indexes = [
    // Categories table indexes
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)'
  ];
  
  // Only add slug index if column exists
  if (hasSlugColumn) {
    indexes.push('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');
  }
  
  // Add other indexes conditionally based on column existence
   const otherIndexes = [];
   
   // Check which columns exist before creating indexes
   const columnNames = categoriesColumns.map(col => col.name);
   
   if (columnNames.includes('category_type')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type)');
   }
   if (columnNames.includes('is_active')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active)');
   }
   if (columnNames.includes('is_featured')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(is_featured)');
   }
   if (columnNames.includes('auto_created')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_auto_created ON categories(auto_created)');
   }
   if (columnNames.includes('created_by_page')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_created_by_page ON categories(created_by_page)');
   }
   if (columnNames.includes('has_active_products')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_has_products ON categories(has_active_products)');
   }
   if (columnNames.includes('total_products_count')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_total_count ON categories(total_products_count)');
   }
   if (columnNames.includes('display_order')) {
     otherIndexes.push('CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order)');
   }
   
   indexes.push(...otherIndexes);
   
   // Category_products table indexes (always add these as we just created the table)
   indexes.push(...[
     'CREATE INDEX IF NOT EXISTS idx_category_products_category ON category_products(category_id)',
     'CREATE INDEX IF NOT EXISTS idx_category_products_product ON category_products(product_id)',
     'CREATE INDEX IF NOT EXISTS idx_category_products_table ON category_products(product_table)',
     'CREATE INDEX IF NOT EXISTS idx_category_products_page ON category_products(page_name)',
     'CREATE INDEX IF NOT EXISTS idx_category_products_expires ON category_products(product_expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_category_products_created ON category_products(created_at)'
    ]);
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Indexes created successfully');
  
  // Insert default categories to get started (only if we have the full schema)
  console.log('🧪 Inserting default categories...');
  
  let insertCategory;
  if (hasSlugColumn && columnNames.includes('category_type')) {
    // Full schema available
    insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (
        name, slug, description, icon, color, category_type,
        is_featured, display_order, auto_created
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  } else {
    // Basic schema - just insert name
    insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (name) VALUES (?)
    `);
  }
  
  // Default product categories
  const defaultCategories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Smartphones, laptops, gadgets and electronic devices',
      icon: 'fas fa-mobile-alt',
      color: '#3B82F6',
      type: 'product',
      featured: 1,
      order: 1
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, accessories and fashion items',
      icon: 'fas fa-tshirt',
      color: '#EC4899',
      type: 'product',
      featured: 1,
      order: 2
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home appliances, kitchen items and household products',
      icon: 'fas fa-home',
      color: '#10B981',
      type: 'product',
      featured: 1,
      order: 3
    },
    {
      name: 'Beauty & Health',
      slug: 'beauty-health',
      description: 'Skincare, makeup, health and wellness products',
      icon: 'fas fa-heart',
      color: '#F59E0B',
      type: 'product',
      featured: 1,
      order: 4
    },
    
    // Default service categories
    {
      name: 'Streaming Services',
      slug: 'streaming-services',
      description: 'Netflix, Prime Video, Spotify and other streaming platforms',
      icon: 'fas fa-play-circle',
      color: '#EF4444',
      type: 'service',
      featured: 1,
      order: 5
    },
    {
      name: 'Credit Cards',
      slug: 'credit-cards',
      description: 'Bank credit cards, cashback cards and financial services',
      icon: 'fas fa-credit-card',
      color: '#8B5CF6',
      type: 'service',
      featured: 1,
      order: 6
    },
    
    // Default app categories
    {
      name: 'AI Apps',
      slug: 'ai-apps',
      description: 'ChatGPT, Midjourney and other AI-powered applications',
      icon: 'fas fa-robot',
      color: '#06B6D4',
      type: 'ai-app',
      featured: 1,
      order: 7
    },
    {
      name: 'Productivity Apps',
      slug: 'productivity-apps',
      description: 'Notion, Grammarly and productivity enhancement tools',
      icon: 'fas fa-tasks',
      color: '#84CC16',
      type: 'app',
      featured: 1,
      order: 8
    }
  ];
  
  defaultCategories.forEach(cat => {
    if (hasSlugColumn && columnNames.includes('category_type')) {
      // Full schema insertion
      insertCategory.run(
        cat.name,
        cat.slug,
        cat.description,
        cat.icon,
        cat.color,
        cat.type,
        cat.featured,
        cat.order,
        0 // Not auto-created
      );
    } else {
      // Basic schema - just insert name
      insertCategory.run(cat.name);
    }
  });
  
  console.log(`Success Inserted ${defaultCategories.length} default categories`);
  
  // Verify table structure
  console.log('\nStats Table structure verification:');
  const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
  const categoryProductsInfo = db.prepare("PRAGMA table_info(category_products)").all();
  
  console.log(`Categories table columns: ${categoriesInfo.length}`);
  console.log(`Category_products table columns: ${categoryProductsInfo.length}`);
  
  // Count categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`Total categories: ${categoryCount.count}`);
  
  // Show category types (only if column exists)
  if (columnNames.includes('category_type')) {
    const categoryTypes = db.prepare('SELECT category_type, COUNT(*) as count FROM categories GROUP BY category_type').all();
    console.log('Category types:', categoryTypes);
  } else {
    console.log('Category types: column not available in existing table');
  }
  
  // Show featured categories (only if columns exist)
  if (columnNames.includes('is_featured') && columnNames.includes('category_type') && columnNames.includes('display_order')) {
    const featuredCategories = db.prepare('SELECT name, category_type FROM categories WHERE is_featured = 1 ORDER BY display_order').all();
    console.log('Featured categories:', featuredCategories);
  } else if (columnNames.includes('is_featured')) {
    const featuredCategories = db.prepare('SELECT name FROM categories WHERE is_featured = 1').all();
    console.log('Featured categories:', featuredCategories);
  } else {
    const allCategories = db.prepare('SELECT name FROM categories LIMIT 10').all();
    console.log('Sample categories:', allCategories);
  }
  
  console.log('\nCelebration Dynamic categories management system setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Create CategoryManager service class for auto-creation logic');
  console.log('2. Update all service classes to use CategoryManager');
  console.log('3. Create browse categories page with dynamic category cards');
  console.log('4. Implement auto-expiration cleanup system');
  console.log('5. Add category management to admin interface');
  
  db.close();
  
} catch (error) {
  console.error('Error Error creating categories system:', error);
  process.exit(1);
}