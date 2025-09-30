// Enhanced Smart Categorization for Bot/RSS Automation
// Automatically detects product types and assigns appropriate flags

export interface ProductTypeDetection {
  isFeatured: boolean;
  isService: boolean;
  isAIApp: boolean;
  category: string;
  confidence: number;
}

export interface CategoryMapping {
  keywords: string[];
  category: string;
  priority: number;
}

// Keywords that indicate a product should be featured
const FEATURED_KEYWORDS = [
  'premium', 'exclusive', 'limited', 'special offer', 'bestseller', 'top rated',
  'editor choice', 'recommended', 'award winning', 'featured', 'trending',
  'popular', 'hot deal', 'must have', 'top pick', 'curated', 'handpicked'
];

// Keywords that indicate a service
const SERVICE_KEYWORDS = [
  'service', 'subscription', 'plan', 'membership', 'account', 'access',
  'streaming', 'cloud', 'hosting', 'vpn', 'insurance', 'banking',
  'credit card', 'loan', 'investment', 'trading', 'consultation',
  'support', 'maintenance', 'warranty', 'protection', 'security'
];

// Keywords that indicate AI/App products
const AI_APP_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'neural',
  'smart', 'intelligent', 'automated', 'bot', 'assistant', 'chatbot',
  'app', 'application', 'software', 'tool', 'platform', 'saas',
  'mobile app', 'web app', 'desktop app', 'chrome extension',
  'plugin', 'addon', 'widget', 'api', 'sdk'
];

// Channel-based categorization mapping
const CHANNEL_TYPE_MAPPING: { [key: string]: Partial<ProductTypeDetection> } = {
  // Featured channels
  'prime-picks': { isFeatured: true, isService: false, isAIApp: false },
  'cue-picks': { isFeatured: true, isService: false, isAIApp: false },
  'value-picks': { isFeatured: true, isService: false, isAIApp: false },
  'click-picks': { isFeatured: true, isService: false, isAIApp: false },
  'global-picks': { isFeatured: true, isService: false, isAIApp: false },
  
  // Service channels
  'deals-hub': { isFeatured: false, isService: true, isAIApp: false },
  'travel-picks': { isFeatured: false, isService: true, isAIApp: false },
  
  // General channels (will use content analysis)
  'loot-box': { isFeatured: false, isService: false, isAIApp: false }
};

// Service categories
const SERVICE_CATEGORIES: CategoryMapping[] = [
  {
    keywords: ['credit card', 'banking', 'loan', 'finance', 'investment', 'trading', 'cryptocurrency'],
    category: 'Financial Services',
    priority: 10
  },
  {
    keywords: ['streaming', 'netflix', 'spotify', 'music', 'video', 'entertainment', 'subscription'],
    category: 'Entertainment Services',
    priority: 9
  },
  {
    keywords: ['cloud', 'storage', 'hosting', 'server', 'database', 'backup', 'sync'],
    category: 'Cloud Services',
    priority: 9
  },
  {
    keywords: ['vpn', 'security', 'antivirus', 'protection', 'privacy', 'cybersecurity'],
    category: 'Security Services',
    priority: 9
  },
  {
    keywords: ['insurance', 'health', 'life', 'auto', 'home', 'travel', 'coverage'],
    category: 'Insurance Services',
    priority: 8
  },
  {
    keywords: ['marketing', 'seo', 'advertising', 'social media', 'email marketing', 'analytics'],
    category: 'Marketing Services',
    priority: 8
  },
  {
    keywords: ['education', 'course', 'training', 'certification', 'learning', 'tutorial'],
    category: 'Education Services',
    priority: 7
  }
];

// AI/App categories
const AI_APP_CATEGORIES: CategoryMapping[] = [
  {
    keywords: ['ai writing', 'content generation', 'copywriting', 'text generator', 'gpt'],
    category: 'AI Writing Tools',
    priority: 15
  },
  {
    keywords: ['ai image', 'image generation', 'ai art', 'photo editing', 'ai photo'],
    category: 'AI Image Tools',
    priority: 14
  },
  {
    keywords: ['chatbot', 'ai assistant', 'virtual assistant', 'conversational ai'],
    category: 'AI Assistants',
    priority: 14
  },
  {
    keywords: ['productivity', 'task management', 'project management', 'organization'],
    category: 'Productivity Apps',
    priority: 12
  },
  {
    keywords: ['design', 'graphics', 'ui', 'ux', 'creative', 'figma', 'sketch'],
    category: 'Design Apps',
    priority: 11
  },
  {
    keywords: ['developer', 'coding', 'programming', 'api', 'sdk', 'development'],
    category: 'Developer Tools',
    priority: 11
  },
  {
    keywords: ['business', 'crm', 'sales', 'analytics', 'dashboard', 'reporting'],
    category: 'Business Apps',
    priority: 10
  },
  {
    keywords: ['mobile app', 'ios', 'android', 'smartphone', 'tablet'],
    category: 'Mobile Apps',
    priority: 9
  }
];

