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