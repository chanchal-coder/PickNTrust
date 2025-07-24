import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  affiliateNetworks,
  type Product, 
  type InsertProduct,
  type BlogPost,
  type InsertBlogPost,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Category,
  type InsertCategory,
  type AffiliateNetwork,
  type InsertAffiliateNetwork
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private blogPosts: Map<number, BlogPost>;
  private newsletterSubscribers: Map<number, NewsletterSubscriber>;
  private categories: Map<number, Category>;
  private affiliateNetworks: Map<number, AffiliateNetwork>;
  private currentProductId: number;
  private currentBlogPostId: number;
  private currentSubscriberId: number;
  private currentCategoryId: number;
  private currentNetworkId: number;

  constructor() {
    this.products = new Map();
    this.blogPosts = new Map();
    this.newsletterSubscribers = new Map();
    this.categories = new Map();
    this.affiliateNetworks = new Map();
    this.currentProductId = 1;
    this.currentBlogPostId = 1;
    this.currentSubscriberId = 1;
    this.currentCategoryId = 1;
    this.currentNetworkId = 1;
    
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
        color: "from-blue-500 to-blue-700",
        description: "Latest Tech & Electronics"
      },
      {
        name: "Mobiles & Accessories",
        icon: "fas fa-mobile-alt",
        color: "from-indigo-500 to-indigo-700",
        description: "Smartphones & Mobile Gear"
      },
      {
        name: "Computers & Laptops",
        icon: "fas fa-laptop",
        color: "from-blue-600 to-blue-800",
        description: "Computing Solutions"
      },
      {
        name: "Cameras & Photography",
        icon: "fas fa-camera",
        color: "from-slate-500 to-slate-700",
        description: "Capture Perfect Moments"
      },
      {
        name: "Home Appliances",
        icon: "fas fa-blender",
        color: "from-teal-500 to-teal-700",
        description: "Smart Home Solutions"
      },
      
      // Fashion & Lifestyle
      {
        name: "Men's Fashion",
        icon: "fas fa-male",
        color: "from-green-600 to-green-800",
        description: "Stylish Men's Wear"
      },
      {
        name: "Women's Fashion",
        icon: "fas fa-female",
        color: "from-pink-500 to-pink-700",
        description: "Elegant Women's Collection"
      },
      {
        name: "Kids' Fashion",
        icon: "fas fa-child",
        color: "from-orange-400 to-orange-600",
        description: "Trendy Kids' Clothing"
      },
      {
        name: "Footwear & Accessories",
        icon: "fas fa-shoe-prints",
        color: "from-purple-500 to-purple-700",
        description: "Shoes & Style Accessories"
      },
      {
        name: "Jewelry & Watches",
        icon: "fas fa-gem",
        color: "from-violet-500 to-violet-700",
        description: "Luxury & Timepieces"
      },
      
      // Beauty, Health & Personal Care
      {
        name: "Beauty & Grooming",
        icon: "fas fa-spa",
        color: "from-pink-400 to-pink-600",
        description: "Beauty & Personal Care"
      },
      {
        name: "Health & Wellness",
        icon: "fas fa-heartbeat",
        color: "from-red-500 to-red-700",
        description: "Health & Fitness Products"
      },
      {
        name: "Fitness & Nutrition",
        icon: "fas fa-dumbbell",
        color: "from-orange-500 to-orange-700",
        description: "Fitness & Sports Gear"
      },
      {
        name: "Personal Care Appliances",
        icon: "fas fa-cut",
        color: "from-lime-500 to-lime-700",
        description: "Personal Care Devices"
      },
      
      // Home & Living
      {
        name: "Furniture & Décor",
        icon: "fas fa-couch",
        color: "from-emerald-500 to-emerald-700",
        description: "Home Furniture & Decor"
      },
      {
        name: "Kitchen & Dining",
        icon: "fas fa-utensils",
        color: "from-green-500 to-green-700",
        description: "Kitchen Essentials"
      },
      {
        name: "Bedding & Home Essentials",
        icon: "fas fa-bed",
        color: "from-teal-600 to-teal-800",
        description: "Comfort & Home Basics"
      },
      {
        name: "Gardening & Outdoor",
        icon: "fas fa-seedling",
        color: "from-lime-600 to-lime-800",
        description: "Garden & Outdoor Living"
      },
      
      // Books, Media & Entertainment
      {
        name: "Books & Stationery",
        icon: "fas fa-book",
        color: "from-amber-600 to-amber-800",
        description: "Books & Learning Materials"
      },
      {
        name: "Music, Movies & Games",
        icon: "fas fa-play-circle",
        color: "from-red-600 to-red-800",
        description: "Entertainment & Gaming"
      },
      {
        name: "E-learning & Courses",
        icon: "fas fa-graduation-cap",
        color: "from-red-700 to-red-900",
        description: "Online Learning & Skills"
      },
      
      // Food & Grocery
      {
        name: "Groceries & Gourmet",
        icon: "fas fa-shopping-cart",
        color: "from-yellow-500 to-yellow-700",
        description: "Fresh & Gourmet Foods"
      },
      {
        name: "Food Delivery & Meal Kits",
        icon: "fas fa-pizza-slice",
        color: "from-orange-600 to-orange-800",
        description: "Ready Meals & Delivery"
      },
      
      // Travel & Experiences
      {
        name: "Flights & Hotels",
        icon: "fas fa-plane",
        color: "from-sky-500 to-sky-700",
        description: "Travel Bookings"
      },
      {
        name: "Holiday Packages",
        icon: "fas fa-suitcase-rolling",
        color: "from-cyan-500 to-cyan-700",
        description: "Complete Travel Packages"
      },
      {
        name: "Experiences & Activities",
        icon: "fas fa-map-marked-alt",
        color: "from-blue-700 to-blue-900",
        description: "Adventure & Experiences"
      },
      
      // Finance & Services
      {
        name: "Credit Cards & Finance",
        icon: "fas fa-credit-card",
        color: "from-indigo-600 to-indigo-800",
        description: "Financial Services"
      },
      {
        name: "Loans & Insurance",
        icon: "fas fa-shield-alt",
        color: "from-purple-600 to-purple-800",
        description: "Loans & Protection Plans"
      },
      {
        name: "Investments & Trading Tools",
        icon: "fas fa-chart-line",
        color: "from-violet-600 to-violet-800",
        description: "Investment & Trading"
      },
      {
        name: "Utility & Bill Payments",
        icon: "fas fa-receipt",
        color: "from-indigo-700 to-indigo-900",
        description: "Bills & Utility Services"
      },
      
      // Automotive
      {
        name: "Cars & Bikes Accessories",
        icon: "fas fa-car",
        color: "from-gray-600 to-gray-800",
        description: "Vehicle Accessories"
      },
      {
        name: "Parts & Maintenance",
        icon: "fas fa-tools",
        color: "from-slate-600 to-slate-800",
        description: "Auto Parts & Services"
      },
      
      // Other
      {
        name: "Baby Products",
        icon: "fas fa-baby",
        color: "from-pink-300 to-pink-500",
        description: "Baby Care & Products"
      },
      {
        name: "Pet Supplies",
        icon: "fas fa-paw",
        color: "from-rose-400 to-rose-600",
        description: "Pet Care & Accessories"
      },
      {
        name: "Gifting & Occasions",
        icon: "fas fa-gift",
        color: "from-red-400 to-red-600",
        description: "Gifts & Special Occasions"
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

    // Seed blog posts
    const blogPostsData: InsertBlogPost[] = [
      {
        title: "5 Smart Ways to Save Money While Shopping Online",
        excerpt: "Discover the insider secrets to getting the best deals every time you shop online...",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        publishedAt: new Date("2024-01-23"),
        readTime: "3 min read",
        slug: "smart-ways-save-money-online-shopping"
      },
      {
        title: "This Week's Hottest Fashion Finds Under $50",
        excerpt: "Update your wardrobe without breaking the bank with these trending pieces...",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        publishedAt: new Date("2024-01-20"),
        readTime: "5 min read",
        slug: "hottest-fashion-finds-under-50"
      },
      {
        title: "Must-Have Tech Gadgets That Are Actually Worth It",
        excerpt: "Cut through the hype and find the tech products that will actually improve your life...",
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
}

export const storage = new MemStorage();
