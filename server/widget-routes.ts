import { Router, Request, Response } from 'express';
import { sqliteDb } from './db.js';
import { insertWidgetSchema } from '../shared/sqlite-schema.js';
import { z } from 'zod';

const router = Router();

// Middleware to verify admin access (reusing existing pattern)
const verifyAdminAccess = (req: Request, res: Response, next: any) => {
  // Enhanced admin access for development and production
  const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password']) as string | undefined;
  const bodyPwd = (req.body && typeof req.body === 'object') ? (req.body.password as string | undefined) : undefined;
  const queryPwd = typeof req.query?.password === 'string' ? (req.query.password as string) : undefined;
  const adminPassword = headerPwd || bodyPwd || queryPwd;
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

  // Allow multiple admin passwords for flexibility
  const validPasswords = [
    process.env.ADMIN_PASSWORD,
    'pickntrust2025',
    'admin',
    'widget-admin'
  ].filter(Boolean); // Remove undefined values

  // For localhost, be more permissive
  if (isLocalhost && (!adminPassword || validPasswords.includes(adminPassword))) {
    console.log('🔓 Widget admin access granted (localhost)');
    return next();
  }

  // For production, require valid password
  if (adminPassword && validPasswords.includes(adminPassword)) {
    console.log('🔐 Widget admin access granted');
    return next();
  }

  console.log('❌ Widget admin access denied:', { password: adminPassword ? '[PROVIDED]' : '[MISSING]', hostname: req.hostname });
  return res.status(401).json({ error: 'Unauthorized - Admin access required for widget management' });
};

// Get all widgets
router.get('/api/admin/widgets', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const allWidgets = sqliteDb.prepare(`
      SELECT * FROM widgets 
      ORDER BY created_at DESC
    `).all();
    res.json(allWidgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ error: 'Failed to fetch widgets' });
  }
});

// Get widgets for a specific page and position
router.get('/api/widgets/:page/:position', async (req: Request, res: Response) => {
  try {
    const { page, position } = req.params;

    // Serve widgets for all pages, including prime-picks

    // Normalize legacy/synonym positions to avoid mismatches across layouts
    let positionsToQuery: string[] = [position];

    if (position === 'header') {
      positionsToQuery = ['header', 'header-top', 'header-bottom'];
    } else if (position === 'footer') {
      positionsToQuery = ['footer', 'footer-top', 'footer-bottom'];
    }

    const placeholders = positionsToQuery.map(() => '?').join(', ');
    const pageWidgets = sqliteDb.prepare(`
      SELECT * FROM widgets 
      WHERE target_page = ? 
        AND position IN (${placeholders}) 
        AND is_active = 1
        AND LOWER(name) NOT LIKE '%fallback%'
        AND LOWER(name) NOT LIKE '%test%'
        AND (description IS NULL OR LOWER(description) NOT LIKE '%test%')
      ORDER BY display_order
    `).all(page, ...positionsToQuery);
    
    res.json(pageWidgets);
  } catch (error) {
    console.error('Error fetching page widgets:', error);
    res.status(500).json({ error: 'Failed to fetch page widgets' });
  }
});

// Get all active widgets for a specific page
router.get('/api/widgets/:page', async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    // Serve widgets for all pages, including prime-picks
    const pageWidgets = sqliteDb.prepare(`
      SELECT * FROM widgets 
      WHERE target_page = ? 
        AND is_active = 1
        AND LOWER(name) NOT LIKE '%fallback%'
        AND LOWER(name) NOT LIKE '%test%'
        AND (description IS NULL OR LOWER(description) NOT LIKE '%test%')
      ORDER BY position, display_order
    `).all(page);
    
    res.json(pageWidgets);
  } catch (error) {
    console.error('Error fetching page widgets:', error);
    res.status(500).json({ error: 'Failed to fetch page widgets' });
  }
});

