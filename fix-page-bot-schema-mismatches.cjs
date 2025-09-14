/**
 * Fix Page-Bot Table Schema Mismatches
 * Comprehensive solution for SQLite case sensitivity and schema issues
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class PageBotSchemaMismatchFixer {
  constructor() {
    this.db = new Database('./database.sqlite');
    this.issues = [];
    this.fixes = [];
    
    // Page to table mapping
    this.pageTableMapping = {
      'prime-picks': 'amazon_products',
      'cue-picks': 'cuelinks_products',
      'value-picks': 'value_picks_products',
      'travel-picks': 'travel_products',
      'click-picks': 'click_picks_products',
      'global-picks': 'global_picks_products',
      'deals-hub': 'deals_hub_products',
      'loot-box': 'lootbox_products'
    };
  }

  /**
   * Get actual table schema from SQLite
   */
  getTableSchema(tableName) {
    try {
      const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return schema.map(col => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        dflt_value: col.dflt_value,
        pk: col.pk
      }));
    } catch (error) {
      console.log(`❌ Error getting schema for ${tableName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check API routes for case sensitivity issues
   */
  checkAPIRoutes() {
    console.log('🔍 CHECKING API ROUTES FOR CASE SENSITIVITY ISSUES');
    console.log('='.repeat(60));
    
    const routesPath = path.join(__dirname, 'server/routes.ts');
    
    if (!fs.existsSync(routesPath)) {
      console.log('❌ Routes file not found');
      return;
    }
    
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // Check for common case sensitivity issues
    const caseIssues = [
      { pattern: /SELECT \* FROM (\w+)/gi, issue: 'Unqualified SELECT statements' },
      { pattern: /INSERT INTO (\w+) \(/gi, issue: 'INSERT statements' },
      { pattern: /UPDATE (\w+) SET/gi, issue: 'UPDATE statements' },
      { pattern: /\.([A-Z]\w*)/g, issue: 'CamelCase column references' },
      { pattern: /ORDER BY ([A-Z]\w*)/gi, issue: 'CamelCase in ORDER BY' },
      { pattern: /WHERE ([A-Z]\w*)/gi, issue: 'CamelCase in WHERE clauses' }
    ];
    
    for (const { pattern, issue } of caseIssues) {
      const matches = routesContent.match(pattern);
      if (matches) {
        console.log(`\n⚠️  Found ${issue}:`);
        matches.slice(0, 5).forEach(match => {
          console.log(`   - ${match}`);
        });
        this.issues.push(`${issue}: ${matches.length} occurrences`);
      }
    }
  }

  /**
   * Check each page-table mapping for schema consistency
   */
  checkPageTableConsistency() {
    console.log('\n📊 CHECKING PAGE-TABLE SCHEMA CONSISTENCY');
    console.log('='.repeat(60));
    
    // Standard columns that should exist in all bot tables
    const standardColumns = [
      { name: 'id', type: 'INTEGER', required: true },
      { name: 'name', type: 'TEXT', required: true },
      { name: 'description', type: 'TEXT', required: false },
      { name: 'price', type: 'TEXT', required: false },
      { name: 'currency', type: 'TEXT', required: false },
      { name: 'image_url', type: 'TEXT', required: false },
      { name: 'affiliate_url', type: 'TEXT', required: false },
      { name: 'category', type: 'TEXT', required: false },
      { name: 'created_at', type: 'INTEGER', required: false },
      { name: 'source', type: 'TEXT', required: false }
    ];
    
    for (const [page, tableName] of Object.entries(this.pageTableMapping)) {
      console.log(`\n📋 Checking ${page} → ${tableName}:`);
      
      const schema = this.getTableSchema(tableName);
      
      if (schema.length === 0) {
        console.log(`   ❌ Table ${tableName} does not exist or is empty`);
        this.issues.push(`Missing table: ${tableName}`);
        continue;
      }
      
      console.log(`   📊 Total columns: ${schema.length}`);
      
      // Check for standard columns
      const existingColumns = schema.map(col => col.name.toLowerCase());
      const missingStandardColumns = standardColumns
        .filter(stdCol => stdCol.required && !existingColumns.includes(stdCol.name.toLowerCase()))
        .map(col => col.name);
      
      if (missingStandardColumns.length > 0) {
        console.log(`   ❌ Missing required columns: ${missingStandardColumns.join(', ')}`);
        this.issues.push(`${tableName}: Missing columns ${missingStandardColumns.join(', ')}`);
      } else {
        console.log(`   ✅ All required columns present`);
      }
      
      // Check for case sensitivity issues in column names
      const caseIssues = schema.filter(col => {
        const hasUpperCase = /[A-Z]/.test(col.name);
        const hasUnderscore = col.name.includes('_');
        return hasUpperCase && !hasUnderscore; // CamelCase without underscores
      });
      
      if (caseIssues.length > 0) {
        console.log(`   ⚠️  Potential case issues: ${caseIssues.map(col => col.name).join(', ')}`);
        this.issues.push(`${tableName}: Case sensitivity issues in columns`);
      }
    }
  }

  /**
   * Test actual API endpoints for each page
   */
  async testAPIEndpoints() {
    console.log('\n🧪 TESTING API ENDPOINTS FOR SCHEMA COMPATIBILITY');
    console.log('='.repeat(60));
    
    const axios = require('axios').default;
    const baseUrl = 'http://localhost:5000';
    
    for (const [page, tableName] of Object.entries(this.pageTableMapping)) {
      console.log(`\n🔍 Testing ${page} API:`);
      
      try {
        const response = await axios.get(`${baseUrl}/api/products/page/${page}`, {
          timeout: 5000
        });
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Products returned: ${Array.isArray(response.data) ? response.data.length : 'Invalid format'}`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          const sampleProduct = response.data[0];
          const productKeys = Object.keys(sampleProduct);
          console.log(`   🔑 Sample product keys: ${productKeys.slice(0, 5).join(', ')}${productKeys.length > 5 ? '...' : ''}`);
          
          // Check for common case issues in returned data
          const caseIssueKeys = productKeys.filter(key => /[A-Z]/.test(key) && !key.includes('_'));
          if (caseIssueKeys.length > 0) {
            console.log(`   ⚠️  CamelCase keys in response: ${caseIssueKeys.join(', ')}`);
            this.issues.push(`${page} API: CamelCase keys in response`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ API Error: ${error.message}`);
        this.issues.push(`${page} API: ${error.message}`);
      }
    }
  }

  /**
   * Generate SQL fixes for schema issues
   */
  generateSchemaFixes() {
    console.log('\n🔧 GENERATING SCHEMA FIXES');
    console.log('='.repeat(60));
    
    const sqlFixes = [];
    
    // Standard columns to ensure exist in all tables
    const ensureColumns = [
      { name: 'source', type: 'TEXT', defaultValue: "'telegram'" },
      { name: 'processing_status', type: 'TEXT', defaultValue: "'active'" },
      { name: 'affiliate_network', type: 'TEXT', defaultValue: "'general'" },
      { name: 'content_type', type: 'TEXT', defaultValue: "'product'" },
      { name: 'expires_at', type: 'INTEGER', defaultValue: 'NULL' }
    ];
    
    for (const [page, tableName] of Object.entries(this.pageTableMapping)) {
      console.log(`\n🔧 Generating fixes for ${tableName}:`);
      
      const schema = this.getTableSchema(tableName);
      if (schema.length === 0) continue;
      
      const existingColumns = schema.map(col => col.name.toLowerCase());
      
      for (const column of ensureColumns) {
        if (!existingColumns.includes(column.name.toLowerCase())) {
          const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue};`;
          sqlFixes.push(alterSQL);
          console.log(`   📝 Add column: ${column.name}`);
        }
      }
    }
    
    // Write fixes to file
    if (sqlFixes.length > 0) {
      const fixesContent = [
        '-- Schema Fixes for Page-Bot Table Mismatches',
        '-- Generated automatically to resolve SQLite case sensitivity issues',
        '',
        ...sqlFixes,
        '',
        '-- End of schema fixes'
      ].join('\n');
      
      fs.writeFileSync('./schema-fixes.sql', fixesContent, 'utf8');
      console.log(`\n✅ Generated ${sqlFixes.length} SQL fixes in schema-fixes.sql`);
      this.fixes = sqlFixes;
    } else {
      console.log('\n✅ No schema fixes needed');
    }
  }

  /**
   * Apply schema fixes to database
   */
  applySchemaFixes() {
    if (this.fixes.length === 0) {
      console.log('\n✅ No fixes to apply');
      return;
    }
    
    console.log('\n🔧 APPLYING SCHEMA FIXES TO DATABASE');
    console.log('='.repeat(60));
    
    let appliedFixes = 0;
    
    for (const fix of this.fixes) {
      try {
        console.log(`\n📝 Executing: ${fix.substring(0, 60)}...`);
        this.db.exec(fix);
        console.log('   ✅ Applied successfully');
        appliedFixes++;
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n🎊 Applied ${appliedFixes}/${this.fixes.length} schema fixes`);
  }

  /**
   * Fix API routes case sensitivity
   */
  fixAPIRoutes() {
    console.log('\n🔧 FIXING API ROUTES CASE SENSITIVITY');
    console.log('='.repeat(60));
    
    const routesPath = path.join(__dirname, 'server/routes.ts');
    
    if (!fs.existsSync(routesPath)) {
      console.log('❌ Routes file not found');
      return;
    }
    
    let routesContent = fs.readFileSync(routesPath, 'utf8');
    let fixesApplied = 0;
    
    // Fix common case sensitivity issues
    const fixes = [
      {
        pattern: /\.createdAt/g,
        replacement: '.created_at',
        description: 'Fix createdAt to created_at'
      },
      {
        pattern: /\.updatedAt/g,
        replacement: '.updated_at',
        description: 'Fix updatedAt to updated_at'
      },
      {
        pattern: /\.imageUrl/g,
        replacement: '.image_url',
        description: 'Fix imageUrl to image_url'
      },
      {
        pattern: /\.affiliateUrl/g,
        replacement: '.affiliate_url',
        description: 'Fix affiliateUrl to affiliate_url'
      },
      {
        pattern: /\.originalPrice/g,
        replacement: '.original_price',
        description: 'Fix originalPrice to original_price'
      },
      {
        pattern: /\.reviewCount/g,
        replacement: '.review_count',
        description: 'Fix reviewCount to review_count'
      },
      {
        pattern: /\.isFeatured/g,
        replacement: '.is_featured',
        description: 'Fix isFeatured to is_featured'
      },
      {
        pattern: /\.affiliateNetwork/g,
        replacement: '.affiliate_network',
        description: 'Fix affiliateNetwork to affiliate_network'
      },
      {
        pattern: /\.contentType/g,
        replacement: '.content_type',
        description: 'Fix contentType to content_type'
      },
      {
        pattern: /\.processingStatus/g,
        replacement: '.processing_status',
        description: 'Fix processingStatus to processing_status'
      },
      {
        pattern: /\.expiresAt/g,
        replacement: '.expires_at',
        description: 'Fix expiresAt to expires_at'
      }
    ];
    
    for (const fix of fixes) {
      const matches = routesContent.match(fix.pattern);
      if (matches) {
        console.log(`\n🔧 ${fix.description}: ${matches.length} occurrences`);
        routesContent = routesContent.replace(fix.pattern, fix.replacement);
        fixesApplied++;
      }
    }
    
    if (fixesApplied > 0) {
      // Create backup
      fs.writeFileSync(routesPath + '.backup', fs.readFileSync(routesPath, 'utf8'));
      
      // Apply fixes
      fs.writeFileSync(routesPath, routesContent, 'utf8');
      console.log(`\n✅ Applied ${fixesApplied} API route fixes`);
      console.log('📁 Backup created: routes.ts.backup');
    } else {
      console.log('\n✅ No API route fixes needed');
    }
  }

  /**
   * Generate comprehensive diagnosis report
   */
  generateDiagnosisReport() {
    console.log('\n📋 COMPREHENSIVE DIAGNOSIS REPORT');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('\n🎊 NO SCHEMA ISSUES FOUND!');
      console.log('✅ All page-bot table mappings are consistent');
      console.log('✅ No case sensitivity issues detected');
      console.log('✅ All API endpoints should work correctly');
    } else {
      console.log(`\n❌ FOUND ${this.issues.length} ISSUES:`);
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('   1. Always use snake_case for SQLite column names');
    console.log('   2. Ensure consistent schema across all bot tables');
    console.log('   3. Test API endpoints after schema changes');
    console.log('   4. Use column aliases in SELECT queries for consistency');
    console.log('   5. Restart server after applying schema fixes');
    
    console.log('\n📊 TABLE SUMMARY:');
    for (const [page, tableName] of Object.entries(this.pageTableMapping)) {
      const schema = this.getTableSchema(tableName);
      const status = schema.length > 0 ? '✅' : '❌';
      console.log(`   ${status} ${page.padEnd(15)} → ${tableName.padEnd(25)} (${schema.length} columns)`);
    }
  }

  /**
   * Run complete diagnosis and fixes
   */
  async runCompleteFix() {
    console.log('🔧 PAGE-BOT SCHEMA MISMATCH COMPREHENSIVE FIX');
    console.log('='.repeat(70));
    console.log('🎯 Fixing SQLite case sensitivity and schema issues');
    console.log('='.repeat(70));
    
    try {
      // Step 1: Check API routes
      this.checkAPIRoutes();
      
      // Step 2: Check page-table consistency
      this.checkPageTableConsistency();
      
      // Step 3: Test API endpoints
      await this.testAPIEndpoints();
      
      // Step 4: Generate schema fixes
      this.generateSchemaFixes();
      
      // Step 5: Apply schema fixes
      this.applySchemaFixes();
      
      // Step 6: Fix API routes
      this.fixAPIRoutes();
      
      // Step 7: Generate report
      this.generateDiagnosisReport();
      
      console.log('\n🎊 SCHEMA MISMATCH FIX COMPLETE!');
      console.log('🔄 RESTART THE SERVER to apply all changes');
      console.log('🧪 Test by posting URLs in Telegram channels');
      
    } catch (error) {
      console.error('❌ Fix process failed:', error.message);
    } finally {
      this.db.close();
    }
  }
}

// Run the complete fix
const fixer = new PageBotSchemaMismatchFixer();
fixer.runCompleteFix();