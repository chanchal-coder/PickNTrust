/**
 * Diagnose Table Schema and API Case Mismatches in SQLite
 * Check for inconsistencies between database column names and API usage
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class SchemaCaseMismatchDiagnoser {
  constructor() {
    this.db = new Database('./database.sqlite');
    this.issues = [];
    this.botTables = [
      'amazon_products',
      'cuelinks_products', 
      'value_picks_products',
      'travel_products',
      'click_picks_products',
      'global_picks_products',
      'deals_hub_products',
      'lootbox_products'
    ];
  }

  /**
   * Get table schema information
   */
  getTableSchema(tableName) {
    try {
      const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return schema.map(col => ({
        name: col.name,
        type: col.type,
        notNull: col.notnull,
        defaultValue: col.dflt_value,
        primaryKey: col.pk
      }));
    } catch (error) {
      console.log(`❌ Error getting schema for ${tableName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check for common case mismatches in bot tables
   */
  checkBotTableCaseMismatches() {
    console.log('🔍 CHECKING BOT TABLE SCHEMA CASE MISMATCHES');
    console.log('='.repeat(60));
    
    const expectedColumns = {
      // Common columns that should exist in bot tables
      core: ['id', 'name', 'description', 'price', 'currency'],
      optional: ['original_price', 'image_url', 'affiliate_url', 'category', 'rating', 'review_count'],
      metadata: ['created_at', 'updated_at', 'processing_status', 'source', 'affiliate_network']
    };

    for (const tableName of this.botTables) {
      console.log(`\n📋 Analyzing ${tableName}:`);
      
      const schema = this.getTableSchema(tableName);
      if (schema.length === 0) {
        console.log(`   ❌ Table ${tableName} not found or inaccessible`);
        this.issues.push({
          table: tableName,
          type: 'missing_table',
          description: 'Table does not exist or is inaccessible'
        });
        continue;
      }

      const columnNames = schema.map(col => col.name.toLowerCase());
      console.log(`   ✅ Found ${schema.length} columns`);
      
      // Check for case variations of expected columns
      const allExpected = [...expectedColumns.core, ...expectedColumns.optional, ...expectedColumns.metadata];
      
      for (const expectedCol of allExpected) {
        const variations = [
          expectedCol,
          expectedCol.replace(/_/g, ''), // Remove underscores
          expectedCol.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(''), // camelCase
          expectedCol.toUpperCase() // UPPERCASE
        ];
        
        const foundVariations = variations.filter(variation => 
          schema.some(col => col.name.toLowerCase() === variation.toLowerCase())
        );
        
        if (foundVariations.length > 1) {
          console.log(`   ⚠️  Multiple case variations found for '${expectedCol}': ${foundVariations.join(', ')}`);
          this.issues.push({
            table: tableName,
            type: 'case_mismatch',
            column: expectedCol,
            variations: foundVariations,
            description: `Multiple case variations of column '${expectedCol}' found`
          });
        }
      }
      
      // Display actual schema
      console.log(`   📊 Actual columns:`);
      schema.forEach(col => {
        console.log(`      - ${col.name} (${col.type})${col.primaryKey ? ' [PK]' : ''}${col.notNull ? ' [NOT NULL]' : ''}`);
      });
    }
  }

  /**
   * Check API routes for case mismatches
   */
  checkAPIRouteCaseMismatches() {
    console.log('\n🔍 CHECKING API ROUTE CASE MISMATCHES');
    console.log('='.repeat(60));
    
    const routesFile = path.join(__dirname, 'server', 'routes.ts');
    
    if (!fs.existsSync(routesFile)) {
      console.log('❌ routes.ts file not found');
      return;
    }
    
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    
    // Look for SQL queries and column references
    const sqlPatterns = [
      /SELECT\s+([^\s]+)\s+FROM/gi,
      /INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/gi,
      /UPDATE\s+\w+\s+SET\s+([^\s]+)/gi,
      /WHERE\s+(\w+)\s*=/gi
    ];
    
    console.log('📋 Scanning routes.ts for SQL column references...');
    
    sqlPatterns.forEach((pattern, index) => {
      const matches = [...routesContent.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`\n   Pattern ${index + 1}: Found ${matches.length} matches`);
        matches.slice(0, 5).forEach((match, i) => {
          console.log(`      ${i + 1}. ${match[0].substring(0, 100)}...`);
        });
      }
    });
    
    // Check for specific problematic patterns
    const problematicPatterns = [
      { pattern: /originalPrice/g, issue: 'camelCase in SQL (should be original_price)' },
      { pattern: /imageUrl/g, issue: 'camelCase in SQL (should be image_url)' },
      { pattern: /affiliateUrl/g, issue: 'camelCase in SQL (should be affiliate_url)' },
      { pattern: /reviewCount/g, issue: 'camelCase in SQL (should be review_count)' },
      { pattern: /createdAt/g, issue: 'camelCase in SQL (should be created_at)' },
      { pattern: /updatedAt/g, issue: 'camelCase in SQL (should be updated_at)' }
    ];
    
    console.log('\n⚠️  Checking for common case mismatch patterns:');
    
    problematicPatterns.forEach(({ pattern, issue }) => {
      const matches = [...routesContent.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`   ❌ Found ${matches.length} instances of ${issue}`);
        this.issues.push({
          type: 'api_case_mismatch',
          pattern: pattern.source,
          issue: issue,
          count: matches.length
        });
      }
    });
  }

  /**
   * Check for inconsistencies between admin product creation and bot tables
   */
  checkAdminBotConsistency() {
    console.log('\n🔍 CHECKING ADMIN-BOT TABLE CONSISTENCY');
    console.log('='.repeat(60));
    
    // Get the admin product creation data structure
    const routesFile = path.join(__dirname, 'server', 'routes.ts');
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    
    // Look for the admin product creation endpoint
    const adminEndpointMatch = routesContent.match(/app\.post\('\/api\/admin\/products'[\s\S]*?botProductData\s*=\s*\{([\s\S]*?)\};/m);
    
    if (adminEndpointMatch) {
      console.log('✅ Found admin product creation endpoint');
      const botProductDataStructure = adminEndpointMatch[1];
      
      // Extract field names from the structure
      const fieldMatches = [...botProductDataStructure.matchAll(/(\w+):/g)];
      const adminFields = fieldMatches.map(match => match[1]);
      
      console.log('📊 Admin product data fields:');
      adminFields.forEach(field => {
        console.log(`   - ${field}`);
      });
      
      // Check against each bot table schema
      for (const tableName of this.botTables) {
        const schema = this.getTableSchema(tableName);
        const tableColumns = schema.map(col => col.name);
        
        console.log(`\n🔍 Checking ${tableName} compatibility:`);
        
        const missingInTable = adminFields.filter(field => 
          !tableColumns.some(col => col.toLowerCase() === field.toLowerCase())
        );
        
        const extraInTable = tableColumns.filter(col => 
          !adminFields.some(field => field.toLowerCase() === col.toLowerCase()) &&
          !['id'].includes(col.toLowerCase()) // Exclude auto-generated fields
        );
        
        if (missingInTable.length > 0) {
          console.log(`   ❌ Fields in admin data but missing in ${tableName}: ${missingInTable.join(', ')}`);
          this.issues.push({
            table: tableName,
            type: 'missing_columns',
            fields: missingInTable,
            description: `Admin data contains fields not present in ${tableName}`
          });
        }
        
        if (extraInTable.length > 0) {
          console.log(`   ⚠️  Extra fields in ${tableName}: ${extraInTable.join(', ')}`);
        }
        
        if (missingInTable.length === 0 && extraInTable.length === 0) {
          console.log(`   ✅ ${tableName} is compatible with admin data structure`);
        }
      }
    } else {
      console.log('❌ Could not find admin product creation endpoint structure');
    }
  }

  /**
   * Generate fix recommendations
   */
  generateFixRecommendations() {
    console.log('\n🛠️  FIX RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('✅ No schema case mismatch issues found!');
      return;
    }
    
    console.log(`Found ${this.issues.length} issues to address:\n`);
    
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});
    
    Object.entries(groupedIssues).forEach(([type, issues]) => {
      console.log(`📋 ${type.toUpperCase().replace(/_/g, ' ')} (${issues.length} issues):`);
      
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.description}`);
        
        if (issue.table) {
          console.log(`      Table: ${issue.table}`);
        }
        
        if (issue.variations) {
          console.log(`      Variations: ${issue.variations.join(', ')}`);
        }
        
        if (issue.fields) {
          console.log(`      Fields: ${issue.fields.join(', ')}`);
        }
      });
      
      console.log('');
    });
    
    // Specific recommendations
    console.log('🎯 SPECIFIC RECOMMENDATIONS:');
    
    if (groupedIssues.case_mismatch) {
      console.log('\n1. CASE MISMATCH FIXES:');
      console.log('   - Standardize all column names to snake_case (e.g., original_price, image_url)');
      console.log('   - Update API queries to use consistent column names');
      console.log('   - Consider adding column aliases in SELECT statements');
    }
    
    if (groupedIssues.missing_columns) {
      console.log('\n2. MISSING COLUMN FIXES:');
      console.log('   - Add missing columns to bot tables using ALTER TABLE statements');
      console.log('   - Or remove unused fields from admin product data structure');
      console.log('   - Ensure all bot tables have consistent schema');
    }
    
    if (groupedIssues.api_case_mismatch) {
      console.log('\n3. API CASE MISMATCH FIXES:');
      console.log('   - Replace camelCase field names with snake_case in SQL queries');
      console.log('   - Use proper column aliases when returning data to frontend');
      console.log('   - Update admin product creation to use correct column names');
    }
  }

  /**
   * Run complete diagnosis
   */
  runDiagnosis() {
    console.log('🔍 SQLITE TABLE SCHEMA & API CASE MISMATCH DIAGNOSIS');
    console.log('='.repeat(70));
    console.log('🎯 Checking for inconsistencies between database schema and API usage');
    console.log('='.repeat(70));
    
    try {
      this.checkBotTableCaseMismatches();
      this.checkAPIRouteCaseMismatches();
      this.checkAdminBotConsistency();
      this.generateFixRecommendations();
      
      console.log('\n✅ DIAGNOSIS COMPLETE!');
      console.log(`📊 Total issues found: ${this.issues.length}`);
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error.message);
    } finally {
      this.db.close();
    }
  }
}

// Run the diagnosis
const diagnoser = new SchemaCaseMismatchDiagnoser();
diagnoser.runDiagnosis();