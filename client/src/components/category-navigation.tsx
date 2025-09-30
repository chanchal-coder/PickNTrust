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

  const decodedCurrentCategory = decodeURIComponent(currentCategory);

  // Categories that have gender-specific products
  const genderSpecificCategories = [
    'Fashion & Clothing',
    'Health & Beauty',
    'Footwear & Accessories',
    'Jewelry & Watches', 
    'Beauty & Grooming'
  ];

  // Get related categories (same group or similar)
  const getRelatedCategories = (currentCat: string) => {
    const categoryGroups = {
      'Tech & Electronics': ['Electronics & Gadgets', 'AI Apps & Services', 'Automotive'],
      'Fashion & Style': ['Fashion & Clothing', 'Footwear & Accessories', 'Jewelry & Watches', 'Beauty & Grooming', 'Beauty & Personal Care'],
      'Home & Lifestyle': ['Home & Living', 'Health & Fitness', 'Sports & Outdoors', 'Pet Supplies'],
      'Learning & Travel': ['Books & Education', 'Travel & Luggage'],
      'Special': ['Special Deals']
    };

    // Find which group the current category belongs to
    for (const [groupName, groupCategories] of Object.entries(categoryGroups)) {
      if (groupCategories.includes(currentCat)) {
        return categories.filter(cat => groupCategories.includes(cat.name));
      }
    }

    // If not in any group, return all categories
    return categories;
  };

  const relatedCategories = getRelatedCategories(decodedCurrentCategory);
  const isCurrentGenderSpecific = genderSpecificCategories.includes(decodedCurrentCategory);

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
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md'
                }`}
                style={decodedCurrentCategory === category.name ? { backgroundColor: category.color } : {}}
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
