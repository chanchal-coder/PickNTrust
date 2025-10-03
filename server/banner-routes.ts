/**
 * Banner Management Routes
 * API endpoints for managing dynamic banners across different pages
 */

import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const router = Router();
const dbPath = path.join(process.cwd(), 'database.sqlite');
const staticConfigPath = path.join(process.cwd(), 'client', 'src', 'config', 'banners.json');

// Get banners for a specific page
router.get('/api/banners/:page', (req, res) => {
  try {
    const { page } = req.params;
    const db = new Database(dbPath);
    
    const banners = db.prepare(`
      SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
             icon, iconType, iconPosition,
             useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
      FROM banners 
      WHERE page = ? AND isActive = 1
      ORDER BY display_order ASC
    `).all(page);
    
    db.close();
    
    // If no banners found in database, fallback to static config
    if (banners.length === 0) {
      try {
        if (fs.existsSync(staticConfigPath)) {
          const configData = fs.readFileSync(staticConfigPath, 'utf8');
          const config = JSON.parse(configData);
          const staticBanners = config[page] || [];
          const activeBanners = staticBanners.filter((banner: any) => banner.isActive);
          console.log(`Serving ${activeBanners.length} static banners for page: ${page}`);
          return res.json({ success: true, banners: activeBanners });
        }
      } catch (staticError) {
        console.error('Error reading static banner config:', staticError);
      }
    }
    
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
             icon, iconType, iconPosition, created_at, updated_at,
             useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
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
      icon, iconType, iconPosition,
      useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
    } = req.body;
    
    // Coerce potentially undefined fields to safe defaults
    const _title = typeof title === 'string' ? title : '';
    const _subtitle = typeof subtitle === 'string' ? subtitle : '';
    const _imageUrl = typeof imageUrl === 'string' ? imageUrl : '';
    const _linkUrl = typeof linkUrl === 'string' ? linkUrl : '';
    const _buttonText = (typeof buttonText === 'string' && buttonText.length > 0) ? buttonText : 'Learn More';
    const _page = typeof page === 'string' ? page : '';
    const _displayOrder = typeof display_order === 'number' ? display_order : 1;
    const _icon = typeof icon === 'string' ? icon : '';
    const _iconType = typeof iconType === 'string' ? iconType : 'none';
    const _iconPosition = typeof iconPosition === 'string' ? iconPosition : 'left';
    const _useGradient = typeof useGradient === 'boolean' || typeof useGradient === 'number' ? (Number(useGradient) ? 1 : 0) : 0;
    const _backgroundGradient = typeof backgroundGradient === 'string' ? backgroundGradient : '';
    const _backgroundOpacity = typeof backgroundOpacity === 'number' ? backgroundOpacity : 100;
    const _imageDisplayType = typeof imageDisplayType === 'string' ? imageDisplayType : 'image';
    const _unsplashQuery = typeof unsplashQuery === 'string' ? unsplashQuery : '';
    
    if (!_page) {
      return res.status(400).json({ 
        success: false, 
        error: 'Page is required' 
      });
    }
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      INSERT INTO banners (
        title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
        icon, iconType, iconPosition,
        useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      _title, 
      _subtitle, 
      _imageUrl, 
      _linkUrl, 
      _buttonText, 
      _page, 
      _displayOrder,
      _icon,
      _iconType,
      _iconPosition,
      _useGradient,
      _backgroundGradient,
      _backgroundOpacity,
      _imageDisplayType,
      _unsplashQuery
    );
    
    db.close();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding banner:', error);
    const message = (error && typeof (error as any).message === 'string') ? (error as any).message : 'Failed to add banner';
    res.status(500).json({ success: false, error: message });
  }
});

// Reorder banners (define BEFORE :id routes to avoid route-capture)
// (Moved reorder route above to avoid :id capture)

// Update banner
// Force numeric :id so '/reorder' does not match this route
router.put('/api/admin/banners/:id(\\d+)', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
      icon, iconType, iconPosition,
      useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
    } = req.body;
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      UPDATE banners 
      SET title = ?, subtitle = ?, imageUrl = ?, linkUrl = ?, buttonText = ?, 
          page = ?, display_order = ?, isActive = ?, 
          icon = ?, iconType = ?, iconPosition = ?,
          useGradient = ?, backgroundGradient = ?, backgroundOpacity = ?, imageDisplayType = ?, unsplashQuery = ?,
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
      (typeof useGradient === 'boolean' || typeof useGradient === 'number') ? (Number(useGradient) ? 1 : 0) : 0,
      backgroundGradient || '',
      (typeof backgroundOpacity === 'number' ? backgroundOpacity : 100),
      imageDisplayType || 'image',
      unsplashQuery || '',
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

