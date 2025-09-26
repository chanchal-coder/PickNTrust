// Debug script to test the actual enhanced-universal-scraper
const path = require('path');

async function debugActualScraper() {
  console.log('🔍 DEBUGGING ACTUAL ENHANCED SCRAPER');
  console.log('====================================');
  
  try {
    // Import the actual modules
    console.log('📦 Importing modules...');
    
    // Import URL resolver
    const { urlResolver } = await import('./server/universal-url-resolver.ts');
    console.log('✅ URL resolver imported');
    
    // Import platform detector
    const { platformDetector } = await import('./server/platform-detector.ts');
    console.log('✅ Platform detector imported');
    
    // Import enhanced scraper
    const { enhancedScraper } = await import('./server/enhanced-universal-scraper.ts');
    console.log('✅ Enhanced scraper imported');
    
    const testUrl = 'https://www.amazon.in/dp/B08N5WRWNW';
    
    console.log('\n🔗 Step 1: Resolving URL...');
    const resolvedUrl = await urlResolver.resolveURL(testUrl);
    console.log('✅ URL resolved:', {
      originalUrl: resolvedUrl.originalUrl,
      finalUrl: resolvedUrl.finalUrl,
      redirectCount: resolvedUrl.redirectCount
    });
    
    console.log('\n🔍 Step 2: Detecting platform...');
    const platformInfo = platformDetector.detectPlatform(resolvedUrl);
    console.log('✅ Platform detected:', {
      platform: platformInfo.platform,
      platformName: platformInfo.platformName,
      hasSelectors: !!platformInfo.selectors
    });
    
    console.log('\n🕷️ Step 3: Scraping product...');
    console.log('This is where the __name error might occur...');
    
    try {
      const scrapedData = await enhancedScraper.scrapeProduct(resolvedUrl);
      console.log('✅ Scraping successful:', {
        success: scrapedData.success,
        name: scrapedData.name,
        price: scrapedData.price,
        error: scrapedData.error
      });
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      if (error.message.includes('__name')) {
        console.error('🎯 FOUND THE __name ERROR!');
        console.error('Full error:', error);
        console.error('Stack trace:', error.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.message.includes('__name')) {
      console.error('🎯 FOUND __name ERROR in import/setup!');
    }
    console.error('Full error:', error);
  }
}

debugActualScraper().catch(console.error);