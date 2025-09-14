// Travel Category Detection Utility
// Automatically detects travel subcategories from Telegram messages

export interface TravelDetectionResult {
  category: string;
  subcategory: string;
  confidence: number;
  detectedFrom: 'url' | 'content' | 'partner' | 'keywords';
  partner?: string;
  route?: string;
}

// Travel subcategories mapping
const TRAVEL_SUBCATEGORIES = {
  FLIGHTS: 'Flights',
  HOTELS: 'Hotels', 
  BUS: 'Bus',
  TRAIN: 'Train',
  PACKAGES: 'Packages',
  CAR_RENTAL: 'Car Rental',
  TOURS: 'Tours',
  ACTIVITIES: 'Activities',
  CRUISES: 'Cruises',
  INSURANCE: 'Travel Insurance'
};

// Partner-based detection patterns
const PARTNER_PATTERNS = {
  // Flight partners
  'makemytrip.com': { subcategory: TRAVEL_SUBCATEGORIES.FLIGHTS, partner: 'MakeMyTrip' },
  'goibibo.com': { subcategory: TRAVEL_SUBCATEGORIES.FLIGHTS, partner: 'Goibibo' },
  'cleartrip.com': { subcategory: TRAVEL_SUBCATEGORIES.FLIGHTS, partner: 'Cleartrip' },
  'yatra.com': { subcategory: TRAVEL_SUBCATEGORIES.FLIGHTS, partner: 'Yatra' },
  'expedia.com': { subcategory: TRAVEL_SUBCATEGORIES.FLIGHTS, partner: 'Expedia' },
  
  // Hotel partners
  'booking.com': { subcategory: TRAVEL_SUBCATEGORIES.HOTELS, partner: 'Booking.com' },
  'agoda.com': { subcategory: TRAVEL_SUBCATEGORIES.HOTELS, partner: 'Agoda' },
  'hotels.com': { subcategory: TRAVEL_SUBCATEGORIES.HOTELS, partner: 'Hotels.com' },
  'oyo.com': { subcategory: TRAVEL_SUBCATEGORIES.HOTELS, partner: 'OYO' },
  
  // Transport partners
  'redbus.in': { subcategory: TRAVEL_SUBCATEGORIES.BUS, partner: 'RedBus' },
  'abhibus.com': { subcategory: TRAVEL_SUBCATEGORIES.BUS, partner: 'AbhiBus' },
  'irctc.co.in': { subcategory: TRAVEL_SUBCATEGORIES.TRAIN, partner: 'IRCTC' },
  'confirmtkt.com': { subcategory: TRAVEL_SUBCATEGORIES.TRAIN, partner: 'ConfirmTkt' },
  
  // Car rental
  'zoomcar.com': { subcategory: TRAVEL_SUBCATEGORIES.CAR_RENTAL, partner: 'Zoomcar' },
  'revv.co.in': { subcategory: TRAVEL_SUBCATEGORIES.CAR_RENTAL, partner: 'Revv' },
  
  // Activities & Tours
  'thrillophilia.com': { subcategory: TRAVEL_SUBCATEGORIES.TOURS, partner: 'Thrillophilia' },
  'viator.com': { subcategory: TRAVEL_SUBCATEGORIES.ACTIVITIES, partner: 'Viator' }
};

// URL path-based detection
const URL_PATH_PATTERNS = {
  '/flights/': TRAVEL_SUBCATEGORIES.FLIGHTS,
  '/flight/': TRAVEL_SUBCATEGORIES.FLIGHTS,
  '/hotels/': TRAVEL_SUBCATEGORIES.HOTELS,
  '/hotel/': TRAVEL_SUBCATEGORIES.HOTELS,
  '/bus/': TRAVEL_SUBCATEGORIES.BUS,
  '/buses/': TRAVEL_SUBCATEGORIES.BUS,
  '/train/': TRAVEL_SUBCATEGORIES.TRAIN,
  '/trains/': TRAVEL_SUBCATEGORIES.TRAIN,
  '/packages/': TRAVEL_SUBCATEGORIES.PACKAGES,
  '/package/': TRAVEL_SUBCATEGORIES.PACKAGES,
  '/cars/': TRAVEL_SUBCATEGORIES.CAR_RENTAL,
  '/car-rental/': TRAVEL_SUBCATEGORIES.CAR_RENTAL,
  '/activities/': TRAVEL_SUBCATEGORIES.ACTIVITIES,
  '/tours/': TRAVEL_SUBCATEGORIES.TOURS
};

