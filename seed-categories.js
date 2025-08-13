import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

// Categories from the image with their colors and icons
const categories = [
  {
    name: "Electronics & Gadgets",
    icon: "fas fa-mobile-alt",
    color: "#3B82F6", // Blue
    description: "Latest Tech & Electronics"
  },
  {
    name: "Mobiles & Accessories",
    icon: "fas fa-mobile",
    color: "#6366F1", // Indigo
    description: "Smartphones & Accessories"
  },
  {
    name: "Computers & Laptops",
    icon: "fas fa-laptop",
    color: "#8B5CF6", // Purple
    description: "Computing Solutions"
  },
  {
    name: "Cameras & Photography",
    icon: "fas fa-camera",
    color: "#A855F7", // Purple
    description: "Photography Equipment"
  },
  {
    name: "Home Appliances",
    icon: "fas fa-home",
    color: "#10B981", // Emerald
    description: "Smart Home Solutions"
  },
  {
    name: "Women's Fashion",
    icon: "fas fa-female",
    color: "#EC4899", // Pink
    description: "Trendy Women's Clothing"
  },
  {
    name: "Kids' Fashion",
    icon: "fas fa-child",
    color: "#F59E0B", // Amber
    description: "Children's Clothing & Toys"
  },
  {
    name: "Footwear & Accessories",
    icon: "fas fa-shoe-prints",
    color: "#8B5CF6", // Purple
    description: "Shoes & Style Accessories"
  },
  {
    name: "Jewelry & Watches",
    icon: "fas fa-gem",
    color: "#A855F7", // Purple
    description: "Luxury & Fashion Jewelry"
  },
  {
    name: "Beauty & Grooming",
    icon: "fas fa-heart",
    color: "#EC4899", // Pink
    description: "Beauty & Personal Care"
  },
  {
    name: "Health & Wellness",
    icon: "fas fa-heartbeat",
    color: "#EF4444", // Red
    description: "Health & Fitness Products"
  },
  {
    name: "Fitness & Nutrition",
    icon: "fas fa-dumbbell",
    color: "#F97316", // Orange
    description: "Fitness & Nutrition Gear"
  },
  {
    name: "Personal Care",
    icon: "fas fa-spa",
    color: "#10B981", // Emerald
    description: "Personal Care Essentials"
  },
  {
    name: "Furniture & Decor",
    icon: "fas fa-couch",
    color: "#F59E0B", // Amber
    description: "Home Furniture & Decor"
  },
  {
    name: "Kitchen & Dining",
    icon: "fas fa-utensils",
    color: "#10B981", // Emerald
    description: "Kitchen Essentials"
  },
  {
    name: "Bedding & Home",
    icon: "fas fa-bed",
    color: "#06B6D4", // Cyan
    description: "Comfort & Home Essentials"
  },
  {
    name: "Gardening & Outdoor",
    icon: "fas fa-seedling",
    color: "#84CC16", // Lime
    description: "Garden & Outdoor Living"
  },
  {
    name: "Sports & Outdoors",
    icon: "fas fa-football-ball",
    color: "#F97316", // Orange
    description: "Sports & Outdoor Gear"
  },
  {
    name: "Music, Books &",
    icon: "fas fa-music",
    color: "#3B82F6", // Blue
    description: "Entertainment & Gaming"
  },
  {
    name: "E-learning & Courses",
    icon: "fas fa-graduation-cap",
    color: "#8B5CF6", // Purple
    description: "Online Learning & Skills"
  },
  {
    name: "Automotive",
    icon: "fas fa-car",
    color: "#F59E0B", // Amber
    description: "Car Accessories & Parts"
  },
  {
    name: "Food Delivery & Meal",
    icon: "fas fa-pizza-slice",
    color: "#06B6D4", // Cyan
    description: "Ready Meals & Delivery"
  },
  {
    name: "Travel & Tourism",
    icon: "fas fa-plane",
    color: "#3B82F6", // Blue
    description: "Travel Bookings"
  },
  {
    name: "Cleaning Essentials",
    icon: "fas fa-broom",
    color: "#06B6D4", // Cyan
    description: "Cleaning Supplies"
  },
  {
    name: "Pet Supplies",
    icon: "fas fa-paw",
    color: "#8B5CF6", // Purple
    description: "Pet Care & Accessories"
  },
  {
    name: "Credit Cards & Finance",
    icon: "fas fa-credit-card",
    color: "#8B5CF6", // Purple
    description: "Banking & Finance Services"
  },
  {
    name: "Loans & Investment",
    icon: "fas fa-chart-line",
    color: "#A855F7", // Purple
    description: "Loans & Investment Plans"
  },
  {
    name: "Insurance & Trading",
    icon: "fas fa-shield-alt",
    color: "#10B981", // Emerald
    description: "Insurance & Trading"
  },
  {
    name: "Cars & Bikes",
    icon: "fas fa-motorcycle",
    color: "#F97316", // Orange
    description: "Automotive Marketplace"
  },
  {
    name: "Parts & Maintenance",
    icon: "fas fa-tools",
    color: "#EF4444", // Red
    description: "Auto Parts & Services"
  },
  {
    name: "Baby Products",
    icon: "fas fa-baby",
    color: "#EC4899", // Pink
    description: "Baby Care & Accessories"
  },
  {
    name: "Pet Supplies",
    icon: "fas fa-dog",
    color: "#F97316", // Orange
    description: "Pet Care & Accessories"
  },
  {
    name: "Writing & Occasions",
    icon: "fas fa-pen",
    color: "#EC4899", // Pink
    description: "Gifts & Special Occasions"
  },
  {
    name: "AI Apps & Services",
    icon: "fas fa-robot",
    color: "#8B5CF6", // Purple with special styling
    description: "Latest AI Tools & Services"
  }
];

// Clear existing categories
db.prepare('DELETE FROM categories').run();

// Insert categories
const insertCategory = db.prepare(`
  INSERT INTO categories (name, icon, color, description)
  VALUES (?, ?, ?, ?)
`);

categories.forEach(category => {
  insertCategory.run(category.name, category.icon, category.color, category.description);
});

console.log(`✅ Successfully seeded ${categories.length} categories!`);
db.close();
