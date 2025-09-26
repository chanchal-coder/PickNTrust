const Database = require('better-sqlite3');
const path = require('path');

console.log('🚀 ENHANCING TELEGRAM MESSAGE PROCESSING');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enhanced price extraction function (improved version)
function extractAdvancedPriceData(text) {
  if (!text) return { price: null, originalPrice: null, discount: null };

  console.log(`   🔍 Analyzing text for prices: "${text.substring(0, 100)}..."`);

  // Pattern 1: Deal @ price and Reg @ price format
  const dealRegPattern = /Deal\s*@\s*₹?([\d,]+(?:\.\d+)?)(k?)\s*.*?Reg\s*@\s*₹?([\d,]+(?:\.\d+)?)(k?)/i;
  const dealRegMatch = text.match(dealRegPattern);
  if (dealRegMatch) {
    let dealPrice = dealRegMatch[1];
    let regPrice = dealRegMatch[3];
    
    // Handle 'k' suffix
    if (dealRegMatch[2] && dealRegMatch[2].toLowerCase() === 'k') {
      dealPrice = (parseFloat(dealPrice.replace(/,/g, '')) * 1000).toString();
    }
    if (dealRegMatch[4] && dealRegMatch[4].toLowerCase() === 'k') {
      regPrice = (parseFloat(regPrice.replace(/,/g, '')) * 1000).toString();
    }
    
    console.log(`   💰 Found Deal/Reg pattern: Deal ₹${dealPrice}, Reg ₹${regPrice}`);
    return {
      price: `₹${dealPrice}`,
      originalPrice: `₹${regPrice}`,
      discount: null
    };
  }

  // Pattern 2: Multiple ₹ symbols in sequence (₹X ₹Y format)
  const multipleRupeePattern = /₹([\d,]+(?:\.\d+)?)(k?)\s*₹([\d,]+(?:\.\d+)?)(k?)/;
  const multipleRupeeMatch = text.match(multipleRupeePattern);
  if (multipleRupeeMatch) {
    let price1 = multipleRupeeMatch[1];
    let price2 = multipleRupeeMatch[3];
    
    // Handle 'k' suffix
    if (multipleRupeeMatch[2] && multipleRupeeMatch[2].toLowerCase() === 'k') {
      price1 = (parseFloat(price1.replace(/,/g, '')) * 1000).toString();
    }
    if (multipleRupeeMatch[4] && multipleRupeeMatch[4].toLowerCase() === 'k') {
      price2 = (parseFloat(price2.replace(/,/g, '')) * 1000).toString();
    }
    
    console.log(`   💰 Found multiple ₹ pattern: ₹${price1}, ₹${price2}`);
    return {
      price: `₹${price1}`,
      originalPrice: `₹${price2}`,
      discount: null
    };
  }

  // Pattern 3: Price with discount percentage
  const priceDiscountPattern = /₹([\d,]+(?:\.\d+)?)(k?)\s*.*?(\d+)%\s*(?:off|discount)/i;
  const priceDiscountMatch = text.match(priceDiscountPattern);
  if (priceDiscountMatch) {
    let currentPrice = priceDiscountMatch[1];
    const discountPercent = parseInt(priceDiscountMatch[3]);
    
    // Handle 'k' suffix
    if (priceDiscountMatch[2] && priceDiscountMatch[2].toLowerCase() === 'k') {
      currentPrice = (parseFloat(currentPrice.replace(/,/g, '')) * 1000).toString();
    }
    
    const currentPriceNum = parseFloat(currentPrice.replace(/,/g, ''));
    const originalPrice = Math.round(currentPriceNum / (1 - discountPercent / 100));
    
    console.log(`   💰 Found price with discount: ₹${currentPrice} (${discountPercent}% off), calculated original: ₹${originalPrice}`);
    return {
      price: `₹${currentPrice}`,
      originalPrice: `₹${originalPrice.toLocaleString('en-IN')}`,
      discount: `${discountPercent}%`
    };
  }

  // Pattern 4: All ₹ symbols (take first two if available)
  const allRupeeMatches = text.match(/₹([\d,]+(?:\.\d+)?)(k?)/g);
  if (allRupeeMatches && allRupeeMatches.length >= 2) {
    const firstMatch = allRupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)(k?)/);
    const secondMatch = allRupeeMatches[1].match(/₹([\d,]+(?:\.\d+)?)(k?)/);
    
    let price1 = firstMatch[1];
    let price2 = secondMatch[1];
    
    // Handle 'k' suffix
    if (firstMatch[2] && firstMatch[2].toLowerCase() === 'k') {
      price1 = (parseFloat(price1.replace(/,/g, '')) * 1000).toString();
    }
    if (secondMatch[2] && secondMatch[2].toLowerCase() === 'k') {
      price2 = (parseFloat(price2.replace(/,/g, '')) * 1000).toString();
    }
    
    console.log(`   💰 Found multiple ₹ symbols: ₹${price1}, ₹${price2}`);
    return {
      price: `₹${price1}`,
      originalPrice: `₹${price2}`,
      discount: null
    };
  } else if (allRupeeMatches && allRupeeMatches.length === 1) {
    const singleMatch = allRupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)(k?)/);
    let price = singleMatch[1];
    
    // Handle 'k' suffix
    if (singleMatch[2] && singleMatch[2].toLowerCase() === 'k') {
      price = (parseFloat(price.replace(/,/g, '')) * 1000).toString();
    }
    
    console.log(`   💰 Found single ₹ symbol: ₹${price}`);
    return {
      price: `₹${price}`,
      originalPrice: null,
      discount: null
    };
  }

  // Pattern 5: MRP format
  const mrpPattern = /MRP\s*:?\s*₹?([\d,]+(?:\.\d+)?)(k?)/i;
  const mrpMatch = text.match(mrpPattern);
  if (mrpMatch) {
    let mrpPrice = mrpMatch[1];
    
    // Handle 'k' suffix
    if (mrpMatch[2] && mrpMatch[2].toLowerCase() === 'k') {
      mrpPrice = (parseFloat(mrpPrice.replace(/,/g, '')) * 1000).toString();
    }
    
    console.log(`   💰 Found MRP: ₹${mrpPrice}`);
    return {
      price: null,
      originalPrice: `₹${mrpPrice}`,
      discount: null
    };
  }

  console.log(`   ❌ No price patterns found`);
  return { price: null, originalPrice: null, discount: null };
}