// Content-based keyword patterns
const KEYWORD_PATTERNS = {
  [TRAVEL_SUBCATEGORIES.FLIGHTS]: {
    primary: ['flight', 'airline', 'airways', 'air', 'fly', 'flying'],
    secondary: ['departure', 'arrival', 'boarding', 'terminal', 'runway', 'pilot'],
    routes: ['→', 'to', 'from', '->', 'delhi', 'mumbai', 'bangalore', 'chennai'],
    indicators: ['non-stop', 'direct', 'connecting', 'layover', 'domestic', 'international']
  },
  
  [TRAVEL_SUBCATEGORIES.HOTELS]: {
    primary: ['hotel', 'resort', 'stay', 'accommodation', 'room', 'suite'],
    secondary: ['check-in', 'check-out', 'booking', 'reservation', 'night', 'nights'],
    indicators: ['star', '★', 'luxury', 'budget', 'deluxe', 'premium', 'ac', 'wifi'],
    amenities: ['pool', 'spa', 'gym', 'restaurant', 'breakfast', 'parking']
  },
  
  [TRAVEL_SUBCATEGORIES.BUS]: {
    primary: ['bus', 'coach', 'volvo', 'sleeper', 'seater'],
    secondary: ['redbus', 'abhibus', 'travels', 'transport'],
    indicators: ['ac', 'non-ac', 'semi-sleeper', 'multi-axle', 'ordinary'],
    routes: ['route', 'via', 'stop', 'boarding', 'dropping']
  },
  
  [TRAVEL_SUBCATEGORIES.TRAIN]: {
    primary: ['train', 'railway', 'irctc', 'rail', 'express', 'passenger'],
    secondary: ['station', 'platform', 'coach', 'berth', 'seat'],
    indicators: ['ac', '1a', '2a', '3a', 'sl', 'cc', 'general', 'tatkal'],
    types: ['rajdhani', 'shatabdi', 'duronto', 'garib rath', 'jan shatabdi']
  },
  
  [TRAVEL_SUBCATEGORIES.PACKAGES]: {
    primary: ['package', 'tour', 'trip', 'holiday', 'vacation'],
    secondary: ['itinerary', 'sightseeing', 'guided', 'group', 'family'],
    duration: ['day', 'days', 'night', 'nights', 'n/', 'd/', 'week'],
    indicators: ['all-inclusive', 'customized', 'honeymoon', 'adventure', 'pilgrimage']
  },
  
  [TRAVEL_SUBCATEGORIES.CAR_RENTAL]: {
    primary: ['car', 'cab', 'taxi', 'rental', 'hire', 'self-drive'],
    secondary: ['driver', 'chauffeur', 'pickup', 'drop', 'outstation'],
    types: ['sedan', 'suv', 'hatchback', 'luxury', 'economy'],
    brands: ['swift', 'innova', 'fortuner', 'ertiga', 'dzire']
  }
};

/**
 * Detects travel subcategory from URL
 */
function detectFromURL(url: string): TravelDetectionResult | null {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  
  // Check partner patterns first (highest confidence)
  for (const [domain, config] of Object.entries(PARTNER_PATTERNS)) {
    if (urlLower.includes(domain)) {
      return {
        category: 'Travel',
        subcategory: config.subcategory,
        confidence: 0.95,
        detectedFrom: 'partner',
        partner: config.partner
      };
    }
  }
  
  // Check URL path patterns
  for (const [path, subcategory] of Object.entries(URL_PATH_PATTERNS)) {
    if (urlLower.includes(path)) {
      return {
        category: 'Travel',
        subcategory,
        confidence: 0.85,
        detectedFrom: 'url'
      };
    }
  }
  
  return null;
}

/**
 * Detects travel subcategory from message content
 */
function detectFromContent(content: string): TravelDetectionResult | null {
  if (!content) return null;
  
  const contentLower = content.toLowerCase();
  const scores: { [key: string]: number } = {};
  
  // Score each subcategory based on keyword matches
  for (const [subcategory, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    let score = 0;
    
    // Primary keywords (high weight)
    patterns.primary?.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 10;
      }
    });
    
    // Secondary keywords (medium weight)
    patterns.secondary?.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 5;
      }
    });
    
    // Indicators (low weight)
    patterns.indicators?.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 2;
      }
    });
    
    // Additional patterns
    Object.values(patterns).flat().forEach(keyword => {
      if (typeof keyword === 'string' && contentLower.includes(keyword)) {
        score += 1;
      }
    });
    
    if (score > 0) {
      scores[subcategory] = score;
    }
  }
  
  // Find the highest scoring subcategory
  const bestMatch = Object.entries(scores).reduce((best, [subcategory, score]) => {
    return score > best.score ? { subcategory, score } : best;
  }, { subcategory: '', score: 0 });
  
  if (bestMatch.score >= 5) { // Minimum threshold
    const confidence = Math.min(bestMatch.score / 20, 0.9); // Cap at 90%
    
    return {
      category: 'Travel',
      subcategory: bestMatch.subcategory,
      confidence,
      detectedFrom: 'content'
    };
  }
  
  return null;
}

