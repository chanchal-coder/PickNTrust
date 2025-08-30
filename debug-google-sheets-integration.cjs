const { GoogleSheetsService } = require('./server/google-sheets-service.ts');
const path = require('path');
require('dotenv').config();

async function debugGoogleSheetsIntegration() {
  console.log('🔍 Debugging Google Sheets Integration...');
  
  try {
    // Check environment variables
    console.log('\n📋 Environment Check:');
    console.log(`   GOOGLE_SHEETS_ID: ${process.env.GOOGLE_SHEETS_ID ? 'Set' : 'Missing'}`);
    console.log(`   GOOGLE_SHEETS_CREDENTIALS_PATH: ${process.env.GOOGLE_SHEETS_CREDENTIALS_PATH ? 'Set' : 'Missing'}`);
    
    if (!process.env.GOOGLE_SHEETS_ID) {
      console.log('❌ GOOGLE_SHEETS_ID is missing from .env file');
      return;
    }
    
    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService();
    await sheetsService.initialize();
    
    console.log('\n📊 Testing Google Sheets Access...');
    
    // Test each sheet
    console.log('\n1. Testing url_inbox sheet:');
    try {
      const inboxProducts = await sheetsService.getInboxProducts();
      console.log(`   ✅ Found ${inboxProducts.length} products in url_inbox`);
      if (inboxProducts.length > 0) {
        console.log('   📋 Sample product:', inboxProducts[0]);
      }
    } catch (error) {
      console.log(`   ❌ Error reading url_inbox: ${error.message}`);
    }
    
    console.log('\n2. Testing commissions_config sheet:');
    try {
      const commissionRules = await sheetsService.getCommissionRules();
      console.log(`   ✅ Found ${commissionRules.length} commission rules`);
      if (commissionRules.length > 0) {
        console.log('   📋 Sample rule:', commissionRules[0]);
      }
    } catch (error) {
      console.log(`   ❌ Error reading commissions_config: ${error.message}`);
    }
    
    console.log('\n3. Testing link_rules sheet:');
    try {
      const linkRules = await sheetsService.getLinkRules();
      console.log(`   ✅ Found ${linkRules.length} link rules`);
      if (linkRules.length > 0) {
        console.log('   📋 Sample rule:', linkRules[0]);
      }
    } catch (error) {
      console.log(`   ❌ Error reading link_rules: ${error.message}`);
    }
    
    console.log('\n4. Testing ls_affiliates sheet:');
    try {
      const lsAffiliates = await sheetsService.getLemonSqueezyAffiliates();
      console.log(`   ✅ Found ${lsAffiliates.length} Lemon Squeezy affiliates`);
      if (lsAffiliates.length > 0) {
        console.log('   📋 Sample affiliate:', lsAffiliates[0]);
      }
    } catch (error) {
      console.log(`   ❌ Error reading ls_affiliates: ${error.message}`);
    }
    
    console.log('\n5. Testing meta sheet:');
    try {
      const metaSettings = await sheetsService.getMetaSettings();
      console.log(`   ✅ Found ${Object.keys(metaSettings).length} meta settings`);
      if (Object.keys(metaSettings).length > 0) {
        console.log('   📋 Sample settings:', metaSettings);
      }
    } catch (error) {
      console.log(`   ❌ Error reading meta: ${error.message}`);
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('   1. Make sure your Google Sheet has these exact sheet names:');
    console.log('      - url_inbox (for input products)');
    console.log('      - commissions_config (for commission rules)');
    console.log('      - link_rules (for link building templates)');
    console.log('      - ls_affiliates (for Lemon Squeezy mappings)');
    console.log('      - meta (for global settings)');
    console.log('      - products_live (for output - will be written to)');
    console.log('\n   2. Add some test data to url_inbox sheet:');
    console.log('      Column A: https://amazon.in/some-product');
    console.log('      Column B: Test Product');
    console.log('      Column C: electronics');
    console.log('      Column D: https://example.com/image.jpg');
    console.log('      Column E: Test description');
    console.log('      Column F: test,product');
    console.log('      Column G: pending');
    
  } catch (error) {
    console.error('❌ Error in Google Sheets integration:', error);
  }
}

debugGoogleSheetsIntegration();