// Create a new widget
router.post('/api/admin/widgets', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const validatedData = insertWidgetSchema.parse(req.body) as any;
    
  const result = sqliteDb.prepare(`
      INSERT INTO widgets (
        name, description, body, code, target_page, position, is_active, display_order, 
        max_width, custom_css, show_on_mobile, show_on_desktop, external_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      validatedData.name,
      validatedData.description || null,
      validatedData.body || null,
      validatedData.code,
      validatedData.targetPage,
      validatedData.position,
      (validatedData.isActive !== false) ? 1 : 0,  // Convert boolean to integer
      validatedData.displayOrder || 0,
      validatedData.maxWidth || null,
      validatedData.customCss || null,
      (validatedData.showOnMobile !== false) ? 1 : 0,  // Convert boolean to integer
      (validatedData.showOnDesktop !== false) ? 1 : 0,   // Convert boolean to integer
      validatedData.externalLink || null
    );
    
    const newWidget = sqliteDb.prepare('SELECT * FROM widgets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newWidget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Widget validation error:', error.errors);
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating widget:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      validatedData: req.body
    });
    res.status(500).json({ error: 'Failed to create widget', details: error.message });
  }
});

// Update a widget
router.put('/api/admin/widgets/:id', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = insertWidgetSchema.partial().parse(req.body) as any;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (validatedData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(validatedData.name);
    }
    if (validatedData.code !== undefined) {
      updateFields.push('code = ?');
      updateValues.push(validatedData.code);
    }
    if (validatedData.targetPage !== undefined) {
      updateFields.push('target_page = ?');
      updateValues.push(validatedData.targetPage);
    }
    if (validatedData.position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(validatedData.position);
    }
    if (validatedData.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(validatedData.isActive ? 1 : 0);
    }
    if (validatedData.displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(validatedData.displayOrder);
    }
    if (validatedData.maxWidth !== undefined) {
      updateFields.push('max_width = ?');
      updateValues.push(validatedData.maxWidth);
    }
    if (validatedData.customCss !== undefined) {
      updateFields.push('custom_css = ?');
      updateValues.push(validatedData.customCss);
    }
    if (validatedData.body !== undefined) {
      updateFields.push('body = ?');
      updateValues.push(validatedData.body || null);
    }
    if (validatedData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(validatedData.description || null);
    }
    if (validatedData.showOnMobile !== undefined) {
      updateFields.push('show_on_mobile = ?');
      updateValues.push(validatedData.showOnMobile ? 1 : 0);
    }
    if (validatedData.showOnDesktop !== undefined) {
      updateFields.push('show_on_desktop = ?');
      updateValues.push(validatedData.showOnDesktop ? 1 : 0);
    }
    if (validatedData.externalLink !== undefined) {
      updateFields.push('external_link = ?');
      updateValues.push(validatedData.externalLink || null);
    }
    
    updateValues.push(parseInt(id));
    
    const result = sqliteDb.prepare(`
      UPDATE widgets SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...updateValues);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    const updatedWidget = sqliteDb.prepare('SELECT * FROM widgets WHERE id = ?').get(parseInt(id));
    res.json(updatedWidget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Toggle widget active status
router.patch('/api/admin/widgets/:id/toggle', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First get the current status
    const currentWidget = sqliteDb.prepare('SELECT is_active FROM widgets WHERE id = ?').get(parseInt(id)) as { is_active: boolean } | undefined;
    
    if (!currentWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Toggle the status (convert boolean to integer for SQLite)
    const newStatus = currentWidget.is_active ? 0 : 1;
    sqliteDb.prepare(`
      UPDATE widgets SET is_active = ? WHERE id = ?
    `).run(newStatus, parseInt(id));
    
    const updatedWidget = sqliteDb.prepare('SELECT * FROM widgets WHERE id = ?').get(parseInt(id));
    res.json(updatedWidget);
  } catch (error) {
    console.error('Error toggling widget:', error);
    res.status(500).json({ error: 'Failed to toggle widget' });
  }
});

// Delete a widget
router.delete('/api/admin/widgets/:id', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the widget before deleting
    const deletedWidget = sqliteDb.prepare('SELECT * FROM widgets WHERE id = ?').get(parseInt(id));
    
    if (!deletedWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Delete the widget
    sqliteDb.prepare('DELETE FROM widgets WHERE id = ?').run(parseInt(id));
    
    res.json({ message: 'Widget deleted successfully', widget: deletedWidget });
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Update widget display order
router.put('/api/admin/widgets/reorder', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const { widgets: widgetUpdates } = req.body;
    
    if (!Array.isArray(widgetUpdates)) {
      return res.status(400).json({ error: 'Invalid widget updates format' });
    }
    
    // Update each widget's display order
    const updateStmt = sqliteDb.prepare('UPDATE widgets SET display_order = ? WHERE id = ?');
    
    for (const { id, displayOrder } of widgetUpdates) {
      updateStmt.run(displayOrder, id);
    }
    
    res.json({ message: 'Widget order updated successfully' });
  } catch (error) {
    console.error('Error reordering widgets:', error);
    res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

// Get widget statistics
router.get('/api/admin/widgets/stats', verifyAdminAccess, async (req: Request, res: Response) => {
  try {
    const totalWidgets = sqliteDb.prepare('SELECT * FROM widgets').all();
    const activeWidgets = totalWidgets.filter((w: any) => w.is_active);
    
    const statsByPage = totalWidgets.reduce((acc: any, widget: any) => {
      if (!acc[widget.target_page]) {
        acc[widget.target_page] = { total: 0, active: 0 };
      }
      acc[widget.target_page].total++;
      if (widget.is_active) {
        acc[widget.target_page].active++;
      }
      return acc;
    }, {} as Record<string, { total: number; active: number }>);
    
    const statsByPosition = totalWidgets.reduce((acc: any, widget: any) => {
      if (!acc[widget.position]) {
        acc[widget.position] = { total: 0, active: 0 };
      }
      acc[widget.position].total++;
      if (widget.is_active) {
        acc[widget.position].active++;
      }
      return acc;
    }, {} as Record<string, { total: number; active: number }>);
    
    res.json({
      total: totalWidgets.length,
      active: activeWidgets.length,
      inactive: totalWidgets.length - activeWidgets.length,
      byPage: statsByPage,
      byPosition: statsByPosition
    });
  } catch (error) {
    console.error('Error fetching widget stats:', error);
    res.status(500).json({ error: 'Failed to fetch widget statistics' });
  }
});

export default router;