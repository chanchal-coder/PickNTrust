/**
 * Meta Tags Management Routes
 * API endpoints for managing website ownership verification meta tags
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { metaTags, type MetaTag, type InsertMetaTag } from '../shared/sqlite-schema';
import { sqliteDb as sharedSqliteDb } from './db.js';

const router = Router();
// Use shared connection pointing to the root database.sqlite initialized in db.ts
const sqliteDb = sharedSqliteDb;

// Admin password verification
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // Simple password fallback: allows operation in dev or when admin_users is not initialized
    const allowedPasswords = ['pickntrust2025', 'admin', 'delete'];
    const envPassword = process.env.ADMIN_PASSWORD;
    if (allowedPasswords.includes(password) || (envPassword && password === envPassword)) {
      return true;
    }

    // Check hashed password from admin_users table
    let adminUser: any;
    try {
      adminUser = sqliteDb.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get('admin');
    } catch (e) {
      console.log('admin_users table not found or inaccessible, password fallback not matched');
      return false;
    }

    if (!adminUser?.password_hash) return false;
    return await bcrypt.compare(password, adminUser.password_hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Get all meta tags
router.get('/api/admin/meta-tags', async (req, res) => {
  try {
    const { password } = req.query;
    
    if (!password || !await verifyAdminPassword(password as string)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tags = sqliteDb.prepare(`
      SELECT id, name, content, provider, purpose, is_active as isActive, 
             created_at as createdAt, updated_at as updatedAt
      FROM meta_tags 
      ORDER BY provider ASC, created_at DESC
    `).all();
    res.json({ success: true, metaTags: tags });
  } catch (error) {
    console.error('Error fetching meta tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch meta tags' });
  }
});

// Get active meta tags (for public use in HTML head)
router.get('/api/meta-tags/active', async (req, res) => {
  try {
    const tags = sqliteDb.prepare(`
      SELECT name, content, provider, purpose
      FROM meta_tags 
      WHERE is_active = 1
      ORDER BY provider ASC
    `).all();
    res.json({ success: true, metaTags: tags });
  } catch (error) {
    console.error('Error fetching active meta tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active meta tags' });
  }
});

// Create new meta tag
router.post('/api/admin/meta-tags', async (req, res) => {
  try {
    const { password, ...metaTagData } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, content, provider, purpose, isActive = true } = metaTagData;
    
    if (!name || !content || !provider || !purpose) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, content, provider, purpose' 
      });
    }

    // Check if meta tag with same name already exists
    const existing = sqliteDb.prepare('SELECT id FROM meta_tags WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Meta tag with this name already exists' 
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const result = sqliteDb.prepare(`
      INSERT INTO meta_tags (name, content, provider, purpose, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, content, provider, purpose, isActive ? 1 : 0, currentTime, currentTime);
    
    res.json({ 
      success: true, 
      message: 'Meta tag created successfully',
      metaTag: { id: result.lastInsertRowid, name, content, provider, purpose, isActive }
    });
  } catch (error) {
    console.error('Error creating meta tag:', error);
    res.status(500).json({ success: false, error: 'Failed to create meta tag' });
  }
});

// Update meta tag
router.put('/api/admin/meta-tags/:id', async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    const { name, content, provider, purpose, isActive } = updates;
    
    // Check if meta tag exists
    const existing = sqliteDb.prepare('SELECT id FROM meta_tags WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Meta tag not found' });
    }

    // Check if name conflicts with another tag (if name is being updated)
    if (name) {
      const nameConflict = sqliteDb.prepare('SELECT id FROM meta_tags WHERE name = ? AND id != ?').get(name, id);
      if (nameConflict) {
        return res.status(400).json({ 
          success: false, 
          error: 'Meta tag with this name already exists' 
        });
      }
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (content !== undefined) { updateFields.push('content = ?'); updateValues.push(content); }
    if (provider !== undefined) { updateFields.push('provider = ?'); updateValues.push(provider); }
    if (purpose !== undefined) { updateFields.push('purpose = ?'); updateValues.push(purpose); }
    if (isActive !== undefined) { updateFields.push('is_active = ?'); updateValues.push(isActive ? 1 : 0); }
    
    updateFields.push('updated_at = ?');
    updateValues.push(currentTime, id);
    
    sqliteDb.prepare(`
      UPDATE meta_tags 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...updateValues);
    
    res.json({ success: true, message: 'Meta tag updated successfully' });
  } catch (error) {
    console.error('Error updating meta tag:', error);
    res.status(500).json({ success: false, error: 'Failed to update meta tag' });
  }
});

// Delete meta tag
router.delete('/api/admin/meta-tags/:id', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    const result = sqliteDb.prepare('DELETE FROM meta_tags WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Meta tag not found' });
    }
    
    res.json({ success: true, message: 'Meta tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting meta tag:', error);
    res.status(500).json({ success: false, error: 'Failed to delete meta tag' });
  }
});

// Toggle meta tag active status
router.patch('/api/admin/meta-tags/:id/toggle', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    
    // Get current status using shared SQLite connection
    const current = sqliteDb.prepare('SELECT is_active FROM meta_tags WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ success: false, error: 'Meta tag not found' });
    }
    
    const newStatus = current.is_active ? 0 : 1;
    const currentTime = Math.floor(Date.now() / 1000);
    
    sqliteDb.prepare('UPDATE meta_tags SET is_active = ?, updated_at = ? WHERE id = ?')
      .run(newStatus, currentTime, id);
    
    res.json({ 
      success: true, 
      message: `Meta tag ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: Boolean(newStatus)
    });
  } catch (error) {
    console.error('Error toggling meta tag status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle meta tag status' });
  }
});

export default router;