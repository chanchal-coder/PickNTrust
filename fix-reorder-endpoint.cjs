const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

// Create a simple standalone server to test the reorder functionality
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// Simple admin password verification
async function verifyAdminPassword(password) {
  return password === 'pickntrust2025';
}

// Fixed reorder endpoint
app.put('/api/admin/categories/reorder', async (req, res) => {
  try {
    console.log('🔧 NEW Reorder API: Request body:', JSON.stringify(req.body, null, 2));
    const { password, categoryOrders } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      console.log('🔧 NEW Reorder API: Unauthorized');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Array.isArray(categoryOrders)) {
      console.log('🔧 NEW Reorder API: categoryOrders is not an array:', categoryOrders);
      return res.status(400).json({ message: 'categoryOrders must be an array' });
    }

    console.log('🔧 NEW Reorder API: Processing', categoryOrders.length, 'category updates');

    // Open database
    const db = new Database('database.sqlite');

    // Update display order for each category
    for (const item of categoryOrders) {
      console.log('🔧 NEW Reorder API: Processing item:', item);
      console.log('🔧 NEW Reorder API: Updating category', item.id, 'to displayOrder', item.displayOrder);
      
      // Check if category exists
      const existingCategory = db.prepare('SELECT id FROM categories WHERE id = ?').get(item.id);
      if (!existingCategory) {
        console.log('🔧 NEW Reorder API: Category', item.id, 'not found');
        db.close();
        return res.status(404).json({ message: `Category ${item.id} not found` });
      }
      
      // Update the category
      const result = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?').run(item.displayOrder, item.id);
      console.log('🔧 NEW Reorder API: Update result for category', item.id, ':', result);
      
      if (result.changes === 0) {
        console.log('🔧 NEW Reorder API: No rows updated for category', item.id);
        db.close();
        return res.status(404).json({ message: `Failed to update category ${item.id}` });
      }
      
      console.log('🔧 NEW Reorder API: Successfully updated category', item.id);
    }
    
    db.close();
    console.log('🔧 NEW Reorder API: All updates completed successfully');
    res.json({ message: 'Category display order updated successfully' });
    
  } catch (error) {
    console.error('🔧 NEW Reorder API: Error:', error);
    res.status(500).json({ message: 'Failed to update category order' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Fixed reorder server is working!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔧 Fixed reorder server running on port ${PORT}`);
  console.log(`🔧 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔧 Reorder endpoint: http://localhost:${PORT}/api/admin/categories/reorder`);
});