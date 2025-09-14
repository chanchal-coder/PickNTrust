const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Creating banners table...');

try {
  // Create banners table
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      imageUrl TEXT NOT NULL,
      linkUrl TEXT,
      buttonText TEXT,
      page TEXT NOT NULL DEFAULT 'home',
      isActive INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Success Banners table created successfully!');

  // Check if table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(banners)").all();
  console.log('\n📋 Banners table structure:');
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });

  // Insert sample banners for different pages
  console.log('\nFeatured Adding sample banners...');
  
  const insertBanner = db.prepare(`
    INSERT INTO banners (title, subtitle, imageUrl, linkUrl, buttonText, page, isActive, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Home page banners
  insertBanner.run(
    'Welcome to PickNTrust',
    'Discover amazing products curated just for you',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
    '/products',
    'Shop Now',
    'home',
    1,
    1
  );

  insertBanner.run(
    'Summer Sale',
    'Up to 50% off on selected items',
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop',
    '/categories',
    'Browse Deals',
    'home',
    1,
    2
  );

  // Products page banner
  insertBanner.run(
    'Featured Products',
    'Hand-picked items from top brands',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop',
    null,
    null,
    'products',
    1,
    1
  );

  // Categories page banner
  insertBanner.run(
    'Explore Categories',
    'Find exactly what you\'re looking for',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    null,
    'Start Shopping',
    'categories',
    1,
    1
  );

  // Blog page banner
  insertBanner.run(
    'Latest Insights',
    'Stay updated with our latest articles and tips',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=400&fit=crop',
    null,
    'Read More',
    'blog',
    1,
    1
  );

  console.log('Success Sample banners added successfully!');

  // Show created banners
  const banners = db.prepare('SELECT * FROM banners ORDER BY page, display_order').all();
  console.log('\nStats Created banners:');
  banners.forEach(banner => {
    console.log(`  - ${banner.page}: "${banner.title}" (${banner.isActive ? 'Active' : 'Inactive'})`);
  });

  console.log('\nCelebration Banners table setup completed!');
  console.log('\nTip You can now:');
  console.log('   1. Manage banners through the admin panel');
  console.log('   2. Add banners for different pages (home, products, categories, blog, etc.)');
  console.log('   3. Configure sliding banners (multiple banners slide, single banner stays static)');
  console.log('   4. Reorder banners using drag & drop');
  console.log('   5. Toggle banner visibility');

} catch (error) {
  console.error('Error Error creating banners table:', error);
} finally {
  db.close();
}