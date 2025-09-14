/**
 * Service Detection Utility
 * Automatically detects if a product should be categorized as a service
 * based on keywords in name and description
 */

interface ServiceDetectionResult {
  isService: boolean;
  serviceCategory: string;
  confidence: number;
}

// Service keywords and their categories
const SERVICE_KEYWORDS = {
  'Web Services': [
    'hosting', 'domain', 'website', 'web design', 'web development',
    'ssl certificate', 'cdn', 'server', 'cloud hosting', 'wordpress'
  ],
  'Consulting': [
    'consultation', 'consulting', 'advisory', 'strategy', 'planning',
    'business advice', 'expert advice', 'professional service'
  ],
  'Design Services': [
    'logo design', 'graphic design', 'ui design', 'ux design',
    'branding', 'design service', 'creative service', 'illustration'
  ],
  'Marketing Services': [
    'seo service', 'digital marketing', 'social media management',
    'content marketing', 'advertising service', 'marketing campaign'
  ],
  'Support Services': [
    'support', 'maintenance', 'technical support', 'customer service',
    'help desk', 'troubleshooting', 'repair service'
  ],
  'Educational Services': [
    'course', 'training', 'tutorial', 'coaching', 'mentoring',
    'online course', 'certification', 'workshop'
  ],
  'Software Services': [
    'saas', 'software as a service', 'api service', 'cloud service',
    'subscription service', 'software license'
  ]
};

/**
 * Detects if a product is a service based on keywords
 */
export function detectService(name: string, description: string = ''): ServiceDetectionResult {
  const text = `${name} ${description}`.toLowerCase();
  
  let bestMatch = {
    category: '',
    confidence: 0
  };
  
  // Check each service category
  for (const [category, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    let matches = 0;
    let totalKeywords = keywords.length;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    const confidence = matches / totalKeywords;
    
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category,
        confidence
      };
    }
  }
  
  // Consider it a service if confidence is above threshold
  const isService = bestMatch.confidence > 0.1; // At least 10% keyword match
  
  return {
    isService,
    serviceCategory: isService ? bestMatch.category : '',
    confidence: bestMatch.confidence
  };
}

/**
 * Gets the appropriate category for a detected service
 */
export function getServiceCategory(name: string, description: string = ''): string {
  const detection = detectService(name, description);
  
  if (detection.isService) {
    return 'Service'; // Use 'Service' as the main category for services page (professional look)
  }
  
  return ''; // Return empty if not a service
}

/**
 * Gets subcategory for more specific service classification
 */
export function getServiceSubcategory(name: string, description: string = ''): string {
  const detection = detectService(name, description);
  
  if (detection.isService) {
    return detection.serviceCategory; // Return specific service type
  }
  
  return '';
}