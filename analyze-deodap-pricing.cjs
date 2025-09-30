// Comprehensive Deodap Pricing Analysis
// Analyze how Deodap displays prices and design proper schema

const axios = require('axios');
const cheerio = require('cheerio');

console.log('Search COMPREHENSIVE DEODAP PRICING ANALYSIS');
console.log('=' .repeat(60));

async function analyzeDeodapPricing() {
  try {
    const testUrl = 'https://deodap.in/products/mini-bag-sealer-2-in-1-seal-cutter-heat-sealers';
    
    console.log('\nGlobal Analyzing Deodap Product Page:');
    console.log(`   URL: ${testUrl}`);
    
    const response = await axios.get(testUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('\nPrice DETAILED PRICE STRUCTURE ANALYSIS:');
    console.log('=' .repeat(50));
    
    // 1. Find all price-related elements
    const priceElements = {
      'meta[property="og:price:amount"]': [],
      '.price': [],
      '.price-item': [],
      '.price-item--regular': [],
      '.price-sale': [],
      '.sale-price': [],
      '.regular-price': [],
      '.current-price': [],
      '.original-price': [],
      '.was-price': [],
      '.now-price': []
    };
    
    // Extract all price elements
    Object.keys(priceElements).forEach(selector => {
      $(selector).each((i, el) => {
        let text = '';
        if (selector.includes('meta')) {
          text = $(el).attr('content') || '';
        } else {
          text = $(el).text().trim();
        }
        
        if (text) {
          priceElements[selector].push({
            text: text,
            html: $(el).html(),
            classes: $(el).attr('class') || '',
            parent: $(el).parent().attr('class') || ''
          });
        }
      });
    });
    
    // Display findings
    console.log('\n📋 PRICE ELEMENTS FOUND:');
    Object.entries(priceElements).forEach(([selector, elements]) => {
      if (elements.length > 0) {
        console.log(`\nSearch ${selector}:`);
        elements.slice(0, 3).forEach((el, i) => {
          console.log(`   ${i + 1}. Text: "${el.text}"`);
          console.log(`      Classes: "${el.classes}"`);
          console.log(`      Parent: "${el.parent}"`);
          if (el.html && el.html.length < 100) {
            console.log(`      HTML: ${el.html}`);
          }
        });
        if (elements.length > 3) {
          console.log(`   ... and ${elements.length - 3} more`);
        }
      }
    });
    
    console.log('\nTarget DEODAP PRICING PATTERN ANALYSIS:');
    console.log('=' .repeat(50));
    
    // Analyze the .price elements specifically
    const priceTexts = priceElements['.price'];
    if (priceTexts.length > 0) {
      console.log('\nStats .price Element Analysis:');
      priceTexts.slice(0, 5).forEach((el, i) => {
        console.log(`\n${i + 1}. "${el.text}"`);
        
        // Try to parse the price structure
        if (el.text.includes('Regular price') && el.text.includes('Sale price')) {
          const match = el.text.match(/Sale price\s*Rs\.?\s*(\d+(?:\.\d+)?).*Regular price\s*Rs\.?\s*(\d+(?:\.\d+)?)/i);
          if (match) {
            console.log(`   Target FOUND PATTERN: Sale=₹${match[1]}, Regular=₹${match[2]}`);
            console.log(`   Success This should be: current_price=₹${match[1]}, original_price=₹${match[2]}`);
          }
        }
        
        // Extract all numbers
        const numbers = el.text.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
          console.log(`   Stats Numbers found: ${numbers.join(', ')}`);
          console.log(`   Tip Likely: Sale=₹${numbers[0]}, Regular=₹${numbers[1]}`);
        }
      });
    }
    
    // Check meta tag
    const metaPrice = priceElements['meta[property="og:price:amount"]'];
    if (metaPrice.length > 0) {
      console.log(`\n🏷️ Meta Tag Price: "${metaPrice[0].text}"`);
      console.log('   Tip This is likely the SALE PRICE (what customer pays)');
    }
    
    console.log('\n🔧 RECOMMENDED DATABASE SCHEMA:');
    console.log('=' .repeat(50));
    console.log('\n📋 Current Schema Issues:');
    console.log('   Error price: Storing regular price instead of sale price');
    console.log('   Error original_price: Not capturing the higher regular price');
    console.log('   Error No dedicated sale_price field');
    
    console.log('\nSuccess RECOMMENDED SCHEMA CHANGES:');
    console.log('   1. price (current_price): Should store SALE PRICE (₹87)');
    console.log('   2. original_price (regular_price): Should store REGULAR PRICE (₹399)');
    console.log('   3. Add sale_price field: Explicit sale price storage');
    console.log('   4. Add price_type: "sale", "regular", "clearance", etc.');
    console.log('   5. Add discount_amount: Calculated difference');
    console.log('   6. Add discount_percentage: Calculated percentage');
    
    console.log('\nAI RECOMMENDED BOT EXTRACTION LOGIC:');
    console.log('=' .repeat(50));
    console.log('\n1. PRIORITY ORDER FOR CURRENT PRICE (what customer pays):');
    console.log('   🥇 meta[property="og:price:amount"] - Most reliable sale price');
    console.log('   🥈 Extract first number from "Sale priceRs. X.XX" pattern');
    console.log('   🥉 .price-sale, .sale-price selectors');
    console.log('   4️⃣ .current-price, .price-current selectors');
    
    console.log('\n2. PRIORITY ORDER FOR ORIGINAL PRICE (regular/MRP):');
    console.log('   🥇 Extract second number from "Regular priceRs. X.XX" pattern');
    console.log('   🥈 .price-item--regular, .price-regular selectors');
    console.log('   🥉 .original-price, .was-price selectors');
    
    console.log('\n3. VALIDATION LOGIC:');
    console.log('   Success current_price < original_price (sale should be lower)');
    console.log('   Success Both prices > 0');
    console.log('   Success Reasonable price range (₹10 - ₹100,000)');
    
    console.log('\nTarget EXPECTED RESULT FOR TEST PRODUCT:');
    console.log('   Current Price (what customer pays): ₹87');
    console.log('   Original Price (regular MRP): ₹399');
    console.log('   Discount: ₹312 (78% off)');
    console.log('   Display: "₹87" with "₹399" crossed out');
    
    console.log('\nLaunch IMPLEMENTATION STEPS:');
    console.log('   1. Update extractPrice() to prioritize sale price selectors');
    console.log('   2. Update extractOriginalPrice() to find regular price');
    console.log('   3. Add validation to ensure current < original');
    console.log('   4. Test with real Deodap URLs');
    console.log('   5. Verify frontend displays correctly');
    
  } catch (error) {
    console.error('Error Error analyzing Deodap pricing:', error.message);
  }
}

// Run the analysis
analyzeDeodapPricing().catch(console.error);