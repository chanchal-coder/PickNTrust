import { Link } from "wouter";
import { useState, useEffect } from "react";

// Predefined categories matching the exact image layout (6 rows x 6 columns = 36 categories)
const predefinedCategories = [
  // Row 1
  { id: 1, name: "Electronics & Gadgets", description: "Latest Tech & Electronics", icon: "⚙️", color: "#6366F1" },
  { id: 2, name: "Mobiles & Accessories", description: "Smartphones & Mobile Gear", icon: "📱", color: "#8B5CF6" },
  { id: 3, name: "Computers & Laptops", description: "Computing Solutions", icon: "💻", color: "#3B82F6" },
  { id: 4, name: "Cameras & Photography", description: "Capture Perfect Moments", icon: "📷", color: "#A855F7" },
  { id: 5, name: "Home Appliances", description: "Smart Home Solutions", icon: "🏠", color: "#10B981" },
  { id: 6, name: "Men's Fashion", description: "Stylish Men's Wear", icon: "👔", color: "#059669" },
  
  // Row 2
  { id: 7, name: "Women's Fashion", description: "Elegant Women's Collection", icon: "👗", color: "#EC4899" },
  { id: 8, name: "Kids' Fashion", description: "Trendy Kids' Clothing", icon: "👶", color: "#F59E0B" },
  { id: 9, name: "Footwear & Accessories", description: "Shoes & Style Accessories", icon: "👟", color: "#8B5CF6" },
  { id: 10, name: "Jewelry & Watches", description: "Luxury & Timepieces", icon: "💎", color: "#A855F7" },
  { id: 11, name: "Beauty & Grooming", description: "Beauty & Personal Care", icon: "💄", color: "#F472B6" },
  { id: 12, name: "Health & Wellness", description: "Health & Fitness Products", icon: "❤️", color: "#EF4444" },
  
  // Row 3
  { id: 13, name: "Fitness & Nutrition", description: "Fitness & Sports Gear", icon: "🏋️", color: "#F97316" },
  { id: 14, name: "Personal Care Appliances", description: "Personal Care Devices", icon: "🧴", color: "#84CC16" },
  { id: 15, name: "Furniture & Décor", description: "Home Furniture & Decor", icon: "🛋️", color: "#10B981" },
  { id: 16, name: "Kitchen & Dining", description: "Kitchen Essentials", icon: "🍽️", color: "#22C55E" },
  { id: 17, name: "Bedding & Home Essentials", description: "Comfort & Home Basics", icon: "🛏️", color: "#06B6D4" },
  { id: 18, name: "Gardening & Outdoor", description: "Garden & Outdoor Living", icon: "🌱", color: "#65A30D" },
  
  // Row 4
  { id: 19, name: "Books & Stationery", description: "Books & Learning Materials", icon: "📚", color: "#D97706" },
  { id: 20, name: "Music, Movies & Games", description: "Entertainment & Gaming", icon: "🎮", color: "#DC2626" },
  { id: 21, name: "E-learning & Courses", description: "Online Learning & Skills", icon: "🎓", color: "#B91C1C" },
  { id: 22, name: "Groceries & Gourmet", description: "Fresh & Gourmet Foods", icon: "🛒", color: "#D97706" },
  { id: 23, name: "Food Delivery & Meal Kits", description: "Ready Meals & Delivery", icon: "🍕", color: "#EA580C" },
  { id: 24, name: "Flights & Hotels", description: "Travel Bookings", icon: "✈️", color: "#3B82F6" },
  
  // Row 5
  { id: 25, name: "Holiday Packages", description: "Complete Travel Packages", icon: "🏖️", color: "#0891B2" },
  { id: 26, name: "Experiences & Activities", description: "Adventure & Experiences", icon: "🎪", color: "#1E40AF" },
  { id: 27, name: "Credit Cards & Finance", description: "Financial Services", icon: "💳", color: "#7C3AED" },
  { id: 28, name: "Loans & Insurance", description: "Loans & Protection Plans", icon: "🛡️", color: "#8B5CF6" },
  { id: 29, name: "Investments & Trading Tools", description: "Investment & Trading", icon: "📈", color: "#A855F7" },
  { id: 30, name: "Utility & Bill Payments", description: "Bills & Utility Services", icon: "📄", color: "#6366F1" },
  
  // Row 6
  { id: 31, name: "Cars & Bikes Accessories", description: "Vehicle Accessories", icon: "🚗", color: "#D97706" },
  { id: 32, name: "Parts & Maintenance", description: "Auto Parts & Services", icon: "🔧", color: "#DC2626" },
  { id: 33, name: "Baby Products", description: "Baby Care & Products", icon: "🍼", color: "#F472B6" },
  { id: 34, name: "Pet Supplies", description: "Pet Care & Accessories", icon: "🐾", color: "#FB7185" },
  { id: 35, name: "Gifting & Occasions", description: "Gifts & Special Occasions", icon: "🎁", color: "#F87171" },
  { id: 36, name: "AI Apps & Services", description: "🤖 Cutting-edge AI tools and applications", icon: "🤖", color: "#8B5CF6", isNew: true },
];

export default function Categories() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminSession === 'active');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <section className="py-12 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-green-400 mb-2">Browse Categories</h2>
        </div>

        {/* 6x6 Grid Layout - Exactly matching the image */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {predefinedCategories.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className={`group relative rounded-2xl p-4 text-white text-center hover:transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg block min-h-[140px] flex flex-col justify-center items-center ${
                category.isNew 
                  ? 'ring-2 ring-yellow-400 ring-opacity-60 animate-pulse shadow-2xl' 
                  : ''
              }`}
              style={{ backgroundColor: category.color }}
            >
              {/* NEW badge for AI category */}
              {category.isNew && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-bounce z-20">
                  NEW!
                </div>
              )}
              
              {/* Icon */}
              <div className={`text-4xl mb-3 ${category.isNew ? 'animate-pulse' : ''}`}>
                {category.icon}
              </div>
              
              {/* Category Name */}
              <h3 className={`font-bold text-sm leading-tight mb-2 text-center ${category.isNew ? 'text-yellow-100' : 'text-white'}`}>
                {category.name}
              </h3>
              
              {/* Description */}
              <p className={`text-xs opacity-90 leading-tight text-center ${category.isNew ? 'text-yellow-200' : 'text-white'}`}>
                {category.description}
              </p>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
