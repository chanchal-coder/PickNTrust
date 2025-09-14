/**
 * Comprehensive Bot Verification System
 * Check credentials, database schemas, case sensitivity, and missing columns
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class BotVerificationSystem {
  constructor() {
    this.db = new Database(DB_PATH);
    
    // Bot configurations from user input
    this.botConfigs = {
      'prime-picks': {
        token: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
        username: '@pntamazon_bot',
        channelId: '-1002955338551',
        channelName: 'pntamazon',
        affiliateTag: '{{URL}}{{SEP}}tag=pickntrust03-21',
        platform: 'amazon',
        table: 'amazon_products',
        envFile: '.env.prime-picks'
      },
      'cue-picks': {
        token: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
        username: 'cuelinkspnt_bot',
        channelId: '-1002982344997',
        channelName: 'Cuelinks PNT',
        affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D',
        platform: 'cuelinks',
        table: 'cuelinks_products',
        envFile: '.env.cue-picks'
      },
      'value-picks': {
        token: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
        username: 'earnkaropnt_bot',
        channelId: '-1003017626269',
        channelName: 'Value Picks EK',
        affiliateTag: 'https://ekaro.in/enkr2020/?url=%7B%7BURL_ENC%7D%7D&ref=4530348',
        platform: 'earnkaro',
        table: 'value_picks_products',
        envFile: '.env.value-picks'
      },
      'click-picks': {
        token: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
        username: 'clickpicks_bot',
        channelId: '-1002981205504',
        channelName: 'Click Picks',
        affiliateTag: 'multiple',
        platform: 'multiple',
        table: 'click_picks_products',
        envFile: '.env.click-picks'
      },
      'global-picks': {
        token: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
        username: 'globalpnt_bot',
        channelId: '-1002902496654',
        channelName: 'Global Picks',
        affiliateTag: 'multiple',
        platform: 'multiple',
        table: 'global_picks_products',
        envFile: '.env.global-picks'
      },
      'travel-picks': {
        token: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
        username: 'travelpicks_bot',
        channelId: '-1003047967930',
        channelName: 'Travel Picks',
        affiliateTag: 'multiple',
        platform: 'multiple',
        table: 'travel_products',
        envFile: '.env.travel-picks'
      },
      'deals-hub': {
        token: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
        username: 'dealshubpnt_bot',
        channelId: '-1003029983162',
        channelName: 'Dealshub PNT',
        affiliateTag: 'id=sha678089037',
        platform: 'inrdeals',
        table: 'deals_hub_products',
        envFile: '.env.deals-hub'
      },
      'lootbox': {
        token: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
        username: 'deodappnt_bot',
        channelId: '-1002991047787',
        channelName: 'Deodap pnt',
        affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
        platform: 'deodap',
        table: 'lootbox_products',
        envFile: '.env.lootbox'
      }
    };
  }

  /**
   * Check environment files and credentials
   */
  checkCredentials() {
    console.log('🔐 Checking Bot Credentials and Environment Files...');
    console.log('=' .repeat(70));
    
    const results = {};
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nMobile ${botName.toUpperCase()}:`);
      
      const envPath = path.join(__dirname, config.envFile);
      const envExists = fs.existsSync(envPath);
      
      console.log(`   📄 Env File: ${config.envFile} ${envExists ? 'Success' : 'Error'}`);
      console.log(`   AI Token: ${config.token.substring(0, 10)}...`);
      console.log(`   👤 Username: ${config.username}`);
      console.log(`   📢 Channel ID: ${config.channelId}`);
      console.log(`   🏷️ Channel Name: ${config.channelName}`);
      console.log(`   Link Affiliate Tag: ${config.affiliateTag.substring(0, 50)}${config.affiliateTag.length > 50 ? '...' : ''}`);
      console.log(`   Global Platform: ${config.platform}`);
      console.log(`   🗄️ Table: ${config.table}`);
      
      if (envExists) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const hasToken = envContent.includes(config.token.split(':')[0]);
          const hasChannelId = envContent.includes(config.channelId);
          
          console.log(`   Success Token in env: ${hasToken ? 'Yes' : 'No'}`);
          console.log(`   Success Channel ID in env: ${hasChannelId ? 'Yes' : 'No'}`);
          
          results[botName] = {
            envExists: true,
            tokenMatch: hasToken,
            channelMatch: hasChannelId,
            status: hasToken && hasChannelId ? 'OK' : 'MISMATCH'
          };
        } catch (error) {
          console.log(`   Error Error reading env file: ${error.message}`);
          results[botName] = { envExists: true, error: error.message, status: 'ERROR' };
        }
      } else {
        results[botName] = { envExists: false, status: 'MISSING' };
      }
    });
    
    return results;
  }

  /**
   * Check database table schemas
   */
  checkDatabaseSchemas() {
    console.log('\n🗄️ Checking Database Table Schemas...');
    console.log('=' .repeat(60));
    
    const schemaResults = {};
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nStats ${botName.toUpperCase()} - Table: ${config.table}`);
      
      try {
        // Check if table exists
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(config.table);
        
        if (tableExists) {
          // Get table schema
          const schema = this.db.prepare(`PRAGMA table_info(${config.table})`).all();
          
          console.log(`   Success Table exists with ${schema.length} columns`);
          
          // Check for essential columns
          const essentialColumns = [
            'id', 'name', 'description', 'price', 'original_price',
            'image_url', 'affiliate_url', 'category', 'processing_status',
            'created_at', 'telegram_message_id', 'telegram_channel_id'
          ];
          
          const existingColumns = schema.map(col => col.name.toLowerCase());
          const missingColumns = essentialColumns.filter(col => 
            !existingColumns.includes(col.toLowerCase())
          );
          
          console.log(`   📋 Essential columns missing: ${missingColumns.length}`);
          if (missingColumns.length > 0) {
            console.log(`      Missing: ${missingColumns.join(', ')}`);
          }
          
          // Check data count
          const totalCount = this.db.prepare(`SELECT COUNT(*) as count FROM ${config.table}`).get().count;
          let activeCount = 0;
          
          try {
            activeCount = this.db.prepare(`
              SELECT COUNT(*) as count FROM ${config.table} 
              WHERE processing_status = 'active'
            `).get().count;
          } catch (e) {
            console.log(`   Warning No processing_status column`);
          }
          
          console.log(`   Stats Data: ${totalCount} total, ${activeCount} active`);
          
          schemaResults[botName] = {
            exists: true,
            columns: schema.length,
            missingColumns,
            totalRecords: totalCount,
            activeRecords: activeCount,
            status: missingColumns.length === 0 ? 'OK' : 'MISSING_COLUMNS'
          };
          
        } else {
          console.log(`   Error Table does not exist`);
          schemaResults[botName] = {
            exists: false,
            status: 'MISSING_TABLE'
          };
        }
        
      } catch (error) {
        console.log(`   Error Schema check error: ${error.message}`);
        schemaResults[botName] = {
          exists: false,
          error: error.message,
          status: 'ERROR'
        };
      }
    });
    
    return schemaResults;
  }

  /**
   * Check case sensitivity issues
   */
  checkCaseSensitivity() {
    console.log('\n🔤 Checking Case Sensitivity Issues...');
    console.log('=' .repeat(50));
    
    const caseResults = {};
    
    // Check table names case sensitivity
    const allTables = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all().map(t => t.name);
    
    console.log(`\n📋 All database tables (${allTables.length}):`);
    allTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nSearch ${botName.toUpperCase()}:`);
      
      const expectedTable = config.table;
      const exactMatch = allTables.includes(expectedTable);
      const caseVariants = allTables.filter(table => 
        table.toLowerCase() === expectedTable.toLowerCase() && table !== expectedTable
      );
      
      console.log(`   Expected: ${expectedTable}`);
      console.log(`   Exact match: ${exactMatch ? 'Success' : 'Error'}`);
      
      if (caseVariants.length > 0) {
        console.log(`   Case variants found: ${caseVariants.join(', ')}`);
      }
      
      caseResults[botName] = {
        expectedTable,
        exactMatch,
        caseVariants,
        status: exactMatch ? 'OK' : (caseVariants.length > 0 ? 'CASE_MISMATCH' : 'NOT_FOUND')
      };
    });
    
    return caseResults;
  }

  /**
   * Check for missing columns in existing tables
   */
  checkMissingColumns() {
    console.log('\nStats Detailed Missing Columns Analysis...');
    console.log('=' .repeat(60));
    
    const columnResults = {};
    
    // Standard column definitions for each bot type
    const standardColumns = {
      'amazon_products': [
        'id', 'name', 'description', 'price', 'original_price', 'currency',
        'image_url', 'affiliate_url', 'category', 'rating', 'review_count',
        'discount', 'is_featured', 'created_at', 'expires_at', 'content_type'
      ],
      'cuelinks_products': [
        'id', 'name', 'description', 'price', 'original_price', 'currency',
        'image_url', 'affiliate_url', 'cuelinks_url', 'original_url',
        'category', 'rating', 'review_count', 'discount', 'is_featured',
        'processing_status', 'created_at', 'expires_at', 'telegram_message_id',
        'telegram_channel_id', 'click_count', 'conversion_count'
      ],
      'default': [
        'id', 'name', 'description', 'price', 'original_price', 'currency',
        'image_url', 'affiliate_url', 'original_url', 'category', 'rating',
        'review_count', 'discount', 'is_featured', 'processing_status',
        'created_at', 'telegram_message_id', 'telegram_channel_id'
      ]
    };
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nSearch ${botName.toUpperCase()} - ${config.table}:`);
      
      try {
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(config.table);
        
        if (tableExists) {
          const schema = this.db.prepare(`PRAGMA table_info(${config.table})`).all();
          const existingColumns = schema.map(col => col.name);
          
          const expectedColumns = standardColumns[config.table] || standardColumns.default;
          const missingColumns = expectedColumns.filter(col => 
            !existingColumns.includes(col)
          );
          const extraColumns = existingColumns.filter(col => 
            !expectedColumns.includes(col)
          );
          
          console.log(`   Stats Existing columns: ${existingColumns.length}`);
          console.log(`   📋 Expected columns: ${expectedColumns.length}`);
          console.log(`   Error Missing columns: ${missingColumns.length}`);
          console.log(`   ➕ Extra columns: ${extraColumns.length}`);
          
          if (missingColumns.length > 0) {
            console.log(`      Missing: ${missingColumns.join(', ')}`);
          }
          
          if (extraColumns.length > 0) {
            console.log(`      Extra: ${extraColumns.join(', ')}`);
          }
          
          columnResults[botName] = {
            table: config.table,
            existingColumns: existingColumns.length,
            expectedColumns: expectedColumns.length,
            missingColumns,
            extraColumns,
            status: missingColumns.length === 0 ? 'OK' : 'MISSING_COLUMNS'
          };
          
        } else {
          console.log(`   Error Table does not exist`);
          columnResults[botName] = {
            table: config.table,
            status: 'TABLE_NOT_FOUND'
          };
        }
        
      } catch (error) {
        console.log(`   Error Error: ${error.message}`);
        columnResults[botName] = {
          table: config.table,
          error: error.message,
          status: 'ERROR'
        };
      }
    });
    
    return columnResults;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(credentialResults, schemaResults, caseResults, columnResults) {
    console.log('\n📋 COMPREHENSIVE VERIFICATION REPORT');
    console.log('=' .repeat(70));
    
    let totalBots = Object.keys(this.botConfigs).length;
    let workingBots = 0;
    let issuesFound = [];
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nAI ${botName.toUpperCase()}:`);
      
      const cred = credentialResults[botName] || {};
      const schema = schemaResults[botName] || {};
      const caseCheck = caseResults[botName] || {};
      const columns = columnResults[botName] || {};
      
      console.log(`   📄 Credentials: ${cred.status || 'UNKNOWN'}`);
      console.log(`   🗄️ Table Schema: ${schema.status || 'UNKNOWN'}`);
      console.log(`   🔤 Case Sensitivity: ${caseCheck.status || 'UNKNOWN'}`);
      console.log(`   Stats Columns: ${columns.status || 'UNKNOWN'}`);
      
      const isWorking = (
        cred.status === 'OK' &&
        schema.status === 'OK' &&
        caseCheck.status === 'OK' &&
        columns.status === 'OK'
      );
      
      if (isWorking) {
        workingBots++;
        console.log(`   Success Status: FULLY WORKING`);
      } else {
        console.log(`   Warning Status: HAS ISSUES`);
        
        // Collect specific issues
        if (cred.status !== 'OK') issuesFound.push(`${botName}: Credential issues`);
        if (schema.status !== 'OK') issuesFound.push(`${botName}: Schema issues`);
        if (caseCheck.status !== 'OK') issuesFound.push(`${botName}: Case sensitivity issues`);
        if (columns.status !== 'OK') issuesFound.push(`${botName}: Missing columns`);
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`   AI Total Bots: ${totalBots}`);
    console.log(`   Success Fully Working: ${workingBots}`);
    console.log(`   Warning With Issues: ${totalBots - workingBots}`);
    console.log(`   Stats Success Rate: ${((workingBots / totalBots) * 100).toFixed(1)}%`);
    
    if (issuesFound.length > 0) {
      console.log('\n🔧 ISSUES TO FIX:');
      issuesFound.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\nTip RECOMMENDATIONS:');
    if (workingBots === totalBots) {
      console.log('   Celebration All bots are properly configured!');
      console.log('   Success Check Telegram bot connectivity and channel permissions');
    } else {
      console.log('   🔧 Fix the issues listed above');
      console.log('   📄 Verify environment files have correct credentials');
      console.log('   🗄️ Ensure database tables have all required columns');
      console.log('   🔤 Check table name case sensitivity');
    }
  }

  /**
   * Run comprehensive verification
   */
  runComprehensiveVerification() {
    console.log('Launch Comprehensive Bot Verification System');
    console.log('=' .repeat(80));
    console.log(`Stats Checking ${Object.keys(this.botConfigs).length} bots...`);
    
    const credentialResults = this.checkCredentials();
    const schemaResults = this.checkDatabaseSchemas();
    const caseResults = this.checkCaseSensitivity();
    const columnResults = this.checkMissingColumns();
    
    this.generateReport(credentialResults, schemaResults, caseResults, columnResults);
    
    console.log('\nTarget VERIFICATION COMPLETE!');
    
    return {
      credentials: credentialResults,
      schemas: schemaResults,
      caseSensitivity: caseResults,
      columns: columnResults
    };
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run comprehensive verification
async function runVerification() {
  const verifier = new BotVerificationSystem();
  
  try {
    const results = verifier.runComprehensiveVerification();
    return results;
  } catch (error) {
    console.error('Error Verification failed:', error.message);
    return null;
  } finally {
    verifier.cleanup();
  }
}

if (require.main === module) {
  runVerification();
}

module.exports = { BotVerificationSystem, runVerification };