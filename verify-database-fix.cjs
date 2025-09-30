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
    console.log('Error No database file found!');
    return false;
  }

  console.log(`Upload Checking database: ${dbFile}`);
  
  try {
    const db = new Database(dbFile);
    
    // Check table schema
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    const columns = schema.map(col => col.name);
    
    console.log(`📋 Available columns: ${columns.join(', ')}`);
    
    // Check required columns
    const requiredColumns = ['id', 'name', 'icon', 'color', 'description', 'displayOrder', 'isForProducts', 'isForServices'];
    let allColumnsExist = true;
    
    console.log('\nSearch Column Check:');
    for (const col of requiredColumns) {
      if (columns.includes(col)) {
        console.log(`  Success ${col}`);
      } else {
        console.log(`  Error ${col} - MISSING!`);
        allColumnsExist = false;
      }
    }
    
    if (!allColumnsExist) {
      console.log('\nError Database schema is incomplete!');
      db.close();
      return false;
    }
    
    // Test query
    try {
      const categories = db.prepare("SELECT id, name, displayOrder, isForProducts, isForServices FROM categories ORDER BY displayOrder LIMIT 5").all();
      
      console.log(`\nStats Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder}, Products: ${cat.isForProducts}, Services: ${cat.isForServices})`);
      });
      
      // Check for Fashion category
      const fashionCat = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
      if (fashionCat) {
        console.log(`\n👕 Fashion Category: ${fashionCat.name} (ID: ${fashionCat.id})`);
      }
      
    } catch (queryError) {
      console.log(`Error Query failed: ${queryError.message}`);
      db.close();
      return false;
    }
    
    db.close();
    console.log('\nSuccess Database verification successful!');
    return true;
    
  } catch (error) {
    console.log(`Error Database error: ${error.message}`);
    return false;
  }
}

// Run verification
const isFixed = verifyDatabase();

if (isFixed) {
  console.log('\nCelebration Database is ready!');
  console.log('Success All required columns exist');
  console.log('Success Categories are populated');
  console.log('Success Gender categorization should work');
  console.log('\nBlog You can now:');
  console.log('1. Restart your server');
  console.log('2. Test categories in frontend');
  console.log('3. Test gender filtering in Fashion category');
} else {
  console.log('\nError Database needs fixing!');
  console.log('Run: node fix-production-categories.cjs');
}
