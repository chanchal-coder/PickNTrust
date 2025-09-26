const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('🔍 Checking services data in unified_content table...\n');

// 1. Check total count of records
const totalCount = db.prepare("SELECT COUNT(*) as count FROM unified_content").get().count;
console.log(`📊 Total records in unified_content: ${totalCount}`);

// 2. Check records with is_service = 1
const serviceCount = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE is_service = 1").get().count;
console.log(`🛠️ Records with is_service = 1: ${serviceCount}`);

// 3. Check records with is_ai_app = 1
const aiAppCount = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE is_ai_app = 1").get().count;
console.log(`📱 Records with is_ai_app = 1: ${aiAppCount}`);

// 4. Check records with is_featured = 1
const featuredCount = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE is_featured = 1").get().count;
console.log(`⭐ Records with is_featured = 1: ${featuredCount}`);

// 5. Show sample records with is_service = 1
console.log('\n🛠️ Sample services (is_service = 1):');
const services = db.prepare(`
  SELECT id, title, category, content_type, is_service, is_ai_app, is_featured, status, processing_status
  FROM unified_content 
  WHERE is_service = 1 
  LIMIT 10
`).all();

if (services.length > 0) {
  services.forEach((service, i) => {
    console.log(`${i+1}. ${service.title} (ID: ${service.id})`);
    console.log(`   Category: ${service.category}`);
    console.log(`   Content Type: ${service.content_type}`);
    console.log(`   Status: ${service.status}, Processing: ${service.processing_status}`);
    console.log(`   Flags: service=${service.is_service}, ai_app=${service.is_ai_app}, featured=${service.is_featured}`);
    console.log('');
  });
} else {
  console.log('   No services found with is_service = 1');
}

// 6. Show sample records with is_ai_app = 1
console.log('\n📱 Sample AI apps (is_ai_app = 1):');
const aiApps = db.prepare(`
  SELECT id, title, category, content_type, is_service, is_ai_app, is_featured, status, processing_status
  FROM unified_content 
  WHERE is_ai_app = 1 
  LIMIT 10
`).all();

if (aiApps.length > 0) {
  aiApps.forEach((app, i) => {
    console.log(`${i+1}. ${app.title} (ID: ${app.id})`);
    console.log(`   Category: ${app.category}`);
    console.log(`   Content Type: ${app.content_type}`);
    console.log(`   Status: ${app.status}, Processing: ${app.processing_status}`);
    console.log(`   Flags: service=${app.is_service}, ai_app=${app.is_ai_app}, featured=${app.is_featured}`);
    console.log('');
  });
} else {
  console.log('   No AI apps found with is_ai_app = 1');
}

// 7. Check records by content_type
console.log('\n📋 Records by content_type:');
const contentTypes = db.prepare(`
  SELECT content_type, COUNT(*) as count 
  FROM unified_content 
  GROUP BY content_type 
  ORDER BY count DESC
`).all();

contentTypes.forEach(type => {
  console.log(`   ${type.content_type || 'NULL'}: ${type.count}`);
});

// 8. Check records by category that might be services
console.log('\n🏷️ Categories that might contain services:');
const serviceCategories = db.prepare(`
  SELECT category, COUNT(*) as count 
  FROM unified_content 
  WHERE category LIKE '%service%' OR category LIKE '%Service%' OR category LIKE '%app%' OR category LIKE '%App%'
  GROUP BY category 
  ORDER BY count DESC
`).all();

if (serviceCategories.length > 0) {
  serviceCategories.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.count}`);
  });
} else {
  console.log('   No service-related categories found');
}

db.close();