// Import all static banners from config into the dynamic database
router.post('/api/admin/banners/import-static', (req, res) => {
  try {
    if (!fs.existsSync(staticConfigPath)) {
      return res.status(404).json({ success: false, error: 'Static banner config not found' });
    }

    const configData = fs.readFileSync(staticConfigPath, 'utf8');
    const config = JSON.parse(configData);

    const db = new Database(dbPath);

    const insert = db.prepare(`
      INSERT INTO banners (
        title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
        icon, iconType, iconPosition,
        useGradient, backgroundGradient, backgroundOpacity, imageDisplayType, unsplashQuery
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const existsStmt = db.prepare(`
      SELECT COUNT(*) as cnt FROM banners WHERE page = ? AND title = ? AND imageUrl = ?
    `);

    let importedCount = 0;

    // Iterate pages in config
    Object.keys(config).forEach((page) => {
      const arr = Array.isArray(config[page]) ? config[page] : [];
      arr.forEach((b: any, idx: number) => {
        const title = (typeof b.title === 'string' && b.title.trim().length > 0)
          ? b.title.trim()
          : (typeof b.subtitle === 'string' && b.subtitle.trim().length > 0)
            ? b.subtitle.trim()
            : `${page} Banner ${idx + 1}`;

        const imageUrl = (typeof b.imageUrl === 'string' && b.imageUrl.trim().length > 0)
          ? b.imageUrl.trim()
          : 'https://via.placeholder.com/1200x400/111827/ffffff?text=Banner';

        const linkUrl = typeof b.linkUrl === 'string' ? b.linkUrl : '';
        const buttonText = typeof b.buttonText === 'string' && b.buttonText.trim().length > 0
          ? b.buttonText
          : 'Learn More';
        const displayOrder = typeof b.display_order === 'number' ? b.display_order : (idx + 1);
        const isActive = b.isActive ? 1 : 0;
        const icon = typeof b.icon === 'string' ? b.icon : '';
        const iconType = icon ? 'fontawesome' : 'none';
        const iconPosition = 'left';

        const backgroundGradient = typeof b.gradient === 'string' && b.gradient.trim().length > 0 
          ? `bg-gradient-to-r ${b.gradient.trim()}` 
          : '';
        const useGradient = backgroundGradient ? 1 : 0;
        const backgroundOpacity = 100;
        const imageDisplayType = 'image';
        const unsplashQuery = '';

        const exists = existsStmt.get(page, title, imageUrl) as { cnt: number };
        if (!exists || exists.cnt === 0) {
          try {
            insert.run(
              title,
              typeof b.subtitle === 'string' ? b.subtitle : '',
              imageUrl,
              linkUrl,
              buttonText,
              page,
              displayOrder,
              isActive,
              icon,
              iconType,
              iconPosition,
              useGradient,
              backgroundGradient,
              backgroundOpacity,
              imageDisplayType,
              unsplashQuery
            );
            importedCount++;
          } catch (e) {
            console.warn('Skipping banner due to insert error:', e instanceof Error ? e.message : e);
          }
        }
      });
    });

    db.close();
    res.json({ success: true, imported: importedCount });
  } catch (error) {
    console.error('Error importing static banners:', error);
    res.status(500).json({ success: false, error: 'Failed to import static banners' });
  }
});

// Delete banner
// Force numeric :id for delete route as well
router.delete('/api/admin/banners/:id(\\d+)', (req, res) => {
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
// Force numeric :id for toggle route
router.patch('/api/admin/banners/:id(\\d+)/toggle', (req, res) => {
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
    console.log('>>> reorder route hit with body:', req.body);
    const { banners } = req.body; // Array of { id, display_order }

    if (!Array.isArray(banners)) {
      return res.status(400).json({ success: false, error: 'Banners array is required' });
    }

    const db = new Database(dbPath);

    // Validate that all banner IDs exist before attempting updates
    const existsStmt = db.prepare('SELECT id FROM banners WHERE id = ?');
    const missingIds: number[] = [];

    for (const b of banners) {
      const idNum = Number(b?.id);
      if (!Number.isFinite(idNum)) {
        missingIds.push(idNum);
        continue;
      }
      const row = existsStmt.get(idNum) as any;
      if (!row || !row.id) {
        missingIds.push(idNum);
      }
    }

    if (missingIds.length > 0) {
      db.close();
      return res.status(404).json({ success: false, error: 'Banner not found', missingIds });
    }

    const updateStmt = db.prepare(`
      UPDATE banners 
      SET display_order = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      for (const banner of banners) {
        updateStmt.run(Number(banner.display_order), Number(banner.id));
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