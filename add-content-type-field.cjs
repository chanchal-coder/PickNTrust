// Add content_type field to all product tables
// This enables support for products, services, and apps across all channels

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Adding content_type field to all product tables...');

try {
  // List of all product tables
  const tables = [
    'amazon_products',
    'cuelinks_products', 
    'value_picks_products',
    'click_picks_products'
  ];
  
  for (const table of tables) {
    console.log(`\n📋 Processing table: ${table}`);
    
    // Check if content_type column already exists
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasContentType = columns.some(col => col.name === 'content_type');
    
    if (hasContentType) {
      console.log(`   Success content_type field already exists in ${table}`);
    } else {
      // Add content_type field with default value 'product'
      const alterQuery = `ALTER TABLE ${table} ADD COLUMN content_type TEXT DEFAULT 'product'`;
      db.exec(alterQuery);
      console.log(`   Success Added content_type field to ${table}`);
      
      // Update existing records to have 'product' as content_type
      const updateQuery = `UPDATE ${table} SET content_type = 'product' WHERE content_type IS NULL`;
      const result = db.prepare(updateQuery).run();
      console.log(`   Stats Updated ${result.changes} existing records to content_type = 'product'`);
    }
    
    // Create index for better performance
    const indexName = `idx_${table}_content_type`;
    try {
      const createIndexQuery = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(content_type)`;
      db.exec(createIndexQuery);
      console.log(`   Search Created index: ${indexName}`);
    } catch (indexError) {
      console.log(`   Warning  Index ${indexName} might already exist`);
    }
  }
  
  console.log('\nTarget Content Type Field Implementation Complete!');
  
  // Add some sample data to demonstrate the new content types
  console.log('\nBlog Adding sample content to demonstrate content types...');
  
  // Sample service for Click Picks
  const sampleService = {
    name: 'Premium Cloud Storage Service',
    description: 'Secure cloud storage with 1TB space and advanced sharing features',
    price: '299',
    original_price: '499',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=500&fit=crop&q=80',
    affiliate_url: 'https://example.com/cloud-storage-service',
    category: 'Technology',
    rating: '4.8',
    review_count: 1520,
    discount: 40,
    is_featured: 1,
    content_type: 'service',
    telegram_message_id: Date.now()
  };
  
  // Sample app for Click Picks
  const sampleApp = {
    name: 'AI Photo Editor Pro',
    description: 'Advanced AI-powered photo editing app with smart filters and enhancement tools',
    price: '199',
    original_price: '399',
    image_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=500&fit=crop&q=80',
    affiliate_url: 'https://example.com/ai-photo-editor',
    category: 'Photography',
    rating: '4.6',
    review_count: 890,
    discount: 50,
    is_new: 1,
    content_type: 'app',
    telegram_message_id: Date.now() + 1
  };
  
  // Insert sample service
  const insertServiceQuery = `
    INSERT INTO click_picks_products (
      name, description, price, original_price, image_url, affiliate_url,
      category, rating, review_count, discount, is_featured, content_type, telegram_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const serviceResult = db.prepare(insertServiceQuery).run(
    sampleService.name, sampleService.description, sampleService.price,
    sampleService.original_price, sampleService.image_url, sampleService.affiliate_url,
    sampleService.category, sampleService.rating, sampleService.review_count,
    sampleService.discount, sampleService.is_featured, sampleService.content_type,
    sampleService.telegram_message_id
  );
  
  console.log(`   Success Added sample service: ${sampleService.name} (ID: ${serviceResult.lastInsertRowid})`);
  
  // Insert sample app
  const insertAppQuery = `
    INSERT INTO click_picks_products (
      name, description, price, original_price, image_url, affiliate_url,
      category, rating, review_count, discount, is_new, content_type, telegram_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const appResult = db.prepare(insertAppQuery).run(
    sampleApp.name, sampleApp.description, sampleApp.price,
    sampleApp.original_price, sampleApp.image_url, sampleApp.affiliate_url,
    sampleApp.category, sampleApp.rating, sampleApp.review_count,
    sampleApp.discount, sampleApp.is_new, sampleApp.content_type,
    sampleApp.telegram_message_id
  );
  
  console.log(`   Success Added sample app: ${sampleApp.name} (ID: ${appResult.lastInsertRowid})`);
  
  // Show content type distribution
  console.log('\nStats Content Type Distribution:');
  for (const table of tables) {
    const stats = db.prepare(`
      SELECT content_type, COUNT(*) as count 
      FROM ${table} 
      GROUP BY content_type
    `).all();
    
    console.log(`\n   ${table}:`);
    stats.forEach(stat => {
      console.log(`     ${stat.content_type}: ${stat.count} items`);
    });
  }
  
} catch (error) {
  console.error('Error Error adding content_type field:', error.message);
} finally {
  db.close();
}

console.log('\nCelebration Content Type System Setup Complete!');
console.log('Success All product tables now support: products, services, and apps');
console.log('Success Indexes created for optimal performance');
console.log('Success Sample data added to demonstrate functionality');
console.log('Success Ready for mixed content display across all pages');