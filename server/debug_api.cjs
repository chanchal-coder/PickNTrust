const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Debugging API queries...');

try {
  // Check what data exists
  console.log('\n=== All data in unified_content ===');
  const allData = db.prepare('SELECT id, title, is_featured, status FROM unified_content').all();
  console.log(`Total records: ${allData.length}`);
  allData.forEach(item => {
    console.log(`ID: ${item.id}, Title: ${item.title}, Featured: ${item.is_featured}, Status: ${item.status}`);
  });

  // Test the exact query from the API
  console.log('\n=== Featured products query (API) ===');
  const featuredQuery = `
    SELECT * FROM unified_content 
    WHERE is_featured = 1
    AND status = 'active'
    ORDER BY created_at DESC, id DESC
    LIMIT 10
  `;
  const featuredProducts = db.prepare(featuredQuery).all();
  console.log(`Featured products found: ${featuredProducts.length}`);
  featuredProducts.forEach(item => {
    console.log(`- ${item.title} (Featured: ${item.is_featured}, Status: ${item.status})`);
  });

  // Test services query
  console.log('\n=== Services query (API) ===');
  const servicesQuery = `
    SELECT * FROM unified_content 
    WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
    AND status = 'active'
    ORDER BY created_at DESC
  `;
  const services = db.prepare(servicesQuery).all();
  console.log(`Services found: ${services.length}`);
  services.forEach(item => {
    console.log(`- ${item.title} (Type: ${item.content_type}, Category: ${item.category})`);
  });

  // Test apps query
  console.log('\n=== Apps query (API) ===');
  const appsQuery = `
    SELECT * FROM unified_content 
    WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app')
    AND status = 'active'
    ORDER BY created_at DESC
  `;
  const apps = db.prepare(appsQuery).all();
  console.log(`Apps found: ${apps.length}`);
  apps.forEach(item => {
    console.log(`- ${item.title} (Type: ${item.content_type}, Category: ${item.category})`);
  });

} catch (error) {
  console.error('Error debugging:', error);
} finally {
  db.close();
}