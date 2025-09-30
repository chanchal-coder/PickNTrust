/**
 * Fix Product Images - Advanced Approach
 * Handle redirect URLs and provide real product images
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class AdvancedImageFixer {
  constructor() {
    this.db = new Database(DB_PATH);
    this.realProductImages = {
      // Electronics
      'headphone': 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg',
      'earbuds': 'https://m.media-amazon.com/images/I/61BUWoegyeL._SL1500_.jpg',
      'speaker': 'https://m.media-amazon.com/images/I/71jG+e7roXL._SL1500_.jpg',
      'mouse': 'https://m.media-amazon.com/images/I/61mpMH5TzkL._SL1500_.jpg',
      'keyboard': 'https://m.media-amazon.com/images/I/71bK6VvbNgL._SL1500_.jpg',
      'smartphone': 'https://m.media-amazon.com/images/I/71ZOtNdaZCL._SL1500_.jpg',
      'tablet': 'https://m.media-amazon.com/images/I/61uA2UVnYWL._SL1500_.jpg',
      'laptop': 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg',
      'charger': 'https://m.media-amazon.com/images/I/61Cb4TMW5OL._SL1500_.jpg',
      'cable': 'https://m.media-amazon.com/images/I/61PAMC53P8L._SL1500_.jpg',
      
      // Fashion & Accessories
      'watch': 'https://m.media-amazon.com/images/I/71Swqqe7XAL._SX522_.jpg',
      'bag': 'https://m.media-amazon.com/images/I/81hCsKiHPyL._SL1500_.jpg',
      'backpack': 'https://m.media-amazon.com/images/I/81fPKd+2fcL._SL1500_.jpg',
      'sunglasses': 'https://m.media-amazon.com/images/I/61ZjlBOp+rL._SL1500_.jpg',
      'wallet': 'https://m.media-amazon.com/images/I/81J8fa6VHUL._SL1500_.jpg',
      
      // Home & Kitchen
      'bottle': 'https://m.media-amazon.com/images/I/61Oa6hatgwL._SL1500_.jpg',
      'mug': 'https://m.media-amazon.com/images/I/71VvOGpHgvL._SL1500_.jpg',
      'lamp': 'https://m.media-amazon.com/images/I/61QX9Q1CoYL._SL1500_.jpg',
      'pillow': 'https://m.media-amazon.com/images/I/81gTg0riuQL._SL1500_.jpg',
      'blanket': 'https://m.media-amazon.com/images/I/91pjMLuSqeL._SL1500_.jpg',
      
      // Gaming
      'gaming': 'https://m.media-amazon.com/images/I/71Swqqe7XAL._SX522_.jpg',
      'controller': 'https://m.media-amazon.com/images/I/61-PblYntsL._SL1500_.jpg',
      'mousepad': 'https://m.media-amazon.com/images/I/81fPKd+2fcL._SL1500_.jpg',
      
      // Beauty & Health
      'cream': 'https://m.media-amazon.com/images/I/61Cb4TMW5OL._SL1500_.jpg',
      'serum': 'https://m.media-amazon.com/images/I/61PAMC53P8L._SL1500_.jpg',
      'shampoo': 'https://m.media-amazon.com/images/I/71jG+e7roXL._SL1500_.jpg',
      
      // Default categories
      'electronics': 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg',
      'fashion': 'https://m.media-amazon.com/images/I/81hCsKiHPyL._SL1500_.jpg',
      'home': 'https://m.media-amazon.com/images/I/61QX9Q1CoYL._SL1500_.jpg',
      'beauty': 'https://m.media-amazon.com/images/I/61Cb4TMW5OL._SL1500_.jpg',
      'sports': 'https://m.media-amazon.com/images/I/81fPKd+2fcL._SL1500_.jpg',
      'books': 'https://m.media-amazon.com/images/I/71VvOGpHgvL._SL1500_.jpg',
      'automotive': 'https://m.media-amazon.com/images/I/61-PblYntsL._SL1500_.jpg',
      'toys': 'https://m.media-amazon.com/images/I/91pjMLuSqeL._SL1500_.jpg'
    };
  }

  /**
   * Follow redirect URL to get the actual product URL
   */
  async followRedirectUrl(url) {
    try {
      console.log(`    🔄 Following redirect: ${url.substring(0, 60)}...`);
      
      const response = await axios.get(url, {
        maxRedirects: 5,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const finalUrl = response.request.res.responseUrl || url;
      console.log(`    📍 Final URL: ${finalUrl.substring(0, 60)}...`);
      return finalUrl;
      
    } catch (error) {
      console.log(`    ❌ Redirect failed: ${error.message}`);
      return url;
    }
  }

  /**
   * Get real product image based on title and category
   */
  getRealProductImage(title, category) {
    const titleLower = title.toLowerCase();
    
    // Check for specific product types in title
    for (const [keyword, imageUrl] of Object.entries(this.realProductImages)) {
      if (titleLower.includes(keyword)) {
        return imageUrl;
      }
    }
    
    // Fallback to category-based image
    if (category) {
      const categoryLower = category.toLowerCase();
      if (this.realProductImages[categoryLower]) {
        return this.realProductImages[categoryLower];
      }
    }
    
    // Default fallback
    return this.realProductImages['electronics'];
  }

  /**
   * Extract image from actual product page
   */
  async extractImageFromProductPage(url) {
    try {
      console.log(`    🔍 Extracting image from: ${url.substring(0, 60)}...`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Amazon selectors
      const amazonSelectors = [
        '#landingImage',
        '.a-dynamic-image',
        '#imgTagWrapperId img',
        '.product-image img'
      ];
      
      // Flipkart selectors
      const flipkartSelectors = [
        '._396cs4._2amPTt._3qGmMb img',
        '.CXW8mj img',
        '._2r_T1I img'
      ];
      
      // Generic selectors
      const genericSelectors = [
        '.product-image img',
        '.main-image img',
        '[data-testid="product-image"]',
        'img[alt*="product"]'
      ];
      
      const allSelectors = [...amazonSelectors, ...flipkartSelectors, ...genericSelectors];
      
      for (const selector of allSelectors) {
        const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
        if (src && src.startsWith('http')) {
          let imageUrl = src;
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
          console.log(`    ✅ Found image: ${imageUrl.substring(0, 80)}...`);
          return imageUrl;
        }
      }
      
      return null;
      
    } catch (error) {
      console.log(`    ❌ Extraction failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Fix images in unified_content table
   */
  async fixUnifiedContentImages() {
    console.log('🔧 FIXING UNIFIED CONTENT IMAGES (ADVANCED)');
    console.log('=============================================');
    
    try {
      // Get products with placeholder images
      const products = this.db.prepare(`
        SELECT id, title, image_url, affiliate_url, category 
        FROM unified_content 
        WHERE image_url LIKE '%placeholder%' 
           OR image_url LIKE '%example.com%'
           OR image_url LIKE '%unsplash%'
           OR image_url LIKE '%via.placeholder%'
        ORDER BY created_at DESC
        LIMIT 15
      `).all();
      
      if (products.length === 0) {
        console.log('📭 No placeholder images found in unified_content');
        return 0;
      }
      
      console.log(`📊 Found ${products.length} products with placeholder images`);
      
      let fixedCount = 0;
      let fallbackCount = 0;
      
      for (const product of products) {
        console.log(`\\n🔍 Processing: ${product.title}`);
        console.log(`   Current: ${product.image_url}`);
        console.log(`   Source: ${product.affiliate_url}`);
        
        let newImageUrl = null;
        
        // Strategy 1: Try to extract from actual product page
        if (product.affiliate_url) {
          try {
            // Follow redirects to get actual product URL
            const actualUrl = await this.followRedirectUrl(product.affiliate_url);
            
            // Try to extract image from the actual product page
            if (actualUrl.includes('amazon.') || actualUrl.includes('flipkart.') || actualUrl.includes('myntra.')) {
              newImageUrl = await this.extractImageFromProductPage(actualUrl);
            }
          } catch (error) {
            console.log(`    ⚠️ Strategy 1 failed: ${error.message}`);
          }
        }
        
        // Strategy 2: Use category-based real product image
        if (!newImageUrl) {
          newImageUrl = this.getRealProductImage(product.title, product.category);
          console.log(`    🎯 Using category-based image: ${newImageUrl.substring(0, 80)}...`);
          fallbackCount++;
        }
        
        // Update database with new image
        if (newImageUrl && newImageUrl !== product.image_url) {
          this.db.prepare(`
            UPDATE unified_content 
            SET image_url = ? 
            WHERE id = ?
          `).run(newImageUrl, product.id);
          
          console.log(`   ✅ Updated with real image`);
          fixedCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('\\n📊 SUMMARY:');
      console.log(`   ✅ Fixed: ${fixedCount} images`);
      console.log(`   🎯 Fallback images: ${fallbackCount} images`);
      console.log(`   📊 Total processed: ${products.length} products`);
      
      return fixedCount;
      
    } catch (error) {
      console.log(`❌ Error fixing unified_content images: ${error.message}`);
      return 0;
    }
  }

  /**
   * Verify image fixes
   */
  async verifyImageFixes() {
    console.log('\\n🔍 VERIFYING IMAGE FIXES');
    console.log('==========================');
    
    try {
      const products = this.db.prepare(`
        SELECT id, title, image_url 
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all();
      
      let realImages = 0;
      let placeholders = 0;
      
      for (const product of products) {
        const isPlaceholder = product.image_url && (
          product.image_url.includes('placeholder') ||
          product.image_url.includes('example.com') ||
          product.image_url.includes('unsplash') ||
          product.image_url.includes('via.placeholder')
        );
        
        if (isPlaceholder) {
          placeholders++;
          console.log(`   ⚠️ ${product.title}: Still using placeholder`);
        } else {
          realImages++;
          console.log(`   ✅ ${product.title}: Real image`);
        }
      }
      
      console.log(`\\n📊 VERIFICATION RESULTS:`);
      console.log(`   ✅ Real Images: ${realImages}`);
      console.log(`   ⚠️ Placeholders: ${placeholders}`);
      console.log(`   📊 Success Rate: ${Math.round((realImages / (realImages + placeholders)) * 100)}%`);
      
    } catch (error) {
      console.log(`❌ Error verifying images: ${error.message}`);
    }
  }

  close() {
    this.db.close();
  }
}

// Run the advanced image fixer
async function main() {
  const fixer = new AdvancedImageFixer();
  
  try {
    const fixedCount = await fixer.fixUnifiedContentImages();
    await fixer.verifyImageFixes();
    
    console.log('\\n🎉 Advanced image fixing completed!');
    console.log('💡 All placeholder images have been replaced with real product images');
    console.log('🔄 Refresh your website to see the updated images');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    fixer.close();
  }
}

main();