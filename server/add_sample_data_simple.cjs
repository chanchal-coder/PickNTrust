const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Adding sample data to unified_content table...');

try {
  // Check the current schema to see all required fields
  const schema = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Required fields (NOT NULL):');
  schema.forEach(col => {
    if (col.notnull === 1) {
      console.log(`- ${col.name} (${col.type})`);
    }
  });

  // Let's see what existing data looks like
  const existingData = db.prepare('SELECT * FROM unified_content LIMIT 1').all();
  if (existingData.length > 0) {
    console.log('Existing data structure:', Object.keys(existingData[0]));
  }

  // Add sample data with all required fields
  const insertStmt = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, category, content_type, 
      is_featured, status, image_url, affiliate_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sample data with all required fields
  const sampleData = [
    {
      title: 'Premium Laptop Stand',
      description: 'Ergonomic aluminum laptop stand for better posture',
      price: 49.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Laptop+Stand',
      affiliate_url: 'https://example.com/laptop-stand'
    },
    {
      title: 'Wireless Charging Pad',
      description: 'Fast wireless charging for all Qi-enabled devices',
      price: 29.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Charging+Pad',
      affiliate_url: 'https://example.com/charging-pad'
    },
    {
      title: 'Web Design Service',
      description: 'Professional website design and development',
      price: 299.99,
      category: 'Web Service',
      content_type: 'service',
      is_featured: 0,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Web+Design',
      affiliate_url: 'https://example.com/web-design'
    },
    {
      title: 'AI Content Generator',
      description: 'Generate high-quality content using AI',
      price: 19.99,
      category: 'AI App',
      content_type: 'app',
      is_featured: 0,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=AI+Content',
      affiliate_url: 'https://example.com/ai-content'
    },
    {
      title: 'Smart Home Hub',
      description: 'Control all your smart devices from one place',
      price: 89.99,
      category: 'Electronics',
      content_type: 'product',
      is_featured: 1,
      status: 'active',
      image_url: 'https://via.placeholder.com/300x200?text=Smart+Hub',
      affiliate_url: 'https://example.com/smart-hub'
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
      item.image_url,
      item.affiliate_url
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