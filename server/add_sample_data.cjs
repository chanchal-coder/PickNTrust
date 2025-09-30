const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Adding sample data to unified_content table...');

try {
  // First, let's see what data exists
  const existingData = db.prepare('SELECT * FROM unified_content LIMIT 5').all();
  console.log('Existing data sample:', existingData);

  // Check the current schema
  const schema = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Table schema:', schema);

  // Add some sample featured products
  const insertStmt = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, category, content_type, 
      is_featured, status, image_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  // Sample featured products
  const sampleData = [
    {
      title: 'Premium Laptop Stand',
      description: 'Ergonomic aluminum laptop stand for better posture',
      price: 49.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Laptop+Stand'
    },
    {
      title: 'Wireless Charging Pad',
      description: 'Fast wireless charging for all Qi-enabled devices',
      price: 29.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Charging+Pad'
    },
    {
      title: 'Web Design Service',
      description: 'Professional website design and development',
      price: 299.99,
      category: 'Web Service',
      content_type: 'service',
      is_featured: 0,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Web+Design'
    },
    {
      title: 'AI Content Generator',
      description: 'Generate high-quality content using AI',
      price: 19.99,
      category: 'AI App',
      content_type: 'app',
      is_featured: 0,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=AI+Content'
    },
    {
      title: 'Smart Home Hub',
      description: 'Control all your smart devices from one place',
      price: 89.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Smart+Hub'
    }
  ];

  // Insert the sample data
  for (const item of sampleData) {
    insertStmt.run(
      item.title,
      item.description,
      item.price,
      item.category,
      item.content_type,
      item.is_featured,
      item.status,
      item.image_url
    );
  }

  console.log(`Added ${sampleData.length} sample items to unified_content table`);

  // Verify the data was added
  const featuredProducts = db.prepare('SELECT * FROM unified_content WHERE is_featured = 1').all();
  const services = db.prepare("SELECT * FROM unified_content WHERE category LIKE '%service%' OR content_type = 'service'").all();
  const apps = db.prepare("SELECT * FROM unified_content WHERE category LIKE '%app%' OR content_type = 'app'").all();

  console.log(`Featured products: ${featuredProducts.length}`);
  console.log(`Services: ${services.length}`);
  console.log(`Apps: ${apps.length}`);

} catch (error) {
  console.error('Error adding sample data:', error);
} finally {
  db.close();
}