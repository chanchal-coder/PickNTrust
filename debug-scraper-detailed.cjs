const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Mimic the exact flow from enhanced-universal-scraper.ts
async function debugScrapingFlow() {
  console.log('🔍 DETAILED SCRAPER DEBUG');
  console.log('========================');
  
  const testUrl = 'https://www.amazon.in/dp/B08N5WRWNW';
  let browser;
  
  try {
    // Initialize browser with same config as enhanced-universal-scraper
    console.log('🚀 Initializing browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    console.log('🌐 Navigating to URL...');
    await page.goto(testUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for content...');
    await page.waitForTimeout(3000);
    
    // Test 1: Basic page evaluation
    console.log('\n📋 TEST 1: Basic Page Evaluation');
    console.log('================================');
    
    try {
      const basicTest = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasDocument: typeof document !== 'undefined',
          hasWindow: typeof window !== 'undefined'
        };
      });
      console.log('✅ Basic evaluation successful:', basicTest);
    } catch (error) {
      console.error('❌ Basic evaluation failed:', error.message);
      if (error.message.includes('__name')) {
        console.error('🎯 FOUND __name ERROR in basic evaluation!');
      }
    }
    
    // Test 2: Amazon-specific selectors (mimicking platform-detector)
    console.log('\n📋 TEST 2: Amazon Selector Testing');
    console.log('==================================');
    
    const amazonSelectors = {
      title: [
        '#productTitle',
        '.product-title',
        'h1.a-size-large',
        '[data-automation-id="product-title"]'
      ],
      price: [
        '.a-price-whole',
        '.a-price .a-offscreen',
        '.a-price-current',
        '#priceblock_dealprice',
        '#priceblock_ourprice'
      ],
      image: [
        '#landingImage',
        '.a-dynamic-image',
        '#imgBlkFront',
        '.product-image img'
      ]
    };
    
    try {
      const selectorTest = await page.evaluate((selectors) => {
        const getTextBySelectors = (selectorList) => {
          for (const selector of selectorList) {
            const element = document.querySelector(selector);
            if (element) {
              return element.textContent?.trim() || element.getAttribute('alt')?.trim();
            }
          }
          return undefined;
        };
        
        const getImageBySelectors = (selectorList) => {
          for (const selector of selectorList) {
            const element = document.querySelector(selector);
            if (element) {
              return element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
            }
          }
          return undefined;
        };
        
        return {
          name: getTextBySelectors(selectors.title),
          price: getTextBySelectors(selectors.price),
          imageUrl: getImageBySelectors(selectors.image),
          titleElements: selectors.title.map(sel => document.querySelectorAll(sel).length),
          priceElements: selectors.price.map(sel => document.querySelectorAll(sel).length)
        };
      }, amazonSelectors);
      
      console.log('✅ Selector test successful:', selectorTest);
    } catch (error) {
      console.error('❌ Selector test failed:', error.message);
      if (error.message.includes('__name')) {
        console.error('🎯 FOUND __name ERROR in selector testing!');
      }
    }
    
    // Test 3: Exact page.evaluate from enhanced-universal-scraper
    console.log('\n📋 TEST 3: Exact Enhanced Scraper Evaluation');
    console.log('============================================');
    
    try {
      const exactTest = await page.evaluate((selectors) => {
        const getTextBySelectors = (selectorList) => {
          for (const selector of selectorList) {
            const element = document.querySelector(selector);
            if (element) {
              return element.textContent?.trim() || element.getAttribute('alt')?.trim();
            }
          }
          return undefined;
        };
        
        const getImageBySelectors = (selectorList) => {
          const imageUrls = [];
          for (const selector of selectorList) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              const src = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src') || element.getAttribute('data-original');
              if (src && !imageUrls.includes(src)) {
                imageUrls.push(src);
              }
            });
          }
          return imageUrls;
        };
        
        return {
          name: getTextBySelectors(selectors.title || []),
          price: getTextBySelectors(selectors.price || []),
          originalPrice: getTextBySelectors(selectors.originalPrice || []),
          imageUrl: getImageBySelectors(selectors.image || []),
          description: getTextBySelectors(selectors.description || []),
          rating: getTextBySelectors(selectors.rating || []),
          reviewCount: getTextBySelectors(selectors.reviewCount || []),
          availability: getTextBySelectors(selectors.availability || []),
          brand: getTextBySelectors(selectors.brand || [])
        };
      }, amazonSelectors);
      
      console.log('✅ Exact enhanced scraper test successful:', exactTest);
    } catch (error) {
      console.error('❌ Exact enhanced scraper test failed:', error.message);
      if (error.message.includes('__name')) {
        console.error('🎯 FOUND __name ERROR in exact enhanced scraper evaluation!');
      }
    }
    
    // Test 4: Check for any injected scripts or global variables
    console.log('\n📋 TEST 4: Global Variable Check');
    console.log('================================');
    
    try {
      const globalCheck = await page.evaluate(() => {
        const globals = {};
        for (let key in window) {
          if (key.includes('name') || key.includes('__')) {
            globals[key] = typeof window[key];
          }
        }
        return {
          globals,
          hasName: typeof name !== 'undefined',
          hasUnderscoreName: typeof __name !== 'undefined',
          windowKeys: Object.keys(window).filter(k => k.includes('name') || k.includes('__')).length
        };
      });
      
      console.log('✅ Global variable check:', globalCheck);
    } catch (error) {
      console.error('❌ Global variable check failed:', error.message);
      if (error.message.includes('__name')) {
        console.error('🎯 FOUND __name ERROR in global variable check!');
      }
    }
    
  } catch (error) {
    console.error('❌ Overall test failed:', error.message);
    if (error.message.includes('__name')) {
      console.error('🎯 FOUND __name ERROR in overall test!');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug
debugScrapingFlow().catch(console.error);