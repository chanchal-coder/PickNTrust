// Comprehensive Banner System Diagnostic
// Deep analysis of all components: schema, queries, case sensitivity, data flow

const Database = require('better-sqlite3');
const fetch = require('node-fetch');

console.log('🔍 COMPREHENSIVE BANNER SYSTEM DIAGNOSTIC');
console.log('=' .repeat(60));

async function comprehensiveDiagnostic() {
  try {
    console.log('\n1️⃣ DATABASE SCHEMA ANALYSIS...');
    
    const db = new Database('database.sqlite');
    
    // Check exact table schema
    console.log('\n📋 Exact Table Schema:');
    const tableInfo = db.prepare("PRAGMA table_info(banners)").all();
    tableInfo.forEach(col => {
      console.log(`   ${col.cid}: ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Check for case sensitivity issues
    console.log('\n🔤 Case Sensitivity Check:');
    const caseTestQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_count,
        COUNT(CASE WHEN "isActive" = 1 THEN 1 END) as quoted_active_count
      FROM banners
    `;
    const caseTest = db.prepare(caseTestQuery).get();
    console.log(`   Total banners: ${caseTest.total}`);
    console.log(`   Active (isActive): ${caseTest.active_count}`);
    console.log(`   Active ("isActive"): ${caseTest.quoted_active_count}`);
    
    console.log('\n2️⃣ DETAILED BANNER DATA ANALYSIS...');
    
    // Get all banners with exact field mapping
    const allBanners = db.prepare(`
      SELECT 
        id, title, subtitle, imageUrl, linkUrl, buttonText, 
        page, isActive, display_order, created_at, updated_at,
        icon, iconType, iconPosition
      FROM banners 
      ORDER BY page, display_order, created_at DESC
    `).all();
    
    console.log(`\n📊 Total banners in database: ${allBanners.length}`);
    
    // Group by page and analyze
    const bannersByPage = {};
    allBanners.forEach(banner => {
      if (!bannersByPage[banner.page]) {
        bannersByPage[banner.page] = { active: [], inactive: [] };
      }
      if (banner.isActive) {
        bannersByPage[banner.page].active.push(banner);
      } else {
        bannersByPage[banner.page].inactive.push(banner);
      }
    });
    
    console.log('\n📋 Banners by Page (Detailed):');
    Object.keys(bannersByPage).sort().forEach(page => {
      const pageData = bannersByPage[page];
      console.log(`\n   📄 ${page.toUpperCase()}:`);
      console.log(`      Active: ${pageData.active.length}, Inactive: ${pageData.inactive.length}`);
      
      if (pageData.active.length > 0) {
        console.log('      🟢 ACTIVE BANNERS:');
        pageData.active.forEach((banner, index) => {
          console.log(`         ${index + 1}. ID: ${banner.id}`);
          console.log(`            Title: "${banner.title}"`);
          console.log(`            isActive: ${banner.isActive} (type: ${typeof banner.isActive})`);
          console.log(`            Display Order: ${banner.display_order}`);
          console.log(`            Created: ${banner.created_at}`);
          console.log(`            Updated: ${banner.updated_at}`);
          console.log(`            Icon: ${banner.icon || 'None'} (${banner.iconType || 'none'})`);
          console.log(`            Image: ${banner.imageUrl ? banner.imageUrl.substring(0, 50) + '...' : 'None'}`);
        });
      }
      
      if (pageData.inactive.length > 0) {
        console.log('      🔴 INACTIVE BANNERS:');
        pageData.inactive.forEach((banner, index) => {
          console.log(`         ${index + 1}. ID: ${banner.id} - "${banner.title}" (Updated: ${banner.updated_at})`);
        });
      }
    });
    
    console.log('\n3️⃣ API ENDPOINT COMPREHENSIVE TESTING...');
    
    const apiTests = [
      { endpoint: '/api/banners/prime-picks', description: 'Prime Picks' },
      { endpoint: '/api/banners/home', description: 'Home' },
      { endpoint: '/api/banners/click-picks', description: 'Click Picks' },
      { endpoint: '/api/banners/value-picks', description: 'Value Picks' },
      { endpoint: '/api/banners/global-picks', description: 'Global Picks' },
      { endpoint: '/api/banners/cue-picks', description: 'Cue Picks' },
      { endpoint: '/api/banners/deals-hub', description: 'Deals Hub' },
      { endpoint: '/api/banners/loot-box', description: 'Loot Box' },
      { endpoint: '/api/admin/banners', description: 'Admin All Banners' }
    ];
    
    for (const test of apiTests) {
      try {
        console.log(`\n🌐 Testing ${test.description}:`);
        console.log(`   URL: http://localhost:5000${test.endpoint}`);
        
        const response = await fetch(`http://localhost:5000${test.endpoint}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (test.endpoint.includes('/admin/')) {
            // Admin endpoint returns array directly
            console.log(`   ✅ Response: Array with ${Array.isArray(data) ? data.length : 'unknown'} items`);
            if (Array.isArray(data) && data.length > 0) {
              console.log(`   📋 Sample banner:`);
              const sample = data[0];
              console.log(`      ID: ${sample.id}, Title: "${sample.title}"`);
              console.log(`      isActive: ${sample.isActive} (type: ${typeof sample.isActive})`);
              console.log(`      Page: "${sample.page}"`);
              console.log(`      Fields: ${Object.keys(sample).join(', ')}`);
            }
          } else {
            // Page endpoints return {banners: []} format
            console.log(`   ✅ Response: {success: ${data.success}, banners: Array(${data.banners ? data.banners.length : 0})}`);
            if (data.banners && data.banners.length > 0) {
              console.log(`   📋 Sample banner:`);
              const sample = data.banners[0];
              console.log(`      ID: ${sample.id}, Title: "${sample.title}"`);
              console.log(`      isActive: ${sample.isActive} (type: ${typeof sample.isActive})`);
              console.log(`      Page: "${sample.page}"`);
              console.log(`      Fields: ${Object.keys(sample).join(', ')}`);
            } else {
              console.log(`   📋 No banners returned for this page`);
              
              // Check if there should be banners for this page
              const pageName = test.endpoint.split('/').pop();
              const dbBannersForPage = allBanners.filter(b => b.page === pageName && b.isActive);
              if (dbBannersForPage.length > 0) {
                console.log(`   ⚠️ MISMATCH: Database has ${dbBannersForPage.length} active banners for '${pageName}' but API returns 0`);
                dbBannersForPage.forEach(banner => {
                  console.log(`      DB Banner: ID ${banner.id}, "${banner.title}", isActive: ${banner.isActive}`);
                });
              }
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n4️⃣ FIELD MAPPING AND QUERY ANALYSIS...');
    
    // Test different query variations
    const queryTests = [
      { name: 'Standard Query', query: `SELECT * FROM banners WHERE page = 'prime-picks' AND isActive = 1` },
      { name: 'Quoted Fields', query: `SELECT * FROM banners WHERE "page" = 'prime-picks' AND "isActive" = 1` },
      { name: 'Case Variations', query: `SELECT * FROM banners WHERE LOWER(page) = 'prime-picks' AND isActive = 1` },
      { name: 'Boolean Check', query: `SELECT * FROM banners WHERE page = 'prime-picks' AND isActive != 0` },
    ];
    
    queryTests.forEach(test => {
      try {
        const result = db.prepare(test.query).all();
        console.log(`   ${test.name}: ${result.length} results`);
        if (result.length > 0) {
          console.log(`      Sample: ID ${result[0].id}, "${result[0].title}", isActive: ${result[0].isActive}`);
        }
      } catch (error) {
        console.log(`   ${test.name}: ERROR - ${error.message}`);
      }
    });
    
    console.log('\n5️⃣ RECENT CHANGES ANALYSIS...');
    
    // Check for recent changes
    const recentChanges = db.prepare(`
      SELECT id, title, page, isActive, created_at, updated_at,
             datetime(updated_at) as updated_datetime,
             datetime('now') as current_time,
             (julianday('now') - julianday(updated_at)) * 24 * 60 as minutes_ago
      FROM banners 
      WHERE datetime(updated_at) > datetime('now', '-1 hour')
      ORDER BY updated_at DESC
    `).all();
    
    console.log(`   📊 Banners modified in last hour: ${recentChanges.length}`);
    recentChanges.forEach(banner => {
      console.log(`      ID: ${banner.id}, "${banner.title}" (${banner.page})`);
      console.log(`         Active: ${banner.isActive}, Updated: ${banner.updated_at} (${Math.round(banner.minutes_ago)} min ago)`);
    });
    
    console.log('\n6️⃣ FRONTEND CACHE ANALYSIS...');
    
    // Test cache behavior by making multiple requests
    try {
      console.log('   🔄 Testing cache behavior with multiple requests...');
      
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(fetch('http://localhost:5000/api/banners/prime-picks'));
      }
      
      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));
      
      console.log('   📊 Cache consistency check:');
      results.forEach((result, index) => {
        console.log(`      Request ${index + 1}: ${result.banners ? result.banners.length : 0} banners`);
      });
      
      // Check if all responses are identical
      const firstResult = JSON.stringify(results[0]);
      const allIdentical = results.every(result => JSON.stringify(result) === firstResult);
      console.log(`   🔍 All responses identical: ${allIdentical ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log(`   ⚠️ Cache test failed: ${error.message}`);
    }
    
    console.log('\n7️⃣ SPECIFIC PRIME PICKS DEEP DIVE...');
    
    // Focus on Prime Picks since that's the main issue
    const primePicksDb = db.prepare(`
      SELECT * FROM banners 
      WHERE page = 'prime-picks' 
      ORDER BY isActive DESC, updated_at DESC
    `).all();
    
    console.log(`   📊 Prime Picks in database: ${primePicksDb.length} total`);
    primePicksDb.forEach((banner, index) => {
      console.log(`      ${index + 1}. ID: ${banner.id} | Active: ${banner.isActive} | Title: "${banner.title}"`);
      console.log(`         Created: ${banner.created_at} | Updated: ${banner.updated_at}`);
      console.log(`         Image: ${banner.imageUrl ? banner.imageUrl.substring(0, 60) + '...' : 'None'}`);
      console.log(`         Icon: ${banner.icon || 'None'} (${banner.iconType || 'none'}, ${banner.iconPosition || 'left'})`);
    });
    
    // Test Prime Picks API specifically
    try {
      const primeResponse = await fetch('http://localhost:5000/api/banners/prime-picks');
      const primeData = await primeResponse.json();
      
      console.log(`\n   🌐 Prime Picks API Response:`);
      console.log(`      Status: ${primeResponse.status}`);
      console.log(`      Success: ${primeData.success}`);
      console.log(`      Banners count: ${primeData.banners ? primeData.banners.length : 0}`);
      
      if (primeData.banners && primeData.banners.length > 0) {
        primeData.banners.forEach((banner, index) => {
          console.log(`         ${index + 1}. API Banner: ID ${banner.id}, "${banner.title}", Active: ${banner.isActive}`);
        });
      }
      
      // Compare DB vs API
      const activeDbBanners = primePicksDb.filter(b => b.isActive);
      const apiBanners = primeData.banners || [];
      
      console.log(`\n   🔍 DB vs API Comparison:`);
      console.log(`      DB Active: ${activeDbBanners.length}`);
      console.log(`      API Returned: ${apiBanners.length}`);
      
      if (activeDbBanners.length !== apiBanners.length) {
        console.log(`      ⚠️ MISMATCH DETECTED!`);
        console.log(`         DB Active Banners:`);
        activeDbBanners.forEach(b => console.log(`            ID ${b.id}: "${b.title}" (isActive: ${b.isActive})`));
        console.log(`         API Banners:`);
        apiBanners.forEach(b => console.log(`            ID ${b.id}: "${b.title}" (isActive: ${b.isActive})`));
      }
      
    } catch (error) {
      console.log(`   ❌ Prime Picks API test failed: ${error.message}`);
    }
    
    db.close();
    
    console.log('\n✅ COMPREHENSIVE DIAGNOSTIC COMPLETE!');
    
    console.log('\n🎯 SUMMARY OF FINDINGS:');
    console.log(`   📊 Total banners: ${allBanners.length}`);
    console.log(`   📄 Pages with banners: ${Object.keys(bannersByPage).length}`);
    console.log(`   🔄 Recent changes: ${recentChanges.length} in last hour`);
    
    console.log('\n🔍 POTENTIAL ISSUES TO CHECK:');
    console.log('   1. Field case sensitivity (isActive vs "isActive")');
    console.log('   2. Data type mismatches (boolean vs integer)');
    console.log('   3. Page name case sensitivity');
    console.log('   4. Cache invalidation timing');
    console.log('   5. Database query execution order');
    console.log('   6. API response transformation');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('   1. Clear browser cache completely (Ctrl+F5)');
    console.log('   2. Check network tab for actual API responses');
    console.log('   3. Verify React Query cache in DevTools');
    console.log('   4. Test in incognito mode');
    console.log('   5. Check for JavaScript errors in console');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    console.error(error.stack);
  }
}

// Run the comprehensive diagnostic
comprehensiveDiagnostic();