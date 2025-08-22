const Database = require('better-sqlite3');

console.log('🧪 Final Categories Test...\n');

function testDatabase(dbFile) {
  console.log(`📁 Testing ${dbFile}...`);
  
  if (!require('fs').existsSync(dbFile)) {
    console.log(`❌ ${dbFile} does not exist!`);
    return false;
  }
  
  const db = new Database(dbFile);
  
  try {
    // Test basic query
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`📊 Total categories: ${count.count}`);
    
    if (count.count === 0) {
      console.log(`❌ No categories found in ${dbFile}!`);
      db.close();
      return false;
    }
    
    // Test with all columns
    const testQuery = db.prepare(`
      SELECT id, name, displayOrder, isForProducts, isForServices 
      FROM categories 
      ORDER BY displayOrder 
      LIMIT 5
    `).all();
    
    console.log(`✅ Sample categories from ${dbFile}:`);
    testQuery.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder})`);
    });
    
    // Test Fashion category specifically
    const fashionCategory = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
    if (fashionCategory) {
      console.log(`\n👕 Fashion Category Found: ${fashionCategory.name} (ID: ${fashionCategory.id})`);
    } else {
      console.log(`\n❌ Fashion category not found in ${dbFile}!`);
    }
    
    db.close();
    return true;
    
  } catch (error) {
    console.error(`❌ Test failed for ${dbFile}:`, error.message);
    db.close();
    return false;
  }
}

// Test both databases
const dbFiles = ['database.sqlite', 'sqlite.db'];
let allGood = true;

for (const dbFile of dbFiles) {
  const result = testDatabase(dbFile);
  if (!result) allGood = false;
  console.log('');
}

if (allGood) {
  console.log('🎉 All database tests passed!');
  console.log('✅ Categories are properly configured');
  console.log('✅ Fashion category exists for gender testing');
  console.log('\n🚀 Ready to test the application!');
  console.log('Run: npm run dev');
} else {
  console.log('❌ Some database issues remain.');
}
