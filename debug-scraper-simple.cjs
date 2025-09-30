const puppeteer = require('puppeteer');

async function debugSimpleFlow() {
  console.log('🔍 SIMPLE SCRAPER DEBUG');
  console.log('=======================');
  
  const testUrl = 'https://www.amazon.in/dp/B08N5WRWNW';
  let browser;
  let page;
  
  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    
    // Set shorter timeout
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('🌐 Navigating to URL...');
    await page.goto(testUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log('⏳ Waiting briefly...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📋 Testing basic evaluation...');
    
    // Test the exact evaluation that might be causing issues
    const result = await page.evaluate(() => {
      try {
        // This is similar to what's in the enhanced scraper
        const getTextBySelectors = (selectorList) => {
          for (const selector of selectorList) {
            const element = document.querySelector(selector);
            if (element) {
              return element.textContent?.trim() || element.getAttribute('alt')?.trim();
            }
          }
          return undefined;
        };
        
        const titleSelectors = [
          '#productTitle',
          '.product-title',
          'h1.a-size-large'
        ];
        
        const priceSelectors = [
          '.a-price-whole',
          '.a-price .a-offscreen',
          '#priceblock_dealprice'
        ];
        
        return {
          success: true,
          name: getTextBySelectors(titleSelectors),
          price: getTextBySelectors(priceSelectors),
          url: window.location.href,
          title: document.title
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('✅ Evaluation result:', result);
    
    if (!result.success) {
      console.error('❌ Evaluation failed:', result.error);
      if (result.error.includes('__name')) {
        console.error('🎯 FOUND __name ERROR!');
        console.error('Stack:', result.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('__name')) {
      console.error('🎯 FOUND __name ERROR in outer catch!');
    }
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.log('Page already closed');
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.log('Browser already closed');
      }
    }
  }
}

debugSimpleFlow().catch(console.error);