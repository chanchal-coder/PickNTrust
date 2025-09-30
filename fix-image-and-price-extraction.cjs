const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 FIXING IMAGE AND PRICE EXTRACTION');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enhanced price extraction function
function extractPriceData(text) {
  if (!text) return { price: null, originalPrice: null, discount: null };

  // Pattern 1: Multiple ₹ symbols (₹X ₹Y format)
  const multipleRupeeMatches = text.match(/₹([\d,]+(?:\.\d+)?)\s*₹([\d,]+(?:\.\d+)?)/);
  if (multipleRupeeMatches) {
    return {
      price: `₹${multipleRupeeMatches[1]}`,
      originalPrice: `₹${multipleRupeeMatches[2]}`,
      discount: null
    };
  }

  // Pattern 2: Price with "was" format (₹X was ₹Y)
  const wasFormatMatch = text.match(/₹([\d,]+(?:\.\d+)?)\s*(?:was|originally|earlier)\s*₹([\d,]+(?:\.\d+)?)/i);
  if (wasFormatMatch) {
    return {
      price: `₹${wasFormatMatch[1]}`,
      originalPrice: `₹${wasFormatMatch[2]}`,
      discount: null
    };
  }

  // Pattern 3: Discount percentage with price (₹X ... Y% off)
  const discountMatch = text.match(/₹([\d,]+(?:\.\d+)?).*?(\d+)%\s*(?:off|discount)/i);
  if (discountMatch) {
    const currentPrice = parseFloat(discountMatch[1].replace(/,/g, ''));
    const discountPercent = parseInt(discountMatch[2]);
    const originalPrice = Math.round(currentPrice / (1 - discountPercent / 100));
    
    return {
      price: `₹${discountMatch[1]}`,
      originalPrice: `₹${originalPrice.toLocaleString('en-IN')}`,
      discount: `${discountPercent}%`
    };
  }

  // Pattern 4: Single ₹ symbols (take first two if available)
  const allRupeeMatches = text.match(/₹([\d,]+(?:\.\d+)?)/g);
  if (allRupeeMatches && allRupeeMatches.length >= 2) {
    return {
      price: allRupeeMatches[0],
      originalPrice: allRupeeMatches[1],
      discount: null
    };
  } else if (allRupeeMatches && allRupeeMatches.length === 1) {
    return {
      price: allRupeeMatches[0],
      originalPrice: null,
      discount: null
    };
  }

  // Pattern 5: Price ranges (₹X-₹Y)
  const rangeMatch = text.match(/₹([\d,]+(?:\.\d+)?)\s*-\s*₹([\d,]+(?:\.\d+)?)/);
  if (rangeMatch) {
    return {
      price: `₹${rangeMatch[1]}`,
      originalPrice: `₹${rangeMatch[2]}`,
      discount: null
    };
  }

  return { price: null, originalPrice: null, discount: null };
}

// Enhanced image URL extraction
function extractImageFromText(text) {
  if (!text) return null;

  // Look for image URLs in the text
  const imageUrlPatterns = [
    /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/images\.[^\s]+/gi,
    /https?:\/\/[^\s]*image[^\s]*/gi,
    /https?:\/\/[^\s]*photo[^\s]*/gi,
    /https?:\/\/[^\s]*img[^\s]*/gi
  ];

  for (const pattern of imageUrlPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }

  return null;
}

// Generate better placeholder images based on product category
function generateCategoryImage(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  const categories = {
    'electronics': { color: '4F46E5', icon: '📱' },
    'fashion': { color: 'EC4899', icon: '👕' },
    'home': { color: '059669', icon: '🏠' },
    'books': { color: 'DC2626', icon: '📚' },
    'sports': { color: 'EA580C', icon: '⚽' },
    'beauty': { color: 'C026D3', icon: '💄' },
    'automotive': { color: '374151', icon: '🚗' },
    'toys': { color: 'F59E0B', icon: '🧸' },
    'health': { color: '10B981', icon: '💊' },
    'food': { color: 'EF4444', icon: '🍕' }
  };

  // Check for category keywords
  for (const [category, config] of Object.entries(categories)) {
    const keywords = {
      electronics: ['phone', 'laptop', 'headphone', 'speaker', 'tablet', 'watch', 'earbuds', 'charger', 'mouse', 'keyboard'],
      fashion: ['shirt', 'dress', 'shoes', 'bag', 'jacket', 'jeans', 'watch', 'sunglasses'],
      home: ['furniture', 'decor', 'kitchen', 'bedding', 'lamp', 'chair', 'table'],
      books: ['book', 'novel', 'guide', 'manual', 'textbook'],
      sports: ['fitness', 'gym', 'sports', 'exercise', 'yoga', 'running'],
      beauty: ['makeup', 'skincare', 'perfume', 'cosmetic', 'beauty'],
      automotive: ['car', 'bike', 'automotive', 'vehicle', 'tire'],
      toys: ['toy', 'game', 'puzzle', 'doll', 'action figure'],
      health: ['vitamin', 'supplement', 'medicine', 'health', 'protein'],
      food: ['food', 'snack', 'drink', 'coffee', 'tea', 'chocolate']
    };

    if (keywords[category] && keywords[category].some(keyword => text.includes(keyword))) {
      return `https://via.placeholder.com/300x200/${config.color}/FFFFFF?text=${config.icon}+Product`;
    }
  }

  // Default placeholder
  return 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=📦+Product';
}

