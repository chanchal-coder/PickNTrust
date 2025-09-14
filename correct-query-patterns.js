
// CORRECT API QUERY PATTERNS BASED ON ACTUAL DATABASE SCHEMA

// 1. Amazon Products - Only use expires_at for filtering (no is_active or processing_status)
const getActiveAmazonProducts = (category = null) => {
  const currentTime = Math.floor(Date.now() / 1000);
  let query = `
    SELECT 
      'amazon_' || id as id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, affiliate_network,
      telegram_message_id as telegramMessageId, expires_at as expiresAt, 
      created_at as createdAt
    FROM amazon_products 
    WHERE (expires_at IS NULL OR expires_at > ?)
  `;
  
  const params = [currentTime];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  return sqliteDb.prepare(query).all(...params);
};

// 2. Loot Box Products - Use processing_status + expires_at
const getActiveLootBoxProducts = (category = null) => {
  const currentTime = Math.floor(Date.now() / 1000);
  let query = `
    SELECT 
      'loot_box_' || id as id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, affiliate_network,
      telegram_message_id as telegramMessageId, processing_status,
      expires_at as expiresAt, created_at as createdAt
    FROM loot_box_products 
    WHERE processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  `;
  
  const params = [currentTime];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  return sqliteDb.prepare(query).all(...params);
};

// 3. Category Products - Combine all active products from different tables
const getCategoryProducts = (category) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Amazon products (only expires_at filter)
  const amazonProducts = sqliteDb.prepare(`
    SELECT 'amazon_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'amazon' as source
    FROM amazon_products 
    WHERE category = ? 
    AND (expires_at IS NULL OR expires_at > ?)
  `).all(category, currentTime);
  
  // Loot Box products (processing_status + expires_at)
  const lootBoxProducts = sqliteDb.prepare(`
    SELECT 'loot_box_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'loot_box' as source
    FROM loot_box_products 
    WHERE category = ? 
    AND processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  `).all(category, currentTime);
  
  // Other product tables...
  const cuelinksProducts = sqliteDb.prepare(`
    SELECT 'cuelinks_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'cuelinks' as source
    FROM cuelinks_products 
    WHERE category = ? 
    AND processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  `).all(category, currentTime);
  
  return [...amazonProducts, ...lootBoxProducts, ...cuelinksProducts];
};
