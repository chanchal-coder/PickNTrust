import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  affiliateNetworks,
  adminUsers,
  announcements,
  type Product, 
  type InsertProduct,
  type BlogPost,
  type InsertBlogPost,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Category,
  type InsertCategory,
  type AffiliateNetwork,
  type InsertAffiliateNetwork,
  type AdminUser,
  type InsertAdminUser,
  type Announcement,
  type InsertAnnouncement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ne, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  
  // Blog Posts
  getBlogPosts(): Promise<BlogPost[]>;
  
  // Newsletter
  subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  
  // Affiliate Networks
  getAffiliateNetworks(): Promise<AffiliateNetwork[]>;
  getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]>;
  addAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork>;
  updateAffiliateNetwork(id: number, network: Partial<AffiliateNetwork>): Promise<AffiliateNetwork>;
  
  // Admin
  addProduct(product: any): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | null>;
  
  // Blog Management
  addBlogPost(blogPost: any): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<boolean>;
  updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Admin User Management
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminById(id: number): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminPassword(id: number, passwordHash: string): Promise<boolean>;
  setResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  validateResetToken(token: string): Promise<AdminUser | undefined>;
  clearResetToken(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private blogPosts: Map<number, BlogPost>;
  private newsletterSubscribers: Map<number, NewsletterSubscriber>;
  private categories: Map<number, Category>;
  private affiliateNetworks: Map<number, AffiliateNetwork>;
  private adminUsers: Map<number, AdminUser>;
  private currentProductId: number;
  private currentBlogPostId: number;
  private currentSubscriberId: number;
  private currentCategoryId: number;
  private currentNetworkId: number;
  private currentAdminId: number;

  constructor() {
    this.products = new Map();
    this.blogPosts = new Map();
    this.newsletterSubscribers = new Map();
    this.categories = new Map();
    this.affiliateNetworks = new Map();
    this.adminUsers = new Map();
    this.currentProductId = 1;
    this.currentBlogPostId = 1;
    this.currentSubscriberId = 1;
    this.currentCategoryId = 1;
    this.currentNetworkId = 1;
    this.currentAdminId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed affiliate networks
    const networksData: InsertAffiliateNetwork[] = [
      {
        name: "Amazon Associates",
        slug: "amazon",
        description: "World's largest e-commerce affiliate program",
        commissionRate: "4.00",
        trackingParams: "tag=pickntrust-21",
        logoUrl: "https://logo.clearbit.com/amazon.com",
        joinUrl: "https://affiliate-program.amazon.com/",
        isActive: true
      },
      {
        name: "Commission Junction (CJ)",
        slug: "cj",
        description: "Global affiliate marketing network",
        commissionRate: "8.00",
        trackingParams: "sid=pickntrust",
        logoUrl: "https://logo.clearbit.com/cj.com",
        joinUrl: "https://www.cj.com/",
        isActive: true
      },
      {
        name: "ShareASale",
        slug: "shareasale",
        description: "Performance marketing network",
        commissionRate: "6.50",
        trackingParams: "afftrack=pickntrust",
        logoUrl: "https://logo.clearbit.com/shareasale.com",
        joinUrl: "https://www.shareasale.com/",
        isActive: true
      },
      {
        name: "Flipkart Affiliate",
        slug: "flipkart",
        description: "India's leading e-commerce affiliate program",
        commissionRate: "5.00",
        trackingParams: "affid=pickntrust",
        logoUrl: "https://logo.clearbit.com/flipkart.com",
        joinUrl: "https://affiliate.flipkart.com/",
        isActive: true
      },
      {
        name: "ClickBank",
        slug: "clickbank",
        description: "Digital products affiliate marketplace",
        commissionRate: "15.00",
        trackingParams: "hop=pickntrust",
        logoUrl: "https://logo.clearbit.com/clickbank.com",
        joinUrl: "https://www.clickbank.com/",
        isActive: true
      },
      {
        name: "Impact",
        slug: "impact",
        description: "Enterprise affiliate marketing platform",
        commissionRate: "7.00",
        trackingParams: "subid=pickntrust",
        logoUrl: "https://logo.clearbit.com/impact.com",
        joinUrl: "https://impact.com/",
        isActive: true
      },
      // Additional affiliate networks
      {
        name: "Rakuten Advertising",
        slug: "rakuten",
        description: "Global performance marketing platform",
        commissionRate: "6.00",
        trackingParams: "ranMID=pickntrust",
        logoUrl: "https://logo.clearbit.com/rakuten.com",
        joinUrl: "https://rakutenadvertising.com/",
        isActive: true
      },
      {
        name: "PartnerStack",
        slug: "partnerstack",
        description: "Partner ecosystem management platform",
        commissionRate: "9.00",
        trackingParams: "ref=pickntrust",
        logoUrl: "https://logo.clearbit.com/partnerstack.com",
        joinUrl: "https://partnerstack.com/",
        isActive: true
      },
      {
        name: "Admitad",
        slug: "admitad",
        description: "Global affiliate marketing network",
        commissionRate: "6.50",
        trackingParams: "subid=pickntrust",
        logoUrl: "https://logo.clearbit.com/admitad.com",
        joinUrl: "https://www.admitad.com/",
        isActive: true
      },
      {
        name: "Awin",
        slug: "awin",
        description: "Global affiliate marketing network",
        commissionRate: "5.50",
        trackingParams: "clickref=pickntrust",
        logoUrl: "https://logo.clearbit.com/awin.com",
        joinUrl: "https://www.awin.com/",
        isActive: true
      },
      {
        name: "FlexOffers",
        slug: "flexoffers",
        description: "Performance marketing network",
        commissionRate: "8.50",
        trackingParams: "fobs=pickntrust",
        logoUrl: "https://logo.clearbit.com/flexoffers.com",
        joinUrl: "https://www.flexoffers.com/",
        isActive: true
      },
      {
        name: "MaxBounty",
        slug: "maxbounty",
        description: "CPA affiliate marketing network",
        commissionRate: "12.00",
        trackingParams: "s1=pickntrust",
        logoUrl: "https://logo.clearbit.com/maxbounty.com",
        joinUrl: "https://www.maxbounty.com/",
        isActive: true
      },
      {
        name: "CueLinks",
        slug: "cuelinks",
        description: "Intelligent link monetization platform",
        commissionRate: "4.50",
        trackingParams: "subId=pickntrust",
        logoUrl: "https://logo.clearbit.com/cuelinks.com",
        joinUrl: "https://www.cuelinks.com/",
        isActive: true
      },
      {
        name: "VCommission",
        slug: "vcommission",
        description: "India's leading affiliate marketing network",
        commissionRate: "7.50",
        trackingParams: "source=pickntrust",
        logoUrl: "https://logo.clearbit.com/vcommission.com",
        joinUrl: "https://www.vcommission.com/",
        isActive: true
      }
    ];

    networksData.forEach(network => {
      const id = this.currentNetworkId++;
      this.affiliateNetworks.set(id, { 
        ...network, 
        id,
        trackingParams: network.trackingParams || null,
        logoUrl: network.logoUrl || null,
        joinUrl: network.joinUrl || null,
        isActive: network.isActive ?? true
      });
    });

    // Seed categories
    const categoriesData: InsertCategory[] = [
      // Electronics & Gadgets
      {
        name: "Electronics & Gadgets",
        icon: "fas fa-microchip",
        color: "#3B82F6",
        description: "Latest Tech & Electronics"
      },
      {
        name: "Mobiles & Accessories",
        icon: "fas fa-mobile-alt",
        color: "#6366F1",
        description: "Smartphones & Mobile Gear"
      },
      {
        name: "Computers & Laptops",
        icon: "fas fa-laptop",
        color: "#1D4ED8",
        description: "Computing Solutions"
      },
      {
        name: "Cameras & Photography",
        icon: "fas fa-camera",
        color: "#8B5CF6",
        description: "Capture Perfect Moments"
      },
      {
        name: "Home Appliances",
        icon: "fas fa-blender",
        color: "#14B8A6",
        description: "Smart Home Solutions"
      },
      
      // Fashion & Lifestyle
      {
        name: "Men's Fashion",
        icon: "fas fa-male",
        color: "#059669",
        description: "Stylish Men's Wear"
      },
      {
        name: "Women's Fashion",
        icon: "fas fa-female",
        color: "#EC4899",
        description: "Elegant Women's Collection"
      },
      {
        name: "Kids' Fashion",
        icon: "fas fa-child",
        color: "#FB923C",
        description: "Trendy Kids' Clothing"
      },
      {
        name: "Footwear & Accessories",
        icon: "fas fa-shoe-prints",
        color: "#A855F7",
        description: "Shoes & Style Accessories"
      },
      {
        name: "Jewelry & Watches",
        icon: "fas fa-gem",
        color: "#8B5CF6",
        description: "Luxury & Timepieces"
      },
      
      // Beauty, Health & Personal Care
      {
        name: "Beauty & Grooming",
        icon: "fas fa-spa",
        color: "#F472B6",
        description: "Beauty & Personal Care"
      },
      {
        name: "Health & Wellness",
        icon: "fas fa-heartbeat",
        color: "#EF4444",
        description: "Health & Fitness Products"
      },
      {
        name: "Fitness & Nutrition",
        icon: "fas fa-dumbbell",
        color: "#F97316",
        description: "Fitness & Sports Gear"
      },
      {
        name: "Personal Care Appliances",
        icon: "fas fa-cut",
        color: "#84CC16",
        description: "Personal Care Devices"
      },
      
      // Home & Living
      {
        name: "Furniture & Décor",
        icon: "fas fa-couch",
        color: "#10B981",
        description: "Home Furniture & Decor"
      },
      {
        name: "Kitchen & Dining",
        icon: "fas fa-utensils",
        color: "#22C55E",
        description: "Kitchen Essentials"
      },
      {
        name: "Bedding & Home Essentials",
        icon: "fas fa-bed",
        color: "#0D9488",
        description: "Comfort & Home Basics"
      },
      {
        name: "Gardening & Outdoor",
        icon: "fas fa-seedling",
        color: "#65A30D",
        description: "Garden & Outdoor Living"
      },
      
      // Books, Media & Entertainment
      {
        name: "Books & Stationery",
        icon: "fas fa-book",
        color: "#D97706",
        description: "Books & Learning Materials"
      },
      {
        name: "Music, Movies & Games",
        icon: "fas fa-play-circle",
        color: "#DC2626",
        description: "Entertainment & Gaming"
      },
      {
        name: "E-learning & Courses",
        icon: "fas fa-graduation-cap",
        color: "#B91C1C",
        description: "Online Learning & Skills"
      },
      
      // Food & Grocery
      {
        name: "Groceries & Gourmet",
        icon: "fas fa-shopping-cart",
        color: "#EAB308",
        description: "Fresh & Gourmet Foods"
      },
      {
        name: "Food Delivery & Meal Kits",
        icon: "fas fa-pizza-slice",
        color: "#EA580C",
        description: "Ready Meals & Delivery"
      },
      
      // Travel & Experiences
      {
        name: "Flights & Hotels",
        icon: "fas fa-plane",
        color: "#0EA5E9",
        description: "Travel Bookings"
      },
      {
        name: "Holiday Packages",
        icon: "fas fa-suitcase-rolling",
        color: "#06B6D4",
        description: "Complete Travel Packages"
      },
      {
        name: "Experiences & Activities",
        icon: "fas fa-map-marked-alt",
        color: "#1E40AF",
        description: "Adventure & Experiences"
      },
      
      // Finance & Services
      {
        name: "Credit Cards & Finance",
        icon: "fas fa-credit-card",
        color: "#7C3AED",
        description: "Financial Services"
      },
      {
        name: "Loans & Insurance",
        icon: "fas fa-shield-alt",
        color: "#9333EA",
        description: "Loans & Protection Plans"
      },
      {
        name: "Investments & Trading Tools",
        icon: "fas fa-chart-line",
        color: "#C026D3",
        description: "Investment & Trading"
      },
      {
        name: "Utility & Bill Payments",
        icon: "fas fa-receipt",
        color: "#5B21B6",
        description: "Bills & Utility Services"
      },
      
      // Automotive
      {
        name: "Cars & Bikes Accessories",
        icon: "fas fa-car",
        color: "#F59E0B",
        description: "Vehicle Accessories"
      },
      {
        name: "Parts & Maintenance",
        icon: "fas fa-tools",
        color: "#EF4444",
        description: "Auto Parts & Services"
      },
      
      // Other
      {
        name: "Baby Products",
        icon: "fas fa-baby",
        color: "#F472B6",
        description: "Baby Care & Products"
      },
      {
        name: "Pet Supplies",
        icon: "fas fa-paw",
        color: "#FB7185",
        description: "Pet Care & Accessories"
      },
      {
        name: "Gifting & Occasions",
        icon: "fas fa-gift",
        color: "#F87171",
        description: "Gifts & Special Occasions"
      },
      
      // AI & Technology
      {
        name: "AI Apps & Services",
        icon: "fas fa-robot",
        color: "#8B5CF6",
        description: "🤖 Cutting-edge AI tools and applications"
      }
    ];

    categoriesData.forEach(category => {
      const id = this.currentCategoryId++;
      this.categories.set(id, { ...category, id });
    });

    // Seed products
    const productsData: InsertProduct[] = [
      {
        name: "Premium Wireless Smartphone",
        description: "Latest model with advanced camera and long battery life",
        price: "49,999.00",
        originalPrice: "66,599.00",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://amazon.in/dp/B08N5WRWNW?tag=pickntrust-21",
        affiliateNetworkId: 1, // Amazon
        category: "Tech",
        rating: "5.0",
        reviewCount: 1234,
        discount: 25,
        isFeatured: true
      },
      {
        name: "Smart Kitchen Appliance Set",
        description: "Complete kitchen solution with smart controls",
        price: "24,999.00",
        originalPrice: "41,599.00",
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://www.flipkart.com/kitchen-appliances?affid=pickntrust",
        affiliateNetworkId: 4, // Flipkart
        category: "Home",
        rating: "4.0",
        reviewCount: 856,
        discount: 40,
        isFeatured: true
      },
      {
        name: "Premium Skincare Bundle",
        description: "Complete skincare routine with natural ingredients",
        price: "7,499.00",
        originalPrice: "9,999.00",
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/skincare-bundle",
        category: "Beauty",
        rating: "5.0",
        reviewCount: 2104,
        isNew: true,
        isFeatured: true
      },
      {
        name: "Wireless Gaming Headset",
        description: "Professional gaming headset with noise cancellation",
        price: "13,299.00",
        originalPrice: "16,599.00",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/gaming-headset",
        category: "Tech",
        rating: "4.5",
        reviewCount: 892,
        discount: 20
      },
      {
        name: "Luxury Silk Scarf",
        description: "Handcrafted silk scarf with elegant patterns",
        price: "3,799.00",
        originalPrice: "6,299.00",
        imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/silk-scarf",
        category: "Fashion",
        rating: "4.8",
        reviewCount: 324,
        discount: 40
      },
      {
        name: "Essential Oil Diffuser",
        description: "Ultrasonic aromatherapy diffuser with LED lights",
        price: "3,299.00",
        originalPrice: "4,999.00",
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/oil-diffuser",
        category: "Home",
        rating: "4.3",
        reviewCount: 567,
        discount: 34
      },
      // Additional Tech Products
      {
        name: "Smart Watch Pro",
        description: "Advanced fitness tracking with health monitoring features",
        price: "24,999.00",
        originalPrice: "32,999.00",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/smart-watch",
        category: "Tech",
        rating: "4.6",
        reviewCount: 1567,
        discount: 24
      },
      {
        name: "Wireless Bluetooth Earbuds",
        description: "Premium sound quality with active noise cancellation",
        price: "8,999.00",
        originalPrice: "14,999.00",
        imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/earbuds",
        category: "Tech",
        rating: "4.4",
        reviewCount: 2103,
        discount: 40
      },
      // Additional Home Products
      {
        name: "Smart Air Purifier",
        description: "HEPA filter air purifier with app control and voice assistant",
        price: "18,999.00",
        originalPrice: "24,999.00",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/air-purifier",
        category: "Home",
        rating: "4.5",
        reviewCount: 876,
        discount: 24
      },
      {
        name: "Robot Vacuum Cleaner",
        description: "Smart mapping robot vacuum with auto-empty dock",
        price: "35,999.00",
        originalPrice: "49,999.00",
        imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/robot-vacuum",
        category: "Home",
        rating: "4.7",
        reviewCount: 1234,
        discount: 28
      },
      // Additional Beauty Products
      {
        name: "LED Face Mask Therapy",
        description: "Professional-grade LED light therapy for glowing skin",
        price: "12,999.00",
        originalPrice: "19,999.00",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/led-mask",
        category: "Beauty",
        rating: "4.8",
        reviewCount: 567,
        discount: 35
      },
      {
        name: "Hair Styling Tool Set",
        description: "Professional curling iron and straightener with ceramic plates",
        price: "5,999.00",
        originalPrice: "8,999.00",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/hair-tools",
        category: "Beauty",
        rating: "4.3",
        reviewCount: 892,
        discount: 33
      },
      // Additional Fashion Products
      {
        name: "Designer Leather Handbag",
        description: "Genuine leather handbag with multiple compartments",
        price: "8,999.00",
        originalPrice: "14,999.00",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/leather-bag",
        category: "Fashion",
        rating: "4.6",
        reviewCount: 456,
        discount: 40
      },
      {
        name: "Premium Cotton T-Shirt Pack",
        description: "Set of 3 premium cotton t-shirts in assorted colors",
        price: "2,499.00",
        originalPrice: "3,999.00",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/tshirt-pack",
        category: "Fashion",
        rating: "4.2",
        reviewCount: 1876,
        discount: 38
      },
      // Deals Category Products
      {
        name: "Flash Sale Fitness Tracker",
        description: "Basic fitness tracking with heart rate monitor - Limited time offer!",
        price: "3,999.00",
        originalPrice: "8,999.00",
        imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/fitness-tracker",
        category: "Deals",
        rating: "4.1",
        reviewCount: 2345,
        discount: 56
      },
      {
        name: "Bundle Deal: Home Essentials",
        description: "Complete home starter pack - Bedding, towels, and kitchen basics",
        price: "12,999.00",
        originalPrice: "24,999.00",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/home-bundle",
        category: "Deals",
        rating: "4.4",
        reviewCount: 987,
        discount: 48
      }
    ];

    productsData.forEach(product => {
      const id = this.currentProductId++;
      this.products.set(id, { 
        ...product, 
        id,
        originalPrice: product.originalPrice || null,
        affiliateNetworkId: product.affiliateNetworkId || null,
        discount: product.discount || null,
        isNew: product.isNew ?? false,
        isFeatured: product.isFeatured ?? false
      });
    });

    // Seed blog posts with enhanced content, categories, and tags
    const blogPostsData: InsertBlogPost[] = [
      {
        title: "5 Smart Ways to Save Money While Shopping Online",
        excerpt: "Discover proven strategies to get the best deals on your favorite products. From cashback apps to price tracking tools, learn how to build a budget-friendly lifestyle that actually works for you.",
        content: `# 5 Smart Ways to Save Money While Shopping Online

Shopping online doesn't have to drain your wallet. With the right strategies, you can save significant money while still getting everything you need. Here are five proven methods that will transform your online shopping experience.

## 1. Use Cashback and Reward Apps

Start earning money back on every purchase with apps like [Paisa Portal](https://paisaportal.com) and [CashKaro](https://cashkaro.com). These platforms partner with major retailers to give you percentage-based returns on your spending.

**Pro tip**: Stack cashback offers with credit card rewards for maximum savings!

## 2. Compare Prices Across Multiple Platforms

Never buy from the first site you visit. Use tools like [PriceDekho](https://pricedekho.com) to compare prices across Amazon, Flipkart, and other major retailers. Price differences of 20-30% are common for the same product.

## 3. Time Your Purchases Right

- **Best times to buy**: End of season clearances, festival sales (Diwali, Christmas)
- **Electronics**: Launch new models to get discounts on previous versions
- **Fashion**: Buy winter clothes in spring, summer clothes in fall

## 4. Abandon Your Cart Strategically

Add items to your cart, then wait 24-48 hours. Many retailers will send you discount codes to complete your purchase. This works especially well with fashion and lifestyle brands.

## 5. Use Coupon Aggregator Sites

Before checking out, always visit [CouponDunia](https://coupondunia.in) or [GrabOn](https://grabon.in) for the latest discount codes. This extra 2-minute step can save you 10-50% on your order.

Start implementing these strategies today and watch your savings grow!`,
        category: "Shopping Tips",
        tags: ["budget", "deals", "ecommerce", "cashback"],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        publishedAt: new Date("2024-01-23"),
        readTime: "3 min read",
        slug: "smart-ways-save-money-online-shopping"
      },
      {
        title: "This Week's Hottest Fashion Finds Under ₹3,000",
        excerpt: "Stay stylish without breaking the bank! Check out these amazing fashion discoveries from trusted brands that won't hurt your wallet. Perfect for college students and young professionals.",
        content: `# This Week's Hottest Fashion Finds Under ₹3,000

Looking stylish doesn't have to cost a fortune. Here are the best budget-friendly fashion finds that will elevate your wardrobe without breaking the bank.

## Top Picks for Women

### 1. Kurta Sets - ₹899-₹1,499
Perfect for office and casual outings. Check out [Libas](https://libas.in) and [Aurelia](https://aurelia.co.in) for trendy designs.

### 2. Statement Earrings - ₹299-₹599
Transform any basic outfit instantly. [Voylla](https://voylla.com) has beautiful collections starting at ₹299.

### 3. Comfortable Sneakers - ₹1,299-₹2,499
[Campus Shoes](https://campussutra.com) and [Asian Footwear](https://asian-shoes.com) offer great quality at budget prices.

## Top Picks for Men

### 1. Casual Shirts - ₹699-₹1,299
[Dennis Lingo](https://dennislingo.com) and [The Indian Garage Co.](https://theindiangarageco.com) have excellent fits and quality.

### 2. Jeans - ₹999-₹1,999
Look for sales at [Flying Machine](https://flyingmachine.in) and [Spykar](https://spykar.com).

### 3. T-Shirts - ₹399-₹899
[Bewakoof](https://bewakoof.com) and [The Souled Store](https://thesouledstore.com) have unique designs at great prices.

## Shopping Tips

- **End-of-season sales**: Buy winter wear in March, summer clothes in August
- **Bundle deals**: Many brands offer 2+1 or 3+2 deals
- **First-time buyer discounts**: Most fashion sites offer 15-20% off for new customers

Quality doesn't always mean expensive - these brands prove you can look great on any budget!`,
        category: "Fashion",
        tags: ["fashion", "budget", "style", "clothing"],
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        videoUrl: "https://www.instagram.com/reel/C2abc123xyz/",
        publishedAt: new Date("2024-01-20"),
        readTime: "5 min read",
        slug: "hottest-fashion-finds-under-50"
      },
      {
        title: "Must-Have Tech Gadgets That Are Actually Worth It",
        excerpt: "Cut through the tech hype and find gadgets that will genuinely improve your daily life. From productivity boosters to entertainment essentials - these picks deliver real value.",
        content: `# Must-Have Tech Gadgets That Are Actually Worth It

The tech world is full of flashy gadgets, but which ones actually improve your life? Here are proven picks that deliver real value for money.

## Productivity Game-Changers

### 1. Wireless Earbuds - ₹2,999-₹8,999
**Why they're worth it**: Freedom of movement during calls and workouts
**Top picks**: [Boat Airdopes](https://boat-lifestyle.com), [Realme Buds Air](https://realme.com)

### 2. Power Banks - ₹1,499-₹3,999
**Essential for**: Remote workers, frequent travelers, students
**Recommended**: [Mi Power Bank 3i](https://mi.com), [Ambrane PowerBank](https://ambrane.com)

### 3. Bluetooth Speakers - ₹1,999-₹5,999
**Perfect for**: Work-from-home setups, small gatherings
**Best value**: [JBL Go 3](https://jbl.com), [Boat Stone](https://boat-lifestyle.com)

## Entertainment Essentials

### 1. Streaming Device - ₹2,999-₹4,999
Turn any TV into a smart TV with [Mi TV Stick](https://mi.com) or [Amazon Fire TV Stick](https://amazon.in).

### 2. Gaming Controllers - ₹1,999-₹4,999
For mobile gaming: [ASUS ROG Phone controllers](https://asus.com) work great with any smartphone.

## Smart Home Basics

### 1. Smart Plugs - ₹699-₹1,299
Control any device remotely. [TP-Link Kasa](https://tp-link.com) plugs are reliable and affordable.

### 2. LED Smart Bulbs - ₹999-₹1,999
[Philips Wiz](https://philips.com) and [Syska Smart](https://syska.com) offer great color options.

## Before You Buy Checklist

- ✅ Read reviews from multiple sources
- ✅ Check warranty and service centers
- ✅ Compare prices across platforms
- ✅ Look for bundle deals

Remember: The best gadget is the one you'll actually use consistently!`,
        category: "Tech News",
        tags: ["tech", "gadgets", "productivity", "gaming"],
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        publishedAt: new Date("2024-01-18"),
        readTime: "4 min read",
        slug: "must-have-tech-gadgets-worth-it"
      }
    ];

    blogPostsData.forEach(blogPost => {
      const id = this.currentBlogPostId++;
      this.blogPosts.set(id, { ...blogPost, id });
    });

    // Seed default admin user
    const defaultAdmin: InsertAdminUser = {
      username: "admin",
      email: "admin@pickntrust.com",
      passwordHash: "7cc8b0731d6b4463bd7d280639fd1ae374c7a1f1374952ac8eefa8362908f68cc7e103900c4de289b875502f273ad9441b901d822d05ac4c1cf8f8e0d584a878", // hashed "pickntrust2025"
      isActive: true
    };

    const adminId = this.currentAdminId++;
    this.adminUsers.set(adminId, {
      ...defaultAdmin,
      id: adminId,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null,
      createdAt: new Date()
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isFeatured);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.category === category);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  async subscribeToNewsletter(insertSubscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    // Check if email already exists
    const existingSubscriber = Array.from(this.newsletterSubscribers.values())
      .find(sub => sub.email === insertSubscriber.email);
    
    if (existingSubscriber) {
      throw new Error("Email already subscribed");
    }

    const id = this.currentSubscriberId++;
    const subscriber: NewsletterSubscriber = {
      ...insertSubscriber,
      id,
      subscribedAt: new Date()
    };
    
    this.newsletterSubscribers.set(id, subscriber);
    return subscriber;
  }

  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return Array.from(this.affiliateNetworks.values());
  }

  async getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return Array.from(this.affiliateNetworks.values()).filter(network => network.isActive);
  }

  async addAffiliateNetwork(networkData: InsertAffiliateNetwork): Promise<AffiliateNetwork> {
    const id = this.currentNetworkId++;
    const network: AffiliateNetwork = {
      ...networkData,
      id,
      trackingParams: networkData.trackingParams || null,
      logoUrl: networkData.logoUrl || null,
      joinUrl: networkData.joinUrl || null,
      isActive: networkData.isActive ?? true
    };
    
    this.affiliateNetworks.set(id, network);
    return network;
  }

  async updateAffiliateNetwork(id: number, updateData: Partial<AffiliateNetwork>): Promise<AffiliateNetwork> {
    const existingNetwork = this.affiliateNetworks.get(id);
    if (!existingNetwork) {
      throw new Error("Affiliate network not found");
    }

    const updatedNetwork = { ...existingNetwork, ...updateData };
    this.affiliateNetworks.set(id, updatedNetwork);
    return updatedNetwork;
  }

  async addProduct(productData: any): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...productData,
      id,
      rating: parseFloat(productData.rating),
      reviewCount: parseInt(productData.reviewCount),
      discount: productData.discount ? parseInt(productData.discount) : undefined,
      isNew: productData.isNew || false,
      isFeatured: productData.isFeatured || false,
    };
    
    this.products.set(id, product);
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      return null;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...updates,
      id // Ensure ID doesn't change
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async addBlogPost(blogPostData: any): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const blogPost: BlogPost = {
      id,
      title: blogPostData.title,
      excerpt: blogPostData.excerpt,
      content: blogPostData.content || '',
      category: blogPostData.category || 'Shopping Tips',
      tags: blogPostData.tags || [],
      imageUrl: blogPostData.imageUrl,
      videoUrl: blogPostData.videoUrl || null,
      publishedAt: new Date(blogPostData.publishedAt || new Date()),
      readTime: blogPostData.readTime,
      slug: blogPostData.slug || blogPostData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const blogPost = this.blogPosts.get(id);
    if (!blogPost) {
      return null;
    }
    
    const updatedBlogPost = { ...blogPost, ...updates };
    this.blogPosts.set(id, updatedBlogPost);
    return updatedBlogPost;
  }

  // Admin User Management Methods
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    for (const admin of this.adminUsers.values()) {
      if (admin.email === email) {
        return admin;
      }
    }
    return undefined;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    for (const admin of this.adminUsers.values()) {
      if (admin.username === username) {
        return admin;
      }
    }
    return undefined;
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async createAdmin(adminData: InsertAdminUser): Promise<AdminUser> {
    const id = this.currentAdminId++;
    const admin: AdminUser = {
      id,
      username: adminData.username,
      email: adminData.email,
      passwordHash: adminData.passwordHash,
      resetToken: adminData.resetToken || null,
      resetTokenExpiry: adminData.resetTokenExpiry || null,
      lastLogin: adminData.lastLogin || null,
      createdAt: new Date(),
      isActive: adminData.isActive ?? true,
    };
    
    this.adminUsers.set(id, admin);
    return admin;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<boolean> {
    const admin = this.adminUsers.get(id);
    if (!admin) return false;
    
    const updatedAdmin = { ...admin, passwordHash };
    this.adminUsers.set(id, updatedAdmin);
    return true;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const admin = await this.getAdminByEmail(email);
    if (!admin) return false;
    
    const updatedAdmin = { ...admin, resetToken: token, resetTokenExpiry: expiry };
    this.adminUsers.set(admin.id, updatedAdmin);
    return true;
  }

  async validateResetToken(token: string): Promise<AdminUser | undefined> {
    for (const admin of this.adminUsers.values()) {
      if (admin.resetToken === token && admin.resetTokenExpiry && admin.resetTokenExpiry > new Date()) {
        return admin;
      }
    }
    return undefined;
  }

  async clearResetToken(id: number): Promise<boolean> {
    const admin = this.adminUsers.get(id);
    if (!admin) return false;
    
    const updatedAdmin = { ...admin, resetToken: null, resetTokenExpiry: null };
    this.adminUsers.set(id, updatedAdmin);
    return true;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const admin = this.adminUsers.get(id);
    if (!admin) return false;
    
    const updatedAdmin = { ...admin, lastLogin: new Date() };
    this.adminUsers.set(id, updatedAdmin);
    return true;
  }

  // Announcements (MemStorage implementation - fallback)
  async getAnnouncements(): Promise<Announcement[]> {
    return [];
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const newAnnouncement = {
      id: 1,
      ...announcement,
      createdAt: new Date()
    } as Announcement;
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    return null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.id));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true)).orderBy(desc(products.id));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category)).orderBy(desc(products.id));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }

  // Newsletter
  async subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [newSubscriber] = await db
      .insert(newsletterSubscribers)
      .values(subscriber)
      .returning();
    return newSubscriber;
  }

  // Affiliate Networks
  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return await db.select().from(affiliateNetworks).orderBy(affiliateNetworks.name);
  }

  async getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return await db.select().from(affiliateNetworks).where(eq(affiliateNetworks.isActive, true)).orderBy(affiliateNetworks.name);
  }

  async addAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork> {
    const [newNetwork] = await db
      .insert(affiliateNetworks)
      .values(network)
      .returning();
    return newNetwork;
  }

  async updateAffiliateNetwork(id: number, network: Partial<AffiliateNetwork>): Promise<AffiliateNetwork> {
    const [updatedNetwork] = await db
      .update(affiliateNetworks)
      .set(network)
      .where(eq(affiliateNetworks.id, id))
      .returning();
    return updatedNetwork;
  }

  // Admin Product Management
  async addProduct(product: any): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  // Announcements (Database implementation)
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db
      .insert(announcements)
      .values(announcement)
      .returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const deleted = await db
      .delete(announcements)
      .where(eq(announcements.id, id));
    return deleted.rowCount > 0;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || null;
  }

  // Blog Management
  async addBlogPost(blogPost: any): Promise<BlogPost> {
    const [newBlogPost] = await db
      .insert(blogPosts)
      .values(blogPost)
      .returning();
    return newBlogPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedBlogPost || null;
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      console.log('Fetching announcements from database...');
      
      // First test with raw SQL to see if database connection works
      const testQuery = await db.execute(sql`SELECT COUNT(*) as count FROM announcements`);
      console.log('Test query result:', testQuery);
      
      const result = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
      console.log('Database result length:', result.length);
      console.log('Database result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error; // Let the error bubble up to see what's wrong
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    // First deactivate all other announcements if this one is active
    if (announcement.isActive) {
      await db.update(announcements).set({ isActive: false });
    }
    
    const [newAnnouncement] = await db.insert(announcements).values({
      ...announcement,
      createdAt: new Date()
    }).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    // If setting this one active, deactivate others first
    if (updates.isActive) {
      await db.update(announcements)
        .set({ isActive: false })
        .where(ne(announcements.id, id));
    }
    
    const [updatedAnnouncement] = await db.update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Admin User Management
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin || undefined;
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db
      .insert(adminUsers)
      .values(admin)
      .returning();
    return newAdmin;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.id, id));
    return result.rowCount > 0;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(adminUsers.email, email));
    return result.rowCount > 0;
  }

  async validateResetToken(token: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.resetToken, token));
    
    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      return undefined;
    }
    
    return admin;
  }

  async clearResetToken(id: number): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(adminUsers.id, id));
    return result.rowCount > 0;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
