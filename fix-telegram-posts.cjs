const Database = require('better-sqlite3');
const path = require('path');

// Fix failed Telegram posts by reprocessing them with improved extraction logic

async function fixTelegramPosts() {
  console.log('🔧 Fixing Failed Telegram Posts...\n');
  
  try {
    // Connect to database
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    // Get failed posts that need reprocessing
    const failedPosts = db.prepare(`
      SELECT * FROM channel_posts 
      WHERE is_processed = 0 OR processing_error IS NOT NULL
      ORDER BY created_at DESC
    `).all();
    
    console.log(`📊 Found ${failedPosts.length} failed posts to reprocess\n`);
    
    if (failedPosts.length === 0) {
      console.log('✅ No failed posts found');
      db.close();
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const post of failedPosts) {
      console.log(`🔄 Processing post ${post.message_id}...`);
      
      try {
        // Extract product info using improved logic
        const productInfo = extractProductInfo(post.original_text);
        
        if (!productInfo.title || productInfo.title === 'Product from Telegram') {
          console.log(`⚠️ Skipping post ${post.message_id} - no meaningful title extracted`);
          continue;
        }
        
        // Save to unified_content
        const productId = await saveProductToDatabase(productInfo, post);
        
        if (productId) {
          // Update channel_posts status
          db.prepare(`
            UPDATE channel_posts 
            SET is_processed = 1, 
                processed_at = ?, 
                processing_error = NULL,
                extracted_title = ?,
                extracted_price = ?,
                extracted_original_price = ?,
                extracted_discount = ?
            WHERE id = ?
          `).run(
            Math.floor(Date.now() / 1000),
            productInfo.title,
            productInfo.price,
            productInfo.originalPrice,
            productInfo.discount,
            post.id
          );
          
          console.log(`✅ Successfully processed post ${post.message_id} -> Product ID: ${productId}`);
          successCount++;
        } else {
          console.log(`❌ Failed to save product for post ${post.message_id}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.message_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 PROCESSING SUMMARY:`);
    console.log(`- Successfully processed: ${successCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total: ${failedPosts.length}`);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error during processing:', error);
  }
}

// Enhanced product info extraction
function extractProductInfo(message, urls) {
  // Handle URL-only posts by attempting to extract product info from URL
  if (message.trim().startsWith('http') && message.trim().split('\n').length === 1) {
    const url = message.trim();
    let title = 'Product from Telegram';
    
    // Try to extract product info from URL patterns
    if (url.includes('amazon.in') || url.includes('amzn.to')) {
      // Extract from Amazon URL patterns
      const dpMatch = url.match(/\/dp\/([A-Z0-9]+)/);
      const keywordMatch = url.match(/keywords=([^&]+)/);
      
      if (keywordMatch) {
        title = decodeURIComponent(keywordMatch[1]).replace(/[+_-]/g, ' ').trim();
      } else if (dpMatch) {
        title = `Amazon Product ${dpMatch[1]}`;
      } else {
        title = 'Amazon Product';
      }
    } else if (url.includes('flipkart.com') || url.includes('fkrt.cc')) {
      title = 'Flipkart Product';
    } else if (url.includes('myntra.com')) {
      title = 'Myntra Product';
    } else if (url.includes('nykaa.com')) {
      title = 'Nykaa Product';
    }
    
    return {
      title,
      description: `Product available at: ${url}`,
      price: null,
      originalPrice: null,
      discount: null
    };
  }

  // Enhanced title extraction logic for posts with content
  const lines = message.split('\n').filter(line => line.trim());
  let title, price, originalPrice, discount;
  
  // Enhanced title extraction
  const productKeywords = ['headphones', 'mouse', 'watch', 'laptop', 'phone', 'smartphone', 'tablet', 'camera', 'speaker', 'earbuds', 'charger', 'cable', 'adapter', 'keyboard', 'monitor', 'tv', 'television', 'gaming', 'wireless', 'bluetooth', 'smart', 'premium', 'pro', 'max', 'mini', 'ultra', 'edition', 'series', 'model', 'chair', 'desk', 'stand', 'holder', 'case', 'cover', 'screen', 'display'];
  
  for (const line of lines) {
    const cleanLine = line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
    
    // Skip lines that are clearly not product names
    if (cleanLine.startsWith('http') || 
        cleanLine.includes('Deal @') || 
        cleanLine.includes('Reg @') || 
        cleanLine.includes('Price:') || 
        cleanLine.includes('MRP') ||
        cleanLine.includes('₹') ||
        cleanLine.includes('%') ||
        cleanLine.toLowerCase().includes('off') ||
        cleanLine.toLowerCase().includes('discount') ||
        cleanLine.toLowerCase().includes('save') ||
        cleanLine.toLowerCase().includes('limited') ||
        cleanLine.toLowerCase().includes('flash sale') ||
        cleanLine.toLowerCase().includes('apply') ||
        cleanLine.toLowerCase().includes('coupon') ||
        cleanLine.toLowerCase().includes('link:') ||
        cleanLine.length < 8) {
      continue;
    }
    
    // Check if line contains product keywords or looks like a product name
    const lowerLine = cleanLine.toLowerCase();
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const looksLikeProductName = cleanLine.length > 15 && cleanLine.length < 150 && 
                                /[a-zA-Z]/.test(cleanLine) && 
                                !cleanLine.match(/^[🔥🎉💥⚡️✨🎯🚀💰❌✅\s]+$/);
    
    if (hasProductKeyword || looksLikeProductName) {
      title = cleanLine;
      break;
    }
  }
  
  // Fallback title extraction
  if (!title) {
    const meaningfulLines = lines
      .map(line => line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim())
      .filter(line => 
        !line.startsWith('http') && 
        line.length > 8 && 
        line.length < 150 &&
        !line.includes('Deal @') &&
        !line.includes('Reg @') &&
        !line.includes('Price:') &&
        !line.includes('MRP') &&
        !line.includes('₹') &&
        !line.includes('%') &&
        !line.toLowerCase().includes('off') &&
        !line.toLowerCase().includes('discount') &&
        !line.toLowerCase().includes('save') &&
        !line.toLowerCase().includes('limited') &&
        !line.toLowerCase().includes('flash sale') &&
        !line.toLowerCase().includes('apply') &&
        !line.toLowerCase().includes('coupon') &&
        !line.toLowerCase().includes('link:') &&
        /[a-zA-Z]/.test(line)
      );
    
    if (meaningfulLines.length > 0) {
      title = meaningfulLines.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    }
  }
  
  // Enhanced price extraction
  // Pattern 1: Deal @ price format
  const dealPriceMatch = message.match(/Deal\s*@\s*₹?([\d,]+(?:\.\d+)?)/i);
  if (dealPriceMatch) {
    price = dealPriceMatch[1].replace(/,/g, '');
  }
  
  // Pattern 2: Reg @ price format (original price)
  const regPriceMatch = message.match(/Reg\s*@\s*₹?([\d,]+(?:\.\d+)?)/i);
  if (regPriceMatch) {
    originalPrice = regPriceMatch[1].replace(/,/g, '');
  }
  
  // Pattern 3: Multiple ₹ symbols
  if (!price) {
    const multipleRupeeMatches = message.match(/₹([\d,]+(?:\.\d+)?)\s*₹([\d,]+(?:\.\d+)?)/g);
    if (multipleRupeeMatches) {
      const matches = multipleRupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)\s*₹([\d,]+(?:\.\d+)?)/);
      if (matches) {
        const price1 = parseFloat(matches[1].replace(/,/g, ''));
        const price2 = parseFloat(matches[2].replace(/,/g, ''));
        
        if (price1 < price2) {
          price = matches[1].replace(/,/g, '');
          originalPrice = matches[2].replace(/,/g, '');
        } else {
          price = matches[2].replace(/,/g, '');
          originalPrice = matches[1].replace(/,/g, '');
        }
      }
    }
  }
  
  // Pattern 4: Single ₹ price
  if (!price) {
    const singlePriceMatch = message.match(/₹([\d,]+(?:\.\d+)?)/);
    if (singlePriceMatch) {
      price = singlePriceMatch[1].replace(/,/g, '');
    }
  }
  
  // Calculate discount
  if (price && originalPrice) {
    const priceNum = parseFloat(price);
    const originalPriceNum = parseFloat(originalPrice);
    if (originalPriceNum > priceNum) {
      discount = Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
    }
  }
  
  return {
    title: title || 'Product from Telegram',
    price: price,
    originalPrice: originalPrice,
    discount: discount ? `${discount}%` : null,
    description: message.substring(0, 200) + (message.length > 200 ? '...' : '')
  };
}

// Save product to database
async function saveProductToDatabase(productInfo, channelPost) {
  try {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    // Extract numeric price values
    const numericPrice = productInfo.price ? parseFloat(productInfo.price) : 0;
    const numericOriginalPrice = productInfo.originalPrice ? parseFloat(productInfo.originalPrice) : null;
    
    // Calculate discount if both prices are available
    const discount = (numericOriginalPrice && numericPrice && numericOriginalPrice > numericPrice) 
      ? Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100)
      : null;
    
    const insertSQL = `
      INSERT INTO unified_content (
        title, description, price, original_price, image_url, affiliate_url,
        content_type, page_type, category, subcategory, source_type, source_id,
        affiliate_platform, rating, review_count, discount, currency, gender,
        is_active, is_featured, display_order, display_pages,
        has_timer, timer_duration, timer_start_time, created_at, updated_at,
        processing_status, content, source_platform, affiliate_urls, status, visibility, media_urls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const pageSlug = channelPost.website_page || 'prime-picks';
    const extractedUrls = JSON.parse(channelPost.extracted_urls || '[]');
    
    const values = [
      productInfo.title,
      productInfo.description || '',
      numericPrice.toString(),
      numericOriginalPrice?.toString() || null,
      channelPost.image_url || 'https://via.placeholder.com/300x300?text=Product',
      extractedUrls[0] || '',
      'product',
      pageSlug,
      pageSlug,
      null, // subcategory
      'telegram',
      channelPost.id.toString(),
      'amazon',
      '4.0',
      100,
      discount,
      'INR',
      null, // gender
      1, // is_active
      0, // is_featured
      0, // display_order
      JSON.stringify([pageSlug]),
      0, // has_timer
      null, // timer_duration
      null, // timer_start_time
      Math.floor(Date.now() / 1000), // created_at
      Math.floor(Date.now() / 1000), // updated_at
      'active', // processing_status
      null, // content
      'telegram', // source_platform
      null, // affiliate_urls
      'active', // status
      'public', // visibility
      null // media_urls
    ];
    
    const result = db.prepare(insertSQL).run(...values);
    db.close();
    
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error('Error saving product to database:', error);
    return null;
  }
}

// Run the fix
fixTelegramPosts().catch(console.error);