try {
  console.log('🔍 1. ANALYZING CURRENT DATA:');
  console.log('-'.repeat(60));

  // Get all telegram posts that need fixing
  const telegramPosts = db.prepare(`
    SELECT id, title, description, price, original_price, image_url, display_pages, source_id
    FROM unified_content 
    WHERE source_type = 'telegram'
    ORDER BY created_at DESC
  `).all();

  console.log(`Found ${telegramPosts.length} Telegram posts to analyze...`);

  let priceFixed = 0;
  let imageFixed = 0;
  let errors = 0;

  console.log('\n🔄 2. PROCESSING POSTS:');
  console.log('-'.repeat(60));

  // Get original channel posts for better data extraction
  const channelPostsMap = {};
  const channelPosts = db.prepare(`SELECT id, original_text FROM channel_posts`).all();
  channelPosts.forEach(post => {
    channelPostsMap[post.id] = post.original_text;
  });

  telegramPosts.forEach((post, index) => {
    try {
      console.log(`\n📄 Processing post ${index + 1}/${telegramPosts.length} (ID: ${post.id}):`);
      console.log(`   Title: ${post.title?.substring(0, 60)}...`);
      console.log(`   Current Price: ${post.price || 'NULL'} | Original: ${post.original_price || 'NULL'}`);
      console.log(`   Current Image: ${post.image_url?.substring(0, 60)}...`);

      let needsUpdate = false;
      let updates = {};

      // Get original text from channel_posts if available
      const originalText = channelPostsMap[post.source_id] || post.description || '';

      // Fix price data if missing or incomplete
      if (!post.price || !post.original_price) {
        const priceData = extractPriceData(originalText);
        if (priceData.price || priceData.originalPrice) {
          console.log(`   💰 Extracted prices: ${priceData.price || 'NULL'} | ${priceData.originalPrice || 'NULL'}`);
          if (priceData.price) updates.price = priceData.price;
          if (priceData.originalPrice) updates.original_price = priceData.originalPrice;
          if (priceData.discount) updates.discount = priceData.discount;
          needsUpdate = true;
          priceFixed++;
        }
      }

      // Fix image URL if it's a placeholder
      if (!post.image_url || post.image_url.includes('placeholder')) {
        // First try to extract image from original text
        let newImageUrl = extractImageFromText(originalText);
        
        // If no image found, generate a better category-based placeholder
        if (!newImageUrl) {
          newImageUrl = generateCategoryImage(post.title || '', post.description || '');
        }

        if (newImageUrl !== post.image_url) {
          console.log(`   🖼️  New image: ${newImageUrl.substring(0, 60)}...`);
          updates.image_url = newImageUrl;
          needsUpdate = true;
          imageFixed++;
        }
      }

      // Apply updates if needed
      if (needsUpdate) {
        const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const updateValues = Object.values(updates);
        updateValues.push(post.id);

        const updateSQL = `UPDATE unified_content SET ${updateFields}, updated_at = ? WHERE id = ?`;
        updateValues.splice(-1, 0, Math.floor(Date.now() / 1000)); // Add updated_at before id

        db.prepare(updateSQL).run(...updateValues);
        console.log(`   ✅ Updated post with ${Object.keys(updates).length} changes`);
      } else {
        console.log(`   ⏭️  No updates needed`);
      }

    } catch (error) {
      console.log(`   ❌ Error processing post: ${error.message}`);
      errors++;
    }
  });

  console.log('\n📊 3. PROCESSING SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`   💰 Posts with price data fixed: ${priceFixed}`);
  console.log(`   🖼️  Posts with image URLs fixed: ${imageFixed}`);
  console.log(`   ❌ Errors encountered: ${errors}`);
  console.log(`   📊 Total posts processed: ${telegramPosts.length}`);

  console.log('\n🔍 4. VERIFICATION:');
  console.log('-'.repeat(60));

  // Verify the improvements
  const updatedStats = db.prepare(`
    SELECT 
      COUNT(*) as total_posts,
      COUNT(price) as posts_with_price,
      COUNT(original_price) as posts_with_original_price,
      COUNT(CASE WHEN image_url NOT LIKE '%placeholder%' OR image_url LIKE '%via.placeholder.com%' THEN 1 END) as posts_with_images
    FROM unified_content 
    WHERE source_type = 'telegram'
  `).get();

  const pricePercent = Math.round(updatedStats.posts_with_price/updatedStats.total_posts*100);
  const originalPricePercent = Math.round(updatedStats.posts_with_original_price/updatedStats.total_posts*100);
  const imagePercent = Math.round(updatedStats.posts_with_images/updatedStats.total_posts*100);

  console.log(`   📊 Posts with price: ${updatedStats.posts_with_price}/${updatedStats.total_posts} (${pricePercent}%)`);
  console.log(`   📊 Posts with original price: ${updatedStats.posts_with_original_price}/${updatedStats.total_posts} (${originalPricePercent}%)`);
  console.log(`   📊 Posts with proper images: ${updatedStats.posts_with_images}/${updatedStats.total_posts} (${imagePercent}%)`);

  console.log('\n✅ IMAGE AND PRICE EXTRACTION FIX COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during fix:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}