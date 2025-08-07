import { dbInstance as db } from "./db.mts";
import { products, categories, blogPosts, affiliateNetworks } from "../shared/schema.js";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    await db.delete(products);
    await db.delete(blogPosts);
    await db.delete(categories);
    await db.delete(affiliateNetworks);

    // Seed affiliate networks
    console.log("📡 Adding affiliate networks...");
    await db.insert(affiliateNetworks).values([
      {
        name: "Amazon Associates",
        slug: "amazon",
        description: "World's largest online marketplace with competitive commissions",
        commissionRate: 4.50,
        trackingParams: "tag=pickntrust-21",
        logoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://affiliate-program.amazon.com/"
      },
      {
        name: "Commission Junction",
        slug: "cj",
        description: "Leading affiliate marketing network with top brands",
        commissionRate: 6.00,
        trackingParams: "sid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://www.cj.com/"
      },
      {
        name: "ShareASale",
        slug: "shareasale",
        description: "Diverse merchant network with excellent tools",
        commissionRate: 5.50,
        trackingParams: "afftrack=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://www.shareasale.com/"
      },
      {
        name: "Flipkart Affiliate",
        slug: "flipkart",
        description: "India's leading e-commerce platform",
        commissionRate: 3.50,
        trackingParams: "affid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://affiliate.flipkart.com/"
      },
      {
        name: "ClickBank",
        slug: "clickbank",
        description: "Digital products and online courses marketplace",
        commissionRate: 8.00,
        trackingParams: "tid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://www.clickbank.com/"
      },
      {
        name: "Impact",
        slug: "impact",
        description: "Performance marketing platform for enterprise brands",
        commissionRate: 7.00,
        trackingParams: "utm_source=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: 1,
        joinUrl: "https://www.impact.com/"
      }
    ]);

    // Seed categories
    console.log("📂 Adding categories...");
    await db.insert(categories).values([
      {
        name: "Electronics & Gadgets",
        icon: "fas fa-microchip",
        color: "#4F46E5",
        description: "Latest Tech & Electronics"
      },
      {
        name: "Mobiles & Accessories",
        icon: "fas fa-mobile-alt",
        color: "#7C3AED",
        description: "Smartphones & Mobile Gear"
      },
      {
        name: "Computers & Laptops",
        icon: "fas fa-laptop",
        color: "#4338CA",
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
        color: "#4ADE80",
        description: "Smart Home Solutions"
      },
      {
        name: "Men's Fashion",
        icon: "fas fa-male",
        color: "#22C55E",
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
        color: "#F59E0B",
        description: "Trendy Kids' Clothing"
      },
      {
        name: "Footwear & Accessories",
        icon: "fas fa-shoe-prints",
        color: "#A78BFA",
        description: "Shoes & Style Accessories"
      },
      {
        name: "Jewelry & Watches",
        icon: "fas fa-gem",
        color: "#8B5CF6",
        description: "Luxury & Timepieces"
      },
      {
        name: "Beauty & Grooming",
        icon: "fas fa-spa",
        color: "#EC4899",
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
        color: "#EA580C",
        description: "Fitness & Sports Gear"
      },
      {
        name: "Personal Care Appliances",
        icon: "fas fa-toothbrush",
        color: "#84CC16",
        description: "Personal Care Devices"
      },
      {
        name: "Furniture & Décor",
        icon: "fas fa-couch",
        color: "#4ADE80",
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
        color: "#4B7A29",
        description: "Comfort & Home Basics"
      },
      {
        name: "Gardening & Outdoor",
        icon: "fas fa-seedling",
        color: "#84CC16",
        description: "Garden & Outdoor Living"
      },
      {
        name: "Books & Stationery",
        icon: "fas fa-book",
        color: "#CA8A04",
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
        color: "#DC2626",
        description: "Online Learning & Skills"
      },
      {
        name: "Groceries & Gourmet",
        icon: "fas fa-shopping-basket",
        color: "#FBBF24",
        description: "Fresh & Gourmet Foods"
      },
      {
        name: "Food Delivery & Meal Kits",
        icon: "fas fa-pizza-slice",
        color: "#EA580C",
        description: "Ready Meals & Delivery"
      },
      {
        name: "Flights & Hotels",
        icon: "fas fa-plane",
        color: "#60A5FA",
        description: "Travel Bookings"
      },
      {
        name: "Holiday Packages",
        icon: "fas fa-suitcase-rolling",
        color: "#60A5FA",
        description: "Complete Travel Packages"
      },
      {
        name: "Experiences & Activities",
        icon: "fas fa-map-marked-alt",
        color: "#4338CA",
        description: "Adventure & Experiences"
      },
      {
        name: "Credit Cards & Finance",
        icon: "fas fa-credit-card",
        color: "#8B5CF6",
        description: "Financial Services"
      },
      {
        name: "Loans & Insurance",
        icon: "fas fa-shield-alt",
        color: "#8B5CF6",
        description: "Loans & Protection Plans"
      },
      {
        name: "Investments & Trading Tools",
        icon: "fas fa-chart-line",
        color: "#8B5CF6",
        description: "Investment & Trading"
      },
      {
        name: "Utility & Bill Payments",
        icon: "fas fa-receipt",
        color: "#8B5CF6",
        description: "Bills & Utility Services"
      },
      {
        name: "Cars & Bikes Accessories",
        icon: "fas fa-car",
        color: "#FBBF24",
        description: "Vehicle Accessories"
      },
      {
        name: "Parts & Maintenance",
        icon: "fas fa-tools",
        color: "#DC2626",
        description: "Auto Parts & Services"
      },
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
      {
        name: "AI Apps & Services",
        icon: "fas fa-robot",
        color: "#8B5CF6",
        description: "Cutting-edge AI tools and applications"
      }
    ]);

    // Seed featured products
    console.log("🛍️ Adding featured products...");
    await db.insert(products).values([
      {
        name: "Premium Wireless Smartphone",
        description: "Latest model with advanced camera and long battery life",
        price: 49999.00,
        originalPrice: 66599.00,
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://amazon.in/dp/B08N5WRWNW?tag=pickntrust-21",
        affiliateNetworkId: 1,
        category: "Mobiles & Accessories",
        rating: 5.0,
        reviewCount: 1234,
        discount: 25,
        isFeatured: true,
        createdAt: new Date()
      },
      {
        name: "Smart Kitchen Appliance Set",
        description: "Complete kitchen solution with smart controls",
        price: 24999.00,
        originalPrice: 41599.00,
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://www.flipkart.com/kitchen-appliances?affid=pickntrust",
        affiliateNetworkId: 4,
        category: "Appliances",
        rating: 4.0,
        reviewCount: 856,
        discount: 40,
        isFeatured: true,
        createdAt: new Date()
      },
      {
        name: "Professional Gaming Laptop",
        description: "High-performance laptop for gaming and professional work",
        price: 89999.00,
        originalPrice: 124999.00,
        imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://amazon.in/dp/B08N5WRWNW?tag=pickntrust-21",
        affiliateNetworkId: 1,
        category: "Computers & Laptops",
        rating: 4.8,
        reviewCount: 2156,
        discount: 28,
        isFeatured: true,
        createdAt: new Date()
      }
    ]);

    // Seed blog posts
    console.log("✍️ Adding blog posts...");
    await db.insert(blogPosts).values([
      {
        title: "5 Smart Ways to Save Money While Shopping Online",
        excerpt: "Discover proven strategies to maximize your savings and get the best deals on every purchase.",
        content: `# 5 Smart Ways to Save Money While Shopping Online

Shopping online has become the new normal, but with rising prices, finding ways to save money is more important than ever. Here are five proven strategies to help you maximize your savings and get the best deals on every purchase.

## 1. Compare Prices Across Multiple Platforms

**Pro tip:** Check both official brand websites and major e-commerce platforms like Amazon, Flipkart, and others.

## 2. Use Cashback and Reward Credit Cards

## 3. Sign Up for Price Drop Alerts

## 4. Shop During Sale Seasons

## 5. Use Coupon Codes and Promotional Offers

---

*For more money-saving tips and best deals, subscribe to our newsletter and follow our latest product recommendations.*`,
        category: "Shopping Tips",
        tags: ["savings", "shopping", "deals", "money-tips"],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        videoUrl: "",
        publishedAt: new Date("2025-01-20"),
        readTime: "5 min read",
        slug: "5-smart-ways-save-money-online-shopping"
      },
      {
        title: "Best Budget Smartphones Under ₹20,000 in 2025",
        excerpt: "Complete guide to the most value-for-money smartphones that won't break your budget.",
        content: `# Best Budget Smartphones Under ₹20,000 in 2025

## Top Picks for 2025

*For the latest smartphone deals and price drops, check our electronics section regularly.*`,
        category: "Tech Reviews",
        tags: ["smartphones", "budget", "tech", "reviews", "2025"],
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        publishedAt: new Date("2025-01-22"),
        readTime: "7 min read",
        slug: "best-budget-smartphones-under-20000-2025"
      }
    ]);

    console.log("✅ Database seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
seedDatabase()
  .then(() => {
    console.log("🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });

export { seedDatabase };