// Enhanced image extraction function
function extractAdvancedImageUrl(text) {
  if (!text) return null;

  console.log(`   🖼️  Analyzing text for image URLs: "${text.substring(0, 100)}..."`);

  // Enhanced image URL patterns
  const imageUrlPatterns = [
    // Direct image URLs
    /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s]*)?/gi,
    // Amazon image URLs
    /https?:\/\/[^\s]*amazon[^\s]*\/images\/[^\s]+/gi,
    // Flipkart image URLs  
    /https?:\/\/[^\s]*flipkart[^\s]*\/image[^\s]+/gi,
    // Generic image hosting
    /https?:\/\/[^\s]*(?:images|img|photo|pic)[^\s]*/gi,
    // Media URLs
    /https?:\/\/[^\s]*media[^\s]*\.[^\s]+/gi
  ];

  for (const pattern of imageUrlPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const imageUrl = matches[0].replace(/[.,;!?]+$/, ''); // Remove trailing punctuation
      console.log(`   🖼️  Found image URL: ${imageUrl.substring(0, 60)}...`);
      return imageUrl;
    }
  }

  console.log(`   ❌ No image URLs found`);
  return null;
}

// Enhanced title extraction function
function extractAdvancedTitle(text) {
  if (!text) return 'Product from Telegram';

  console.log(`   📝 Analyzing text for title: "${text.substring(0, 100)}..."`);

  const lines = text.split('\n').filter(line => line.trim());
  
  // Product keywords for better detection
  const productKeywords = [
    'headphones', 'mouse', 'watch', 'laptop', 'phone', 'smartphone', 'tablet', 
    'camera', 'speaker', 'earbuds', 'charger', 'cable', 'adapter', 'keyboard', 
    'monitor', 'tv', 'television', 'gaming', 'wireless', 'bluetooth', 'smart', 
    'premium', 'pro', 'max', 'mini', 'ultra', 'edition', 'series', 'model',
    'chair', 'table', 'bag', 'shoes', 'shirt', 'dress', 'kurta', 'saree'
  ];

  // Look for product-specific lines first
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
        cleanLine.length < 8) {
      continue;
    }
    
    // Check if line contains product keywords or looks like a product name
    const lowerLine = cleanLine.toLowerCase();
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const looksLikeProductName = cleanLine.length > 15 && cleanLine.length < 100 && 
                                /[a-zA-Z]/.test(cleanLine) && 
                                !cleanLine.match(/^[🔥🎉💥⚡️✨🎯🚀💰❌✅\s]+$/);
    
    if (hasProductKeyword || looksLikeProductName) {
      console.log(`   📝 Found product title: "${cleanLine}"`);
      return cleanLine;
    }
  }

  // Fallback to first meaningful line
  const meaningfulLines = lines
    .map(line => line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim())
    .filter(line => 
      !line.startsWith('http') && 
      line.length > 8 && 
      line.length < 100 &&
      !line.includes('Deal @') &&
      !line.includes('Reg @') &&
      !line.includes('Price:') &&
      !line.includes('MRP') &&
      !line.includes('₹') &&
      !line.includes('%') &&
      !line.toLowerCase().includes('off') &&
      !line.toLowerCase().includes('discount') &&
      /[a-zA-Z]/.test(line)
    );

  if (meaningfulLines.length > 0) {
    const title = meaningfulLines.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
    console.log(`   📝 Using fallback title: "${title}"`);
    return title;
  }

  console.log(`   📝 Using default title`);
  return 'Product from Telegram';
}