/**
 * Extracts route information from content
 */
function extractRoute(content: string): string | undefined {
  if (!content) return undefined;
  
  const routePatterns = [
    /([A-Za-z\s]+)\s*→\s*([A-Za-z\s]+)/,
    /([A-Za-z\s]+)\s*to\s*([A-Za-z\s]+)/,
    /([A-Za-z\s]+)\s*-\s*([A-Za-z\s]+)/,
    /from\s+([A-Za-z\s]+)\s+to\s+([A-Za-z\s]+)/i
  ];
  
  for (const pattern of routePatterns) {
    const match = content.match(pattern);
    if (match) {
      const from = match[1].trim();
      const to = match[2].trim();
      return `${from} → ${to}`;
    }
  }
  
  return undefined;
}

/**
 * Main function to detect travel subcategory
 */
export function detectTravelSubcategory(
  messageText: string,
  url?: string,
  productName?: string
): TravelDetectionResult {
  const allContent = [messageText, productName].filter(Boolean).join(' ');
  
  // Try URL detection first (highest confidence)
  if (url) {
    const urlResult = detectFromURL(url);
    if (urlResult) {
      // Extract route if it's a flight/transport
      if ([TRAVEL_SUBCATEGORIES.FLIGHTS, TRAVEL_SUBCATEGORIES.BUS, TRAVEL_SUBCATEGORIES.TRAIN].includes(urlResult.subcategory)) {
        urlResult.route = extractRoute(allContent);
      }
      return urlResult;
    }
  }
  
  // Try content detection
  const contentResult = detectFromContent(allContent);
  if (contentResult) {
    // Extract route if applicable
    if ([TRAVEL_SUBCATEGORIES.FLIGHTS, TRAVEL_SUBCATEGORIES.BUS, TRAVEL_SUBCATEGORIES.TRAIN].includes(contentResult.subcategory)) {
      contentResult.route = extractRoute(allContent);
    }
    return contentResult;
  }
  
  // Default fallback
  return {
    category: 'Travel',
    subcategory: 'Travel', // Generic travel
    confidence: 0.1,
    detectedFrom: 'keywords'
  };
}

/**
 * Enhanced detection with additional context
 */
export function detectTravelSubcategoryEnhanced(
  messageText: string,
  url?: string,
  productName?: string,
  description?: string,
  channelName?: string
): TravelDetectionResult {
  const allContent = [messageText, productName, description].filter(Boolean).join(' ');
  
  // Channel-based hints
  let channelHint = '';
  if (channelName) {
    const channelLower = channelName.toLowerCase();
    if (channelLower.includes('flight')) channelHint = TRAVEL_SUBCATEGORIES.FLIGHTS;
    else if (channelLower.includes('hotel')) channelHint = TRAVEL_SUBCATEGORIES.HOTELS;
    else if (channelLower.includes('bus')) channelHint = TRAVEL_SUBCATEGORIES.BUS;
    else if (channelLower.includes('train')) channelHint = TRAVEL_SUBCATEGORIES.TRAIN;
  }
  
  const result = detectTravelSubcategory(messageText, url, productName);
  
  // Boost confidence if channel hint matches
  if (channelHint && result.subcategory === channelHint) {
    result.confidence = Math.min(result.confidence + 0.2, 0.95);
  }
  
  return result;
}

/**
 * Get travel icon for subcategory
 */
export function getTravelIcon(subcategory: string): string {
  const iconMap: { [key: string]: string } = {
    [TRAVEL_SUBCATEGORIES.FLIGHTS]: 'Flight',
    [TRAVEL_SUBCATEGORIES.HOTELS]: 'Hotel',
    [TRAVEL_SUBCATEGORIES.BUS]: 'Bus',
    [TRAVEL_SUBCATEGORIES.TRAIN]: 'Train',
    [TRAVEL_SUBCATEGORIES.PACKAGES]: 'Package',
    [TRAVEL_SUBCATEGORIES.CAR_RENTAL]: 'Car',
    [TRAVEL_SUBCATEGORIES.TOURS]: 'Ticket',
    [TRAVEL_SUBCATEGORIES.ACTIVITIES]: 'Experience',
    [TRAVEL_SUBCATEGORIES.CRUISES]: '🚢',
    [TRAVEL_SUBCATEGORIES.INSURANCE]: '🛡️'
  };
  
  return iconMap[subcategory] || 'Flight';
}

/**
 * Validate if content is travel-related
 */
export function isTravelRelated(content: string, url?: string): boolean {
  const result = detectTravelSubcategory(content, url);
  return result.confidence > 0.3; // 30% confidence threshold
}