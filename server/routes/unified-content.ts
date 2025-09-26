import express from 'express';
import { db } from '../db';
import { unifiedContent } from '../../shared/sqlite-schema';
import { eq, and, desc, asc } from 'drizzle-orm';

const router = express.Router();

// Get content by page type
router.get('/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    const { category, limit = '50', offset = '0', featured } = req.query;
    
    // Build where conditions
    let whereConditions = [
      eq(unifiedContent.pageType, pageType as any),
      eq(unifiedContent.isActive, true)
    ];
    
    // Add category filter if specified
    if (category) {
      whereConditions.push(eq(unifiedContent.category, category as string));
    }
    
    // Add featured filter if specified
    if (featured === 'true') {
      whereConditions.push(eq(unifiedContent.isFeatured, true));
    }
    
    const query = db.select().from(unifiedContent)
      .where(and(...whereConditions));
    
    const content = await query
      .orderBy(desc(unifiedContent.displayOrder), desc(unifiedContent.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get single content item
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await db.select().from(unifiedContent)
      .where(eq(unifiedContent.id, parseInt(id)))
      .limit(1);
    
    if (content.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(content[0]);
  } catch (error) {
    console.error('Error fetching content item:', error);
    res.status(500).json({ error: 'Failed to fetch content item' });
  }
});

// Create new content
router.post('/', async (req, res) => {
  try {
    const contentData = req.body;
    
    // Set source type to manual for API created content
    contentData.sourceType = 'manual';
    contentData.sourceId = 'admin_panel';
    
    const [newContent] = await db.insert(unifiedContent)
      .values(contentData)
      .returning();
    
    res.status(201).json(newContent);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Update content
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove id and timestamps from update data
    delete updateData.id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();
    
    const [updatedContent] = await db.update(unifiedContent)
      .set(updateData)
      .where(eq(unifiedContent.id, parseInt(id)))
      .returning();
    
    if (!updatedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(updatedContent);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete content
router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify admin password
    if (!password || password !== 'pickntrust2025') {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    const { id } = req.params;
    
    const [deletedContent] = await db.delete(unifiedContent)
      .where(eq(unifiedContent.id, parseInt(id)))
      .returning();
    
    if (!deletedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Get categories for a page type
router.get('/:pageType/categories', async (req, res) => {
  try {
    const { pageType } = req.params;
    
    const categories = await db.selectDistinct({ category: unifiedContent.category })
      .from(unifiedContent)
      .where(and(
        eq(unifiedContent.pageType, pageType as any),
        eq(unifiedContent.isActive, true)
      ));
    
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Toggle featured status
router.patch('/:id/featured', async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const [updatedContent] = await db.update(unifiedContent)
      .set({ 
        isFeatured: featured as boolean
      } as any)
      .where(eq(unifiedContent.id, parseInt(id)))
      .returning();
    
    if (!updatedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(updatedContent);
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// Toggle active status
router.patch('/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    const [updatedContent] = await db.update(unifiedContent)
      .set({ 
        isActive: active as boolean
      } as any)
      .where(eq(unifiedContent.id, parseInt(id)))
      .returning();
    
    if (!updatedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(updatedContent);
  } catch (error) {
    console.error('Error updating active status:', error);
    res.status(500).json({ error: 'Failed to update active status' });
  }
});

export default router;