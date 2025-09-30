const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 DEBUG SERVER DATABASE CONNECTION');
console.log('=' .repeat(50));

// Check all possible database files
const dbFiles = ['database.sqlite', 'sqlite.db', 'database.db'];
const existingFiles = [];

console.log('📁 Checking for database files:');
for (const file of dbFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    existingFiles.push({
      name: file,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
    console.log(`  ✅ ${file}: ${stats.size} bytes (modified: ${stats.modified})`);
  } else {
    console.log(`  ❌ ${file}: Not found`);
  }
}

// The server uses database.sqlite according to db.ts
const serverDbFile = 'database.sqlite';
console.log(`\n🎯 Server should be using: ${serverDbFile}`);

if (!fs.existsSync(serverDbFile)) {
  console.log(`❌ ERROR: Server database file ${serverDbFile} does not exist!`);
  process.exit(1);
}

// Connect to the server's database
const db = new Database(serverDbFile);

console.log('\n📊 UNIFIED_CONTENT TABLE ANALYSIS:');
console.log('-' .repeat(50));

// Check table schema
const schema = db.prepare("PRAGMA table_info(unified_content)").all();
console.log('Columns:', schema.map(col => col.name).join(', '));

// Check total records
const totalCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
console.log(`Total records: ${totalCount.count}`);

// Check featured products
const featuredQuery = `
  SELECT COUNT(*) as count 
  FROM unified_content 
  WHERE is_featured = 1 AND status = 'active'
`;
const featuredCount = db.prepare(featuredQuery).get();
console.log(`Featured products (is_featured=1, status='active'): ${featuredCount.count}`);

// Check services
const servicesQuery = `
  SELECT COUNT(*) as count 
  FROM unified_content 
  WHERE (category LIKE '%service%' OR content_type = 'service') AND status = 'active'
`;
const servicesCount = db.prepare(servicesQuery).get();
console.log(`Services: ${servicesCount.count}`);

// Check apps
const appsQuery = `
  SELECT COUNT(*) as count 
  FROM unified_content 
  WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app') AND status = 'active'
`;
const appsCount = db.prepare(appsQuery).get();
console.log(`Apps: ${appsCount.count}`);

// Show sample data
console.log('\n📋 SAMPLE DATA:');
console.log('-' .repeat(50));
const sampleData = db.prepare(`
  SELECT id, title, content_type, category, is_featured, status, created_at
  FROM unified_content 
  ORDER BY created_at DESC 
  LIMIT 5
`).all();

if (sampleData.length === 0) {
  console.log('❌ No data found in unified_content table');
} else {
  sampleData.forEach((row, index) => {
    console.log(`${index + 1}. ${row.title}`);
    console.log(`   Type: ${row.content_type}, Category: ${row.category}`);
    console.log(`   Featured: ${row.is_featured}, Status: ${row.status}`);
    console.log(`   Created: ${row.created_at}`);
    console.log('');
  });
}

// Test the exact API queries
console.log('\n🧪 TESTING API QUERIES:');
console.log('-' .repeat(50));

// Featured products query
const featuredProducts = db.prepare(`
  SELECT * FROM unified_content 
  WHERE is_featured = 1 AND status = 'active' 
  ORDER BY created_at DESC, id DESC 
  LIMIT 10
` ).all();
console.log(`Featured products API query result: ${featuredProducts.length} items`);

// Services query
const services = db.prepare(`
  SELECT * FROM unified_content 
  WHERE (category LIKE '%service%' OR content_type = 'service') AND status = 'active' 
  ORDER BY created_at DESC, id DESC 
  LIMIT 10
`).all();
console.log(`Services API query result: ${services.length} items`);

// Apps query
const apps = db.prepare(`
  SELECT * FROM unified_content 
  WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app') AND status = 'active' 
  ORDER BY created_at DESC, id DESC 
  LIMIT 10
`).all();
console.log(`Apps API query result: ${apps.length} items`);

db.close();
console.log('\n✅ Database analysis complete');