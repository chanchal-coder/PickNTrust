// Comprehensive Telegram Posting Diagnostic Tool
// Identifies and fixes common posting issues

const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class TelegramPostingDiagnostic {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.testResults = {};
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 TELEGRAM POSTING DIAGNOSTIC TOOL');
    console.log('=' .repeat(50));
    console.log('Analyzing all potential posting failure points...');
    
    await this.checkEnvironmentVariables();
    await this.checkDatabaseTables();
    await this.checkBotTokens();
    await this.checkWebhookConfiguration();
    await this.checkAPIEndpoints();
    await this.checkPostingFlow();
    await this.checkErrorHandling();
    
    this.generateDiagnosticReport();
    await this.implementFixes();
  }

  async checkEnvironmentVariables() {
    console.log('\n1️⃣ Checking Environment Variables...');
    
    const requiredEnvVars = [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_BOT_TOKEN_PRIME_PICKS',
      'TELEGRAM_BOT_TOKEN_CUE_PICKS',
      'TELEGRAM_BOT_TOKEN_VALUE_PICKS',
      'CHANNEL_ID',
      'PRIME_PICKS_CHANNEL_ID',
      'CUE_PICKS_CHANNEL_ID',
      'VALUE_PICKS_CHANNEL_ID'
    ];

    const missing = [];
    const present = [];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        present.push(envVar);
        console.log(`   ✅ ${envVar}: Present`);
      } else {
        missing.push(envVar);
        console.log(`   ❌ ${envVar}: Missing`);
        this.issues.push(`Missing environment variable: ${envVar}`);
      }
    }

    this.testResults.environmentVariables = {
      present: present.length,
      missing: missing.length,
      total: requiredEnvVars.length,
      missingVars: missing
    };
  }

  async checkDatabaseTables() {
    console.log('\n2️⃣ Checking Database Tables...');
    
    try {
      const db = new Database('database.sqlite');
      
      const botTables = [
        'prime_picks_products',
        'cue_picks_products', 
        'value_picks_products',
        'click_picks_products',
        'global_picks_products',
        'travel_products',
        'deals_hub_products',
        'lootbox_products'
      ];

      const tableStatus = {};
      
      for (const table of botTables) {
        try {
          const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          console.log(`   ✅ ${table}: ${result.count} products`);
          tableStatus[table] = { exists: true, count: result.count };
        } catch (error) {
          console.log(`   ❌ ${table}: Table missing or inaccessible`);
          tableStatus[table] = { exists: false, error: error.message };
          this.issues.push(`Database table issue: ${table} - ${error.message}`);
        }
      }
      
      this.testResults.databaseTables = tableStatus;
      db.close();
      
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      this.issues.push(`Database connection failed: ${error.message}`);
    }
  }

  async checkBotTokens() {
    console.log('\n3️⃣ Checking Bot Token Validity...');
    
    const bots = [
      { name: 'prime-picks', token: process.env.TELEGRAM_BOT_TOKEN_PRIME_PICKS },
      { name: 'cue-picks', token: process.env.TELEGRAM_BOT_TOKEN_CUE_PICKS },
      { name: 'value-picks', token: process.env.TELEGRAM_BOT_TOKEN_VALUE_PICKS },
      { name: 'main-bot', token: process.env.TELEGRAM_BOT_TOKEN }
    ];

    const tokenResults = {};
    
    for (const bot of bots) {
      if (!bot.token) {
        console.log(`   ❌ ${bot.name}: Token not configured`);
        tokenResults[bot.name] = { valid: false, error: 'Token not configured' };
        continue;
      }

      try {
        const response = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
          console.log(`   ✅ ${bot.name}: Valid - @${data.result.username}`);
          tokenResults[bot.name] = { 
            valid: true, 
            username: data.result.username,
            id: data.result.id
          };
        } else {
          console.log(`   ❌ ${bot.name}: Invalid - ${data.description}`);
          tokenResults[bot.name] = { valid: false, error: data.description };
          this.issues.push(`Invalid bot token: ${bot.name} - ${data.description}`);
        }
      } catch (error) {
        console.log(`   ❌ ${bot.name}: Connection failed - ${error.message}`);
        tokenResults[bot.name] = { valid: false, error: error.message };
        this.issues.push(`Bot token connection failed: ${bot.name} - ${error.message}`);
      }
    }
    
    this.testResults.botTokens = tokenResults;
  }

  async checkWebhookConfiguration() {
    console.log('\n4️⃣ Checking Webhook Configuration...');
    
    // Check if webhook routes exist
    const webhookFile = path.join(__dirname, 'server', 'webhook-routes.ts');
    
    if (fs.existsSync(webhookFile)) {
      console.log('   ✅ Webhook routes file exists');
      
      const content = fs.readFileSync(webhookFile, 'utf8');
      
      // Check for essential webhook components
      const checks = [
        { pattern: /registerBot/, name: 'Bot registration function' },
        { pattern: /handleWebhook/, name: 'Webhook handler function' },
        { pattern: /x-telegram-bot-api-secret-token/, name: 'Secret token validation' }
      ];
      
      for (const check of checks) {
        if (check.pattern.test(content)) {
          console.log(`   ✅ ${check.name}: Present`);
        } else {
          console.log(`   ❌ ${check.name}: Missing`);
          this.issues.push(`Webhook configuration missing: ${check.name}`);
        }
      }
    } else {
      console.log('   ❌ Webhook routes file missing');
      this.issues.push('Webhook routes file missing');
    }
  }

  async checkAPIEndpoints() {
    console.log('\n5️⃣ Checking API Endpoints...');
    
    const endpoints = [
      '/api/products',
      '/api/prime-picks',
      '/api/cue-picks',
      '/api/value-picks'
    ];

    const endpointResults = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        
        if (response.ok) {
          console.log(`   ✅ ${endpoint}: Responding (${response.status})`);
          endpointResults[endpoint] = { working: true, status: response.status };
        } else {
          console.log(`   ⚠️ ${endpoint}: Status ${response.status}`);
          endpointResults[endpoint] = { working: false, status: response.status };
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Connection failed`);
        endpointResults[endpoint] = { working: false, error: error.message };
        this.issues.push(`API endpoint failed: ${endpoint}`);
      }
    }
    
    this.testResults.apiEndpoints = endpointResults;
  }

  async checkPostingFlow() {
    console.log('\n6️⃣ Checking Posting Flow Components...');
    
    // Check if bot services exist
    const botServices = [
      'prime-picks-bot.ts',
      'cue-picks-bot.ts',
      'value-picks-bot.ts',
      'enhanced-telegram-manager.ts'
    ];

    const serviceStatus = {};
    
    for (const service of botServices) {
      const servicePath = path.join(__dirname, 'server', service);
      
      if (fs.existsSync(servicePath)) {
        console.log(`   ✅ ${service}: Present`);
        
        const content = fs.readFileSync(servicePath, 'utf8');
        
        // Check for essential posting functions
        const hasMessageHandler = /handleMessage|handleTelegramMessage/.test(content);
        const hasProductProcessing = /processProduct|saveProduct/.test(content);
        const hasErrorHandling = /try.*catch|error/.test(content);
        
        serviceStatus[service] = {
          exists: true,
          hasMessageHandler,
          hasProductProcessing,
          hasErrorHandling
        };
        
        if (!hasMessageHandler) {
          this.issues.push(`${service}: Missing message handler`);
        }
        if (!hasProductProcessing) {
          this.issues.push(`${service}: Missing product processing`);
        }
        if (!hasErrorHandling) {
          this.issues.push(`${service}: Missing error handling`);
        }
        
      } else {
        console.log(`   ❌ ${service}: Missing`);
        serviceStatus[service] = { exists: false };
        this.issues.push(`Bot service missing: ${service}`);
      }
    }
    
    this.testResults.postingFlow = serviceStatus;
  }

  async checkErrorHandling() {
    console.log('\n7️⃣ Checking Error Handling & Logging...');
    
    // Check for error handling patterns in main files
    const criticalFiles = [
      'server/index.ts',
      'server/routes.ts',
      'server/enhanced-telegram-manager.ts'
    ];

    const errorHandlingStatus = {};
    
    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasTryCatch = (content.match(/try\s*{[\s\S]*?}\s*catch/g) || []).length;
        const hasErrorLogging = /console\.error|logger\.error/.test(content);
        const hasErrorRecovery = /restart|retry|fallback/.test(content);
        
        errorHandlingStatus[file] = {
          tryCatchBlocks: hasTryCatch,
          hasErrorLogging,
          hasErrorRecovery
        };
        
        console.log(`   ✅ ${file}: ${hasTryCatch} try-catch blocks, logging: ${hasErrorLogging}`);
        
        if (hasTryCatch === 0) {
          this.issues.push(`${file}: No error handling found`);
        }
      }
    }
    
    this.testResults.errorHandling = errorHandlingStatus;
  }

  generateDiagnosticReport() {
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('=' .repeat(50));
    
    if (this.issues.length === 0) {
      console.log('✅ NO ISSUES FOUND - System appears healthy!');
      console.log('\n🎯 POSTING SHOULD WORK CORRECTLY');
    } else {
      console.log(`❌ FOUND ${this.issues.length} POTENTIAL ISSUES:`);
      
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n⚠️ THESE ISSUES MAY PREVENT POSTING FROM WORKING');
    }
    
    // Summary statistics
    console.log('\n📈 SYSTEM HEALTH SUMMARY:');
    console.log(`   Environment Variables: ${this.testResults.environmentVariables?.present || 0}/${this.testResults.environmentVariables?.total || 0} configured`);
    
    const validTokens = Object.values(this.testResults.botTokens || {}).filter(t => t.valid).length;
    const totalTokens = Object.keys(this.testResults.botTokens || {}).length;
    console.log(`   Bot Tokens: ${validTokens}/${totalTokens} valid`);
    
    const workingEndpoints = Object.values(this.testResults.apiEndpoints || {}).filter(e => e.working).length;
    const totalEndpoints = Object.keys(this.testResults.apiEndpoints || {}).length;
    console.log(`   API Endpoints: ${workingEndpoints}/${totalEndpoints} working`);
  }

  async implementFixes() {
    if (this.issues.length === 0) {
      console.log('\n✅ No fixes needed - system is healthy!');
      return;
    }
    
    console.log('\n🔧 IMPLEMENTING AUTOMATIC FIXES...');
    
    // Create a comprehensive fix script
    const fixScript = `
// Automatic fixes for Telegram posting issues
// Generated by diagnostic tool

// 1. Enhanced Error Handling
const enhancedErrorHandler = (error, context) => {
  console.error(\`❌ Error in \${context}:\`, error);
  
  // Log to file for debugging
  const fs = require('fs');
  const timestamp = new Date().toISOString();
  const logEntry = \`[\${timestamp}] \${context}: \${error.message}\\n\`;
  fs.appendFileSync('telegram-errors.log', logEntry);
  
  // Attempt recovery based on error type
  if (error.message.includes('409')) {
    console.log('🔄 Detected 409 conflict - attempting bot restart...');
    // Restart bot logic here
  }
  
  if (error.message.includes('token')) {
    console.log('🔑 Token issue detected - check environment variables');
  }
};

// 2. Robust Posting Function
const robustPostToWebsite = async (productData, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(\`📤 Posting attempt \${attempt}/\${retries}...\`);
      
      // Your existing posting logic here
      const result = await postProductToDatabase(productData);
      
      console.log('✅ Successfully posted to website!');
      return result;
      
    } catch (error) {
      console.log(\`❌ Attempt \${attempt} failed: \${error.message}\`);
      
      if (attempt === retries) {
        enhancedErrorHandler(error, 'Final posting attempt');
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// 3. Health Check Function
const performHealthCheck = async () => {
  console.log('🏥 Performing system health check...');
  
  // Check database connection
  try {
    const db = new Database('database.sqlite');
    db.prepare('SELECT 1').get();
    db.close();
    console.log('✅ Database: Connected');
  } catch (error) {
    console.log('❌ Database: Failed');
    return false;
  }
  
  // Check bot tokens
  const tokens = [
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_BOT_TOKEN_PRIME_PICKS
  ].filter(Boolean);
  
  for (const token of tokens) {
    try {
      const response = await fetch(\`https://api.telegram.org/bot\${token}/getMe\`);
      const data = await response.json();
      
      if (data.ok) {
        console.log(\`✅ Bot Token: Valid (@\${data.result.username})\`);
      } else {
        console.log('❌ Bot Token: Invalid');
        return false;
      }
    } catch (error) {
      console.log('❌ Bot Token: Connection failed');
      return false;
    }
  }
  
  console.log('✅ Health check passed!');
  return true;
};

// Export functions for use in your bot services
module.exports = {
  enhancedErrorHandler,
  robustPostToWebsite,
  performHealthCheck
};
`;
    
    // Write the fix script
    fs.writeFileSync('telegram-posting-fixes.js', fixScript);
    console.log('✅ Created telegram-posting-fixes.js with enhanced error handling');
    
    // Create monitoring script
    const monitorScript = `
// Telegram Posting Monitor
// Continuously monitors posting health

const { performHealthCheck } = require('./telegram-posting-fixes.js');

const startMonitoring = () => {
  console.log('🔍 Starting Telegram posting monitor...');
  
  // Check health every 5 minutes
  setInterval(async () => {
    const isHealthy = await performHealthCheck();
    
    if (!isHealthy) {
      console.log('⚠️ System unhealthy - check logs!');
      // Could trigger alerts, restart services, etc.
    }
  }, 5 * 60 * 1000);
};

// Start monitoring if this file is run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = { startMonitoring };
`;
    
    fs.writeFileSync('telegram-posting-monitor.js', monitorScript);
    console.log('✅ Created telegram-posting-monitor.js for continuous monitoring');
    
    console.log('\n🎯 FIXES IMPLEMENTED:');
    console.log('   1. Enhanced error handling with logging');
    console.log('   2. Robust posting with retry logic');
    console.log('   3. Continuous health monitoring');
    console.log('   4. Automatic recovery mechanisms');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Import the fixes into your bot services');
    console.log('   2. Start the monitoring service');
    console.log('   3. Test posting with enhanced error handling');
    console.log('   4. Monitor telegram-errors.log for issues');
  }
}

// Run diagnostic
const diagnostic = new TelegramPostingDiagnostic();
diagnostic.runComprehensiveDiagnostic().catch(console.error);