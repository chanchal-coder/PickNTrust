/**
 * Comprehensive Frontend-Backend Schema Analysis
 * Check database tables, schema consistency, and data flow issues
 */

const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 FRONTEND-BACKEND SCHEMA ANALYSIS');
console.log('='.repeat(70));
console.log('🎯 Goal: Identify schema mismatches and data flow issues');
console.log('📊 Checking: Tables, field mappings, data consistency');
console.log('='.repeat(70));

try {
  const db = new Database('./database.sqlite');
  
  // Define expected page-to-table mappings from routes.ts analysis
  const pageTableMapping = {
    'prime-picks': 'amazon_products',
    'cue-picks': 'cuelinks_products', 
    'value-picks': 'value_picks_products',
    'click-picks': 'click_picks_products',
    'global-picks': 'global_picks_products',
    'deals-hub': 'deals_hub_products',
    'loot-box': 'lootbox_products',
    'travel-picks': 'travel_products',
    'top-picks': 'featured_products'
  };
  
  // Critical fields expected by frontend (from ProductCard interfaces)
  const criticalFrontendFields = [
    'id', 'name', 'description', 'price', 'originalPrice', 'currency',
    'imageUrl', 'image_url', 'affiliateUrl', 'affiliate_url', 'category',
    'rating', 'reviewCount', 'review_count', 'discount', 'isNew', 'is_new',
    'isFeatured', 'is_featured', 'createdAt', 'created_at'
  ];
  
  // Field mapping from database to frontend (from routes.ts)
  const fieldMappings = {
    'original_price': 'originalPrice',
    'review_count': 'reviewCount', 
    'image_url': 'imageUrl',
    'affiliate_url': 'affiliateUrl',
    'telegram_message_id': 'telegramMessageId',
    'telegram_channel_id': 'telegramChannelId',
    'created_at': 'createdAt',
    'is_new': 'isNew',
    'is_featured': 'isFeatured',
    'is_service': 'isService',
    'has_timer': 'hasTimer',
    'timer_duration': 'timerDuration',
    'timer_start_time': 'timerStartTime'
  };

  console.log('\n📋 CHECKING PAGE-TABLE MAPPINGS');
  console.log('-'.repeat(50));
  
  let totalIssues = 0;
  let workingPages = [];
  let brokenPages = [];
  
  Object.entries(pageTableMapping).forEach(([page, tableName]) => {
    console.log(`\n📄 PAGE: /${page} → TABLE: ${tableName}`);
    console.log('   ' + '-'.repeat(45));
    
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (!tableExists) {
        console.log('   ❌ TABLE MISSING - This breaks the page!');
        console.log('   🔧 Frontend will show empty page');
        brokenPages.push({ page, issue: 'Table missing', table: tableName });
        totalIssues++;
        return;
      }
      
      console.log('   ✅ Table exists');
      
      // Get table schema
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnNames = schema.map(col => col.name);
      
      console.log(`   📋 Columns (${columnNames.length}):`, columnNames.slice(0, 8).join(', ') + (columnNames.length > 8 ? '...' : ''));
      
      // Count records
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   📦 Records: ${count.count}`);
      
      if (count.count === 0) {
        console.log('   ⚠️  NO DATA - Page will be empty');
        brokenPages.push({ page, issue: 'No data', table: tableName, count: 0 });
        totalIssues++;
      } else {
        console.log('   ✅ Has data');
        
        // Check for critical fields
        const missingCriticalFields = criticalFrontendFields.filter(field => {
          // Check both original and mapped field names
          const mappedField = Object.keys(fieldMappings).find(key => fieldMappings[key] === field);
          return !columnNames.includes(field) && !columnNames.includes(mappedField);
        });
        
        if (missingCriticalFields.length > 0) {
          console.log('   ❌ MISSING CRITICAL FIELDS:', missingCriticalFields.slice(0, 3).join(', '));
          brokenPages.push({ page, issue: 'Missing fields', fields: missingCriticalFields });
          totalIssues++;
        } else {
          console.log('   ✅ All critical fields present');
        }
        
        // Check for active/processing_status field
        if (columnNames.includes('processing_status')) {
          const activeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE processing_status = 'active'`).get();
          console.log(`   📊 Active records: ${activeCount.count}/${count.count}`);
          
          if (activeCount.count === 0) {
            console.log('   ⚠️  NO ACTIVE RECORDS - Page will be empty');
            brokenPages.push({ page, issue: 'No active records', table: tableName });
            totalIssues++;
          }
        }
        
        // Check for expires_at field and expired records
        if (columnNames.includes('expires_at')) {
          const currentTime = Math.floor(Date.now() / 1000);
          const nonExpiredCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE expires_at IS NULL OR expires_at > ?`).get(currentTime);
          console.log(`   ⏰ Non-expired records: ${nonExpiredCount.count}/${count.count}`);
          
          if (nonExpiredCount.count === 0) {
            console.log('   ⚠️  ALL RECORDS EXPIRED - Page will be empty');
            brokenPages.push({ page, issue: 'All records expired', table: tableName });
            totalIssues++;
          }
        }
        
        if (totalIssues === 0 || brokenPages.filter(bp => bp.page === page).length === 0) {
          workingPages.push({ page, table: tableName, count: count.count });
        }
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      brokenPages.push({ page, issue: 'Database error', error: error.message });
      totalIssues++;
    }
  });

  console.log('\n📊 CHECKING GENERAL PRODUCTS TABLE');
  console.log('-'.repeat(50));
  
  try {
    const productsCount = db.prepare(`SELECT COUNT(*) as count FROM products`).get();
    console.log(`📦 General products table: ${productsCount.count} records`);
    
    if (productsCount.count > 0) {
      // Check display_pages field
      const sampleProduct = db.prepare(`SELECT display_pages FROM products LIMIT 1`).get();
      console.log('📄 Sample display_pages:', sampleProduct?.display_pages);
      
      // Check products by page
      const pagesWithProducts = db.prepare(`
        SELECT display_pages, COUNT(*) as count 
        FROM products 
        WHERE display_pages IS NOT NULL 
        GROUP BY display_pages
      `).all();
      
      console.log('📊 Products by display_pages:');
      pagesWithProducts.forEach(row => {
        console.log(`   ${row.display_pages}: ${row.count} products`);
      });
    }
  } catch (error) {
    console.log('❌ Error checking products table:', error.message);
  }

  console.log('\n🔍 SCHEMA CONSISTENCY CHECK');
  console.log('-'.repeat(50));
  
  // Check field naming consistency across tables
  const allTables = Object.values(pageTableMapping);
  const fieldInconsistencies = [];
  
  allTables.forEach(tableName => {
    try {
      const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
      if (!tableExists) return;
      
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columns = schema.map(col => col.name);
      
      // Check for inconsistent field naming
      const hasImageUrl = columns.includes('image_url');
      const hasImageURL = columns.includes('imageUrl');
      const hasAffiliateUrl = columns.includes('affiliate_url');
      const hasAffiliateURL = columns.includes('affiliateUrl');
      
      if (!hasImageUrl && !hasImageURL) {
        fieldInconsistencies.push({ table: tableName, issue: 'Missing image URL field' });
      }
      if (!hasAffiliateUrl && !hasAffiliateURL) {
        fieldInconsistencies.push({ table: tableName, issue: 'Missing affiliate URL field' });
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${tableName}:`, error.message);
    }
  });

  console.log('\n📋 SUMMARY REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n✅ WORKING PAGES (${workingPages.length}):`);
  workingPages.forEach(page => {
    console.log(`   /${page.page} → ${page.table} (${page.count} records)`);
  });
  
  console.log(`\n❌ BROKEN PAGES (${brokenPages.length}):`);
  brokenPages.forEach(page => {
    console.log(`   /${page.page} → ${page.table || 'N/A'} - ${page.issue}`);
    if (page.fields) console.log(`      Missing: ${page.fields.slice(0, 3).join(', ')}`);
    if (page.error) console.log(`      Error: ${page.error}`);
  });
  
  if (fieldInconsistencies.length > 0) {
    console.log(`\n⚠️  FIELD INCONSISTENCIES (${fieldInconsistencies.length}):`);
    fieldInconsistencies.forEach(inc => {
      console.log(`   ${inc.table}: ${inc.issue}`);
    });
  }
  
  console.log(`\n🎯 TOTAL ISSUES FOUND: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 ALL CHECKS PASSED! Frontend-backend schema is consistent.');
  } else {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('   1. Create missing tables for broken pages');
    console.log('   2. Add missing critical fields to existing tables');
    console.log('   3. Populate empty tables with test data');
    console.log('   4. Fix field naming inconsistencies');
    console.log('   5. Check bot posting logic for empty tables');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ CRITICAL ERROR:', error);
  console.error('Stack:', error.stack);
}