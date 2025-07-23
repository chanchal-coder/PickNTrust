import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  type Product, 
  type InsertProduct,
  type BlogPost,
  type InsertBlogPost,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Category,
  type InsertCategory
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
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private blogPosts: Map<number, BlogPost>;
  private newsletterSubscribers: Map<number, NewsletterSubscriber>;
  private categories: Map<number, Category>;
  private currentProductId: number;
  private currentBlogPostId: number;
  private currentSubscriberId: number;
  private currentCategoryId: number;

  constructor() {
    this.products = new Map();
    this.blogPosts = new Map();
    this.newsletterSubscribers = new Map();
    this.categories = new Map();
    this.currentProductId = 1;
    this.currentBlogPostId = 1;
    this.currentSubscriberId = 1;
    this.currentCategoryId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoriesData: InsertCategory[] = [
      {
        name: "Tech",
        icon: "fas fa-laptop",
        color: "from-bright-blue to-blue-600",
        description: "Gadgets & More"
      },
      {
        name: "Home",
        icon: "fas fa-home",
        color: "from-accent-green to-green-600",
        description: "Living & Decor"
      },
      {
        name: "Beauty",
        icon: "fas fa-sparkles",
        color: "from-pink-500 to-purple-600",
        description: "Skincare & Makeup"
      },
      {
        name: "Fashion",
        icon: "fas fa-tshirt",
        color: "from-purple-500 to-indigo-600",
        description: "Style & Trends"
      },
      {
        name: "Deals",
        icon: "fas fa-fire",
        color: "from-accent-orange to-red-600",
        description: "Limited Time!"
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
        affiliateUrl: "https://example.com/affiliate/smartphone",
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
        affiliateUrl: "https://example.com/affiliate/kitchen-set",
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
      this.products.set(id, { ...product, id });
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
}

export const storage = new MemStorage();
