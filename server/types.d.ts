// Server-side type declarations

// Node.js global types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TELEGRAM_BOT_TOKEN?: string;
      PORT?: string;
      NODE_ENV?: string;
    }
  }
}

// Express types
declare module 'express' {
  interface Request {
    body: any;
  }
}

// Telegram Bot API types
interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  from?: {
    id: number;
    username?: string;
    first_name?: string;
  };
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  forward_from?: any;
  forward_from_chat?: any;
}

// Database types
interface DatabaseProduct {
  id: number | string;
  name: string;
  description: string;
  price: string;
  original_price?: string | null;
  currency?: string;
  image_url: string;
  affiliate_url: string;
  category: string;
  rating: string;
  review_count: number;
  discount?: number | null;
  is_new: boolean;
  is_featured?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Database interface matching actual SQLite schema (camelCase for consistency)
export interface UnifiedContent {
  id: number;
  title: string;
  description?: string | null;
  price?: string | null;
  original_price?: string | null;
  originalPrice?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  affiliate_url?: string | null;
  affiliateUrl?: string | null;
  content_type?: string;
  contentType?: string;
  page_type?: string;
  pageType?: string;
  category: string;
  subcategory?: string | null;
  source_type?: string;
  sourceType?: string;
  source_id?: string | null;
  sourceId?: string | null;
  affiliate_platform?: string | null;
  affiliatePlatform?: string | null;
  rating?: string | null;
  review_count?: number | null;
  reviewCount?: number | null;
  discount?: number | null;
  currency?: string;
  gender?: string | null;
  is_active?: boolean | number;
  isActive?: boolean | number;
  is_featured?: boolean | number;
  isFeatured?: boolean | number;
  display_order?: number;
  displayOrder?: number;
  display_pages?: string | string[];
  displayPages?: string | string[];
  has_timer?: boolean | number;
  hasTimer?: boolean | number;
  timer_duration?: number | null;
  timerDuration?: number | null;
  timer_start_time?: number | null;
  timerStartTime?: number | null;
  created_at?: number;
  createdAt?: number;
  updated_at?: number;
  updatedAt?: number;
  // Additional fields that may exist in database
  content?: string | null;
  media_urls?: string | null;
  affiliate_urls?: string | null;
  isNew?: boolean | number;
  is_new?: boolean | number;
  status?: string;
  processing_status?: string;
  visibility?: string;
  source_platform?: string;
  pricing_type?: string;
  monthly_price?: string | null;
  yearly_price?: string | null;
  is_free?: boolean | number;
  price_description?: string | null;
  custom_pricing_details?: string | null;
  is_service?: boolean | number;
  is_ai_app?: boolean | number;
}

// Mapped interface for frontend API responses (camelCase)
export interface MappedUnifiedContent {
  id: number;
  title: string;
  name: string; // Mapped from title
  description?: string | null;
  price?: string | null;
  originalPrice?: string | null; // Already camelCase in UnifiedContent
  imageUrl?: string | null; // Made optional to match UnifiedContent
  affiliateUrl?: string | null; // Made optional to match UnifiedContent
  contentType?: string; // Made optional to match UnifiedContent
  pageType?: string; // Made optional to match UnifiedContent
  category: string;
  subcategory?: string | null;
  sourceType?: string; // Made optional to match UnifiedContent
  sourceId?: string | null; // Already camelCase in UnifiedContent
  affiliatePlatform?: string | null; // Already camelCase in UnifiedContent
  rating?: string | number | null;
  reviewCount?: number | null; // Already camelCase in UnifiedContent
  discount?: number | null;
  currency?: string;
  // Timer fields for limited-time deals
  hasTimer?: boolean | number;
  timerDuration?: number | null; // hours
  timerStartTime?: number | string | null; // timestamp or ISO string
  gender?: string | null;
  isActive?: boolean | number; // Already camelCase in UnifiedContent
  isFeatured?: boolean | number; // Already camelCase in UnifiedContent
  is_featured?: boolean | number; // snake_case for backward compatibility
  isNew?: boolean | number; // New flag to match routes mapping
  displayOrder?: number; // Already camelCase in UnifiedContent
  displayPages?: string | string[]; // Already camelCase in UnifiedContent
  createdAt?: number; // Already camelCase in UnifiedContent
  updatedAt?: number; // Already camelCase in UnifiedContent
  // Frontend-specific flags
  isService?: boolean;
  isAIApp?: boolean;
  // Pricing fields (camelCase for frontend)
  pricingType?: string;
  monthlyPrice?: string | null;
  yearlyPrice?: string | null;
  isFree?: boolean | number;
  priceDescription?: string | null;
}

// CueLinks specific types
interface CueLinksProduct extends DatabaseProduct {
  cuelinks_url?: string;
  original_url?: string;
  cuelinks_cid?: string;
  affiliate_network?: string;
  commission_rate?: number;
  telegram_message_id?: number;
  telegram_channel_id?: number;
  telegram_channel_name?: string;
  click_count?: number;
  conversion_count?: number;
  processing_status?: string;
  expires_at?: number;
  display_pages?: string;
  source_metadata?: string;
  tags?: string;
}

// Amazon/Telegram products types
interface AmazonProduct extends DatabaseProduct {
  telegram_message_id?: number;
  expires_at?: number;
  affiliate_link?: string;
  display_pages?: string;
}

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Express types extension
declare namespace Express {
  interface Request {
    user?: any;
    session?: any;
  }
}

// Node.js types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL?: string;
      
      // Telegram Bot tokens
      TELEGRAM_BOT_TOKEN?: string;
      TELEGRAM_CHANNEL_ID?: string;
      TELEGRAM_CHANNEL_TITLE?: string;
      
      // CueLinks configuration
      CUE_PICKS_BOT_TOKEN?: string;
      CUE_PICKS_CHANNEL_ID?: string;
      CUE_PICKS_CHANNEL_TITLE?: string;
      CUELINKS_AFFILIATE_URL?: string;
      CUELINKS_CID?: string;
      CUELINKS_SOURCE?: string;
      
      // Other environment variables
      [key: string]: string | undefined;
    }
  }
}

// Vite React plugin shim for server-side TypeScript to avoid ts2307
declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

// Utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type StringOrNumber = string | number;

// Export commonly used types
export {
  TelegramMessage,
  DatabaseProduct,
  UnifiedContent,
  CueLinksProduct,
  AmazonProduct,
  ApiResponse,
  Nullable,
  Optional,
  StringOrNumber
};