try {
  console.log('🔍 1. ANALYZING TELEGRAM POSTS FOR ENHANCEMENT:');
  console.log('-'.repeat(60));

  // Get all channel posts that need processing
  const channelPosts = db.prepare(`
    SELECT id, original_text, channel_name, message_id
    FROM channel_posts 
    ORDER BY created_at DESC
  `).all();

  console.log(`Found ${channelPosts.length} channel posts to analyze...`);

  let enhanced = 0;
  let errors = 0;

  console.log('\n🔄 2. ENHANCING CHANNEL POSTS:');
  console.log('-'.repeat(60));

  channelPosts.forEach((post, index) => {
    try {
      console.log(`\n📄 Processing channel post ${index + 1}/${channelPosts.length} (ID: ${post.id}):`);
      console.log(`   Channel: ${post.channel_name}`);
      console.log(`   Message ID: ${post.message_id}`);

      const originalText = post.original_text || '';
      
      // Extract enhanced data
      const priceData = extractAdvancedPriceData(originalText);
      const imageUrl = extractAdvancedImageUrl(originalText);
      const title = extractAdvancedTitle(originalText);

      // Check if we found any enhancements
      const hasEnhancements = priceData.price || priceData.originalPrice || imageUrl || 
                             (title && title !== 'Product from Telegram');

      if (hasEnhancements) {
        console.log(`   ✅ Enhancements found:`);
        if (priceData.price) console.log(`      💰 Price: ${priceData.price}`);
        if (priceData.originalPrice) console.log(`      💰 Original Price: ${priceData.originalPrice}`);
        if (priceData.discount) console.log(`      💰 Discount: ${priceData.discount}`);
        if (imageUrl) console.log(`      🖼️  Image: ${imageUrl.substring(0, 60)}...`);
        if (title !== 'Product from Telegram') console.log(`      📝 Title: ${title.substring(0, 60)}...`);

        // Update the channel_posts record with enhanced data
        const updateFields = [];
        const updateValues = [];

        if (priceData.price) {
          updateFields.push('extracted_price = ?');
          updateValues.push(priceData.price);
        }
        if (priceData.originalPrice) {
          updateFields.push('extracted_original_price = ?');
          updateValues.push(priceData.originalPrice);
        }
        if (priceData.discount) {
          updateFields.push('extracted_discount = ?');
          updateValues.push(priceData.discount);
        }
        if (imageUrl) {
          updateFields.push('image_url = ?');
          updateValues.push(imageUrl);
        }
        if (title !== 'Product from Telegram') {
          updateFields.push('extracted_title = ?');
          updateValues.push(title);
        }

        if (updateFields.length > 0) {
          updateValues.push(post.id);
          const updateSQL = `UPDATE channel_posts SET ${updateFields.join(', ')} WHERE id = ?`;
          
          try {
            db.prepare(updateSQL).run(...updateValues);
            enhanced++;
            console.log(`   ✅ Channel post enhanced with ${updateFields.length} improvements`);
          } catch (dbError) {
            console.log(`   ⚠️  Database update failed: ${dbError.message}`);
            // Try to add columns if they don't exist
            try {
              db.prepare('ALTER TABLE channel_posts ADD COLUMN extracted_price TEXT').run();
            } catch {}
            try {
              db.prepare('ALTER TABLE channel_posts ADD COLUMN extracted_original_price TEXT').run();
            } catch {}
            try {
              db.prepare('ALTER TABLE channel_posts ADD COLUMN extracted_discount TEXT').run();
            } catch {}
            try {
              db.prepare('ALTER TABLE channel_posts ADD COLUMN extracted_title TEXT').run();
            } catch {}
            
            // Try update again
            try {
              db.prepare(updateSQL).run(...updateValues);
              enhanced++;
              console.log(`   ✅ Channel post enhanced after adding columns`);
            } catch (retryError) {
              console.log(`   ❌ Failed to enhance after retry: ${retryError.message}`);
              errors++;
            }
          }
        }
      } else {
        console.log(`   ⏭️  No enhancements found`);
      }

    } catch (error) {
      console.log(`   ❌ Error processing post: ${error.message}`);
      errors++;
    }
  });

  console.log('\n📊 3. ENHANCEMENT SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`   ✅ Posts enhanced: ${enhanced}`);
  console.log(`   ❌ Errors encountered: ${errors}`);
  console.log(`   📊 Total posts processed: ${channelPosts.length}`);

  console.log('\n🔄 4. UPDATING UNIFIED CONTENT WITH ENHANCED DATA:');
  console.log('-'.repeat(60));

  // Now update unified_content with the enhanced channel_posts data
  const enhancedChannelPosts = db.prepare(`
    SELECT cp.id, cp.extracted_price, cp.extracted_original_price, cp.extracted_discount, 
           cp.image_url, cp.extracted_title, uc.id as unified_id
    FROM channel_posts cp
    JOIN unified_content uc ON uc.source_id = cp.id AND uc.source_type = 'telegram'
    WHERE (cp.extracted_price IS NOT NULL OR cp.extracted_original_price IS NOT NULL OR 
           cp.image_url IS NOT NULL OR cp.extracted_title IS NOT NULL)
  `).all();

  console.log(`Found ${enhancedChannelPosts.length} unified_content records to update...`);

  let unifiedUpdated = 0;
  enhancedChannelPosts.forEach((post, index) => {
    try {
      console.log(`\n📄 Updating unified_content ${index + 1}/${enhancedChannelPosts.length} (ID: ${post.unified_id}):`);

      const updateFields = [];
      const updateValues = [];

      if (post.extracted_price) {
        updateFields.push('price = ?');
        updateValues.push(post.extracted_price);
        console.log(`   💰 Setting price: ${post.extracted_price}`);
      }
      if (post.extracted_original_price) {
        updateFields.push('original_price = ?');
        updateValues.push(post.extracted_original_price);
        console.log(`   💰 Setting original price: ${post.extracted_original_price}`);
      }
      if (post.extracted_discount) {
        updateFields.push('discount = ?');
        updateValues.push(post.extracted_discount);
        console.log(`   💰 Setting discount: ${post.extracted_discount}`);
      }
      if (post.image_url && !post.image_url.includes('placeholder')) {
        updateFields.push('image_url = ?');
        updateValues.push(post.image_url);
        console.log(`   🖼️  Setting image: ${post.image_url.substring(0, 60)}...`);
      }
      if (post.extracted_title) {
        updateFields.push('title = ?');
        updateValues.push(post.extracted_title);
        console.log(`   📝 Setting title: ${post.extracted_title.substring(0, 60)}...`);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = ?');
        updateValues.push(Math.floor(Date.now() / 1000));
        updateValues.push(post.unified_id);

        const updateSQL = `UPDATE unified_content SET ${updateFields.join(', ')} WHERE id = ?`;
        db.prepare(updateSQL).run(...updateValues);
        unifiedUpdated++;
        console.log(`   ✅ Updated unified_content with ${updateFields.length - 1} improvements`);
      }

    } catch (error) {
      console.log(`   ❌ Error updating unified_content: ${error.message}`);
      errors++;
    }
  });

  console.log('\n📊 4. UNIFIED CONTENT UPDATE SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`   ✅ Unified content records updated: ${unifiedUpdated}`);
  console.log(`   📊 Total enhanced posts processed: ${enhancedChannelPosts.length}`);

  console.log('\n✅ TELEGRAM PROCESSING ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during enhancement:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}