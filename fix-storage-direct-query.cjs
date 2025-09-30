#!/usr/bin/env node
// Direct Storage Fix - Bypass Drizzle ORM with Raw SQLite Queries
// This fixes the SQLITE_ERROR by using direct database queries

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Direct Storage Fix...');

const storageFilePath = path.join(process.cwd(), 'server', 'storage.ts');

if (!fs.existsSync(storageFilePath)) {
  console.error('❌ storage.ts file not found');
  process.exit(1);
}

// Read the current storage file
let storageContent = fs.readFileSync(storageFilePath, 'utf8');

// Create a backup
fs.writeFileSync(storageFilePath + '.backup', storageContent);
console.log('📋 Created backup of storage.ts');

// Replace the getProducts method with a direct SQLite query version
const newGetProductsMethod = `
  async getProducts(): Promise<Product[]> {
    try {
      console.log('DatabaseStorage: Getting products with direct query...');
      
      // Use direct SQLite query to bypass Drizzle ORM issues
      const Database = require('better-sqlite3');
      const directDb = new Database('sqlite.db');
      
      const query = \`
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          affiliate_network_id as affiliateNetworkId, category, subcategory,
          gender, rating, review_count as reviewCount, discount, is_new as isNew,
          is_featured as isFeatured, is_service as isService, is_ai_app as isAIApp,
          custom_fields as customFields, pricing_type as pricingType,
          monthly_price as monthlyPrice, yearly_price as yearlyPrice,
          is_free as isFree, price_description as priceDescription,
          has_timer as hasTimer, timer_duration as timerDuration,
          timer_start_time as timerStartTime, created_at as createdAt,
          display_pages as displayPages
        FROM products 
        ORDER BY id DESC
      \`;
      
      const result = directDb.prepare(query).all();
      directDb.close();
      
      console.log(\`DatabaseStorage: Found \${result.length} products with direct query\`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error getting products with direct query:', error);
      
      // Fallback to original Drizzle query if direct query fails
      try {
        console.log('DatabaseStorage: Falling back to Drizzle query...');
        const result = await db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          originalPrice: products.originalPrice,
          currency: products.currency,
          imageUrl: products.imageUrl,
          affiliateUrl: products.affiliateUrl,
          affiliateNetworkId: products.affiliateNetworkId,
          category: products.category,
          subcategory: products.subcategory,
          gender: products.gender,
          rating: products.rating,
          reviewCount: products.reviewCount,
          discount: products.discount,
          isNew: products.isNew,
          isFeatured: products.isFeatured,
          isService: products.isService,
          isAIApp: products.isAIApp,
          customFields: products.customFields,
          pricingType: products.pricingType,
          monthlyPrice: products.monthlyPrice,
          yearlyPrice: products.yearlyPrice,
          isFree: products.isFree,
          priceDescription: products.priceDescription,
          hasTimer: products.hasTimer,
          timerDuration: products.timerDuration,
          timerStartTime: products.timerStartTime,
          createdAt: products.createdAt,
          displayPages: products.displayPages
        }).from(products).orderBy(desc(products.id));
        console.log(\`DatabaseStorage: Fallback found \${result.length} products\`);
        return result;
      } catch (fallbackError) {
        console.error('DatabaseStorage: Fallback also failed:', fallbackError);
        return [];
      }
    }
  }`;

// Find and replace the existing getProducts method
const getProductsRegex = /async getProducts\(\): Promise<Product\[\]> \{[\s\S]*?^  \}/m;

if (getProductsRegex.test(storageContent)) {
  storageContent = storageContent.replace(getProductsRegex, newGetProductsMethod.trim());
  console.log('✅ Replaced getProducts method with direct query version');
} else {
  console.error('❌ Could not find getProducts method to replace');
  process.exit(1);
}

// Write the modified content back to the file
fs.writeFileSync(storageFilePath, storageContent);

console.log('✅ Direct storage fix applied successfully');
console.log('🚀 The products API should now work with direct SQLite queries');
console.log('📋 Original file backed up as storage.ts.backup');

console.log('\n🔧 Storage fix completed. Restart the application to apply changes.');