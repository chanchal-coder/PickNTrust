const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('=== UPDATING EXISTING PRODUCTS WITH SMART CATEGORIZATION ===\n');

try {
  // Get all products
  const products = db.prepare(`
    SELECT id, title, category, is_featured, display_pages
    FROM unified_content 
    ORDER BY id
  `).all();

  console.log(`Found ${products.length} products to categorize\n`);

  // Define categorization rules
  const serviceKeywords = ['service', 'cloud', 'web', 'hosting', 'support', 'consulting', 'design', 'development'];
  const aiAppKeywords = ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'photo editor', 'content generator'];

  let updatedCount = 0;

  const updateStmt = db.prepare(`
    UPDATE unified_content 
    SET is_service = ?, is_ai_app = ?, processing_status = 'completed', visibility = 'public'
    WHERE id = ?
  `);

  for (const product of products) {
    const title = product.title.toLowerCase();
    const category = product.category.toLowerCase();
    
    // Determine if it's a service
    const isService = serviceKeywords.some(keyword => 
      title.includes(keyword) || category.includes(keyword)
    ) ? 1 : 0;

    // Determine if it's an AI app
    const isAiApp = aiAppKeywords.some(keyword => 
      title.includes(keyword) || category.includes(keyword)
    ) ? 1 : 0;

    // Update the product
    updateStmt.run(isService, isAiApp, product.id);
    updatedCount++;

    console.log(`${product.id}: ${product.title}`);
    console.log(`  Category: ${product.category}`);
    console.log(`  Service: ${isService ? '✅' : '❌'}, AI App: ${isAiApp ? '✅' : '❌'}`);
    console.log('');
  }

  console.log(`✅ Updated ${updatedCount} products with smart categorization flags\n`);

  // Show summary
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(is_featured) as featured,
      SUM(is_service) as services,
      SUM(is_ai_app) as ai_apps
    FROM unified_content
  `).get();

  console.log('📊 CATEGORIZATION SUMMARY:');
  console.log(`  Total Products: ${summary.total}`);
  console.log(`  Featured Products: ${summary.featured}`);
  console.log(`  Services: ${summary.services}`);
  console.log(`  AI Apps: ${summary.ai_apps}`);

  // Show products by category
  console.log('\n📋 PRODUCTS BY TYPE:');
  
  const featuredProducts = db.prepare(`
    SELECT id, title FROM unified_content WHERE is_featured = 1
  `).all();
  console.log(`\nFeatured Products (${featuredProducts.length}):`);
  featuredProducts.forEach(p => console.log(`  - ${p.title}`));

  const serviceProducts = db.prepare(`
    SELECT id, title FROM unified_content WHERE is_service = 1
  `).all();
  console.log(`\nServices (${serviceProducts.length}):`);
  serviceProducts.forEach(p => console.log(`  - ${p.title}`));

  const aiAppProducts = db.prepare(`
    SELECT id, title FROM unified_content WHERE is_ai_app = 1
  `).all();
  console.log(`\nAI Apps (${aiAppProducts.length}):`);
  aiAppProducts.forEach(p => console.log(`  - ${p.title}`));

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}