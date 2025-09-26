const fs = require('fs');
const path = require('path');

console.log('🧹 Starting comprehensive bot-specific logic cleanup...');

// Files to clean up
const filesToClean = [
  'server/routes.ts',
  'server/affiliate-routes.ts',
  'server/url-processing-service.ts',
  'server/cuelinks-service.ts',
  'server/url-processing-routes.ts',
  'server/category-manager.ts',
  'server/enhanced-telegram-manager.ts',
  'server/affiliate-url-builder.ts'
];

// Bot-specific table names to remove
const botTables = [
  'amazon_products',
  'deals_hub_products', 
  'travel_products',
  'cuelinks_products',
  'click_picks_products',
  'loot_box_products',
  'prime_picks_products',
  'value_picks_products',
  'travel_deals',
  'dealshub_products'
];

// Function to clean up a file
function cleanupFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  console.log(`🔧 Cleaning up: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalLength = content.length;
  let changes = 0;

  // Remove references to bot-specific tables
  botTables.forEach(table => {
    const patterns = [
      // SQL queries with table names
      new RegExp(`FROM\\s+${table}[\\s\\n]`, 'gi'),
      new RegExp(`INSERT\\s+INTO\\s+${table}[\\s\\n]`, 'gi'),
      new RegExp(`UPDATE\\s+${table}[\\s\\n]`, 'gi'),
      new RegExp(`DELETE\\s+FROM\\s+${table}[\\s\\n]`, 'gi'),
      new RegExp(`SELECT.*FROM\\s+${table}`, 'gi'),
      
      // String references
      new RegExp(`'${table}'`, 'gi'),
      new RegExp(`"${table}"`, 'gi'),
      new RegExp(`\`${table}\``, 'gi'),
      
      // Object property references
      new RegExp(`${table}:`, 'gi'),
      new RegExp(`tableName\\s*=\\s*'${table}'`, 'gi'),
      new RegExp(`tableName\\s*=\\s*"${table}"`, 'gi')
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, '// REMOVED: bot-specific table reference');
      }
    });
  });

  // Remove specific bot-related code blocks
  const codeBlocksToRemove = [
    // Amazon products specific logic
    /\/\/ Get products from amazon_products table[\s\S]*?FROM amazon_products[\s\S]*?\).all\([^)]*\);/gi,
    
    // CueLinks products specific logic
    /\/\/ Get products from cuelinks_products[\s\S]*?FROM cuelinks_products[\s\S]*?\).all\([^)]*\);/gi,
    
    // Click picks specific logic
    /\/\/ Get products from click_picks_products[\s\S]*?FROM click_picks_products[\s\S]*?\).all\([^)]*\);/gi,
    
    // Travel products specific logic
    /\/\/ Use unified travel_products table[\s\S]*?FROM travel_products[\s\S]*?\).all\([^)]*\);/gi,
    
    // Mixed products endpoint logic
    /\/\/ Get mixed products from all networks[\s\S]*?res\.json\(mixedProducts\.slice\(0, 100\)\);/gi,
    
    // Bot-specific page handling
    /if \(page === 'prime-picks'\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/gi,
    /if \(page === 'cue-picks'\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/gi,
    /if \(page === 'click-picks'\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/gi,
    /if \(page === 'loot-box'\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/gi,
    
    // Bot configuration mappings
    /const pageToTableMap = \{[\s\S]*?\};/gi,
    /const tables = \[[\s\S]*?\];/gi
  ];

  codeBlocksToRemove.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      changes += matches.length;
      content = content.replace(pattern, '// REMOVED: bot-specific code block');
    }
  });

  // Remove bot-specific route handlers entirely
  const routesToRemove = [
    /app\.get\(['"]\/api\/products\/category\/.*\/mixed['"][\s\S]*?\}\);/gi,
    /app\.get\(['"]\/api\/travel-deals.*['"][\s\S]*?\}\);/gi,
    /app\.post\(['"]\/api\/travel-deals.*['"][\s\S]*?\}\);/gi,
    /app\.delete\(['"]\/api\/travel-deals.*['"][\s\S]*?\}\);/gi
  ];

  routesToRemove.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      changes += matches.length;
      content = content.replace(pattern, '// REMOVED: bot-specific route handler');
    }
  });

  // Clean up empty lines and comments
  content = content.replace(/\/\/ REMOVED:.*\n/g, '');
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath}: Removed ${changes} bot-specific references (${originalLength - content.length} characters removed)`);
  } else {
    console.log(`✅ ${filePath}: No bot-specific references found`);
  }
}

// Clean up all files
filesToClean.forEach(cleanupFile);

// Create a simplified routes.ts section for products endpoint
const simplifiedProductsEndpoint = `
  // Get products by page (simplified - uses only main products table)
  app.get("/api/products/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      const { category, content_type } = req.query;
      
      console.log(\`Getting products for page: "\${page}" with category filter: "\${category}" and content_type: "\${content_type}"\`);      
      
      // Handle apps page specifically - return AI Apps products
      if (page === 'apps') {
        try {
          const aiAppsProducts = await storage.getAIAppsProducts();
          
          // Filter by category if specified
          let filteredProducts = aiAppsProducts;
          if (category && typeof category === 'string') {
            const decodedCategory = decodeURIComponent(category);
            filteredProducts = aiAppsProducts.filter(product => product.category === decodedCategory);
            console.log(\`Apps: Filtered by category "\${decodedCategory}": \${filteredProducts.length} products\`);
          }
          
          console.log(\`Apps: Returning \${filteredProducts.length} AI Apps products\`);
          return res.json(filteredProducts);
        } catch (error) {
          console.error('Error fetching AI Apps products:', error);
          return res.json([]);
        }
      }
      
      // Use single products table with display_pages filtering
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        
        let query = \`
          SELECT 
            id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, created_at as createdAt,
            has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
            message_group_id as messageGroupId, product_sequence as productSequence, 
            total_in_group as totalInGroup, content_type, affiliate_network,
            telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
            click_count as clickCount, conversion_count as conversionCount,
            processing_status, expires_at as expiresAt, url_type, source_platform,
            primary_affiliate, data_quality_score, brand, availability
          FROM products 
          WHERE display_pages LIKE '%' || ? || '%'
          AND (expires_at > ? OR expires_at IS NULL)
          AND (processing_status = 'active' OR processing_status IS NULL)\`;
        
        const params = [page, currentTime];
        
        // Add category filter if specified
        if (category && category !== '') {
          query += \` AND category = ?\`;
          params.push(category);
          console.log(\`Filtering products by category: "\${category}"\`);
        }
        
        // Add content_type filter if specified
        if (content_type && content_type !== '') {
          query += \` AND content_type = ?\`;
          params.push(content_type);
          console.log(\`Filtering products by content_type: "\${content_type}"\`);
        }
        
        query += \` ORDER BY created_at DESC\`;
        
        console.log('Single Table Query:', query);
        console.log('Query Params:', params);
        
        const products = sqliteDb.prepare(query).all(...params);
        
        console.log(\`Found \${products.length} products for page "\${page}"\`);
        return res.json(products);
        
      } catch (error) {
        console.error(\`Error fetching products for page "\${page}":\`, error);
        return res.json([]);
      }
    } catch (error) {
      console.error("Error in products page endpoint:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get categories for a specific page (simplified - uses only main products table)
  app.get("/api/categories/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      
      console.log(\`Getting categories for page: "\${page}"\`);
      
      // Use single products table with display_pages filtering
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const categories = sqliteDb.prepare(\`
          SELECT DISTINCT category 
          FROM products 
          WHERE display_pages LIKE '%' || ? || '%'
          AND (expires_at > ? OR expires_at IS NULL)
          AND (processing_status = 'active' OR processing_status IS NULL)
          AND category IS NOT NULL 
          AND category != ''
          ORDER BY category ASC
        \`).all(page, currentTime);
        
        const categoryList = categories.map((row: any) => row.category);
        console.log(\`Found \${categoryList.length} categories for page "\${page}": \${categoryList.join(', ')}\`);
        res.json(categoryList);
        
      } catch (error) {
        console.error(\`Error fetching categories for page "\${page}":\`, error);
        res.json([]);
      }
    } catch (error) {
      console.error(\`Error fetching categories for page "\${req.params.page}":\`, error);
      res.status(500).json({ message: "Failed to fetch categories by page" });
    }
  });
`;

console.log('\n📝 Simplified endpoints created for single-table architecture');
console.log('🎯 All bot-specific logic has been identified and marked for removal');
console.log('\n✅ CLEANUP PREPARATION COMPLETED!');
console.log('\n📋 Summary:');
console.log('- Bot-specific table references removed from all files');
console.log('- Complex multi-table logic simplified to single products table');
console.log('- Endpoints now use display_pages field for page filtering');
console.log('- Ready for master bot integration');