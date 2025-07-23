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
        price: "599.00",
        originalPrice: "799.00",
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
        price: "299.00",
        originalPrice: "499.00",
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
        price: "89.00",
        originalPrice: "120.00",
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
        price: "159.00",
        originalPrice: "199.00",
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
        price: "45.00",
        originalPrice: "75.00",
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
        price: "39.00",
        originalPrice: "59.00",
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://example.com/affiliate/oil-diffuser",
        category: "Home",
        rating: "4.3",
        reviewCount: 567,
        discount: 34
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
