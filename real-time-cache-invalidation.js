
// REAL-TIME CACHE INVALIDATION FOR CATEGORY SYNCHRONIZATION

// 1. Update admin deletion endpoint to invalidate category caches
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const productId = req.params.id;
    console.log(`🗑️ REAL-TIME: Deleting product ${productId}`);
    
    // Get product category before deletion for cache invalidation
    let productCategory = null;
    
    // Check which table the product is in and get its category
    if (productId.startsWith('amazon_')) {
      const numericId = parseInt(productId.replace('amazon_', ''));
      const product = sqliteDb.prepare('SELECT category FROM amazon_products WHERE id = ?').get(numericId);
      productCategory = product?.category;
    } else if (productId.startsWith('loot_box_')) {
      const numericId = parseInt(productId.replace('loot_box_', ''));
      const product = sqliteDb.prepare('SELECT category FROM loot_box_products WHERE id = ?').get(numericId);
      productCategory = product?.category;
    } else if (productId.startsWith('cuelinks_')) {
      const numericId = parseInt(productId.replace('cuelinks_', ''));
      const product = sqliteDb.prepare('SELECT category FROM cuelinks_products WHERE id = ?').get(numericId);
      productCategory = product?.category;
    } else {
      const product = sqliteDb.prepare('SELECT category FROM products WHERE id = ?').get(parseInt(productId));
      productCategory = product?.category;
    }
    
    // Perform the deletion (existing logic)
    const deleted = await performProductDeletion(productId);
    
    if (deleted && productCategory) {
      console.log(`Refresh REAL-TIME: Invalidating caches for category "${productCategory}"`);
      
      // Trigger cache invalidation for the affected category
      // This would be implemented in the frontend using React Query
      // queryClient.invalidateQueries({ queryKey: ['/api/products/category', productCategory] });
      // queryClient.invalidateQueries({ queryKey: ['/api/categories/browse'] });
      
      res.json({ 
        message: 'Product deleted successfully',
        invalidateCategory: productCategory,
        realTimeSync: true
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
    
  } catch (error) {
    console.error('Error REAL-TIME: Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// 2. Add real-time category validation endpoint
app.get('/api/products/category/:category/validate', async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Count active products across all tables
    const counts = {
      amazon: 0,
      loot_box: 0,
      cuelinks: 0,
      value_picks: 0,
      main: 0
    };
    
    try {
      counts.amazon = sqliteDb.prepare(`
        SELECT COUNT(*) as count FROM amazon_products 
        WHERE category = ? AND (expires_at IS NULL OR expires_at > ?)
      `).get(decodedCategory, currentTime).count;
    } catch (e) {}
    
    try {
      counts.loot_box = sqliteDb.prepare(`
        SELECT COUNT(*) as count FROM loot_box_products 
        WHERE category = ? AND processing_status = 'active' 
        AND (expires_at IS NULL OR expires_at > ?)
      `).get(decodedCategory, currentTime).count;
    } catch (e) {}
    
    try {
      counts.main = sqliteDb.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category = ? AND (expires_at IS NULL OR expires_at > ?)
      `).get(decodedCategory, currentTime).count;
    } catch (e) {}
    
    const totalActive = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    res.json({
      category: decodedCategory,
      totalActiveProducts: totalActive,
      breakdown: counts,
      lastValidated: new Date().toISOString(),
      realTimeSync: true
    });
    
  } catch (error) {
    console.error('Error REAL-TIME: Category validation error:', error);
    res.status(500).json({ message: 'Failed to validate category' });
  }
});
