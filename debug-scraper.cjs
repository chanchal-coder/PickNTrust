const puppeteer = require('puppeteer');

async function debugScraper() {
  console.log('🔍 DEBUG: Starting scraper debug session...');
  
  let browser;
  try {
    // Initialize browser
    console.log('🚀 DEBUG: Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 DEBUG: Navigating to Amazon page...');
    await page.goto('https://www.amazon.in/dp/B08N5WRWNW', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('⏳ DEBUG: Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 DEBUG: Testing simple page evaluation...');
    const simpleTest = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasDocument: typeof document !== 'undefined',
        hasWindow: typeof window !== 'undefined'
      };
    });
    console.log('✅ DEBUG: Simple test result:', simpleTest);
    
    console.log('🔍 DEBUG: Testing selector-based evaluation...');
    const selectorTest = await page.evaluate(() => {
      const selectors = {
        title: ['#productTitle', '.product-title', 'h1.a-size-large'],
        price: ['#priceblock_dealprice', '#priceblock_ourprice', '.a-price-whole', '.a-offscreen']
      };
      
      const getTextBySelectors = (selectorList) => {
        for (const selector of selectorList) {
          const element = document.querySelector(selector);
          if (element) {
            return element.textContent?.trim() || element.getAttribute('alt')?.trim();
          }
        }
        return undefined;
      };
      
      return {
        name: getTextBySelectors(selectors.title),
        price: getTextBySelectors(selectors.price),
        foundElements: {
          productTitle: !!document.querySelector('#productTitle'),
          priceElements: document.querySelectorAll('.a-price-whole, .a-offscreen').length
        }
      };
    });
    console.log('✅ DEBUG: Selector test result:', selectorTest);
    
    console.log('🎉 DEBUG: All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ DEBUG: Error occurred:', error.message);
    console.error('📍 DEBUG: Error stack:', error.stack);
    
    // Check if it's the specific __name error
    if (error.message.includes('__name')) {
      console.error('🚨 DEBUG: Found the __name error!');
      console.error('🔍 DEBUG: This suggests the error is coming from the page evaluation context');
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 DEBUG: Browser closed');
    }
  }
}

debugScraper();