// Fix Remaining Image and Price Issues
const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

console.log('🔧 Fixing remaining image and price extraction issues...');

async function fixRemainingIssues() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1. Stats Analyzing current product issues...');
    
    // Get products with issues
    const products = db.prepare(`
      SELECT * FROM value_picks_products 
      WHERE processing_status = 'active'
      ORDER BY created_at DESC
    `).all();
    
    console.log(`Found ${products.length} products to analyze:`);
    
    let correctImages = 0;
    let wrongImages = 0;
    let wrongPrices = 0;
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name.substring(0, 50)}...`);
      
      // Check image
      if (product.image_url.includes('rukminim3.flixcart.com/image/')) {
        console.log(`   🖼️ Image: Success CORRECT (real product image)`);
        correctImages++;
      } else if (product.image_url.includes('rukminim3.flixcart.com/www/128/128/promos/')) {
        console.log(`   🖼️ Image: Error WRONG (generic promo image)`);
        wrongImages++;
      } else {
        console.log(`   🖼️ Image: ❓ OTHER (${product.image_url.substring(0, 60)}...)`);
      }
      
      // Check price
      if (product.price === '85' && product.original_price === '199') {
        console.log(`   Price Price: Error WRONG (default ₹85/₹199)`);
        wrongPrices++;
      } else {
        console.log(`   Price Price: Success CORRECT (₹${product.price}/₹${product.original_price})`);
      }
    });
    
    console.log('\n2. 📈 ISSUE SUMMARY:');
    console.log(`   Success Products with correct images: ${correctImages}`);
    console.log(`   Error Products with wrong images: ${wrongImages}`);
    console.log(`   Error Products with wrong prices: ${wrongPrices}`);
    
    console.log('\n3. Search ROOT CAUSE ANALYSIS:');
    
    if (wrongImages > 0) {
      console.log('   📸 IMAGE ISSUES:');
      console.log('     • Some products getting generic promo images instead of product images');
      console.log('     • Image selectors may not be finding the main product image');
      console.log('     • Need to prioritize product-specific images over category images');
    }
    
    if (wrongPrices > 0) {
      console.log('   Price PRICE ISSUES:');
      console.log('     • All products have same default prices (₹85/₹199)');
      console.log('     • Price extraction is failing completely');
      console.log('     • Bot falling back to hardcoded default values');
    }
    
    console.log('\n4. 🛠️ ENHANCED FIXES NEEDED:');
    
    console.log('   🖼️ IMAGE EXTRACTION IMPROVEMENTS:');
    console.log('     • Add more specific product image selectors');
    console.log('     • Prioritize individual product images over category/promo images');
    console.log('     • Filter out generic promo images');
    console.log('     • Add validation to ensure images are product-specific');
    
    console.log('   Price PRICE EXTRACTION IMPROVEMENTS:');
    console.log('     • Add more Shopsy-specific price selectors');
    console.log('     • Improve price text parsing and validation');
    console.log('     • Add fallback price extraction methods');
    console.log('     • Better handling of different price formats');
    
    console.log('\n5. 🧪 TESTING SPECIFIC URLS:');
    
    // Test specific problematic URLs
    const problematicUrls = [
      'https://www.shopsy.in/clo/cfv/itg/tys/~cs-t715216lgw/pr', // Women's Kurti Set
      'https://www.shopsy.in/clo/ash/axc/mmk/~cs-23zk94ivv3/pr'  // Men's Shirt
    ];
    
    for (const url of problematicUrls) {
      console.log(`\nSearch Testing: ${url.substring(0, 60)}...`);
      await testUrlExtraction(url);
    }
    
    db.close();
    
    console.log('\n6. Target NEXT STEPS:');
    console.log('   1. Enhance image selectors to avoid generic promo images');
    console.log('   2. Improve price extraction with more specific selectors');
    console.log('   3. Add validation to ensure extracted data is product-specific');
    console.log('   4. Test with the problematic URLs to verify fixes');
    console.log('   5. Update existing products with correct data');
    
  } catch (error) {
    console.error('Error Error analyzing issues:', error.message);
  }
}

async function testUrlExtraction(url) {
  try {
    console.log('   Global Fetching page...');
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Test image extraction
    console.log('   🖼️ Testing image extraction...');
    const images = [];
    
    // Check different image selectors
    const imageSelectors = [
      '._396cs4 img',
      '._2r_T1I img', 
      '.CXW8mj img',
      'img[src*="image/"]',
      'img[data-src*="image/"]'
    ];
    
    imageSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('flixcart.com')) {
          images.push({ selector, src: src.substring(0, 80) + '...' });
        }
      });
    });
    
    if (images.length > 0) {
      console.log(`   Success Found ${images.length} potential images:`);
      images.forEach((img, i) => {
        console.log(`      ${i+1}. ${img.selector}: ${img.src}`);
      });
    } else {
      console.log('   Error No product images found');
    }
    
    // Test price extraction
    console.log('   Price Testing price extraction...');
    const prices = [];
    
    const priceSelectors = [
      '._30jeq3._16Jk6d',
      '._1_WHN1',
      '.CEmiEU .Nx9bqj',
      '._30jeq3',
      '._1vC4OE',
      '.price'
    ];
    
    priceSelectors.forEach(selector => {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.includes('₹')) {
          prices.push({ selector, text });
        }
      }
    });
    
    if (prices.length > 0) {
      console.log(`   Success Found ${prices.length} potential prices:`);
      prices.forEach((price, i) => {
        console.log(`      ${i+1}. ${price.selector}: ${price.text}`);
      });
    } else {
      console.log('   Error No prices found');
    }
    
  } catch (error) {
    console.log(`   Error Error testing URL: ${error.message}`);
  }
}

// Run the analysis
fixRemainingIssues().catch(console.error);