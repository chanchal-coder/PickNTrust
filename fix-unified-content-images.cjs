/**
 * Fix Product Images in Unified Content Table
 * Replace placeholder images with real product images from scraped data
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class UnifiedContentImageFixer {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    if (url.includes('amazon.')) return 'amazon';
    if (url.includes('flipkart.')) return 'flipkart';
    if (url.includes('myntra.')) return 'myntra';
    if (url.includes('nykaa.')) return 'nykaa';
    if (url.includes('boat-lifestyle.')) return 'boat';
    return 'generic';
  }

  /**
   * Extract image URL from product page
   */
  async extractImageFromURL(url, platform) {
    try {
      console.log(`    🔍 Scraping image from: ${url.substring(0, 60)}...`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      let imageUrl = null;
      
      if (platform === 'amazon') {
        // Amazon image selectors
        const selectors = [
          '#landingImage',
          '.a-dynamic-image',
          '#imgTagWrapperId img',
          '.product-image img',
          '.pdp-image img',
          'img[data-automation-id="product-image"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
        
      } else if (platform === 'flipkart') {
        // Flipkart image selectors
        const selectors = [
          '._396cs4._2amPTt._3qGmMb img',
          '.CXW8mj img',
          '._2r_T1I img',
          '.q6DClP img',
          'img[class*="_396cs4"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
        
      } else if (platform === 'myntra') {
        // Myntra image selectors
        const selectors = [
          '.image-grid-image img',
          '.pdp-image img',
          '.product-image img',
          'img[class*="image-grid"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
        
      } else if (platform === 'nykaa') {
        // Nykaa image selectors
        const selectors = [
          '.product-image img',
          '.pdp-image img',
          '.main-image img',
          'img[class*="product"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
        
      } else if (platform === 'boat') {
        // Boat Lifestyle image selectors
        const selectors = [
          '.product-single__photo img',
          '.product__photo img',
          '.product-image img',
          'img[class*="product"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
      } else {
        // Generic selectors
        const selectors = [
          '.product-image img',
          '.main-image img',
          '.hero-image img',
          '[data-testid="product-image"]',
          'img[alt*="product"]',
          'img[alt*="Product"]'
        ];
        
        for (const selector of selectors) {
          const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
          if (src && src.startsWith('http')) {
            imageUrl = src;
            break;
          }
        }
      }
      
      if (imageUrl) {
        // Clean up the image URL
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
        
        console.log(`    ✅ Found image: ${imageUrl.substring(0, 80)}...`);
        return imageUrl;
      } else {
        console.log(`    ⚠️ No image found`);
        return null;
      }
      
    } catch (error) {
      console.log(`    ❌ Error scraping: ${error.message}`);
      return null;
    }
  }

  /**
   * Fix images in unified_content table
   */
  async fixUnifiedContentImages() {
    console.log('🔧 FIXING UNIFIED CONTENT IMAGES');
    console.log('===================================');
    
    try {
      // Get products with placeholder images
      const products = this.db.prepare(`
        SELECT id, title, image_url, affiliate_url 
        FROM unified_content 
        WHERE image_url LIKE '%placeholder%' 
           OR image_url LIKE '%example.com%'
           OR image_url LIKE '%unsplash%'
           OR image_url LIKE '%via.placeholder%'
        ORDER BY created_at DESC
        LIMIT 20
      `).all();
      
      if (products.length === 0) {
        console.log('📭 No placeholder images found in unified_content');
        return 0;
      }
      
      console.log(`📊 Found ${products.length} products with placeholder images`);
      
      let fixedCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
        console.log(`\\n🔍 Processing: ${product.title}`);
        console.log(`   Current: ${product.image_url}`);
        console.log(`   Source: ${product.affiliate_url}`);
        
        if (product.affiliate_url) {
          try {
            const platform = this.detectPlatform(product.affiliate_url);
            const realImageUrl = await this.extractImageFromURL(product.affiliate_url, platform);
            
            if (realImageUrl && realImageUrl !== product.image_url) {
              // Update database with real image
              this.db.prepare(`
                UPDATE unified_content 
                SET image_url = ? 
                WHERE id = ?
              `).run(realImageUrl, product.id);
              
              console.log(`   ✅ Updated with real image`);
              fixedCount++;
            } else {
              console.log(`   ⚠️ Could not extract real image`);
              errorCount++;
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ⚠️ No affiliate URL available`);
          errorCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('\\n📊 SUMMARY:');
      console.log(`   ✅ Fixed: ${fixedCount} images`);
      console.log(`   ❌ Errors: ${errorCount} images`);
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

// Run the image fixer
async function main() {
  const fixer = new UnifiedContentImageFixer();
  
  try {
    const fixedCount = await fixer.fixUnifiedContentImages();
    await fixer.verifyImageFixes();
    
    console.log('\\n🎉 Image fixing completed!');
    console.log('💡 Refresh your website to see the updated images');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    fixer.close();
  }
}

main();