/**
 * Analyzes product content and determines its type and category
 */
export function analyzeProductType(
  title: string,
  description: string = '',
  channelSlug: string = '',
  platform: string = ''
): ProductTypeDetection {
  const text = `${title} ${description}`.toLowerCase();
  const normalizedChannelSlug = channelSlug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Start with channel-based detection
  let detection: ProductTypeDetection = {
    isFeatured: false,
    isService: false,
    isAIApp: false,
    category: 'General',
    confidence: 0
  };
  
  // Apply channel-based rules first
  if (CHANNEL_TYPE_MAPPING[normalizedChannelSlug]) {
    const channelMapping = CHANNEL_TYPE_MAPPING[normalizedChannelSlug];
    detection = { ...detection, ...channelMapping };
    detection.confidence += 30; // Channel mapping gives 30% confidence
  }
  
  // Content-based analysis for additional confidence and overrides
  let contentConfidence = 0;
  
  // Check for featured indicators
  const featuredScore = FEATURED_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
  
  if (featuredScore > 0) {
    detection.isFeatured = true;
    contentConfidence += featuredScore * 5;
  }
  
  // Check for service indicators
  const serviceScore = SERVICE_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
  
  if (serviceScore > 1) { // Need at least 2 service keywords
    detection.isService = true;
    contentConfidence += serviceScore * 8;
  }
  
  // Check for AI/App indicators
  const aiAppScore = AI_APP_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
  
  if (aiAppScore > 0) {
    detection.isAIApp = true;
    contentConfidence += aiAppScore * 10;
  }
  
  // Determine category based on type
  if (detection.isAIApp) {
    detection.category = findBestCategoryMatch(text, AI_APP_CATEGORIES) || 'AI & Apps';
  } else if (detection.isService) {
    detection.category = findBestCategoryMatch(text, SERVICE_CATEGORIES) || 'Services';
  } else if (detection.isFeatured) {
    detection.category = 'Featured Products';
  }
  
  // Platform-specific adjustments
  if (platform.toLowerCase().includes('app') || platform.toLowerCase().includes('mobile')) {
    detection.isAIApp = true;
    contentConfidence += 15;
  }
  
  detection.confidence = Math.min(100, detection.confidence + contentConfidence);
  
  return detection;
}

/**
 * Finds the best matching category from a list of category mappings
 */
function findBestCategoryMatch(text: string, categories: CategoryMapping[]): string | null {
  let bestMatch: CategoryMapping | null = null;
  let bestScore = 0;
  
  for (const category of categories) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (text.includes(keyword)) {
        score += category.priority;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }
  
  return bestMatch?.category || null;
}

/**
 * Determines page assignments based on product type
 */
export function getPageAssignments(detection: ProductTypeDetection): string[] {
  const pages: string[] = ['home']; // Always include home page
  
  if (detection.isFeatured) {
    pages.push('top-picks', 'featured');
  }
  
  if (detection.isService) {
    pages.push('services');
  }
  
  if (detection.isAIApp) {
    pages.push('apps-ai-apps', 'apps');
  }
  
  return pages;
}

/**
 * Main function for bot/RSS automation
 * Analyzes product and returns all necessary flags and assignments
 */
export function categorizeForAutomation(
  title: string,
  description: string = '',
  channelSlug: string = '',
  platform: string = ''
): {
  isFeatured: boolean;
  isService: boolean;
  isAIApp: boolean;
  category: string;
  displayPages: string[];
  confidence: number;
} {
  const detection = analyzeProductType(title, description, channelSlug, platform);
  const displayPages = getPageAssignments(detection);
  
  return {
    isFeatured: detection.isFeatured,
    isService: detection.isService,
    isAIApp: detection.isAIApp,
    category: detection.category,
    displayPages,
    confidence: detection.confidence
  };
}

/**
 * Validates if a product should be automatically categorized
 * Returns false for manual products to preserve existing behavior
 */
export function shouldAutoCategorize(sourceType: string): boolean {
  const autoSources = ['telegram', 'rss', 'bot', 'automation', 'feed'];
  return autoSources.includes(sourceType.toLowerCase());
}