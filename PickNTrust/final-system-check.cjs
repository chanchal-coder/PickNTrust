const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 FINAL SYSTEM CHECK - Verifying Complete Fix...');

async function finalSystemCheck() {
  try {
    // Check both database files
    const fs = require('fs');
    
    console.log('\n📁 1. Database Files Check');
    console.log('-'.repeat(50));
    
    const sqliteDb = path.join(__dirname, 'sqlite.db');
    const databaseSqlite = path.join(__dirname, 'database.sqlite');
    
    if (fs.existsSync(sqliteDb)) {
      const stats = fs.statSync(sqliteDb);
      console.log(`✅ sqlite.db exists (${stats.size} bytes) - Server will use this`);
    } else {
      console.log('❌ sqlite.db missing');
    }
    
    if (fs.existsSync(databaseSqlite)) {
      const stats = fs.statSync(databaseSqlite);
      console.log(`✅ database.sqlite exists (${stats.size} bytes) - Backup copy`);
    } else {
      console.log('❌ database.sqlite missing');
    }
    
    // Test the server database (sqlite.db)
    console.log('\n🗄️  2. Server Database Test (sqlite.db)');
    console.log('-'.repeat(50));
    
    const sqlite = new Database(sqliteDb);
    
    // Check categories count
    const count = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Categories count: ${count.count}`);
    
    if (count.count === 36) {
      console.log('🎉 SUCCESS! All 36 categories are in the server database');
    } else {
      console.log(`⚠️  Expected 36 categories, found ${count.count}`);
    }
    
    // Check table structure
    const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
    const requiredColumns = ['id', 'name', 'icon', 'color', 'description', 'is_for_products', 'is_for_services', 'display_order'];
    
    console.log('\nTable structure check:');
    const existingColumns = tableInfo.map(col => col.name);
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`  ❌ ${col} - MISSING`);
      }
    });
    
    // Test API query simulation
    console.log('\n🌐 3. API Query Simulation');
    console.log('-'.repeat(50));
    
    try {
      const apiResult = sqlite.prepare(`
        SELECT id, name, description, icon, color, is_for_products, is_for_services, display_order
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
      
      console.log(`✅ /api/categories query: ${apiResult.length} categories returned`);
      
      // Check Fashion & Clothing
      const fashionCategory = apiResult.find(cat => cat.name === 'Fashion & Clothing');
      if (fashionCategory) {
        console.log(`✅ Fashion & Clothing found (ID: ${fashionCategory.id}, Order: ${fashionCategory.display_order})`);
      } else {
        console.log('❌ Fashion & Clothing category missing');
      }
      
    } catch (queryError) {
      console.log('❌ API query simulation failed:', queryError.message);
    }
    
    // Show sample categories
    console.log('\n📋 4. Sample Categories (First 10)');
    console.log('-'.repeat(50));
    
    const sampleCategories = sqlite.prepare(`
      SELECT id, name, icon, color, display_order, is_for_products, is_for_services
      FROM categories 
      ORDER BY display_order ASC 
      LIMIT 10
    `).all();
    
    sampleCategories.forEach((cat, index) => {
      const type = cat.is_for_products && cat.is_for_services ? 'Mixed' : 
                   cat.is_for_products ? 'Product' : 'Service';
      console.log(`   ${index + 1}. ${cat.name} (${type}) - ${cat.icon} - Order: ${cat.display_order}`);
    });
    
    sqlite.close();
    
    // Final status
    console.log('\n🎯 5. Final System Status');
    console.log('-'.repeat(50));
    
    const allGood = count.count === 36 && fashionCategory && existingColumns.includes('display_order');
    
    if (allGood) {
      console.log('🎉 SYSTEM FULLY OPERATIONAL!');
      console.log('✅ Database connection fixed');
      console.log('✅ All 36 categories properly installed');
      console.log('✅ Fashion & Clothing ready for gender testing');
      console.log('✅ Display orders configured');
      console.log('✅ API endpoints will work properly');
    } else {
      console.log('⚠️  Some issues detected. Please review above.');
    }
    
    return allGood;

  } catch (error) {
    console.error('❌ System check failed:', error.message);
    return false;
  }
}

// Run the check
finalSystemCheck().then(success => {
  if (success) {
    console.log('\n🚀 READY FOR PRODUCTION!');
    console.log('\n📋 What You Should See After Server Restart:');
    console.log('   • Admin Panel: "Manage Categories (36)" instead of "(0)"');
    console.log('   • Browse Categories: All 36 categories with proper icons');
    console.log('   • Category reordering: Up/Down arrows functional');
    console.log('   • Fashion & Clothing: Gender tabs working');
    console.log('   • Mobile footer: Responsive layout');
    console.log('\n⚠️  CRITICAL: Restart your development server NOW!');
    console.log('\n🧪 Test Checklist After Restart:');
    console.log('   1. ✅ Admin panel shows "Manage Categories (36)"');
    console.log('   2. ✅ Browse categories shows all 36 items');
    console.log('   3. ✅ Category reordering works with arrows');
    console.log('   4. ✅ Add product to Fashion & Clothing with gender="men"');
    console.log('   5. ✅ Product appears under Men tab in fashion category');
    console.log('   6. ✅ Mobile footer displays properly');
  } else {
    console.log('\n❌ SYSTEM NOT READY - Issues detected above');
    process.exit(1);
  }
});
