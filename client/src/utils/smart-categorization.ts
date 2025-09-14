// Smart categorization utility for services and apps
// Automatically assigns categories based on content analysis

export interface CategoryMapping {
  keywords: string[];
  category: string;
  priority: number; // Higher priority takes precedence
}

// Category mappings for services and apps
const SERVICE_CATEGORIES: CategoryMapping[] = [
  {
    keywords: ['cloud', 'storage', 'backup', 'drive', 'sync', 'hosting', 'server', 'database', 'aws', 'azure', 'google cloud'],
    category: 'Technology',
    priority: 10
  },
  {
    keywords: ['marketing', 'seo', 'social media', 'advertising', 'campaign', 'email marketing', 'analytics', 'conversion'],
    category: 'Business',
    priority: 9
  },
  {
    keywords: ['streaming', 'netflix', 'spotify', 'music', 'video', 'entertainment', 'gaming', 'movies', 'tv shows'],
    category: 'Entertainment',
    priority: 8
  },
  {
    keywords: ['vpn', 'security', 'antivirus', 'firewall', 'encryption', 'privacy', 'protection', 'cybersecurity'],
    category: 'Security',
    priority: 9
  },
  {
    keywords: ['design', 'graphics', 'photo editing', 'video editing', 'creative', 'adobe', 'canva', 'figma'],
    category: 'Design & Creative',
    priority: 8
  },
  {
    keywords: ['fitness', 'health', 'workout', 'nutrition', 'wellness', 'meditation', 'yoga', 'exercise'],
    category: 'Health & Fitness',
    priority: 7
  },
  {
    keywords: ['education', 'learning', 'course', 'training', 'tutorial', 'skill', 'certification', 'online class'],
    category: 'Education',
    priority: 8
  },
  {
    keywords: ['finance', 'banking', 'investment', 'trading', 'cryptocurrency', 'payment', 'wallet', 'money'],
    category: 'Finance',
    priority: 9
  },
  {
    keywords: ['communication', 'messaging', 'chat', 'video call', 'conference', 'collaboration', 'team'],
    category: 'Communication',
    priority: 7
  },
  {
    keywords: ['productivity', 'task management', 'project management', 'organization', 'planning', 'scheduling'],
    category: 'Productivity',
    priority: 8
  }
];

const APP_CATEGORIES: CategoryMapping[] = [
  {
    keywords: ['photo', 'camera', 'image', 'picture', 'photography', 'editing', 'filter', 'instagram'],
    category: 'Photography',
    priority: 10
  },
  {
    keywords: ['productivity', 'task', 'todo', 'note', 'reminder', 'calendar', 'schedule', 'organization'],
    category: 'Productivity',
    priority: 9
  },
  {
    keywords: ['game', 'gaming', 'play', 'puzzle', 'arcade', 'strategy', 'action', 'adventure'],
    category: 'Games',
    priority: 10
  },
  {
    keywords: ['social', 'chat', 'messaging', 'communication', 'network', 'friends', 'community'],
    category: 'Social',
    priority: 8
  },
  {
    keywords: ['music', 'audio', 'sound', 'player', 'streaming', 'podcast', 'radio', 'spotify'],
    category: 'Music & Audio',
    priority: 9
  },
  {
    keywords: ['shopping', 'ecommerce', 'store', 'buy', 'sell', 'marketplace', 'retail', 'amazon'],
    category: 'Shopping',
    priority: 8
  },
  {
    keywords: ['travel', 'booking', 'hotel', 'flight', 'trip', 'vacation', 'navigation', 'maps'],
    category: 'Travel',
    priority: 8
  },
  {
    keywords: ['health', 'fitness', 'medical', 'doctor', 'wellness', 'exercise', 'diet', 'nutrition'],
    category: 'Health & Fitness',
    priority: 8
  },
  {
    keywords: ['education', 'learning', 'study', 'course', 'language', 'skill', 'tutorial', 'knowledge'],
    category: 'Education',
    priority: 8
  },
  {
    keywords: ['business', 'crm', 'sales', 'analytics', 'management', 'enterprise', 'professional'],
    category: 'Business',
    priority: 9
  },
  {
    keywords: ['utility', 'tool', 'system', 'file', 'cleaner', 'optimizer', 'manager', 'maintenance'],
    category: 'Utilities',
    priority: 7
  },
  {
    keywords: ['news', 'media', 'reading', 'magazine', 'newspaper', 'article', 'information'],
    category: 'News & Magazines',
    priority: 7
  }
];

