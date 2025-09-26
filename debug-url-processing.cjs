const Database = require('better-sqlite3');
const path = require('path');

// Test URL processing service behavior
async function testUrlProcessing() {
  console.log('🔍 Testing URL Processing Service Behavior\n');
  
  // Get some actual URLs from the database
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Get recent channel posts with URLs
    const posts = db.prepare(`
      SELECT id, original_text, extracted_urls, is_processed 
      FROM channel_posts 
      WHERE extracted_urls IS NOT NULL 
      AND extracted_urls != '[]' 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    console.log(`Found ${posts.length} posts with URLs:\n`);
    
    for (const post of posts) {
      console.log(`📝 Post ID: ${post.id}`);
      console.log(`   Text: ${post.original_text.substring(0, 100)}...`);
      console.log(`   URLs: ${post.extracted_urls}`);
      console.log(`   Processed: ${post.is_processed}`);
      
      // Parse URLs
      let urls = [];
      try {
        urls = JSON.parse(post.extracted_urls);
      } catch (e) {
        console.log(`   ❌ Failed to parse URLs: ${e.message}`);
        continue;
      }
      
      if (urls.length > 0) {
        const firstUrl = urls[0];
        console.log(`   🔗 Testing URL: ${firstUrl}`);
        
        // Test URL processing logic
        await testUrlProcessingLogic(firstUrl, post.original_text);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    db.close();
  }
}

async function testUrlProcessingLogic(url, messageText) {
  try {
    console.log(`   📍 Step 1: URL Resolution`);
    // Simulate URL resolution
    let resolvedUrl = url;
    if (url.includes('bitli.in') || url.includes('bit.ly') || url.includes('tinyurl.com')) {
      console.log(`   ⚠️  Shortened URL detected - would need resolution`);
      resolvedUrl = 'https://amazon.in/dp/simulated-product'; // Simulate resolution
    }
    console.log(`   ✅ Resolved to: ${resolvedUrl}`);
    
    console.log(`   📍 Step 2: Platform Detection`);
    let platform = 'unknown';
    if (resolvedUrl.includes('amazon')) platform = 'Amazon';
    else if (resolvedUrl.includes('flipkart')) platform = 'Flipkart';
    else if (resolvedUrl.includes('myntra')) platform = 'Myntra';
    console.log(`   ✅ Platform: ${platform}`);
    
    console.log(`   📍 Step 3: Scraping Simulation`);
    // This is where the URL processing service would fail for many URLs
    const scrapingSuccess = Math.random() > 0.7; // Simulate 30% success rate
    
    if (!scrapingSuccess) {
      console.log(`   ❌ Scraping failed - should fallback to basic extraction`);
      
      // Test basic extraction
      console.log(`   📍 Step 4: Basic Extraction Fallback`);
      const basicInfo = extractBasicProductInfo(messageText, [url]);
      console.log(`   📦 Basic extraction result:`, {
        title: basicInfo.title,
        price: basicInfo.price,
        originalPrice: basicInfo.originalPrice,
        discount: basicInfo.discount
      });
      
      return basicInfo;
    } else {
      console.log(`   ✅ Scraping successful - would return URL processing data`);
      return {
        success: true,
        productData: {
          name: 'Product from URL Processing',
          price: '999',
          originalPrice: '1299',
          discount: 23
        }
      };
    }
    
  } catch (error) {
    console.log(`   ❌ URL processing error: ${error.message}`);
    return null;
  }
}

// Simulate the basic product info extraction
function extractBasicProductInfo(message, urls) {
  console.log(`   🔍 Running basic extraction on: "${message.substring(0, 50)}..."`);
  
  // Price patterns from telegram-bot.ts
  const pricePatterns = [
    /₹(\d+(?:,\d+)*(?:\.\d+)?)\s*₹(\d+(?:,\d+)*(?:\.\d+)?)/g, // ₹X ₹Y format
    /₹(\d+(?:,\d+)*(?:\.\d+)?k?)/gi, // Single ₹ symbol
    /Deal\s*@\s*₹?(\d+(?:,\d+)*(?:\.\d+)?k?)/gi, // Deal @ format
    /Reg\s*@\s*₹?(\d+(?:,\d+)*(?:\.\d+)?k?)/gi, // Reg @ format
    /Price:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?k?)/gi, // Price: format
    /MRP:?\s*₹?(\d+(?:,\d+)*(?:\.\d+)?k?)/gi // MRP format
  ];
  
  let price = null;
  let originalPrice = null;
  let discount = null;
  
  // Test each pattern
  for (const pattern of pricePatterns) {
    const matches = [...message.matchAll(pattern)];
    if (matches.length > 0) {
      console.log(`   ✅ Pattern matched: ${pattern.source}`);
      console.log(`   📊 Matches:`, matches.map(m => m[0]));
      
      // Extract prices based on pattern
      if (pattern.source.includes('₹.*₹')) {
        // Two price format
        const match = matches[0];
        price = match[1];
        originalPrice = match[2];
      } else {
        // Single price format
        price = matches[0][1];
      }
      break;
    }
  }
  
  // Convert 'k' suffix
  if (price && price.toLowerCase().includes('k')) {
    price = (parseFloat(price.replace(/[,k]/gi, '')) * 1000).toString();
  }
  if (originalPrice && originalPrice.toLowerCase().includes('k')) {
    originalPrice = (parseFloat(originalPrice.replace(/[,k]/gi, '')) * 1000).toString();
  }
  
  // Calculate discount
  if (price && originalPrice) {
    const priceNum = parseFloat(price.replace(/,/g, ''));
    const originalPriceNum = parseFloat(originalPrice.replace(/,/g, ''));
    if (originalPriceNum > priceNum) {
      discount = Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
    }
  }
  
  // Extract title
  const lines = message.split('\n').filter(line => line.trim());
  let title = 'Product from Telegram';
  
  for (const line of lines) {
    const cleanLine = line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
    if (cleanLine && !cleanLine.startsWith('http') && cleanLine.length > 10) {
      title = cleanLine;
      break;
    }
  }
  
  return {
    title,
    price,
    originalPrice,
    discount,
    urls
  };
}

// Run the test
testUrlProcessing().catch(console.error);