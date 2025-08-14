import { Link } from "wouter";

const categoriesData = [
  // Row 1
  {
    id: 1,
    name: 'Electronics & Gadgets',
    description: 'Latest Tech & Electronics',
    icon: '⚙️',
    color: '#6366F1'
  },
  {
    id: 2,
    name: 'Mobiles & Accessories',
    description: 'Smartphones & Mobile Gear',
    icon: '📱',
    color: '#6366F1'
  },
  {
    id: 3,
    name: 'Computers & Laptops',
    description: 'Computing Solutions',
    icon: '💻',
    color: '#6366F1'
  },
  {
    id: 4,
    name: 'Cameras & Photography',
    description: 'Capture Perfect Moments',
    icon: '📷',
    color: '#A855F7'
  },
  {
    id: 5,
    name: 'Home Appliances',
    description: 'Smart Home Solutions',
    icon: '🏠',
    color: '#10B981'
  },
  {
    id: 6,
    name: "Men's Fashion",
    description: "Stylish Men's Wear",
    icon: '👔',
    color: '#10B981'
  },
  // Row 2
  {
    id: 7,
    name: "Women's Fashion",
    description: "Elegant Women's Collection",
    icon: '👗',
    color: '#EC4899'
  },
  {
    id: 8,
    name: "Kids' Fashion",
    description: "Trendy Kids' Clothing",
    icon: '👶',
    color: '#F97316'
  },
  {
    id: 9,
    name: 'Footwear & Accessories',
    description: 'Shoes & Style Accessories',
    icon: '👟',
    color: '#8B5CF6'
  },
  {
    id: 10,
    name: 'Jewelry & Watches',
    description: 'Luxury & Timepieces',
    icon: '💎',
    color: '#8B5CF6'
  },
  {
    id: 11,
    name: 'Beauty & Grooming',
    description: 'Beauty & Personal Care',
    icon: '💄',
    color: '#EC4899'
  },
  {
    id: 12,
    name: 'Health & Wellness',
    description: 'Health & Fitness Products',
    icon: '❤️',
    color: '#EF4444'
  },
  // Row 3
  {
    id: 13,
    name: 'Fitness & Nutrition',
    description: 'Fitness & Sports Gear',
    icon: '🏋️',
    color: '#F97316'
  },
  {
    id: 14,
    name: 'Personal Care Appliances',
    description: 'Personal Care Devices',
    icon: '🔧',
    color: '#22C55E'
  },
  {
    id: 15,
    name: 'Furniture & Décor',
    description: 'Home Furniture & Decor',
    icon: '🛋️',
    color: '#10B981'
  },
  {
    id: 16,
    name: 'Kitchen & Dining',
    description: 'Kitchen Essentials',
    icon: '🍽️',
    color: '#22C55E'
  },
  {
    id: 17,
    name: 'Bedding & Home Essentials',
    description: 'Comfort & Home Basics',
    icon: '🛏️',
    color: '#06B6D4'
  },
  {
    id: 18,
    name: 'Gardening & Outdoor',
    description: 'Garden & Outdoor Living',
    icon: '🌱',
    color: '#22C55E'
  },
  // Row 4
  {
    id: 19,
    name: 'Books & Stationery',
    description: 'Books & Learning Materials',
    icon: '📚',
    color: '#D97706'
  },
  {
    id: 20,
    name: 'Music, Movies & Games',
    description: 'Entertainment & Gaming',
    icon: '🎵',
    color: '#DC2626'
  },
  {
    id: 21,
    name: 'E-learning & Courses',
    description: 'Online Learning & Skills',
    icon: '🎓',
    color: '#DC2626'
  },
  {
    id: 22,
    name: 'Groceries & Gourmet',
    description: 'Fresh & Gourmet Foods',
    icon: '🛒',
    color: '#D97706'
  },
  {
    id: 23,
    name: 'Food Delivery & Meal Kits',
    description: 'Ready Meals & Delivery',
    icon: '🍕',
    color: '#F97316'
  },
  {
    id: 24,
    name: 'Flights & Hotels',
    description: 'Travel Bookings',
    icon: '✈️',
    color: '#3B82F6'
  },
  // Row 5
  {
    id: 25,
    name: 'Holiday Packages',
    description: 'Complete Travel Packages',
    icon: '🏖️',
    color: '#06B6D4'
  },
  {
    id: 26,
    name: 'Experiences & Activities',
    description: 'Adventure & Experiences',
    icon: '🎪',
    color: '#6366F1'
  },
  {
    id: 27,
    name: 'Credit Cards & Finance',
    description: 'Financial Services',
    icon: '💳',
    color: '#8B5CF6'
  },
  {
    id: 28,
    name: 'Loans & Insurance',
    description: 'Loans & Protection Plans',
    icon: '🛡️',
    color: '#8B5CF6'
  },
  {
    id: 29,
    name: 'Investments & Trading Tools',
    description: 'Investment & Trading',
    icon: '📈',
    color: '#A855F7'
  },
  {
    id: 30,
    name: 'Utility & Bill Payments',
    description: 'Bills & Utility Services',
    icon: '📄',
    color: '#6366F1'
  },
  // Row 6
  {
    id: 31,
    name: 'Cars & Bikes Accessories',
    description: 'Vehicle Accessories',
    icon: '🚗',
    color: '#D97706'
  },
  {
    id: 32,
    name: 'Parts & Maintenance',
    description: 'Auto Parts & Services',
    icon: '🔧',
    color: '#DC2626'
  },
  {
    id: 33,
    name: 'Baby Products',
    description: 'Baby Care & Products',
    icon: '🍼',
    color: '#EC4899'
  },
  {
    id: 34,
    name: 'Pet Supplies',
    description: 'Pet Care & Accessories',
    icon: '🐾',
    color: '#EC4899'
  },
  {
    id: 35,
    name: 'Gifting & Occasions',
    description: 'Gifts & Special Occasions',
    icon: '🎁',
    color: '#F97316'
  },
  {
    id: 36,
    name: 'AI Apps & Services',
    description: 'Cutting-edge AI tools and applications',
    icon: '🤖',
    color: '#8B5CF6'
  }
];

export default function Categories() {
  return (
    <section className="py-12 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent relative">
              Browse Categories
              <div className="absolute -top-1 -right-4 text-lg animate-pulse">🏪</div>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categoriesData.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className={`rounded-2xl p-4 text-white text-center hover:transform hover:scale-105 transition-all cursor-pointer shadow-lg block relative group ${
                category.name === 'AI Apps & Services' 
                  ? 'ring-4 ring-yellow-400 ring-opacity-60 animate-pulse shadow-2xl' 
                  : ''
              }`}
              style={{ backgroundColor: category.color }}
            >
              {category.name === 'AI Apps & Services' && (
                <>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    NEW! 🔥
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl"></div>
                </>
              )}
              <div className={`text-2xl mb-3 ${category.name === 'AI Apps & Services' ? 'animate-pulse text-yellow-200' : ''}`}>
                {category.icon}
              </div>
              <h4 className={`font-bold text-sm ${category.name === 'AI Apps & Services' ? 'text-yellow-100' : ''}`}>
                {category.name}
              </h4>
              <p className={`text-xs opacity-90 ${category.name === 'AI Apps & Services' ? 'text-yellow-200' : ''}`}>
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
