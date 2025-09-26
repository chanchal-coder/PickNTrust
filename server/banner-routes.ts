/**
 * Banner Management Routes
 * API endpoints for managing dynamic banners across different pages
 */

import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';

const router = Router();
const dbPath = path.join(process.cwd(), 'database.sqlite');

// Get banners for a specific page
router.get('/api/banners/:page', (req, res) => {
  try {
    const { page } = req.params;
    const db = new Database(dbPath);
    
    const banners = db.prepare(`
      SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
             icon, iconType, iconPosition
      FROM banners 
      WHERE page = ? AND isActive = 1
      ORDER BY display_order ASC
    `).all(page);
    
    db.close();
    res.json({ success: true, banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch banners' });
  }
});

// Get all banners (for admin panel)
router.get('/api/admin/banners', (req, res) => {
  try {
    const db = new Database(dbPath);
    
    const banners = db.prepare(`
      SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
             icon, iconType, iconPosition, created_at, updated_at
      FROM banners 
      ORDER BY page ASC, display_order ASC
    `).all();
    
    // Group banners by page
    const bannersByPage = banners.reduce((acc: any, banner: any) => {
      if (!acc[banner.page]) {
        acc[banner.page] = [];
      }
      acc[banner.page].push(banner);
      return acc;
    }, {});
    
    db.close();
    res.json({ success: true, banners: bannersByPage });
  } catch (error) {
    console.error('Error fetching all banners:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch banners' });
  }
});

// Add new banner
router.post('/api/admin/banners', (req, res) => {
  try {
    const { 
      title, subtitle, imageUrl, linkUrl, buttonText, page, display_order,
      icon, iconType, iconPosition 
    } = req.body;
    
    if (!page) {
      return res.status(400).json({ 
        success: false, 
        error: 'Page is required' 
      });
    }
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      INSERT INTO banners (
        title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
        icon, iconType, iconPosition
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(
      title, 
      subtitle || '', 
      imageUrl, 
      linkUrl || '', 
      buttonText || 'Learn More', 
      page, 
      display_order || 1,
      icon || '',
      iconType || 'none',
      iconPosition || 'left'
    );
    
    db.close();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ success: false, error: 'Failed to add banner' });
  }
});

// Update banner
router.put('/api/admin/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
      icon, iconType, iconPosition 
    } = req.body;
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      UPDATE banners 
      SET title = ?, subtitle = ?, imageUrl = ?, linkUrl = ?, buttonText = ?, 
          page = ?, display_order = ?, isActive = ?, 
          icon = ?, iconType = ?, iconPosition = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, 
      subtitle || '', 
      imageUrl, 
      linkUrl || '', 
      buttonText || 'Learn More',
      page, 
      display_order || 1, 
      isActive ? 1 : 0,
      icon || '',
      iconType || 'none',
      iconPosition || 'left',
      id
    );
    
    db.close();
    
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Banner not found' });
    }
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: 'Failed to update banner' });
  }
});

// Delete banner
router.delete('/api/admin/banners/:id', (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify admin password
    if (!password || password !== 'pickntrust2025') {
      return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    const { id } = req.params;
    const db = new Database(dbPath);
    
    const result = db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    
    db.close();
    
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Banner not found' });
    }
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, error: 'Failed to delete banner' });
  }
});

// Toggle banner active status
router.patch('/api/admin/banners/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const db = new Database(dbPath);
    
    // Get current status
    const current = db.prepare('SELECT isActive FROM banners WHERE id = ?').get(id) as any;
    
    if (!current) {
      db.close();
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    // Toggle status
    const newStatus = current.isActive ? 0 : 1;
    const result = db.prepare(`
      UPDATE banners 
      SET isActive = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStatus, id);
    
    db.close();
    res.json({ success: true, isActive: newStatus === 1 });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle banner status' });
  }
});

// Reorder banners
router.put('/api/admin/banners/reorder', (req, res) => {
  try {
    const { banners } = req.body; // Array of { id, display_order }
    
    if (!Array.isArray(banners)) {
      return res.status(400).json({ success: false, error: 'Banners array is required' });
    }
    
    const db = new Database(dbPath);
    const updateStmt = db.prepare(`
      UPDATE banners 
      SET display_order = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const transaction = db.transaction(() => {
      for (const banner of banners) {
        updateStmt.run(banner.display_order, banner.id);
      }
    });
    
    transaction();
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering banners:', error);
    res.status(500).json({ success: false, error: 'Failed to reorder banners' });
  }
});

// Get banner statistics
router.get('/api/admin/banners/stats', (req, res) => {
  try {
    const db = new Database(dbPath);
    
    const stats = db.prepare(`
      SELECT 
        page,
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive
      FROM banners 
      GROUP BY page
      ORDER BY page
    `).all();
    
    const totalStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive
      FROM banners
    `).get();
    
    db.close();
    
    res.json({ 
      success: true, 
      stats: {
        byPage: stats,
        total: totalStats
      }
    });
  } catch (error) {
    console.error('Error fetching banner statistics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;