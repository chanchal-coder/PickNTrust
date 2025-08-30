const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  testProducts: [
    {
      url: 'https://amazon.com/dp/B08N5WRWNW',
      title: 'iPhone Case',
      category: 'electronics',
      tags: 'trending'
    },
    {
      url: 'https://myntra.com/shirts/roadster/123',
      title: 'Casual Shirt', 
      category: 'fashion',
      tags: 'viral'
    },
    {
      url: 'https://revid.ai',
      title: 'AI Video Tool',
      category: 'apps',
      tags: 'featured'
    },
    {
      url: 'https://deodap.com/product/123',
      title: 'DeoDap Product',
      category: 'beauty',
      tags: ''
    }
  ],
  
  testCommissionRules: [
    {
      merchant_pattern: 'amazon.com',
      category_pattern: '*',
      affiliate_program: 'amazon_associates',
      commission_rate: '4%',
      cookie_days: 24,
      priority: 1,
      active: true,
      direct_affiliate: false,
      template_url: 'https://amazon.com/dp/{ASIN}?tag=pickntrust03-21'
    },
    {
      merchant_pattern: 'myntra.com',
      category_pattern: 'fashion',
      affiliate_program: 'earnkaro',
      commission_rate: '8%',
      cookie_days: 30,
      priority: 1,
      active: true,
      direct_affiliate: false,
      template_url: 'https://earnkaro.com/api/redirect?id=4530348&url={URL}'
    },
    {
      merchant_pattern: 'revid.ai',
      category_pattern: 'apps',
      affiliate_program: 'lemon_squeezy',
      commission_rate: '30%',
      cookie_days: 60,
      priority: 1,
      active: true,
      direct_affiliate: true,
      template_url: 'https://revid.ai?aff=bl2W8D'
    },
    {
      merchant_pattern: 'deodap.com',
      category_pattern: '*',
      affiliate_program: 'deodap',
      commission_rate: '15%',
      cookie_days: 30,
      priority: 1,
      active: true,
      direct_affiliate: true,
      template_url: '{URL}'
    }
  ]
};

class AffiliateAutomationTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    try {
      console.log(`🧪 Running test: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async testHealthCheck() {
    const health = await this.makeRequest('/api/affiliate/health');
    
    if (!health.service) {
      throw new Error('Health check failed - no service status');
    }
    
    console.log(`   Service status: ${health.service}`);
    console.log(`   Environment check:`, health.environment);
  }

  async testAffiliateStatus() {
    const status = await this.makeRequest('/api/affiliate/status');
    
    console.log(`   Initialized: ${status.initialized}`);
    if (status.initialized) {
      console.log(`   Auto-sync enabled: ${status.autoSyncEnabled}`);
      console.log(`   Sync interval: ${status.syncInterval} minutes`);
    }
  }

  async testManualSync() {
    console.log('   Triggering manual sync...');
    const result = await this.makeRequest('/api/affiliate/sync', {
      method: 'POST'
    });
    
    if (!result.success && !result.message.includes('not initialized')) {
      throw new Error(`Manual sync failed: ${result.message}`);
    }
    
    console.log(`   Sync result: ${result.message}`);
  }

  async testProductsByPage() {
    const pages = ['todays_top_picks', 'apps_ai', 'lootbox', 'cards_services'];
    
    for (const page of pages) {
      const products = await this.makeRequest(`/api/products/by-page/${page}`);
      
      if (!products.success) {
        throw new Error(`Failed to get products for page: ${page}`);
      }
      
      console.log(`   ${page}: ${products.count} products`);
    }
  }

  async testAffiliateEngine() {
    // Test affiliate link generation logic
    const AffiliateEngine = require('./server/affiliate-engine.ts').default;
    
    const config = {
      amazon_tag: 'pickntrust03-21',
      earnkaro_id: '4530348',
      lemon_squeezy_code: 'bl2W8D'
    };
    
    const engine = new AffiliateEngine(config);
    engine.updateCommissionRules(TEST_CONFIG.testCommissionRules);
    
    // Test each product
    for (const product of TEST_CONFIG.testProducts) {
      const result = engine.processProduct(product.url, product.category);
      
      console.log(`   ${product.title}:`);
      console.log(`     Original: ${result.originalUrl}`);
      console.log(`     Affiliate: ${result.affiliateUrl}`);
      console.log(`     Program: ${result.selectedProgram}`);
      console.log(`     Rate: ${result.commissionRate}`);
      
      if (result.selectedProgram === 'none') {
        console.log(`     ⚠️ No affiliate program found: ${result.reasoning}`);
      }
    }
  }

  async testAutoSyncControl() {
    // Test starting auto-sync
    const startResult = await this.makeRequest('/api/affiliate/auto-sync/start', {
      method: 'POST'
    });
    
    if (!startResult.success) {
      throw new Error(`Failed to start auto-sync: ${startResult.message}`);
    }
    
    console.log('   Auto-sync started successfully');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test stopping auto-sync
    const stopResult = await this.makeRequest('/api/affiliate/auto-sync/stop', {
      method: 'POST'
    });
    
    if (!stopResult.success) {
      throw new Error(`Failed to stop auto-sync: ${stopResult.message}`);
    }
    
    console.log('   Auto-sync stopped successfully');
  }

  checkEnvironmentSetup() {
    const requiredFiles = [
      './server/google-sheets-service.ts',
      './server/affiliate-engine.ts', 
      './server/affiliate-automation.ts',
      './.env.affiliate'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }
    
    console.log('   All required files present');
  }

  checkDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const requiredDeps = ['googleapis'];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }
    
    console.log('   All required dependencies installed');
  }

  async runAllTests() {
    console.log('🚀 Starting Affiliate Automation Tests\n');
    
    // Environment tests
    await this.runTest('Environment Setup', () => this.checkEnvironmentSetup());
    await this.runTest('Dependencies Check', () => this.checkDependencies());
    
    // API tests (these will work even if Google Sheets is not configured)
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Affiliate Status', () => this.testAffiliateStatus());
    await this.runTest('Products by Page', () => this.testProductsByPage());
    
    // These tests require the server to be running
    try {
      await this.runTest('Manual Sync', () => this.testManualSync());
      await this.runTest('Auto-sync Control', () => this.testAutoSyncControl());
    } catch (error) {
      console.log('⚠️ Server-dependent tests skipped (server may not be running)');
    }
    
    // Logic tests (these work without external dependencies)
    try {
      await this.runTest('Affiliate Engine Logic', () => this.testAffiliateEngine());
    } catch (error) {
      console.log('⚠️ Affiliate engine test skipped (TypeScript compilation needed)');
    }
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Set up Google Sheets credentials (google-credentials.json)');
    console.log('2. Configure environment variables (.env file)');
    console.log('3. Create Google Sheets with proper structure');
    console.log('4. Start the server: npm run dev');
    console.log('5. Test with real products in Google Sheets');
    
    return this.results.failed === 0;
  }
}

// Run tests
if (require.main === module) {
  const tester = new AffiliateAutomationTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = AffiliateAutomationTester;