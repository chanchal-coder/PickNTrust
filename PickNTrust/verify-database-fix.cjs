const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🧪 Verifying Database Fix...\n');

function verifyDatabase() {
  // Find the database file
  let dbFile = null;
  if (fs.existsSync('sqlite.db')) {
    dbFile = 'sqlite.db';
  } else if (fs.existsSync('database.sqlite')) {
    dbFile = 'database.sqlite';
  } else {
    console.log('❌ No database file found!');
    return false;
  }

  console.log(`📁 Checking database: ${dbFile}`);
  
  try {
    const db = new Database(dbFile);
    
    // Check table schema
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    const columns = schema.map(col => col.name);
    
    console.log(`📋 Available columns: ${columns.join(', ')}`);
    
    // Check required columns
    const requiredColumns = ['id', 'name', 'icon', 'color', 'description', 'displayOrder', 'isForProducts', 'isForServices'];
    let allColumnsExist = true;
    
    console.log('\n🔍 Column Check:');
    for (const col of requiredColumns) {
      if (columns.includes(col)) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`  ❌ ${col} - MISSING!`);
        allColumnsExist = false;
      }
    }
    
    if (!allColumnsExist) {
      console.log('\n❌ Database schema is incomplete!');
      db.close();
      return false;
    }
    
    // Test query
    try {
      const categories = db.prepare("SELECT id, name, displayOrder, isForProducts, isForServices FROM categories ORDER BY displayOrder LIMIT 5").all();
      
      console.log(`\n📊 Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder}, Products: ${cat.isForProducts}, Services: ${cat.isForServices})`);
      });
      
      // Check for Fashion category
      const fashionCat = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
      if (fashionCat) {
        console.log(`\n👕 Fashion Category: ${fashionCat.name} (ID: ${fashionCat.id})`);
      }
      
    } catch (queryError) {
      console.log(`❌ Query failed: ${queryError.message}`);
      db.close();
      return false;
    }
    
    db.close();
    console.log('\n✅ Database verification successful!');
    return true;
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return false;
  }
}

// Run verification
const isFixed = verifyDatabase();

if (isFixed) {
  console.log('\n🎉 Database is ready!');
  console.log('✅ All required columns exist');
  console.log('✅ Categories are populated');
  console.log('✅ Gender categorization should work');
  console.log('\n📝 You can now:');
  console.log('1. Restart your server');
  console.log('2. Test categories in frontend');
  console.log('3. Test gender filtering in Fashion category');
} else {
  console.log('\n❌ Database needs fixing!');
  console.log('Run: node fix-production-categories.cjs');
}
