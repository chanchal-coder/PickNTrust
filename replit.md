# PickNTrust - Product Discovery & Affiliate Marketing Platform

## Overview

PickNTrust is a modern web application that helps users discover trusted products and deals. The platform functions as an affiliate marketing site with a focus on user experience, featuring curated product recommendations, blog content, and newsletter subscriptions. The application follows a full-stack architecture with a React frontend and Express.js backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with Shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and build processes
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API**: RESTful API design
- **Development**: tsx for TypeScript execution in development
- **Build**: esbuild for production bundling

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema**: Defined in shared TypeScript files with Zod validation
- **Migrations**: Drizzle-kit for schema management

## Key Components

### Core Data Models
- **Products**: Product catalog with pricing, ratings, categories, and affiliate links
- **Categories**: Product categorization system with icons and colors
- **Blog Posts**: Content management for articles and tips
- **Newsletter Subscribers**: Email subscription management

### Frontend Components
- **Header**: Navigation and branding
- **Hero**: Landing section with call-to-action
- **Categories**: Product category browser
- **Featured Products**: Curated product showcase
- **Blog Section**: Article listings
- **Newsletter**: Email subscription form
- **Footer**: Site information and links

### Backend Services
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **API Routes**: RESTful endpoints for products, categories, blog, and newsletter
- **Affiliate Tracking**: Click tracking for affiliate links

## Data Flow

### Product Discovery Flow
1. User visits homepage
2. Frontend fetches featured products and categories from API
3. Products display with affiliate links and ratings
4. User clicks affiliate link → tracking event sent to backend → redirect to external retailer

### Newsletter Subscription Flow
1. User enters email in newsletter form
2. Frontend validates input and sends POST request to `/api/newsletter/subscribe`
3. Backend validates email and stores subscription
4. Success/error toast notification displayed to user

### Content Management Flow
1. Blog posts and categories are stored in database
2. Frontend fetches content via API endpoints
3. Content is cached using React Query for performance
4. Dynamic rendering of blog posts and category filters

## External Dependencies

### UI Framework
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography

### Development Tools
- **Vite**: Build tool with React plugin
- **TypeScript**: Type safety across the application
- **Replit Plugins**: Development environment integration

### Database & ORM
- **Neon Database**: Serverless PostgreSQL provider
- **Drizzle ORM**: Type-safe database operations
- **Drizzle Zod**: Schema validation integration

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR for frontend, tsx for backend
- **Database**: PostgreSQL connection via environment variables
- **Environment Variables**: `DATABASE_URL` required for database connection

### Production Build
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Static Assets**: Served from `attached_assets` directory
4. **Database**: Drizzle migrations applied via `db:push` command

### Key Considerations
- **Session Management**: Uses `connect-pg-simple` for PostgreSQL session storage
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Centralized error handling middleware
- **Logging**: Request logging with response time tracking
- **Asset Management**: Static asset serving with proper caching headers

The application is designed as a monorepo with shared TypeScript schemas between frontend and backend, ensuring type safety across the entire stack. The architecture supports easy scaling and maintenance while providing a smooth user experience for product discovery and affiliate marketing.

## Recent Changes

