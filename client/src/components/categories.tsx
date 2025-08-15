import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Fallback categories data in case API fails - Cleaned up duplicates
const fallbackCategoriesData = [
  {
    id: 1,
    name: 'Electronics & Gadgets',
    description: 'Latest tech & gadgets',
    icon: 'fas fa-laptop',
    color: '#6366F1'
  },
  {
    id: 2,
    name: 'Fashion & Clothing',
    description: 'Trendy fashion items',
    icon: 'fas fa-tshirt',
    color: '#EC4899'
  },
  {
    id: 3,
    name: 'Home & Kitchen',
    description: 'Home essentials',
    icon: 'fas fa-home',
    color: '#10B981'
  },
  {
    id: 4,
    name: 'Health & Beauty',
    description: 'Beauty & wellness',
    icon: 'fas fa-heart',
    color: '#F59E0B'
  },
  {
    id: 5,
    name: 'Sports & Fitness',
    description: 'Fitness equipment',
    icon: 'fas fa-dumbbell',
    color: '#EF4444'
  },
  {
    id: 6,
    name: 'Books & Education',
    description: 'Learning resources',
    icon: 'fas fa-book',
    color: '#8B5CF6'
  },
  {
    id: 7,
    name: 'Gaming & Entertainment',
    description: 'Gaming gear & fun',
    icon: 'fas fa-gamepad',
    color: '#06B6D4'
  },
  {
    id: 8,
    name: 'Automotive',
    description: 'Car accessories',
    icon: 'fas fa-car',
    color: '#84CC16'
  },
  {
    id: 9,
    name: 'Travel & Luggage',
    description: 'Travel essentials',
    icon: 'fas fa-suitcase',
    color: '#F97316'
  },
  {
    id: 10,
    name: 'Pet Supplies',
    description: 'Pet care products',
    icon: 'fas fa-paw',
    color: '#14B8A6'
  },
  {
    id: 11,
    name: 'Office Supplies',
    description: 'Work essentials',
    icon: 'fas fa-briefcase',
    color: '#6B7280'
  },
  {
    id: 12,
    name: 'Garden & Outdoor',
    description: 'Outdoor living',
    icon: 'fas fa-leaf',
    color: '#22C55E'
  },
  {
    id: 13,
    name: 'Baby & Kids',
    description: 'Child care items',
    icon: 'fas fa-baby',
    color: '#F472B6'
  },
  {
    id: 14,
    name: 'Music & Instruments',
    description: 'Musical equipment',
    icon: 'fas fa-music',
    color: '#A855F7'
  },
  {
    id: 15,
    name: 'Art & Crafts',
    description: 'Creative supplies',
    icon: 'fas fa-palette',
    color: '#FB7185'
  },
  {
    id: 16,
    name: 'Food & Beverages',
    description: 'Gourmet foods',
    icon: 'fas fa-utensils',
    color: '#FBBF24'
  },
  {
    id: 17,
    name: 'Jewelry & Watches',
    description: 'Luxury accessories',
    icon: 'fas fa-gem',
    color: '#C084FC'
  },
  {
    id: 18,
    name: 'Photography',
    description: 'Camera equipment',
    icon: 'fas fa-camera',
    color: '#60A5FA'
  },
  {
    id: 19,
    name: 'Tools & Hardware',
    description: 'DIY tools',
    icon: 'fas fa-tools',
    color: '#F87171'
  },
  {
    id: 20,
    name: 'Collectibles',
    description: 'Rare collectibles',
    icon: 'fas fa-trophy',
    color: '#FBBF24'
  },
  {
    id: 21,
    name: 'Software & Apps',
    description: 'Digital products',
    icon: 'fas fa-code',
    color: '#818CF8'
  },
  {
    id: 22,
    name: 'Subscription Services',
    description: 'Monthly services',
    icon: 'fas fa-calendar',
    color: '#FB923C'
  },
  {
    id: 23,
    name: 'Gift Cards',
    description: 'Digital gift cards',
    icon: 'fas fa-gift',
    color: '#F472B6'
  },
  {
    id: 24,
    name: 'Online Learning',
    description: 'Courses & training',
    icon: 'fas fa-graduation-cap',
    color: '#A78BFA'
  },
  {
    id: 25,
    name: 'Streaming Services',
    description: 'Entertainment',
    icon: 'fas fa-play',
    color: '#EF4444'
  },
  {
    id: 26,
    name: 'Cloud Storage',
    description: 'Data storage',
    icon: 'fas fa-cloud',
    color: '#06B6D4'
  },
  {
    id: 27,
    name: 'VPN & Security',
    description: 'Online security',
    icon: 'fas fa-shield-alt',
    color: '#10B981'
  },
  {
    id: 28,
    name: 'Web Hosting',
    description: 'Website hosting',
    icon: 'fas fa-server',
    color: '#6B7280'
  },
  {
    id: 29,
    name: 'Design Tools',
    description: 'Creative software',
    icon: 'fas fa-paint-brush',
    color: '#F59E0B'
  },
  {
    id: 30,
    name: 'AI Apps & Services',
    description: 'AI-powered tools',
    icon: 'fas fa-robot',
    color: '#A855F7'
  }
];

export default function Categories() {
  // Don't show loading state - use fallback data immediately
  const { data: apiCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    retry: false,
    enabled: false, // Disable automatic fetching for now
  });

  // Always use fallback data for immediate display
  const categoriesData = fallbackCategoriesData;

  // Remove loading state completely - always show content immediately

  return (
    <section id="categories" className="py-16 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Browse Categories
          </h2>
          <p className="text-slate-300 text-lg">
            Discover amazing deals across all categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
          {categoriesData.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className="group block"
            >
              <div 
                className={`
                  relative overflow-hidden rounded-[20px] p-4 sm:p-6 text-center
                  h-32 sm:h-36 flex flex-col justify-center
                  transform transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-2xl hover:shadow-black/20
                  shadow-lg shadow-black/10
                  ${category.name === 'AI Apps & Services' 
                    ? 'ring-2 ring-yellow-400/50 shadow-yellow-400/20' 
                    : ''
                  }
                `}
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}CC, ${category.color}FF)`
                }}
              >
                {/* Special badge for AI Apps & Services */}
                {category.name === 'AI Apps & Services' && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-lg">
                    NEW
                  </div>
                )}

                {/* Inner highlight effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[20px]"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="mb-2 sm:mb-3">
                    <i className={`${category.icon} text-2xl sm:text-3xl text-white drop-shadow-lg`}></i>
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm mb-1 sm:mb-2 leading-tight drop-shadow-sm line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-[10px] sm:text-xs leading-tight drop-shadow-sm line-clamp-2">
                    {category.description}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px]"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
