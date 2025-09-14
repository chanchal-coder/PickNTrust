/**
 * Check Database Tables and Data for Bot Pages
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class DatabaseChecker {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  checkTables() {
    console.log('Search Checking Database Tables...');
    console.log('=' .repeat(50));
    
    // Get all tables
    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    console.log(`Stats Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
    });
    
    return tables.map(t => t.name);
  }

  checkBotTables() {
    console.log('\nAI Checking Bot-Specific Tables...');
    console.log('=' .repeat(50));
    
    const botTables = [
      'amazon_products',
      'cuelinks_products', 
      'click_picks_products',
      'value_picks_products',
      'global_picks_products',
      'deals_hub_products',
      'lootbox_products'
    ];
    
    botTables.forEach(tableName => {
      try {
        // Check if table exists
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(tableName);
        
        if (tableExists) {
          // Get count
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
          
          // Get active count
          let activeCount = 0;
          try {
            activeCount = this.db.prepare(`
              SELECT COUNT(*) as count FROM ${tableName} 
              WHERE processing_status = 'active'
            `).get().count;
          } catch (e) {
            // processing_status column might not exist
          }
          
          console.log(`Products ${tableName}:`);
          console.log(`   Total: ${count} products`);
          console.log(`   Active: ${activeCount} products`);
          
          // Show sample data
          if (count > 0) {
            const sample = this.db.prepare(`
              SELECT name, processing_status, created_at 
              FROM ${tableName} 
              ORDER BY created_at DESC 
              LIMIT 2
            `).all();
            
            console.log(`   Sample products:`);
            sample.forEach((product, index) => {
              const timeAgo = product.created_at ? 
                Math.floor((Date.now() / 1000 - product.created_at) / 3600) : 'unknown';
              console.log(`     ${index + 1}. ${product.name} (${product.processing_status || 'no status'}, ${timeAgo}h ago)`);
            });
          }
          
        } else {
          console.log(`Error ${tableName}: Table does not exist`);
        }
        
      } catch (error) {
        console.log(`Error ${tableName}: Error - ${error.message}`);
      }
      
      console.log('');
    });
  }

  checkTableSchemas() {
    console.log('\n📋 Checking Table Schemas...');
    console.log('=' .repeat(50));
    
    const criticalTables = ['deals_hub_products', 'lootbox_products'];
    
    criticalTables.forEach(tableName => {
      try {
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(tableName);
        
        if (tableExists) {
          const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
          
          console.log(`\n🏗️ ${tableName} schema:`);
          schema.forEach(column => {
            console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
          });
        } else {
          console.log(`\nError ${tableName}: Table does not exist`);
        }
        
      } catch (error) {
        console.log(`\nError ${tableName}: Schema error - ${error.message}`);
      }
    });
  }

  testQueries() {
    console.log('\n🧪 Testing Database Queries...');
    console.log('=' .repeat(50));
    
    // Test the exact queries used in routes.ts
    const testQueries = [
      {
        name: 'Deals Hub Query',
        query: `
          SELECT 
            id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, affiliate_network, url_type, source_platform,
            primary_affiliate, data_quality_score, brand, availability,
            telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
            click_count as clickCount, conversion_count as conversionCount,
            processing_status, created_at as createdAt,
            deal_type, deal_priority, deal_badge, deal_urgency_level, deal_status,
            stock_status, price_drop_percentage, is_trending, engagement_score
          FROM deals_hub_products 
          WHERE processing_status = 'active'
          ORDER BY created_at DESC
        `
      },
      {
        name: 'Loot Box Query',
        query: `
          SELECT 
            id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, affiliate_network,
            telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
            click_count as clickCount, conversion_count as conversionCount,
            processing_status, expires_at as expiresAt, created_at as createdAt,
            has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
          FROM lootbox_products 
          WHERE processing_status = 'active' 
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `
      }
    ];
    
    testQueries.forEach(test => {
      console.log(`\nSearch Testing: ${test.name}`);
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        const params = test.query.includes('expires_at > ?') ? [currentTime] : [];
        
        const results = this.db.prepare(test.query).all(...params);
        console.log(`   Success Query executed successfully`);
        console.log(`   Stats Results: ${results.length} products`);
        
        if (results.length > 0) {
          console.log(`   📋 Sample result:`);
          const sample = results[0];
          console.log(`      Name: ${sample.name}`);
          console.log(`      Status: ${sample.processing_status}`);
          console.log(`      Created: ${sample.createdAt}`);
        }
        
      } catch (error) {
        console.log(`   Error Query failed: ${error.message}`);
      }
    });
  }

  runCompleteCheck() {
    console.log('Launch Complete Database Check for Bot Pages');
    console.log('=' .repeat(60));
    
    this.checkTables();
    this.checkBotTables();
    this.checkTableSchemas();
    this.testQueries();
    
    console.log('\n📋 SUMMARY');
    console.log('=' .repeat(30));
    console.log('Success Database check complete');
    console.log('Search Check the results above to identify issues');
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the complete check
async function runDatabaseCheck() {
  const checker = new DatabaseChecker();
  
  try {
    checker.runCompleteCheck();
  } catch (error) {
    console.error('Error Database check failed:', error.message);
  } finally {
    checker.cleanup();
  }
}

if (require.main === module) {
  runDatabaseCheck();
}

module.exports = { DatabaseChecker, runDatabaseCheck };