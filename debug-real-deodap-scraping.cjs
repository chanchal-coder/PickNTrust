// Debug Real Deodap Scraping
// Actually scrape a real Deodap URL to see what's happening

const axios = require('axios');
const cheerio = require('cheerio');

console.log('Search DEBUGGING REAL DEODAP SCRAPING');
console.log('=' .repeat(50));

async function debugRealDeodapScraping() {
  try {
    // Test with a real Deodap URL
    const testUrl = 'https://deodap.in/products/mini-bag-sealer-2-in-1-seal-cutter-heat-sealers';
    
    console.log(`\nGlobal Testing Real Deodap URL:`);
    console.log(`   URL: ${testUrl}`);
    
    console.log('\n📡 Making HTTP Request...');
    
    const response = await axios.get(testUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content Length: ${response.data.length} characters`);
    
    const $ = cheerio.load(response.data);
    
    console.log('\nSearch Analyzing Page Structure...');
    
    // Check if it's a valid product page
    const title = $('title').text();
    console.log(`   Page Title: ${title}`);
    
    // Look for any price-related elements
    console.log('\nPrice Searching for Price Elements...');
    
    const allPriceSelectors = [
      // Deodap specific
      '.price-item--regular',
      '.price__regular',
      '.price-regular',
      '.product-price-value',
      '.price-current',
      '.current-price',
      '.sale-price',
      '.product-price',
      '.price-wrapper .price',
      '.price-box .price',
      '.product-form__price',
      '.money',
      '.price-item',
      '.price-sale',
      // Generic
      '.price',
      '[data-price]',
      '.selling-price',
      '.final-price',
      // Meta tags
      'meta[property="product:price:amount"]',
      'meta[name="price"]',
      'meta[property="og:price:amount"]'
    ];
    
    let foundPrice = false;
    
    for (const selector of allPriceSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          let priceText = '';
          
          if (selector.includes('meta')) {
            priceText = $(el).attr('content') || '';
          } else {
            priceText = $(el).text().trim();
          }
          
          if (priceText) {
            console.log(`   Success FOUND: ${selector} = "${priceText}"`);
            foundPrice = true;
            
            // Try to extract price
            const firstNumber = priceText.match(/\d+(?:[,.]\d+)*/);
            if (firstNumber) {
              const cleanNumber = firstNumber[0].replace(/[,]/g, '');
              const numericValue = parseFloat(cleanNumber);
              if (numericValue > 0 && numericValue < 1000000) {
                const finalPrice = `₹${Math.floor(numericValue)}`;
                console.log(`   Price EXTRACTED: ${finalPrice}`);
              }
            }
          }
        });
      }
    }
    
    if (!foundPrice) {
      console.log('   Error NO PRICE ELEMENTS FOUND WITH ANY SELECTOR');
      
      console.log('\nSearch Searching for ANY text containing "Rs" or "₹"...');
      const bodyText = $('body').text();
      const priceMatches = bodyText.match(/(?:Rs\.?|₹)\s*\d+(?:[,.]\d+)*/gi);
      
      if (priceMatches) {
        console.log('   📄 Found price-like text in page:');
        priceMatches.slice(0, 5).forEach(match => {
          console.log(`      "${match}"`);
        });
      } else {
        console.log('   Error NO PRICE TEXT FOUND ANYWHERE ON PAGE');
      }
      
      console.log('\nSearch Checking if page loaded properly...');
      const bodyLength = $('body').text().length;
      console.log(`   Body text length: ${bodyLength} characters`);
      
      if (bodyLength < 1000) {
        console.log('   Warning Page seems too short - might be blocked or redirected');
        console.log('   📄 Page content preview:');
        console.log(response.data.substring(0, 500));
      }
    }
    
    console.log('\nSearch Checking Page Structure...');
    const hasProductInfo = $('.product').length > 0 || $('.item').length > 0 || $('[data-product]').length > 0;
    console.log(`   Has product elements: ${hasProductInfo}`);
    
    const hasJavaScript = response.data.includes('<script');
    console.log(`   Has JavaScript: ${hasJavaScript}`);
    
    if (hasJavaScript && !foundPrice) {
      console.log('   Warning Price might be loaded dynamically via JavaScript');
      console.log('   Tip Static scraping may not work for this site');
    }
    
    console.log('\n📋 DIAGNOSIS:');
    if (foundPrice) {
      console.log('   Success Price extraction should work');
      console.log('   🔧 Check if bot is actually reaching this URL');
    } else {
      console.log('   Error No prices found with current selectors');
      console.log('   🔧 Need to inspect actual Deodap HTML structure');
      console.log('   Tip Price might be loaded via JavaScript/AJAX');
    }
    
  } catch (error) {
    console.error('Error Error scraping Deodap URL:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('   Global DNS resolution failed - check internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   🚫 Connection refused - site might be blocking requests');
    } else if (error.response) {
      console.log(`   📡 HTTP Error: ${error.response.status} ${error.response.statusText}`);
    }
  }
}

// Run the debug
debugRealDeodapScraping().catch(console.error);