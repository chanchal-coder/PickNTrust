// Server-side type declarations

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

// Utility types
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type StringOrNumber = string | number;

// Export commonly used types
export {
  TelegramMessage,
  DatabaseProduct,
  CueLinksProduct,
  AmazonProduct,
  ApiResponse,
  Nullable,
  Optional,
  StringOrNumber
};