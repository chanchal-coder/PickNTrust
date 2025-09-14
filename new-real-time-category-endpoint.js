
// REAL-TIME CATEGORY ENDPOINT - QUERIES ALL PRODUCT TABLES
app.get("/api/products/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { gender } = req.query;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // URL decode the category parameter
    const decodedCategory = decodeURIComponent(category);
    console.log(`Search REAL-TIME: Getting products for category: "${decodedCategory}"`);
    
    const allCategoryProducts = [];
    
    // 1. Query Amazon Products (expires_at only)
    try {
      const amazonProducts = sqliteDb.prepare(`
        SELECT 
          'amazon_' || id as id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, 'amazon' as source, 'Prime Picks' as networkBadge,
          created_at as createdAt, gender
        FROM amazon_products 
        WHERE category = ? 
        AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY created_at DESC
      `).all(decodedCategory, currentTime);
      
      allCategoryProducts.push(...amazonProducts);
      console.log(`   Products Amazon products: ${amazonProducts.length}`);
    } catch (error) {
      console.error('Error querying Amazon products:', error);
    }
    
    // 2. Query Loot Box Products (processing_status + expires_at)
    try {
      const lootBoxProducts = sqliteDb.prepare(`
        SELECT 
          'loot_box_' || id as id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, 'loot_box' as source, 'Wholesale' as networkBadge,
          created_at as createdAt, NULL as gender
        FROM loot_box_products 
        WHERE category = ? 
        AND processing_status = 'active'
        AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY created_at DESC
      `).all(decodedCategory, currentTime);
      
      allCategoryProducts.push(...lootBoxProducts);
      console.log(`   Products Loot Box products: ${lootBoxProducts.length}`);
    } catch (error) {
      console.error('Error querying Loot Box products:', error);
    }
    
    // 3. Query CueLinks Products (processing_status + expires_at)
    try {
      const cuelinksProducts = sqliteDb.prepare(`
        SELECT 
          'cuelinks_' || id as id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, 'cuelinks' as source, 'Click Picks' as networkBadge,
          created_at as createdAt, NULL as gender
        FROM cuelinks_products 
        WHERE category = ? 
        AND processing_status = 'active'
        AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY created_at DESC
      `).all(decodedCategory, currentTime);
      
      allCategoryProducts.push(...cuelinksProducts);
      console.log(`   Products CueLinks products: ${cuelinksProducts.length}`);
    } catch (error) {
      console.error('Error querying CueLinks products:', error);
    }
    
    // 4. Query Value Picks Products (processing_status + expires_at)
    try {
      const valuePicksProducts = sqliteDb.prepare(`
        SELECT 
          'value_picks_' || id as id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, 'value_picks' as source, 'Value Picks' as networkBadge,
          created_at as createdAt, NULL as gender
        FROM value_picks_products 
        WHERE category = ? 
        AND processing_status = 'active'
        AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY created_at DESC
      `).all(decodedCategory, currentTime);
      
      allCategoryProducts.push(...valuePicksProducts);
      console.log(`   Products Value Picks products: ${valuePicksProducts.length}`);
    } catch (error) {
      console.error('Error querying Value Picks products:', error);
    }
    
    // 5. Query Main Products Table (expires_at if available)
    try {
      const mainProducts = sqliteDb.prepare(`
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, 'main' as source, 'Featured' as networkBadge,
          created_at as createdAt, gender
        FROM products 
        WHERE category = ? 
        AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY created_at DESC
      `).all(decodedCategory, currentTime);
      
      allCategoryProducts.push(...mainProducts);
      console.log(`   Products Main products: ${mainProducts.length}`);
    } catch (error) {
      console.error('Error querying main products:', error);
    }
    
    // Apply gender filtering if provided
    let filteredProducts = allCategoryProducts;
    if (gender && typeof gender === 'string') {
      const normalizeGender = (g) => {
        const genderMap = {
          'men': 'Men', 'women': 'Women', 'kids': 'Kids',
          'boys': 'Boys', 'girls': 'Girls', 'common': 'Common'
        };
        return genderMap[g.toLowerCase()] || g;
      };
      
      const normalizedGender = normalizeGender(gender);
      filteredProducts = allCategoryProducts.filter(product => {
        if (!product.gender) return false;
        return normalizeGender(product.gender) === normalizedGender;
      });
      
      console.log(`   Target Gender filtered (${normalizedGender}): ${filteredProducts.length} products`);
    }
    
    // Sort by creation date (newest first)
    filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Success REAL-TIME: Returning ${filteredProducts.length} active products for "${decodedCategory}"`);
    res.json(filteredProducts);
    
  } catch (error) {
    console.error(`Error REAL-TIME: Error fetching products for category "${req.params.category}":`, error);
    res.status(500).json({ message: "Failed to fetch products by category" });
  }
});