// AI-specific categories
const AI_CATEGORIES: CategoryMapping[] = [
  {
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'smart', 'intelligent', 'automated'],
    category: 'AI & Automation',
    priority: 15
  },
  {
    keywords: ['chatbot', 'assistant', 'bot', 'virtual assistant', 'ai helper', 'conversational'],
    category: 'AI Assistants',
    priority: 14
  },
  {
    keywords: ['ai photo', 'ai image', 'ai editing', 'ai enhancement', 'ai filter', 'ai art'],
    category: 'AI Photography',
    priority: 13
  },
  {
    keywords: ['ai writing', 'ai content', 'ai text', 'ai copywriting', 'ai generator', 'gpt'],
    category: 'AI Writing',
    priority: 13
  }
];

/**
 * Automatically categorizes content based on name and description
 * @param name - Product/service/app name
 * @param description - Product/service/app description
 * @param contentType - 'product', 'service', or 'app'
 * @returns Suggested category
 */
export function smartCategorize(name: string, description: string = '', contentType: string = 'product'): string {
  const text = `${name} ${description}`.toLowerCase();
  
  // Check for AI content first (highest priority)
  const aiMatch = findBestCategoryMatch(text, AI_CATEGORIES);
  if (aiMatch) {
    return aiMatch;
  }
  
  // Then check content-type specific categories
  let categories: CategoryMapping[] = [];
  
  switch (contentType) {
    case 'service':
      categories = SERVICE_CATEGORIES;
      break;
    case 'app':
      categories = APP_CATEGORIES;
      break;
    default:
      // For products, use a mix of service and app categories
      categories = [...SERVICE_CATEGORIES, ...APP_CATEGORIES];
  }
  
  const match = findBestCategoryMatch(text, categories);
  
  // Fallback categories based on content type
  if (!match) {
    switch (contentType) {
      case 'service':
        return 'Business Services';
      case 'app':
        return 'Mobile Apps';
      default:
        return 'General';
    }
  }
  
  return match;
}

/**
 * Finds the best category match based on keyword analysis
 * @param text - Text to analyze
 * @param categories - Category mappings to check against
 * @returns Best matching category or null
 */
function findBestCategoryMatch(text: string, categories: CategoryMapping[]): string | null {
  let bestMatch: { category: string; score: number; priority: number } | null = null;
  
  for (const mapping of categories) {
    let score = 0;
    
    // Count keyword matches
    for (const keyword of mapping.keywords) {
      if (text.includes(keyword)) {
        score += 1;
        // Bonus for exact word matches
        const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (wordRegex.test(text)) {
          score += 0.5;
        }
      }
    }
    
    if (score > 0) {
      const totalScore = score * mapping.priority;
      
      if (!bestMatch || totalScore > (bestMatch.score * bestMatch.priority)) {
        bestMatch = {
          category: mapping.category,
          score,
          priority: mapping.priority
        };
      }
    }
  }
  
  return bestMatch?.category || null;
}

/**
 * Detects if content is AI-related
 * @param name - Content name
 * @param description - Content description
 * @returns True if AI-related
 */
export function isAIContent(name: string, description: string = ''): boolean {
  const text = `${name} ${description}`.toLowerCase();
  const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'smart', 'intelligent', 'automated', 'bot', 'assistant'];
  
  return aiKeywords.some(keyword => {
    const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    return wordRegex.test(text);
  });
}

/**
 * Gets all available categories for a content type
 * @param contentType - 'product', 'service', or 'app'
 * @returns Array of category names
 */
export function getAvailableCategories(contentType: string = 'product'): string[] {
  let categories: CategoryMapping[] = [];
  
  switch (contentType) {
    case 'service':
      categories = SERVICE_CATEGORIES;
      break;
    case 'app':
      categories = [...APP_CATEGORIES, ...AI_CATEGORIES];
      break;
    default:
      categories = [...SERVICE_CATEGORIES, ...APP_CATEGORIES, ...AI_CATEGORIES];
  }
  
  const uniqueCategories = Array.from(new Set(categories.map(c => c.category)));
  return uniqueCategories.sort();
}

/**
 * Updates category for mixed content display
 * @param items - Array of content items
 * @returns Items with updated categories
 */
export function updateMixedContentCategories<T extends { name: string; description?: string; content_type?: string; category?: string }>(items: T[]): T[] {
  return items.map(item => {
    // Only auto-categorize if no category exists or if it's a generic category
    const needsCategorization = !item.category || 
      item.category === 'General' || 
      item.category === 'Uncategorized' ||
      (item.content_type !== 'product' && !item.category.includes(item.content_type || ''));
    
    if (needsCategorization) {
      const suggestedCategory = smartCategorize(
        item.name,
        item.description || '',
        item.content_type || 'product'
      );
      
      return {
        ...item,
        category: suggestedCategory
      };
    }
    
    return item;
  });
}