import { db } from "./db";
import { products, categories, blogPosts, affiliateNetworks } from "@shared/schema";

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
        commissionRate: "4.50",
        trackingParams: "tag=pickntrust-21",
        logoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://affiliate-program.amazon.com/"
      },
      {
        name: "Commission Junction",
        slug: "cj",
        description: "Leading affiliate marketing network with top brands",
        commissionRate: "6.00",
        trackingParams: "sid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://www.cj.com/"
      },
      {
        name: "ShareASale",
        slug: "shareasale",
        description: "Diverse merchant network with excellent tools",
        commissionRate: "5.50",
        trackingParams: "afftrack=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://www.shareasale.com/"
      },
      {
        name: "Flipkart Affiliate",
        slug: "flipkart",
        description: "India's leading e-commerce platform",
        commissionRate: "3.50",
        trackingParams: "affid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://affiliate.flipkart.com/"
      },
      {
        name: "ClickBank",
        slug: "clickbank",
        description: "Digital products and online courses marketplace",
        commissionRate: "8.00",
        trackingParams: "tid=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://www.clickbank.com/"
      },
      {
        name: "Impact",
        slug: "impact",
        description: "Performance marketing platform for enterprise brands",
        commissionRate: "7.00",
        trackingParams: "utm_source=pickntrust",
        logoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        isActive: true,
        joinUrl: "https://www.impact.com/"
      }
    ]);

    // Seed categories
    console.log("📂 Adding categories...");
    await db.insert(categories).values([
      {
        name: "Electronics & Gadgets",
        icon: "fas fa-microchip",
        color: "#3B82F6",
        description: "Latest Electronics & Tech Gadgets"
      },
      {
        name: "Mobiles & Accessories",
        icon: "fas fa-mobile-alt",
        color: "#10B981",
        description: "Smartphones & Mobile Accessories"
      },
      {
        name: "Computers & Laptops",
        icon: "fas fa-laptop",
        color: "#8B5CF6",
        description: "Laptops, PCs & Computer Hardware"
      },
      {
        name: "Fashion Men",
        icon: "fas fa-male",
        color: "#059669",
        description: "Men's Clothing & Fashion"
      },
      {
        name: "Fashion Women",
        icon: "fas fa-female",
        color: "#EC4899",
        description: "Women's Clothing & Fashion"
      },
      {
        name: "Fashion Kids",
        icon: "fas fa-child",
        color: "#F472B6",
        description: "Kids' Clothing & Fashion"
      },
      {
        name: "Shoes & Footwear",
        icon: "fas fa-shoe-prints",
        color: "#8B5A2B",
        description: "Footwear for All Ages"
      },
      {
        name: "Watches & Accessories",
        icon: "fas fa-clock",
        color: "#6366F1",
        description: "Watches & Fashion Accessories"
      },
      {
        name: "Beauty & Personal Care",
        icon: "fas fa-spa",
        color: "#F59E0B",
        description: "Beauty & Personal Care Products"
      },
      {
        name: "Health & Wellness",
        icon: "fas fa-heartbeat",
        color: "#EF4444",
        description: "Health & Wellness Products"
      },
      {
        name: "Home & Kitchen",
        icon: "fas fa-home",
        color: "#84CC16",
        description: "Home & Kitchen Essentials"
      },
      {
        name: "Furniture & Decor",
        icon: "fas fa-couch",
        color: "#A855F7",
        description: "Furniture & Home Decor"
      },
      {
        name: "Appliances",
        icon: "fas fa-blender",
        color: "#06B6D4",
        description: "Home & Kitchen Appliances"
      },
      {
        name: "Garden & Outdoor",
        icon: "fas fa-leaf",
        color: "#22C55E",
        description: "Garden & Outdoor Living"
      },
      {
        name: "Books & Stationery",
        icon: "fas fa-book",
        color: "#DC2626",
        description: "Books & Stationery Items"
      },
      {
        name: "Sports & Fitness",
        icon: "fas fa-dumbbell",
        color: "#059669",
        description: "Sports & Fitness Equipment"
      },
      {
        name: "Toys & Games",
        icon: "fas fa-gamepad",
        color: "#7C2D12",
        description: "Toys, Games & Entertainment"
      },
      {
        name: "Music & Instruments",
        icon: "fas fa-music",
        color: "#BE185D",
        description: "Musical Instruments & Audio"
      },
      {
        name: "Movies & Entertainment",
        icon: "fas fa-film",
        color: "#1E40AF",
        description: "Movies & Entertainment"
      },
      {
        name: "Food & Grocery",
        icon: "fas fa-shopping-basket",
        color: "#DC2626",
        description: "Food & Grocery Items"
      },
      {
        name: "Travel & Luggage",
        icon: "fas fa-suitcase-rolling",
        color: "#1E40AF",
        description: "Travel & Luggage"
      },
      {
        name: "Credit Cards & Finance",
        icon: "fas fa-credit-card",
        color: "#7C3AED",
        description: "Financial Services"
      },
      {
        name: "Cars & Bikes Accessories",
        icon: "fas fa-car",
        color: "#F59E0B",
        description: "Vehicle Accessories"
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
      }
    ]);

    // Seed featured products
    console.log("🛍️ Adding featured products...");
    await db.insert(products).values([
      {
        name: "Premium Wireless Smartphone",
        description: "Latest model with advanced camera and long battery life",
        price: "49999.00",
        originalPrice: "66599.00",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://amazon.in/dp/B08N5WRWNW?tag=pickntrust-21",
        affiliateNetworkId: 1,
        category: "Mobiles & Accessories",
        rating: "5.0",
        reviewCount: 1234,
        discount: 25,
        isFeatured: true
      },
      {
        name: "Smart Kitchen Appliance Set",
        description: "Complete kitchen solution with smart controls",
        price: "24999.00",
        originalPrice: "41599.00",
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://www.flipkart.com/kitchen-appliances?affid=pickntrust",
        affiliateNetworkId: 4,
        category: "Appliances",
        rating: "4.0",
        reviewCount: 856,
        discount: 40,
        isFeatured: true
      },
      {
        name: "Professional Gaming Laptop",
        description: "High-performance laptop for gaming and professional work",
        price: "89999.00",
        originalPrice: "124999.00",
        imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        affiliateUrl: "https://amazon.in/dp/B08N5WRWNW?tag=pickntrust-21",
        affiliateNetworkId: 1,
        category: "Computers & Laptops",
        rating: "4.8",
        reviewCount: 2156,
        discount: 28,
        isFeatured: true
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

Before making any purchase, always compare prices across different websites and platforms. Use price comparison tools and browser extensions that automatically show you the best available prices.

**Pro tip:** Check both official brand websites and major e-commerce platforms like Amazon, Flipkart, and others.

## 2. Use Cashback and Reward Credit Cards

Choose credit cards that offer cashback or reward points for online purchases. Many cards offer:
- 2-5% cashback on online shopping
- Bonus points for specific categories
- Welcome bonuses for new cardholders

## 3. Sign Up for Price Drop Alerts

Many websites offer price drop alerts that notify you when an item goes on sale. This is especially useful for:
- Electronics and gadgets
- Fashion items
- Home appliances
- Books and media

## 4. Shop During Sale Seasons

Plan your major purchases around sale seasons:
- **Diwali Sales** (October/November)
- **Republic Day Sales** (January)
- **End of Season Sales** (March/September)
- **Black Friday & Cyber Monday** (November)

## 5. Use Coupon Codes and Promotional Offers

Always search for coupon codes before checkout. Many websites offer:
- First-time buyer discounts
- Newsletter subscription coupons
- Social media exclusive codes
- Bank-specific offers

**Remember:** These small savings add up to significant amounts over time. Happy shopping!

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

Finding a great smartphone under ₹20,000 has never been easier. With fierce competition among manufacturers, budget phones now offer premium features that were once exclusive to flagship models.

## Top Picks for 2025

### 1. Realme Narzo 70 Pro 5G
**Price: ₹17,999**
- 108MP AI Triple Camera
- 5000mAh Battery with 67W Fast Charging
- MediaTek Dimensity 7050 Processor
- 8GB RAM + 128GB Storage

### 2. Redmi Note 13 5G
**Price: ₹16,999**
- Snapdragon 4 Gen 2 Processor
- 108MP Main Camera
- 5000mAh Battery
- MIUI 14 based on Android 13

### 3. Samsung Galaxy M34 5G
**Price: ₹19,499**
- Exynos 1280 Processor
- 50MP Triple Camera Setup
- 6000mAh Battery
- One UI 5.1

## Key Features to Look For

When choosing a budget smartphone, prioritize these features:

### Performance
- At least 6GB RAM for smooth multitasking
- Snapdragon 4 Gen 2 or MediaTek Dimensity series processors
- 128GB storage minimum

### Camera Quality
- Main camera: 50MP or higher
- Ultra-wide lens for versatility
- Night mode capabilities

### Battery Life
- 5000mAh minimum capacity
- Fast charging (33W or higher)
- Power-efficient processor

### Display
- 6.5" or larger screen
- Full HD+ resolution
- 90Hz refresh rate for smooth scrolling

## Pro Shopping Tips

1. **Wait for sales**: Major sales can bring down prices by ₹2,000-3,000
2. **Check exchange offers**: Old phone exchange can save significant money
3. **Consider older flagships**: Last year's premium phones often drop to budget range
4. **Read reviews**: Check camera samples and real-world performance reviews

## Conclusion

These budget smartphones prove you don't need to spend a fortune for a great mobile experience. Each offers excellent value for money with modern features and reliable performance.

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