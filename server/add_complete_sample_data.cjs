const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Adding sample data to unified_content table...');

try {
  // Add sample data with ALL required fields
  const insertStmt = db.prepare(`
    INSERT INTO unified_content (
      title, image_url, affiliate_url, content_type, 
      page_type, category, source_type, description, price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sample data with all required NOT NULL fields
  const sampleData = [
    {
      title: 'Premium Laptop Stand',
      image_url: 'https://via.placeholder.com/300x200?text=Laptop+Stand',
      affiliate_url: 'https://example.com/laptop-stand',
      content_type: 'product',
      page_type: 'home',
      category: 'Electronics',
      source_type: 'manual',
      description: 'Ergonomic aluminum laptop stand for better posture',
      price: 49.99
    },
    {
      title: 'Wireless Charging Pad',
      image_url: 'https://via.placeholder.com/300x200?text=Charging+Pad',
      affiliate_url: 'https://example.com/charging-pad',
      content_type: 'product',
      page_type: 'home',
      category: 'Electronics',
      source_type: 'manual',
      description: 'Fast wireless charging for all Qi-enabled devices',
      price: 29.99
    },
    {
      title: 'Web Design Service',
      image_url: 'https://via.placeholder.com/300x200?text=Web+Design',
      affiliate_url: 'https://example.com/web-design',
      content_type: 'service',
      page_type: 'home',
      category: 'Web Service',
      source_type: 'manual',
      description: 'Professional website design and development',
      price: 299.99
    },
    {
      title: 'AI Content Generator',
      image_url: 'https://via.placeholder.com/300x200?text=AI+Content',
      affiliate_url: 'https://example.com/ai-content',
      content_type: 'app',
      page_type: 'home',
      category: 'AI App',
      source_type: 'manual',
      description: 'Generate high-quality content using AI',
      price: 19.99
    },
    {
      title: 'Smart Home Hub',
      image_url: 'https://via.placeholder.com/300x200?text=Smart+Hub',
      affiliate_url: 'https://example.com/smart-hub',
      content_type: 'product',
      page_type: 'home',
      category: 'Electronics',
      source_type: 'manual',
      description: 'Control all your smart devices from one place',
      price: 89.99
    }
  ];

  // Insert the sample data
  for (const item of sampleData) {
    insertStmt.run(
      item.title,
      item.image_url,
      item.affiliate_url,
      item.content_type,
      item.page_type,
      item.category,
      item.source_type,
      item.description,
      item.price
    );
  }

  console.log(`Added ${sampleData.length} sample items to unified_content table`);

  // Now update some items to be featured
  const updateFeatured = db.prepare('UPDATE unified_content SET is_featured = 1 WHERE content_type = ? AND title LIKE ?');
  updateFeatured.run('product', '%Laptop Stand%');
  updateFeatured.run('product', '%Charging Pad%');
  updateFeatured.run('product', '%Smart Home Hub%');

  console.log('Updated 3 products to be featured');

  // Verify the data was added
  const featuredProducts = db.prepare('SELECT * FROM unified_content WHERE is_featured = 1').all();
  const services = db.prepare("SELECT * FROM unified_content WHERE category LIKE '%service%' OR content_type = 'service'").all();
  const apps = db.prepare("SELECT * FROM unified_content WHERE category LIKE '%app%' OR content_type = 'app'").all();

  console.log(`Featured products: ${featuredProducts.length}`);
  console.log(`Services: ${services.length}`);
  console.log(`Apps: ${apps.length}`);

  console.log('Sample featured products:');
  featuredProducts.forEach(p => console.log(`- ${p.title} (${p.content_type})`));

} catch (error) {
  console.error('Error adding sample data:', error);
} finally {
  db.close();
}