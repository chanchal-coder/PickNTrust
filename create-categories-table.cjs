const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
console.log('Creating categories table at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Create categories table based on schema
  console.log('\n=== CREATING CATEGORIES TABLE ===');
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT NOT NULL,
      parent_id INTEGER REFERENCES categories(id),
      is_for_products INTEGER DEFAULT 1,
      is_for_services INTEGER DEFAULT 0,
      is_for_ai_apps INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createCategoriesTable);
  console.log('✅ Categories table created successfully');
  
  // Get unique categories from unified_content
  console.log('\n=== EXTRACTING CATEGORIES FROM PRODUCTS ===');
  const uniqueCategories = db.prepare(`
    SELECT DISTINCT category, COUNT(*) as product_count
    FROM unified_content 
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY product_count DESC
  `).all();
  
  console.log('Found unique categories:', uniqueCategories.length);
  uniqueCategories.forEach(cat => {
    console.log(`- ${cat.category}: ${cat.product_count} products`);
  });
  
  // Define category mappings with icons and colors
  const categoryMappings = {
    'Electronics': {
      icon: '📱',
      color: '#3B82F6',
      description: 'Electronic devices, gadgets, and tech accessories',
      is_for_products: 1,
      is_for_services: 0,
      is_for_ai_apps: 0,
      display_order: 1
    },
    'deals': {
      name: 'Deals & Offers',
      icon: '🔥',
      color: '#EF4444',
      description: 'Special deals, discounts, and limited-time offers',
      is_for_products: 1,
      is_for_services: 1,
      is_for_ai_apps: 1,
      display_order: 0
    },
    'Web Service': {
      name: 'Web Services',
      icon: '🌐',
      color: '#10B981',
      description: 'Web development, hosting, and online services',
      is_for_products: 0,
      is_for_services: 1,
      is_for_ai_apps: 0,
      display_order: 2
    },
    'Technology Service': {
      name: 'Technology Services',
      icon: '⚙️',
      color: '#8B5CF6',
      description: 'Technical services, cloud solutions, and IT support',
      is_for_products: 0,
      is_for_services: 1,
      is_for_ai_apps: 0,
      display_order: 3
    },
    'AI Photo App': {
      name: 'AI Photo Apps',
      icon: '📸',
      color: '#F59E0B',
      description: 'AI-powered photo editing and enhancement applications',
      is_for_products: 0,
      is_for_services: 0,
      is_for_ai_apps: 1,
      display_order: 4
    },
    'AI App': {
      name: 'AI Applications',
      icon: '🤖',
      color: '#EC4899',
      description: 'Artificial intelligence applications and tools',
      is_for_products: 0,
      is_for_services: 0,
      is_for_ai_apps: 1,
      display_order: 5
    }
  };
  
  // Insert categories
  console.log('\n=== INSERTING CATEGORIES ===');
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (
      name, slug, icon, color, description, parent_id, 
      is_for_products, is_for_services, is_for_ai_apps, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  uniqueCategories.forEach(cat => {
    const mapping = categoryMappings[cat.category];
    if (mapping) {
      const name = mapping.name || cat.category;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      insertCategory.run(
        name,
        slug,
        mapping.icon,
        mapping.color,
        mapping.description,
        null, // parent_id
        mapping.is_for_products,
        mapping.is_for_services,
        mapping.is_for_ai_apps,
        mapping.display_order
      );
      
      console.log(`✅ Inserted: ${name} (${slug})`);
    } else {
      // Default mapping for unknown categories
      const slug = cat.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      insertCategory.run(
        cat.category,
        slug,
        '📦',
        '#6B7280',
        `Products in ${cat.category} category`,
        null,
        1, 0, 0, 10
      );
      console.log(`✅ Inserted (default): ${cat.category} (${slug})`);
    }
  });
  
  // Add some parent categories for better organization
  console.log('\n=== ADDING PARENT CATEGORIES ===');
  const parentCategories = [
    {
      name: 'Services',
      slug: 'services',
      icon: '🛠️',
      color: '#059669',
      description: 'Professional services and solutions',
      is_for_products: 0,
      is_for_services: 1,
      is_for_ai_apps: 0,
      display_order: 100
    },
    {
      name: 'AI & Apps',
      slug: 'ai-apps',
      icon: '🚀',
      color: '#7C3AED',
      description: 'AI applications and software tools',
      is_for_products: 0,
      is_for_services: 0,
      is_for_ai_apps: 1,
      display_order: 101
    }
  ];
  
  parentCategories.forEach(parent => {
    insertCategory.run(
      parent.name,
      parent.slug,
      parent.icon,
      parent.color,
      parent.description,
      null,
      parent.is_for_products,
      parent.is_for_services,
      parent.is_for_ai_apps,
      parent.display_order
    );
    console.log(`✅ Added parent category: ${parent.name}`);
  });
  
  // Verify the results
  console.log('\n=== VERIFICATION ===');
  const totalCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  console.log('Total categories created:', totalCategories.count);
  
  const allCategories = db.prepare(`
    SELECT id, name, slug, icon, color, parent_id, 
           is_for_products, is_for_services, is_for_ai_apps, display_order
    FROM categories 
    ORDER BY display_order, name
  `).all();
  
  console.log('\n=== ALL CATEGORIES ===');
  allCategories.forEach(cat => {
    console.log(`${cat.icon} ${cat.name} (${cat.slug})`);
    console.log(`  ID: ${cat.id}, Order: ${cat.display_order}`);
    console.log(`  Products: ${cat.is_for_products}, Services: ${cat.is_for_services}, AI Apps: ${cat.is_for_ai_apps}`);
    console.log('');
  });
  
  db.close();
  console.log('=== CATEGORIES TABLE CREATION COMPLETE ===');
  
} catch (error) {
  console.error('Error creating categories table:', error.message);
  console.error('Stack:', error.stack);
}