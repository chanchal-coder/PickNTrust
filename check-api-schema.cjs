// Check API Data Table and Schema
// Comprehensive analysis of banner API endpoints and database schema

const Database = require('better-sqlite3');
const fetch = require('node-fetch');

console.log('🔍 CHECKING API DATA TABLE & SCHEMA');
console.log('=' .repeat(50));

async function checkApiSchema() {
  try {
    console.log('\n1️⃣ Database Schema Analysis...');
    
    const db = new Database('database.sqlite');
    
    // Check banners table schema
    console.log('\n📋 Banners Table Schema:');
    const tableInfo = db.prepare("PRAGMA table_info(banners)").all();
    
    console.log('   Columns:');
    tableInfo.forEach(col => {
      console.log(`      ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    console.log('\n2️⃣ Current Banner Data Analysis...');
    
    // Get all banners with full details
    const allBanners = db.prepare(`
      SELECT * FROM banners ORDER BY page, display_order
    `).all();
    
    console.log(`   📊 Total banners: ${allBanners.length}`);
    
    // Group by page
    const bannersByPage = {};
    allBanners.forEach(banner => {
      if (!bannersByPage[banner.page]) {
        bannersByPage[banner.page] = [];
      }
      bannersByPage[banner.page].push(banner);
    });
    
    console.log('\n📋 Banners by Page:');
    Object.keys(bannersByPage).forEach(page => {
      console.log(`\n   📄 ${page}:`);
      bannersByPage[page].forEach(banner => {
        console.log(`      ID: ${banner.id} | Active: ${banner.isActive ? 'YES' : 'NO'}`);
        console.log(`      Title: "${banner.title}"`);
        console.log(`      Icon: ${banner.icon || 'None'} (${banner.iconType || 'none'}, ${banner.iconPosition || 'left'})`);
        console.log(`      Image: ${banner.imageUrl ? banner.imageUrl.substring(0, 50) + '...' : 'None'}`);
        console.log(`      Created: ${banner.created_at}`);
        console.log(`      Updated: ${banner.updated_at}`);
        console.log('      ---');
      });
    });
    
    console.log('\n3️⃣ API Endpoint Testing...');
    
    const apiTests = [
      { endpoint: '/api/banners/prime-picks', description: 'Prime Picks Banners' },
      { endpoint: '/api/admin/banners', description: 'Admin All Banners' },
      { endpoint: '/api/banners/home', description: 'Home Banners' },
      { endpoint: '/api/banners/click-picks', description: 'Click Picks Banners' },
      { endpoint: '/api/banners/value-picks', description: 'Value Picks Banners' }
    ];
    
    for (const test of apiTests) {
      try {
        console.log(`\n   🌐 Testing ${test.description}:`);
        console.log(`      URL: http://localhost:5000${test.endpoint}`);
        
        const response = await fetch(`http://localhost:5000${test.endpoint}`);
        console.log(`      Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (test.endpoint.includes('/admin/')) {
            // Admin endpoint returns array directly
            console.log(`      Response: Array with ${Array.isArray(data) ? data.length : 'unknown'} items`);
            if (Array.isArray(data) && data.length > 0) {
              console.log(`      Sample banner: ID ${data[0].id}, Title: "${data[0].title}"`);
              console.log(`      Has icon fields: ${data[0].hasOwnProperty('icon') ? 'YES' : 'NO'}`);
            }
          } else {
            // Page endpoints return {banners: []} format
            console.log(`      Response: {banners: Array(${data.banners ? data.banners.length : 0})}`);
            if (data.banners && data.banners.length > 0) {
              console.log(`      Sample banner: ID ${data.banners[0].id}, Title: "${data.banners[0].title}"`);
              console.log(`      Has icon fields: ${data.banners[0].hasOwnProperty('icon') ? 'YES' : 'NO'}`);
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`      Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`      ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n4️⃣ Schema Validation...');
    
    // Check if all required columns exist
    const requiredColumns = ['id', 'title', 'subtitle', 'imageUrl', 'linkUrl', 'buttonText', 'page', 'isActive', 'display_order', 'created_at', 'updated_at', 'icon', 'iconType', 'iconPosition'];
    const existingColumns = tableInfo.map(col => col.name);
    
    console.log('   📋 Column Validation:');
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`      ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    if (missingColumns.length > 0) {
      console.log(`\n   ⚠️ Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('\n   ✅ All required columns present');
    }
    
    console.log('\n5️⃣ Data Integrity Check...');
    
    // Check for data issues
    const issues = [];
    
    // Check for banners with empty titles
    const emptyTitles = db.prepare(`
      SELECT COUNT(*) as count FROM banners WHERE title = '' OR title IS NULL
    `).get().count;
    
    if (emptyTitles > 0) {
      issues.push(`${emptyTitles} banners with empty titles`);
    }
    
    // Check for banners with missing images
    const missingImages = db.prepare(`
      SELECT COUNT(*) as count FROM banners WHERE imageUrl = '' OR imageUrl IS NULL
    `).get().count;
    
    if (missingImages > 0) {
      issues.push(`${missingImages} banners with missing images`);
    }
    
    // Check for duplicate active banners per page
    const duplicateCheck = db.prepare(`
      SELECT page, COUNT(*) as count 
      FROM banners 
      WHERE isActive = 1 
      GROUP BY page 
      HAVING COUNT(*) > 1
    `).all();
    
    if (duplicateCheck.length > 0) {
      duplicateCheck.forEach(dup => {
        issues.push(`${dup.count} active banners on page '${dup.page}'`);
      });
    }
    
    if (issues.length > 0) {
      console.log('   ⚠️ Data Issues Found:');
      issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    } else {
      console.log('   ✅ No data integrity issues found');
    }
    
    console.log('\n6️⃣ Frontend-Backend Sync Check...');
    
    // Check if API responses match database
    try {
      const primePicksApi = await fetch('http://localhost:5000/api/banners/prime-picks');
      if (primePicksApi.ok) {
        const apiData = await primePicksApi.json();
        const dbData = db.prepare(`
          SELECT * FROM banners WHERE page = 'prime-picks' AND isActive = 1
        `).all();
        
        console.log(`   📊 Prime Picks Sync:`);
        console.log(`      Database: ${dbData.length} active banners`);
        console.log(`      API Response: ${apiData.banners ? apiData.banners.length : 0} banners`);
        
        if (dbData.length === (apiData.banners ? apiData.banners.length : 0)) {
          console.log('      ✅ Database and API are in sync');
        } else {
          console.log('      ❌ Database and API are out of sync!');
        }
      }
    } catch (error) {
      console.log('   ⚠️ Sync check failed: API not accessible');
    }
    
    db.close();
    
    console.log('\n✅ API DATA TABLE & SCHEMA CHECK COMPLETE!');
    
    console.log('\n📋 SUMMARY:');
    console.log(`   🗄️ Database: ${allBanners.length} total banners`);
    console.log(`   📊 Pages: ${Object.keys(bannersByPage).length} different pages`);
    console.log(`   🔧 Schema: ${existingColumns.length} columns`);
    console.log(`   🎨 Icon Support: ${existingColumns.includes('icon') ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⚠️ Issues: ${issues.length} data integrity issues`);
    
    console.log('\n🔍 NEXT STEPS:');
    if (issues.length > 0) {
      console.log('   1. Fix data integrity issues');
      console.log('   2. Verify API endpoints are working');
      console.log('   3. Check frontend cache clearing');
    } else {
      console.log('   1. Clear browser cache completely');
      console.log('   2. Hard refresh the page (Ctrl+F5)');
      console.log('   3. Check network tab for API call failures');
    }
    
  } catch (error) {
    console.error('❌ Error during API schema check:', error.message);
  }
}

// Run the check
checkApiSchema();