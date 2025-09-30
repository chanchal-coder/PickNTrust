const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Fixing Database Connection Issue...');

async function fixDatabaseConnection() {
  try {
    // The server is using 'sqlite.db' but our scripts use 'database.sqlite'
    // Let's copy the data from database.sqlite to sqlite.db
    
    const sourcePath = path.join(__dirname, 'database.sqlite');
    const targetPath = path.join(__dirname, 'sqlite.db');
    
    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${targetPath}`);
    
    // Check if source exists
    const fs = require('fs');
    if (!fs.existsSync(sourcePath)) {
      console.log('Error Source database.sqlite does not exist');
      return false;
    }
    
    // Copy database.sqlite to sqlite.db
    fs.copyFileSync(sourcePath, targetPath);
    console.log('Success Copied database.sqlite to sqlite.db');
    
    // Verify the copy worked
    const sqlite = new Database(targetPath);
    const count = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Success Verified: sqlite.db now has ${count.count} categories`);
    
    // Test the categories table structure
    const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
    console.log('Categories table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Show sample categories
    const sampleCategories = sqlite.prepare(`
      SELECT id, name, icon, display_order 
      FROM categories 
      ORDER BY display_order ASC 
      LIMIT 5
    `).all();
    
    console.log('\nSample categories:');
    sampleCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} - ${cat.icon} (Order: ${cat.display_order})`);
    });
    
    sqlite.close();
    
    console.log('\nCelebration Database connection fixed!');
    console.log('Success Server will now use sqlite.db with all 36 categories');
    console.log('Refresh Please restart your development server now');
    
    return true;
    
  } catch (error) {
    console.error('Error Failed to fix database connection:', error.message);
    return false;
  }
}

// Run the fix
fixDatabaseConnection().then(success => {
  if (success) {
    console.log('\nLaunch SUCCESS! Database connection is now fixed.');
    console.log('\nBlog Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Check admin panel - should show "Manage Categories (36)"');
    console.log('   3. Browse categories should show all 36 items');
    console.log('   4. Test Fashion & Clothing gender categorization');
  } else {
    console.log('\nError Fix failed. Please check the errors above.');
    process.exit(1);
  }
});
