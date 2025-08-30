import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import GenderSelectionModal from "./GenderSelectionModal";

export default function Categories() {
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Fetch categories from API
  const { data: apiCategories, isLoading, error } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Categories that require gender selection
  const genderSpecificCategories = [
    'Fashion & Clothing',
    'Health & Beauty', 
    'Jewelry & Watches',
    'Baby & Kids'
  ];

  const handleCategoryClick = (e: React.MouseEvent, categoryName: string) => {
    if (genderSpecificCategories.includes(categoryName)) {
      e.preventDefault();
      setSelectedCategory(categoryName);
      setShowGenderModal(true);
    }
  };

  const handleGenderSelect = (gender: string) => {
    setShowGenderModal(false);
    // Navigate to category with gender parameter
    window.location.href = `/category/${encodeURIComponent(selectedCategory)}?gender=${gender}`;
  };

  if (isLoading) {
    return (
      <section id="categories" className="py-16 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Browse Categories
            </h2>
            <p className="text-slate-300 text-lg">
              Loading categories...
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-slate-700 rounded-[20px] p-4 sm:p-6 h-40 sm:h-44 animate-pulse">
                <div className="w-8 h-8 bg-slate-600 rounded mb-4 mx-auto"></div>
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-3 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !apiCategories || apiCategories.length === 0) {
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
          <div className="text-center py-12">
            <div className="mb-8">
              <i className="fas fa-tags text-6xl text-slate-600 mb-4"></i>
              <h3 className="text-2xl font-bold text-slate-400 mb-2">
                No Categories Available
              </h3>
              <p className="text-slate-500 mb-6">
                Categories are being set up. Please check back soon!
              </p>
              <Link 
                href="/admin"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Categories (Admin)
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-16 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 relative leading-tight">
              Browse Categories
              <div className="absolute -top-1 -right-6 text-xl animate-pulse">🏷️</div>
            </h2>
          </div>
          <p className="text-slate-300 text-lg">
            Discover amazing deals across all categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
          {(showAllCategories ? apiCategories : apiCategories.slice(0, 12)).map((category: any, index: number) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className="group block"
              onClick={(e) => handleCategoryClick(e, category.name)}
            >
              <div 
                className={`
                  relative overflow-hidden rounded-[20px] p-4 sm:p-6 text-center
                  h-40 sm:h-44 flex flex-col justify-center
                  transform transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-2xl hover:shadow-black/20
                  shadow-lg shadow-black/10
                  ${category.name === 'Apps & AI Apps' 
                    ? 'ring-2 ring-yellow-400/50 shadow-yellow-400/20' 
                    : ''
                  }
                  ${genderSpecificCategories.includes(category.name) 
                    ? 'ring-2 ring-purple-400/50 shadow-purple-400/20' 
                    : ''
                  }
                `}
                style={{ 
                  background: category.color 
                    ? `linear-gradient(135deg, ${category.color}CC, ${category.color}FF)`
                    : `linear-gradient(135deg, ${getDefaultColor(index)}CC, ${getDefaultColor(index)}FF)`
                }}
              >
                {/* Gender selection badge for specific categories */}
                {genderSpecificCategories.includes(category.name) && (
                  <div className="absolute -top-1 -left-1 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    👤
                  </div>
                )}
                {/* Special badge for Apps & AI Apps */}
                {category.name === 'Apps & AI Apps' && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-lg">
                    NEW
                  </div>
                )}

                {/* Inner highlight effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[20px]"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="mb-2 sm:mb-3">
                    <i className={`${category.icon || getDefaultIcon(index)} text-2xl sm:text-3xl text-white drop-shadow-lg`}></i>
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

        {/* Show More / Show Less Button */}
        {apiCategories && apiCategories.length > 12 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {showAllCategories ? (
                <>
                  <span>Show Less</span>
                  <i className="fas fa-chevron-up ml-2 transition-transform duration-300"></i>
                </>
              ) : (
                <>
                  <span>Show More ({apiCategories.length - 12} more categories)</span>
                  <i className="fas fa-chevron-down ml-2 transition-transform duration-300"></i>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Gender Selection Modal */}
      <GenderSelectionModal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        onSelect={handleGenderSelect}
        category={selectedCategory}
      />
    </section>
  );
}

// Helper function to get default colors if not provided by API
function getDefaultColor(index: number): string {
  const colors = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#14B8A6', '#6B7280', '#22C55E',
    '#F472B6', '#A855F7', '#FB7185', '#FBBF24', '#C084FC', '#60A5FA'
  ];
  return colors[index % colors.length];
}

// Helper function to get default icons if not provided by API
function getDefaultIcon(index: number): string {
  const icons = [
    'fas fa-laptop', 'fas fa-tshirt', 'fas fa-home', 'fas fa-heart', 'fas fa-dumbbell', 'fas fa-book',
    'fas fa-gamepad', 'fas fa-car', 'fas fa-suitcase', 'fas fa-paw', 'fas fa-briefcase', 'fas fa-leaf',
    'fas fa-baby', 'fas fa-music', 'fas fa-palette', 'fas fa-utensils', 'fas fa-gem', 'fas fa-camera'
  ];
  return icons[index % icons.length];
}
