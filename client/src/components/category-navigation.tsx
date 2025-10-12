import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CategoryNavigationProps {
  currentCategory: string;
  className?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export default function CategoryNavigation({ currentCategory, className = "" }: CategoryNavigationProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories/browse'],
    queryFn: () => fetch('/api/categories/browse').then(res => res.json()),
  });

  // Normalize to a safe array to prevent runtime errors if API returns
  // an object or an unexpected shape
  const safeCategories: Category[] = Array.isArray(categories) ? categories : [];

  const decodedCurrentCategory = decodeURIComponent(currentCategory);

  // Categories that have gender-specific products
  const genderSpecificCategories = [
    'Fashion & Clothing',
    'Health & Beauty',
    'Footwear & Accessories',
    'Jewelry & Watches', 
    'Beauty & Grooming'
  ];

  // Color fallbacks to ensure colorful UI even when API lacks category color/icon
  const colorMap: Record<string, string> = {
    'Electronics & Gadgets': '#3B82F6', // blue
    'AI Apps & Services': '#8B5CF6',    // violet
    'Automotive': '#F59E0B',            // amber
    'Fashion & Clothing': '#EC4899',    // pink
    'Footwear & Accessories': '#10B981', // emerald
    'Jewelry & Watches': '#F472B6',     // rose
    'Beauty & Grooming': '#A3E635',     // lime
    'Beauty & Personal Care': '#06B6D4',// cyan
    'Home & Living': '#22C55E',         // green
    'Health & Fitness': '#EF4444',      // red
    'Sports & Outdoors': '#FB923C',     // orange
    'Pet Supplies': '#6366F1',          // indigo
    'Books & Education': '#7C3AED',     // purple
    'Travel & Luggage': '#0EA5E9',      // sky
    'Special Deals': '#14B8A6'          // teal
  };

  // Get related categories (same group or similar)
  const getRelatedCategories = (currentCat: string) => {
    const categoryGroups: Record<string, string[]> = {
      'Tech & Electronics': ['Electronics & Gadgets', 'AI Apps & Services', 'Automotive'],
      'Fashion & Style': ['Fashion & Clothing', 'Footwear & Accessories', 'Jewelry & Watches', 'Beauty & Grooming', 'Beauty & Personal Care'],
      'Home & Lifestyle': ['Home & Living', 'Health & Fitness', 'Sports & Outdoors', 'Pet Supplies'],
      'Learning & Travel': ['Books & Education', 'Travel & Luggage'],
      'Special': ['Special Deals']
    };

    // Find which group the current category belongs to
    for (const groupCategories of Object.values(categoryGroups)) {
      if (groupCategories.includes(currentCat)) {
        // Build display items from API when available, otherwise add colorful fallbacks
        return groupCategories.map((name) => {
          const apiCat = safeCategories.find(c => c.name === name);
          return {
            id: apiCat?.id ?? 0,
            name,
            icon: apiCat?.icon ?? 'fas fa-tags',
            color: apiCat?.color ?? (colorMap[name] || '#3B82F6'),
            description: apiCat?.description ?? ''
          } as Category;
        });
      }
    }

    // If not in any group, return all categories from API or a colorful minimal set
    if (safeCategories.length > 0) return safeCategories;
    const fallbackNames = Object.keys(colorMap);
    return fallbackNames.map((name) => ({
      id: 0,
      name,
      icon: 'fas fa-tags',
      color: colorMap[name],
      description: ''
    }));
  };

  const relatedCategories = getRelatedCategories(decodedCurrentCategory);
  const isCurrentGenderSpecific = genderSpecificCategories.includes(decodedCurrentCategory);

  // Helper to create soft background color using 8-digit hex with alpha
  const softBg = (hex: string) => {
    // If hex is like #RRGGBB, append 1A (~10% opacity)
    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) return `${hex}1A`;
    return hex;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {isCurrentGenderSpecific ? 'Related Categories' : 'Switch Categories'}
            </h3>
            <Link 
              href="/"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
            {relatedCategories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${encodeURIComponent(category.name)}`}
                className={`flex-shrink-0 px-4 py-3 rounded-lg text-sm font-medium border transition-all hover:transform hover:scale-105 ${
                  decodedCurrentCategory === category.name
                    ? 'text-white border-transparent shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:shadow-md'
                }`}
                style={decodedCurrentCategory === category.name 
                  ? { backgroundColor: category.color }
                  : { borderColor: category.color, backgroundColor: softBg(category.color) }}
              >
                <div className="flex items-center">
                  <i className={`${category.icon} text-sm mr-2`} style={{color: decodedCurrentCategory === category.name ? 'white' : category.color}}></i>
                  <span>{category.name}</span>
                  {decodedCurrentCategory === category.name && (
                    <i className="fas fa-check ml-2 text-xs"></i>
                  )}
                  {genderSpecificCategories.includes(category.name) && (
                    <div className="ml-2 flex space-x-1">
                      <i className="fas fa-male text-xs opacity-60"></i>
                      <i className="fas fa-female text-xs opacity-60"></i>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Show all categories link */}
          <div className="mt-3 text-center">
            <Link 
              href="/#categories"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              View All Categories →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
