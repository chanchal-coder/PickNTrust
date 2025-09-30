/**
 * Check Banners Table and Data
 * This script checks if the banners table exists and what data it contains
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 CHECKING BANNERS TABLE AND DATA');
console.log('='.repeat(60));

async function checkBannersTable() {
try {
  const db = new Database(dbPath);
  
  // Check if banners table exists
  console.log('1️⃣ Checking if banners table exists...');
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='banners'
  `).get();
  
  if (!tableExists) {
    console.log('❌ Banners table does not exist!');
    console.log('\n💡 The banners table needs to be created.');
    console.log('   This explains why the API is returning 404 errors.');
    db.close();
    return;
  }
  
  console.log('✅ Banners table exists');
  
  // Check table schema
  console.log('\n2️⃣ Checking banners table schema...');
  const schema = db.prepare(`PRAGMA table_info(banners)`).all();
  console.log('   Columns:');
  schema.forEach(col => {
    console.log(`     - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
  });
  
  // Check total count
  console.log('\n3️⃣ Checking banner count...');
  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM banners`).get();
  console.log(`   Total banners: ${totalCount.count}`);
  
  if (totalCount.count === 0) {
    console.log('❌ No banners found in the table!');
    console.log('\n💡 The banners table is empty.');
    console.log('   This explains why the API returns empty results.');
    db.close();
    return;
  }
  
  // Check banners by page
  console.log('\n4️⃣ Checking banners by page...');
  const bannersByPage = db.prepare(`
    SELECT page, COUNT(*) as count, 
           SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_count
    FROM banners 
    GROUP BY page 
    ORDER BY page
  `).all();
  
  bannersByPage.forEach(pageData => {
    console.log(`   📄 ${pageData.page}: ${pageData.count} total (${pageData.active_count} active)`);
  });
  
  // Check specific pages that are causing issues
  console.log('\n5️⃣ Checking specific problematic pages...');
  const problematicPages = ['cue-picks', 'prime-picks', 'value-picks'];
  
  problematicPages.forEach(page => {
    const banners = db.prepare(`
      SELECT id, title, isActive, created_at 
      FROM banners 
      WHERE page = ? 
      ORDER BY display_order ASC
    `).all(page);
    
    console.log(`\n   🔍 ${page}:`);
    if (banners.length === 0) {
      console.log(`     ❌ No banners found for ${page}`);
    } else {
      banners.forEach(banner => {
        console.log(`     - ID ${banner.id}: "${banner.title}" (${banner.isActive ? 'Active' : 'Inactive'})`);
      });
    }
  });
  
  // Test API endpoint directly
  console.log('\n6️⃣ Testing API endpoint directly...');
  try {
    const response = await fetch('http://localhost:5000/api/banners/cue-picks');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Failed to test API: ${error.message}`);
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error checking banners:', error);
}
}

checkBannersTable();