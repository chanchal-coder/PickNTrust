// Dynamic page detection utility for announcement system
// This automatically detects all available pages from the routing system

export interface PageInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
}

// Define page metadata for better UX
const PAGE_METADATA: Record<string, Omit<PageInfo, 'id' | 'path'>> = {
  home: {
    name: 'Home Page',
    icon: '🏠',
    description: 'Main landing page with featured content'
  },
  blog: {
    name: 'Blog Listing',
    icon: '📝',
    description: 'Blog posts listing page'
  },
  'blog-post': {
    name: 'Blog Posts',
    icon: '📖',
    description: 'Individual blog post pages'
  },
  apps: {
    name: 'Apps & AI Tools',
    icon: '📱',
    description: 'Apps and AI tools showcase'
  },
  videos: {
    name: 'Videos',
    icon: '🎥',
    description: 'Video content and reviews'
  },
  services: {
    name: 'Services',
    icon: '🛠️',
    description: 'Services and subscriptions'
  },
  'top-picks': {
    name: 'Top Picks',
    icon: '⭐',
    description: 'Editor\'s choice products'
  },
  'travel-picks': {
    name: 'Travel Picks',
    icon: '✈️',
    description: 'Travel deals and recommendations'
  },
  'prime-picks': {
    name: 'Prime Picks',
    icon: '👑',
    description: 'Premium product selections'
  },
  'value-picks': {
    name: 'Value Picks',
    icon: '💎',
    description: 'Best value for money deals'
  },
  'click-picks': {
    name: 'Click Picks',
    icon: '🖱️',
    description: 'One-click shopping deals'
  },
  'cue-picks': {
    name: 'Cue Picks',
    icon: '🎯',
    description: 'Trending and curated picks'
  },
  'global-picks': {
    name: 'Global Picks',
    icon: '🌍',
    description: 'International product selections'
  },
  'deals-hub': {
    name: 'Deals Hub',
    icon: '🔥',
    description: 'Hot deals and discounts'
  },
  'loot-box': {
    name: 'Loot Box',
    icon: '📦',
    description: 'Mystery deals and surprises'
  },
  'fresh-picks': {
    name: 'Fresh Picks',
    icon: '🌱',
    description: 'Latest and freshest curated selections'
  },
  "artists-corner": {
    name: "Artist's Corner",
    icon: '🎨',
    description: 'Creative picks, art and design highlights'
  },
  'ott-hub': {
    name: 'OTT Hub',
    icon: '📺',
    description: 'Streaming platforms and entertainment hub'
  },
  trending: {
    name: 'Trending',
    icon: '📈',
    description: 'Most popular and trending products'
  },
  flights: {
    name: 'Flights',
    icon: '🛫',
    description: 'Flight booking and deals'
  },
  hotels: {
    name: 'Hotels',
    icon: '🏨',
    description: 'Hotel booking and deals'
  },
  search: {
    name: 'Search Results',
    icon: '🔍',
    description: 'Product search results'
  },
  'browse-categories': {
    name: 'Browse Categories',
    icon: '📂',
    description: 'Product category browser'
  },
  wishlist: {
    name: 'Wishlist',
    icon: '❤️',
    description: 'User wishlist and saved items'
  }
};

// Routes that should be excluded from announcement targeting
const EXCLUDED_ROUTES = [
  'admin',
  'bot-admin',
  'how-it-works',
  'terms-of-service',
  'privacy-policy',
  'category' // Dynamic category pages
];

/**
 * Get all available pages for announcement targeting
 * This function dynamically detects pages and can be extended
 */
export function getAvailablePages(): PageInfo[] {
  // Get all page IDs from metadata (this represents our available pages)
  const availablePageIds = Object.keys(PAGE_METADATA);
  
  // Convert to PageInfo objects
  const pages: PageInfo[] = availablePageIds.map(pageId => {
    const metadata = PAGE_METADATA[pageId];
    return {
      id: pageId,
      path: pageId === 'home' ? '/' : `/${pageId}`,
      ...metadata
    };
  });

  // Sort pages alphabetically by name for better UX
  return pages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get page info by ID
 */
export function getPageInfo(pageId: string): PageInfo | null {
  const metadata = PAGE_METADATA[pageId];
  if (!metadata) return null;
  
  return {
    id: pageId,
    path: pageId === 'home' ? '/' : `/${pageId}`,
    ...metadata
  };
}

/**
 * Add a new page to the system (for future extensibility)
 * This allows dynamic addition of pages without code changes
 */
export function addPage(pageInfo: PageInfo): void {
  PAGE_METADATA[pageInfo.id] = {
    name: pageInfo.name,
    icon: pageInfo.icon,
    description: pageInfo.description
  };
}

/**
 * Remove a page from the system (for future extensibility)
 */
export function removePage(pageId: string): void {
  delete PAGE_METADATA[pageId];
}

/**
 * Check if a page exists in the system
 */
export function pageExists(pageId: string): boolean {
  return pageId in PAGE_METADATA;
}

/**
 * Get page display name with icon
 */
export function getPageDisplayName(pageId: string): string {
  const pageInfo = getPageInfo(pageId);
  if (!pageInfo) return pageId;
  return `${pageInfo.icon} ${pageInfo.name}`;
}

/**
 * Get available pages from API (fully dynamic)
 * This allows the system to be completely dynamic - pages can be added/removed
 * from the server without any frontend code changes
 */
export async function getAvailablePagesFromAPI(): Promise<PageInfo[]> {
  try {
    const response = await fetch('/api/pages');
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success && Array.isArray(data.pages)) {
      return data.pages;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('Failed to fetch pages from API:', error);
    // Fallback to static pages
    return getAvailablePages();
  }
}

/**
 * Get available pages with API fallback
 * Tries API first, falls back to static list
 */
export async function getAvailablePagesHybrid(): Promise<PageInfo[]> {
  try {
    // Try API first for dynamic pages
    return await getAvailablePagesFromAPI();
  } catch (error) {
    console.warn('API unavailable, using static pages:', error);
    // Fallback to static pages
    return getAvailablePages();
  }
}

/**
 * Add a new page via API (admin function)
 */
export async function addPageViaAPI(pageInfo: PageInfo, adminPassword: string): Promise<boolean> {
  try {
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: adminPassword,
        page: pageInfo
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to add page via API:', error);
    return false;
  }
}

/**
 * Remove a page via API (admin function)
 */
export async function removePageViaAPI(pageId: string, adminPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/pages/${pageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: adminPassword
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to remove page via API:', error);
    return false;
  }
}