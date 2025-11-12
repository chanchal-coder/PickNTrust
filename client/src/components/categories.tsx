import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import GenderSelectionModal from "./GenderSelectionModal";

export default function Categories() {
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [, setLocation] = useLocation();

  // Deprecated for display: browse API may hide inactive parents
  // Kept as a fallback only
  const { data: apiCategories } = useQuery({
    queryKey: ['/api/categories/browse'],
    queryFn: async () => {
      const response = await fetch('/api/categories/browse');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000, // refresh every 60s to reflect admin updates
    gcTime: 10 * 60 * 1000,
  });

  // Primary source: admin-managed categories (always show DB categories)
  const { data: allCategories } = useQuery({
    queryKey: ['/api/categories', 'home-parent-categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch all categories');
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000, // refresh every 60s to reflect admin updates
    gcTime: 10 * 60 * 1000,
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
    if (selectedCategory) {
      setLocation(`/category/${encodeURIComponent(selectedCategory)}?gender=${gender}`);
      setSelectedCategory('');
      setShowGenderModal(false);
    }
  };

  // Compute total parent count for Show More label using allCategories (fallback to apiCategories)
  const totalParentCount = (() => {
    if (Array.isArray(allCategories)) {
      return allCategories.filter((c: any) => !c.parentId).length;
    }
    if (Array.isArray(apiCategories)) {
      return apiCategories.filter((c: any) => !c.parentId).length;
    }
    return 0;
  })();

  return (
    <section id="categories" className="py-16 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 relative leading-tight">
              Browse Categories
              <div className="absolute -top-1 -right-6 text-xl animate-pulse"><i className="fas fa-tag"></i></div>
            </h2>
          </div>
          <p className="text-slate-300 text-lg">
            Discover amazing deals across all categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 sm:gap-6">
          {(() => {
            // Always derive from full DB categories list, fall back to browse if needed
            const parentCategories = Array.isArray(allCategories)
              ? allCategories.filter((c: any) => !c.parentId)
              : (Array.isArray(apiCategories) ? apiCategories.filter((c: any) => !c.parentId) : []);
            const list = showAllCategories ? parentCategories : parentCategories.slice(0, 12);
            return list.map((category: any, index: number) => {
              const iconClass = (category.icon && String(category.icon).trim().length > 0)
                ? String(category.icon)
                : getCategoryIcon(category.name, index);
              const baseColor = (category.color && String(category.color).trim().length > 0)
                ? String(category.color)
                : getVibrantColor(index, category.name);
              const gradient = `linear-gradient(135deg, ${baseColor}, ${baseColor}E6)`;
              return (
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
                    background: gradient
                  }}
                >
                  {/* Remove all badges - no product count badge, no network count badge, no gender badge, no special badges */}

                  {/* Inner highlight effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[20px]"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div className="mb-2 sm:mb-3">
                      <i className={`${iconClass} text-2xl sm:text-3xl text-white drop-shadow-lg`}></i>
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm mb-1 leading-tight drop-shadow-sm line-clamp-2">
                      {category.name}
                    </h3>
                    {(() => {
                      const desc = (category.description || '').trim();
                      const fallback = category.isForServices
                        ? `Professional services for ${category.name}`
                        : (category.isForAIApps
                            ? `AI apps and tools for ${category.name}`
                            : `Products and tools for ${category.name}`);
                      return (
                        <p className="text-white/90 text-[10px] sm:text-xs leading-tight drop-shadow-sm line-clamp-2 text-center px-2">
                          {desc || fallback}
                        </p>
                      );
                    })()}
                    {/* Removed child category chips from parent cards per requirement */}
                    {/* Child category chips removed: show only parent name and description */}
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px]"></div>
                </div>
              </Link>
              );
            });
          })()}
        </div>

        {/* Show More / Show Less Button */}
        {totalParentCount > 12 && (
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
                (() => {
                  const count = Math.max(totalParentCount - 12, 0);
                  return (
                    <>
                      <span>Show More ({count} more categories)</span>
                      <i className="fas fa-chevron-down ml-2 transition-transform duration-300"></i>
                    </>
                  );
                })()
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

// Helper function to get vibrant colors (no grey) with adjacent color prevention
function getVibrantColor(index: number, categoryName: string): string {
  // Vibrant color palette - no grey colors
  const vibrantColors = [
    '#FF6B6B', // Vibrant Red
    '#4ECDC4', // Vibrant Teal
    '#45B7D1', // Vibrant Blue
    '#FF69B4', // Vibrant Pink
    '#32CD32', // Vibrant Green
    '#9370DB', // Vibrant Purple
    '#FFB347', // Vibrant Orange
    '#1E90FF', // Vibrant Sky Blue
    '#FF4500', // Vibrant Red Orange
    '#228B22', // Vibrant Forest Green
    '#DC143C', // Vibrant Crimson
    '#00CED1', // Vibrant Dark Turquoise
    '#FF8C00', // Vibrant Dark Orange
    '#FFD700', // Vibrant Gold
    '#20B2AA', // Vibrant Light Sea Green
    '#8A2BE2', // Vibrant Blue Violet
    '#FF1493', // Vibrant Deep Pink
    '#00FF7F', // Vibrant Spring Green
    '#FF6347', // Vibrant Tomato
    '#4169E1', // Vibrant Royal Blue
    '#F0E68C', // Vibrant Khaki
    '#DA70D6', // Vibrant Orchid
    '#87CEEB', // Vibrant Sky Blue
    '#FFA500'  // Vibrant Orange
  ];

  // Ensure no adjacent cards have the same color by using a pattern
  // that distributes colors evenly across the grid
  const colorIndex = (index * 7) % vibrantColors.length;
  return vibrantColors[colorIndex];
}

// Helper function to get FontAwesome icons based on category name or fallback
function getCategoryIcon(categoryName: string, index: number): string {
  // Direct mapping for category names to FontAwesome icons
  const iconMapping: { [key: string]: string } = {
    'Electronics': 'fas fa-laptop',
    'Electronics & Gadgets': 'fas fa-laptop',
    'Fashion': 'fas fa-tshirt',
    'Fashion & Clothing': 'fas fa-tshirt',
    'Home & Kitchen': 'fas fa-home',
    'Health & Beauty': 'fas fa-heart',
    'Sports & Fitness': 'fas fa-dumbbell',
    'Books & Education': 'fas fa-book',
    'Toys & Games': 'fas fa-gamepad',
    'Automotive': 'fas fa-car',
    'Baby & Kids': 'fas fa-baby',
    'Pet Supplies': 'fas fa-paw',
    'Food & Beverages': 'fas fa-utensils',
    'Jewelry & Watches': 'fas fa-gem',
    'Music & Instruments': 'fas fa-music',
    'Office Supplies': 'fas fa-briefcase',
    'Outdoor & Recreation': 'fas fa-mountain',
    'Arts & Crafts': 'fas fa-palette',
    'Tools & Hardware': 'fas fa-tools',
    'Photography': 'fas fa-camera',
    'Kitchen & Dining': 'fas fa-blender',
    'Furniture': 'fas fa-couch',
    'Lighting': 'fas fa-lightbulb',
    'Cleaning Supplies': 'fas fa-broom',
    'Party Supplies': 'fas fa-birthday-cake',
    'Collectibles': 'fas fa-trophy',
    'Industrial & Scientific': 'fas fa-flask',
    'Travel & Luggage': 'fas fa-suitcase-rolling',
    'Apps & AI Apps': 'fas fa-robot',
    'AI Apps & Services': 'fas fa-robot',
    'AI & Productivity': 'fas fa-robot',
    'Services': 'fas fa-cogs',
    'Digital Services': 'fas fa-laptop-code',
    'Financial Services': 'fas fa-dollar-sign',
    'Garden & Outdoor': 'fas fa-seedling',
    'Mystery Box': 'fas fa-gift',
    'Curated Picks': 'fas fa-star'
  };

  // Check for exact match first
  if (iconMapping[categoryName]) {
    return iconMapping[categoryName];
  }

  // Check for partial matches
  const name = categoryName.toLowerCase();
  if (name.includes('electronic') || name.includes('gadget') || name.includes('tech')) return 'fas fa-laptop';
  if (name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) return 'fas fa-tshirt';
  if (name.includes('home') || name.includes('kitchen') || name.includes('house')) return 'fas fa-home';
  if (name.includes('health') || name.includes('beauty') || name.includes('cosmetic')) return 'fas fa-heart';
  if (name.includes('sport') || name.includes('fitness') || name.includes('gym')) return 'fas fa-dumbbell';
  if (name.includes('book') || name.includes('education') || name.includes('learn')) return 'fas fa-book';
  if (name.includes('toy') || name.includes('game') || name.includes('play')) return 'fas fa-gamepad';
  if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) return 'fas fa-car';
  if (name.includes('baby') || name.includes('kid') || name.includes('child')) return 'fas fa-baby';
  if (name.includes('pet') || name.includes('animal') || name.includes('dog') || name.includes('cat')) return 'fas fa-paw';
  if (name.includes('food') || name.includes('beverage') || name.includes('drink')) return 'fas fa-utensils';
  if (name.includes('jewelry') || name.includes('watch') || name.includes('accessory')) return 'fas fa-gem';
  if (name.includes('music') || name.includes('instrument') || name.includes('audio')) return 'fas fa-music';
  if (name.includes('office') || name.includes('supplies') || name.includes('stationery')) return 'fas fa-briefcase';
  if (name.includes('outdoor') || name.includes('recreation') || name.includes('camping')) return 'fas fa-mountain';
  if (name.includes('art') || name.includes('craft') || name.includes('creative')) return 'fas fa-palette';
  if (name.includes('tool') || name.includes('hardware') || name.includes('repair')) return 'fas fa-tools';
  if (name.includes('photo') || name.includes('camera') || name.includes('picture')) return 'fas fa-camera';
  if (name.includes('furniture') || name.includes('chair') || name.includes('table')) return 'fas fa-couch';
  if (name.includes('light') || name.includes('lamp') || name.includes('bulb')) return 'fas fa-lightbulb';
  if (name.includes('clean') || name.includes('wash') || name.includes('soap')) return 'fas fa-broom';
  if (name.includes('party') || name.includes('celebration') || name.includes('event')) return 'fas fa-birthday-cake';
  if (name.includes('collect') || name.includes('rare') || name.includes('vintage')) return 'fas fa-trophy';
  if (name.includes('travel') || name.includes('luggage') || name.includes('trip')) return 'fas fa-suitcase-rolling';
  if (name.includes('app') || name.includes('ai') || name.includes('software')) return 'fas fa-robot';
  if (name.includes('service') || name.includes('digital') || name.includes('online')) return 'fas fa-cogs';
  if (name.includes('garden') || name.includes('plant') || name.includes('seed')) return 'fas fa-seedling';
  if (name.includes('mystery') || name.includes('surprise') || name.includes('box')) return 'fas fa-gift';
  if (name.includes('pick') || name.includes('curated') || name.includes('featured')) return 'fas fa-star';

  // Fallback to default icons
  const defaultIcons = [
    'fas fa-laptop', 'fas fa-tshirt', 'fas fa-home', 'fas fa-heart', 'fas fa-dumbbell', 'fas fa-book',
    'fas fa-gamepad', 'fas fa-car', 'fas fa-suitcase-rolling', 'fas fa-paw', 'fas fa-briefcase', 'fas fa-seedling',
    'fas fa-baby', 'fas fa-music', 'fas fa-palette', 'fas fa-utensils', 'fas fa-gem', 'fas fa-camera'
  ];
  return defaultIcons[index % defaultIcons.length];
}

// Helper function to get default icons if not provided by API (kept for backward compatibility)
function getDefaultIcon(index: number): string {
  return getCategoryIcon('', index);
}