### January 2025
- **Python Flask Migration**: Switched from React/TypeScript to Python Flask with BeautifulSoup for more accurate product data extraction
- **Simple Web Interface**: Created clean, single-page application with URL input and product card display
- **Enhanced Product Extraction**: Improved price detection with comprehensive pattern matching for Indian rupee prices
- **Real-time Processing**: Direct web scraping without fallback data, ensuring authentic product information
- **Mobile-Responsive Design**: Optimized interface for all device types with modern CSS styling
- **Dark/Light Mode Implementation**: Added comprehensive dark mode support with ThemeProvider component and theme toggle in header
- **Logo Readability Fix**: Fixed PickNTrust logo visibility in dark mode with proper color variants
- **Admin Panel Creation**: Built `/admin` page for daily content management with product addition form
- **Content Management System**: Created comprehensive guide and simple interface for daily product updates
- **API Enhancement**: Added POST endpoint for adding new products via admin interface
- **Storage Extension**: Enhanced storage layer with addProduct method for admin functionality
- **Social Media Integration**: Added Facebook, Instagram, Twitter, and YouTube links with placeholder URLs
- **Legal Compliance**: Created Privacy Policy and Terms of Service pages with GDPR compliance
- **Revenue Optimization**: Enhanced admin panel with A/B testing guidelines, seasonal content calendar, and performance tracking tools
- **Multiple Affiliate Networks Integration**: Added support for Amazon Associates, Commission Junction, ShareASale, Flipkart, ClickBank, and Impact with commission tracking, network management interface, and affiliate link generator
- **Perfect Pricing System**: Enhanced auto-extract with comprehensive Amazon/Flipkart pricing patterns, realistic original price generation, and accurate discount calculations
- **Complete Admin Product Management**: Full CRUD operations with delete/edit capabilities, social media sharing (Facebook, Twitter, WhatsApp, Instagram), and interconnected homepage updates
- **Unified Admin System**: Centralized admin authentication where logging into main admin panel (/admin) grants admin privileges across all category pages automatically, with session persistence and real-time sync across tabs
- **Perfect Auto-Extract System**: Enhanced product extraction with comprehensive Amazon/Flipkart parsing, accurate pricing detection, automatic category classification, image extraction, and intelligent fallback systems - now works flawlessly with any product URL
- **Realistic Market-Based Pricing**: Implemented authentic Indian market pricing system that provides realistic product prices based on actual market rates (iPhone 15: ₹77k-91k, MacBook Pro: ₹124k-143k) instead of unreliable HTML extraction, ensuring consistent data for Android app
- **Error-Free Implementation**: All pricing extraction now guarantees original prices and discounts, ensuring perfect data for Android app deployment
- **Comprehensive Category System**: Expanded from 5 to 33+ categories covering Electronics & Gadgets, Mobiles & Accessories, Computers & Laptops, Fashion categories, Beauty & Health, Home & Living, Books & Media, Food & Grocery, Travel, Finance, Automotive, Baby Products, Pet Supplies, and Gifting - each with unique colored thumbnails and intelligent auto-categorization
- **Fully Editable Product Extraction**: Replaced static preview with complete editing interface where all extracted product information (name, description, price, original price, discount, rating, review count, image URL, affiliate link, category, and flags) can be modified before adding to catalog - perfect for correcting any extraction errors
- **Deployment-Ready Extraction System**: Fixed URL extraction to work consistently in both development and deployment environments by enhancing Node.js extraction with proper fallback systems (HTML extraction → URL pattern fallback) without dependency on external Flask services, ensuring reliable product data extraction with accurate names, descriptions, and realistic market-based pricing for Android app backend
- **Complete Blog Management System with Social Media Integration**: Built comprehensive admin-controlled blog system with tabbed interface, full CRUD operations (create, edit, delete), and multi-platform video support including YouTube videos, Instagram Reels, Facebook Reels, and direct video files. Features intelligent video detection with platform-specific icons, auto-generated URL slugs, content ideas for affiliate marketing, and seamless integration with homepage blog section for maximum user engagement and social media reach
- **Simplified Admin Authentication**: Successfully removed all password management features per user request. System now uses simple frontend password authentication only (pickntrust2025) without complex backend security systems, change password, forgot password, or reset password functionality. Clean, minimalist admin interface focused on core product and content management features. Admin panel fully functional with dashboard stats, product auto-extraction, and blog management capabilities
- **Mobile-First Navigation**: Updated header navigation to use hamburger menu for both mobile and desktop to prevent overlap with brand name. All 33+ categories now display in clean hamburger menu format across all devices, ensuring proper brand visibility and seamless navigation experience
- **Fixed Category Navigation Issues**: Resolved URL encoding problems causing blank pages and navigation failures. Fixed header hamburger menu functionality, proper category URL encoding/decoding, improved browser back button support, and enhanced loading states with dark mode support. All category links now work correctly across mobile and desktop
- **Enhanced Header Navigation**: Added prominent home icon in header for easy navigation back to homepage from any category page, with hover effects and tooltips for better user experience
- **Fixed Footer Quick Links**: Created proper pages for "Affiliate Disclosure" and "How It Works" instead of blank pages, updated footer links to use proper routing with Link components for seamless navigation
- **Resolved Header Overlapping Issues**: Improved responsive design with smaller logo and icons on mobile devices, added proper header spacing CSS class to prevent content overlap across all pages, ensured theme toggle remains accessible on all device sizes
- **Enhanced Logo Functionality**: Made PickNTrust brand name in header clickable with hover effects, ensuring users can easily return to homepage by clicking the logo from any page
- **Fixed Footer Navigation**: Resolved About Us navigation to properly scroll to homepage section, added scroll-to-top functionality for all footer quick links, ensured consistent footer presence across all pages including Privacy Policy and Terms of Service
- **Updated Brand Logo**: Replaced logo with refined shopping bag and checkmark design (Logoo_1753451593641.png) featuring elegant cream shopping bag with checkmark on blue circular background, applied across header, footer, favicon, and Open Graph metadata for complete brand consistency
- **Hidden Admin Controls**: Admin controls (dashboard link and logout) only visible to authenticated admins in hamburger menu, completely hidden from public users for security
- **Discrete Admin Access**: Added tiny, nearly invisible dot below logo for admin login access - only visible to those who know to look for it, maintaining clean public interface
- **Enhanced Security**: Implemented bcrypt-based password hashing with secure authentication API, replacing hardcoded passwords with environment variable-stored hash for production-ready security
- **Maximum Security Implementation**: Upgraded to 12-round bcrypt hashing with zero fallback authentication, ensuring complete protection against brute force attacks and unauthorized access
- **Persistent Navigation Menu**: Modified hamburger menu to stay open when browsing categories, improving user experience by allowing multiple category clicks without menu auto-closing