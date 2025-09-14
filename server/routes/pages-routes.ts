// Dynamic pages API for announcement system
// This provides a server-side endpoint to fetch available pages

import { Router } from 'express';

const router = Router();

// Page information interface
interface PageInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  category?: string;
  isActive?: boolean;
}

// Available pages configuration
// This can be moved to database or configuration file for full dynamic management
const AVAILABLE_PAGES: PageInfo[] = [
  {
    id: 'home',
    name: 'Home Page',
    icon: '🏠',
    description: 'Main landing page with featured content',
    path: '/',
    category: 'main',
    isActive: true
  },
  {
    id: 'blog',
    name: 'Blog Listing',
    icon: '📝',
    description: 'Blog posts listing page',
    path: '/blog',
    category: 'content',
    isActive: true
  },
  {
    id: 'blog-post',
    name: 'Blog Posts',
    icon: '📖',
    description: 'Individual blog post pages',
    path: '/blog/:slug',
    category: 'content',
    isActive: true
  },
  {
    id: 'apps',
    name: 'Apps & AI Tools',
    icon: '📱',
    description: 'Apps and AI tools showcase',
    path: '/apps',
    category: 'products',
    isActive: true
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: '🎥',
    description: 'Video content and reviews',
    path: '/videos',
    category: 'content',
    isActive: true
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🛠️',
    description: 'Services and subscriptions',
    path: '/services',
    category: 'products',
    isActive: true
  },
  {
    id: 'top-picks',
    name: 'Top Picks',
    icon: '⭐',
    description: 'Editor\'s choice products',
    path: '/top-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'travel-picks',
    name: 'Travel Picks',
    icon: '✈️',
    description: 'Travel deals and recommendations',
    path: '/travel-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'prime-picks',
    name: 'Prime Picks',
    icon: '👑',
    description: 'Premium product selections',
    path: '/prime-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'value-picks',
    name: 'Value Picks',
    icon: '💎',
    description: 'Best value for money deals',
    path: '/value-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'click-picks',
    name: 'Click Picks',
    icon: '🖱️',
    description: 'One-click shopping deals',
    path: '/click-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'cue-picks',
    name: 'Cue Picks',
    icon: '🎯',
    description: 'Trending and curated picks',
    path: '/cue-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'global-picks',
    name: 'Global Picks',
    icon: '🌍',
    description: 'International product selections',
    path: '/global-picks',
    category: 'picks',
    isActive: true
  },
  {
    id: 'deals-hub',
    name: 'Deals Hub',
    icon: '🔥',
    description: 'Hot deals and discounts',
    path: '/deals-hub',
    category: 'deals',
    isActive: true
  },
  {
    id: 'loot-box',
    name: 'Loot Box',
    icon: '📦',
    description: 'Mystery deals and surprises',
    path: '/loot-box',
    category: 'deals',
    isActive: true
  },
  {
    id: 'flights',
    name: 'Flights',
    icon: '🛫',
    description: 'Flight booking and deals',
    path: '/flights',
    category: 'travel',
    isActive: true
  },
  {
    id: 'hotels',
    name: 'Hotels',
    icon: '🏨',
    description: 'Hotel booking and deals',
    path: '/hotels',
    category: 'travel',
    isActive: true
  },
  {
    id: 'search',
    name: 'Search Results',
    icon: '🔍',
    description: 'Product search results',
    path: '/search',
    category: 'utility',
    isActive: true
  },
  {
    id: 'browse-categories',
    name: 'Browse Categories',
    icon: '📂',
    description: 'Product category browser',
    path: '/browse-categories',
    category: 'utility',
    isActive: true
  },
  {
    id: 'wishlist',
    name: 'Wishlist',
    icon: '❤️',
    description: 'User wishlist and saved items',
    path: '/wishlist',
    category: 'user',
    isActive: true
  }
];

/**
 * GET /api/pages
 * Get all available pages for announcement targeting
 */
router.get('/', (req, res) => {
  try {
    // Filter only active pages
    const activePages = AVAILABLE_PAGES.filter(page => page.isActive !== false);
    
    // Sort by category and then by name
    const sortedPages = activePages.sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      success: true,
      pages: sortedPages,
      total: sortedPages.length,
      categories: [...new Set(sortedPages.map(p => p.category).filter(Boolean))]
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages'
    });
  }
});

/**
 * GET /api/pages/:pageId
 * Get specific page information
 */
router.get('/:pageId', (req, res) => {
  try {
    const { pageId } = req.params;
    const page = AVAILABLE_PAGES.find(p => p.id === pageId);
    
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    
    res.json({
      success: true,
      page
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page'
    });
  }
});

/**
 * POST /api/pages (Admin only)
 * Add a new page to the system
 * This allows dynamic addition of pages without code changes
 */
router.post('/', (req, res) => {
  try {
    const { password, page } = req.body;
    
    // Simple admin authentication (in production, use proper auth)
    if (password !== 'pickntrust2025') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Validate page data
    if (!page || !page.id || !page.name || !page.path) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page data. Required: id, name, path'
      });
    }
    
    // Check if page already exists
    if (AVAILABLE_PAGES.find(p => p.id === page.id)) {
      return res.status(409).json({
        success: false,
        error: 'Page already exists'
      });
    }
    
    // Add page with defaults
    const newPage: PageInfo = {
      id: page.id,
      name: page.name,
      icon: page.icon || '📄',
      description: page.description || `${page.name} page`,
      path: page.path,
      category: page.category || 'custom',
      isActive: true
    };
    
    AVAILABLE_PAGES.push(newPage);
    
    res.json({
      success: true,
      message: 'Page added successfully',
      page: newPage
    });
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add page'
    });
  }
});

/**
 * DELETE /api/pages/:pageId (Admin only)
 * Remove a page from the system
 */
router.delete('/:pageId', (req, res) => {
  try {
    const { pageId } = req.params;
    const { password } = req.body;
    
    // Simple admin authentication
    if (password !== 'pickntrust2025') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const pageIndex = AVAILABLE_PAGES.findIndex(p => p.id === pageId);
    
    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    
    // Instead of deleting, mark as inactive (safer)
    AVAILABLE_PAGES[pageIndex].isActive = false;
    
    res.json({
      success: true,
      message: 'Page deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate page'
    });
  }
});

export default router;