const Database = require('better-sqlite3');

console.log('🔧 FIXING DATA STATUS AND FEATURED FLAGS');
console.log('=' .repeat(50));

const db = new Database('database.sqlite');

try {
  // First, let's see what we have
  console.log('📊 Current data status:');
  const currentData = db.prepare(`
    SELECT id, title, content_type, category, status, is_featured 
    FROM unified_content
  `).all();
  
  currentData.forEach((row, index) => {
    console.log(`${index + 1}. ${row.title}`);
    console.log(`   Type: ${row.content_type}, Category: ${row.category}`);
    console.log(`   Status: ${row.status}, Featured: ${row.is_featured}`);
    console.log('');
  });

  // Fix 1: Update status from 'published' to 'active'
  console.log('🔧 Step 1: Updating status from "published" to "active"...');
  const statusUpdate = db.prepare(`
    UPDATE unified_content 
    SET status = 'active' 
    WHERE status = 'published'
  `);
  const statusResult = statusUpdate.run();
  console.log(`✅ Updated ${statusResult.changes} records to status='active'`);

  // Fix 2: Make some products featured
  console.log('\n🔧 Step 2: Making some products featured...');
  const featuredUpdate = db.prepare(`
    UPDATE unified_content 
    SET is_featured = 1 
    WHERE id IN (SELECT id FROM unified_content LIMIT 2)
  `);
  const featuredResult = featuredUpdate.run();
  console.log(`✅ Made ${featuredResult.changes} products featured`);

  // Fix 3: Update categories to create services and apps
  console.log('\n🔧 Step 3: Creating service and app entries...');
  
  // Update one record to be a service
  const serviceUpdate = db.prepare(`
    UPDATE unified_content 
    SET content_type = 'service', category = 'Business Services'
    WHERE id = (SELECT id FROM unified_content ORDER BY id LIMIT 1 OFFSET 1)
  `);
  const serviceResult = serviceUpdate.run();
  console.log(`✅ Updated ${serviceResult.changes} record to be a service`);

  // Update one record to be an app
  const appUpdate = db.prepare(`
    UPDATE unified_content 
    SET content_type = 'app', category = 'Productivity Apps'
    WHERE id = (SELECT id FROM unified_content ORDER BY id LIMIT 1 OFFSET 2)
  `);
  const appResult = appUpdate.run();
  console.log(`✅ Updated ${appResult.changes} record to be an app`);

  // Verify the changes
  console.log('\n📊 VERIFICATION - Updated data:');
  console.log('-' .repeat(50));
  
  const updatedData = db.prepare(`
    SELECT id, title, content_type, category, status, is_featured 
    FROM unified_content
  `).all();
  
  updatedData.forEach((row, index) => {
    console.log(`${index + 1}. ${row.title}`);
    console.log(`   Type: ${row.content_type}, Category: ${row.category}`);
    console.log(`   Status: ${row.status}, Featured: ${row.is_featured}`);
    console.log('');
  });

  // Test the API queries
  console.log('🧪 TESTING API QUERIES AFTER FIX:');
  console.log('-' .repeat(50));

  // Featured products
  const featuredProducts = db.prepare(`
    SELECT * FROM unified_content 
    WHERE is_featured = 1 AND status = 'active' 
    ORDER BY rating DESC, created_at DESC, id DESC 
    LIMIT 10
  `).all();
  console.log(`Featured products: ${featuredProducts.length} items`);

  // Services
  const services = db.prepare(`
    SELECT * FROM unified_content 
    WHERE (category LIKE '%service%' OR content_type = 'service') AND status = 'active' 
    ORDER BY rating DESC, created_at DESC, id DESC 
    LIMIT 10
  `).all();
  console.log(`Services: ${services.length} items`);

  // Apps
  const apps = db.prepare(`
    SELECT * FROM unified_content 
    WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app') AND status = 'active' 
    ORDER BY rating DESC, created_at DESC, id DESC 
    LIMIT 10
  `).all();
  console.log(`Apps: ${apps.length} items`);

  console.log('\n✅ Data fix completed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}