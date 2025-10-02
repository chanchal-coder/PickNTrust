// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ScrollNavigation from '@/components/scroll-navigation';
import PageVideosSection from '@/components/PageVideosSection';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import PageBanner from '@/components/PageBanner';

// Define Category type
interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  category_type?: string;
  is_featured?: boolean;
  is_active?: boolean;
  auto_created?: boolean;
  created_by_page?: string;
  total_products_count?: number;
  prime_picks_count?: number;
  click_picks_count?: number;
  cue_picks_count?: number;
  value_picks_count?: number;
  global_picks_count?: number;
  deals_hub_count?: number;
  loot_box_count?: number;
  apps_count?: number;
  top_picks_count?: number;
  services_count?: number;
  has_active_products?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export default function BrowseCategories() {
  const [selectedType, setSelectedType] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get('type') || '').toLowerCase();
      if (raw === 'products') return 'product';
      if (raw === 'services') return 'service';
      if (raw === 'apps') return 'app';
      if (raw === 'aiapps') return 'ai-app';
      if (raw === 'featured') return 'featured';
      if (raw === 'auto') return 'auto';
      if (raw === 'all') return 'all';
      return 'product';
    } catch {
      return 'product';
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Vibrant color palette without grey colors - now using database colors
  const vibrantColorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#32CD32',
    '#9370DB', '#FFB347', '#1E90FF', '#FF4500', '#228B22',
    '#DC143C', '#00CED1', '#FF8C00', '#FFD700', '#20B2AA',
    '#8A2BE2', '#FF1493', '#00FF7F', '#FF6347', '#4169E1'
  ];

  // Function to get vibrant category color
  const getVibrantCategoryColor = (index: number, categoryColor?: string) => {
    // Always use database color if available, otherwise use vibrant palette
    if (categoryColor && categoryColor.startsWith('#')) {
      return categoryColor;
    }
    // Fallback to vibrant palette
    return vibrantColorPalette[index % vibrantColorPalette.length];
  };

  // Fetch categories from API
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ['/api/categories/browse', selectedType],
    queryFn: async (): Promise<Category[]> => {
      try {
        let url = '/api/categories/browse';
        const params = new URLSearchParams();
        
        // Map UI selectedType to backend-supported type values
        const apiType =
          selectedType === 'product' ? 'products' :
          selectedType === 'service' ? 'services' :
          (selectedType === 'app' || selectedType === 'ai-app') ? 'aiapps' :
          'all';

        if (apiType !== 'all') {
          params.append('type', apiType);
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchQuery || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  // Group categories by type
  const groupedCategories = {
    featured: filteredCategories.filter(cat => cat.is_featured),
    product: filteredCategories.filter(cat => cat.category_type === 'product' || !cat.category_type),
    service: filteredCategories.filter(cat => cat.category_type === 'service'),
    app: filteredCategories.filter(cat => cat.category_type === 'app'),
    'ai-app': filteredCategories.filter(cat => cat.category_type === 'ai-app'),
    auto: filteredCategories.filter(cat => cat.auto_created)
  };

  // Get categories to display based on selected type
  const getCategoriesToDisplay = () => {
    if (selectedType === 'all') {
      return filteredCategories;
    }
    return groupedCategories[selectedType] || [];
  };

  const categoriesToDisplay = getCategoriesToDisplay();

  // Get category stats
  const categoryStats = {
    total: categories.length,
    withProducts: categories.filter(cat => cat.has_active_products).length,
    autoCreated: categories.filter(cat => cat.auto_created).length,
    featured: categories.filter(cat => cat.is_featured).length
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
    <UniversalPageLayout pageId="browse-categories">
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 page-container">
              <Header />
              <PageBanner page="browse-categories" />
              <div className="pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading categories...</p>
                  </div>
                </div>
              </div>
            </div>
    </UniversalPageLayout>
  );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 page-container">
      <Header />
      
      {/* Page Banner */}
      <PageBanner page="browse-categories" />
      
      {/* Categories Content Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header with Stats */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-folder-open"></i> Browse Categories
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Discover products, services, and apps organized by category
            </p>
            
            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{categoryStats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Categories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{categoryStats.withProducts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">With Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{categoryStats.autoCreated}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Auto-Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{categoryStats.featured}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Featured</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Category Type Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  <option value="featured">Featured ({groupedCategories.featured.length})</option>
                  <option value="product">Products ({groupedCategories.product.length})</option>
                  <option value="service">Services ({groupedCategories.service.length})</option>
                  <option value="app">Apps ({groupedCategories.app.length})</option>
                  <option value="ai-app">AI Apps ({groupedCategories['ai-app'].length})</option>
                  <option value="auto">Auto-Created ({groupedCategories.auto.length})</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Categories
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {categoriesToDisplay.length} categories
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          {categoriesToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoriesToDisplay.map((category: Category, index: number) => (
                <Link 
                  key={category.id}
                  href={`/category/${encodeURIComponent(category.name)}`}
                  className="group"
                  onClick={() => {
                    // Scroll to top when navigating to category
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 hover:border-green-500">
                    
                    {/* Category Header with Icon */}
                    <div 
                      className="relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${getVibrantCategoryColor(index, category.color)}CC, ${getVibrantCategoryColor(index, category.color)}FF)`,
                        boxShadow: `0 10px 25px ${getVibrantCategoryColor(index, category.color)}40`
                      }}
                    >
                      
                      {/* Category Icon */}
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <i className={`${category.icon || 'fas fa-tag'} text-3xl text-white drop-shadow-lg`}></i>
                        </div>
                        
                        {/* Category Type Badge */}
                        {category.category_type && (
                          <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                            {category.category_type === 'ai-app' ? 'AI App' : 
                             category.category_type.charAt(0).toUpperCase() + category.category_type.slice(1)}
                          </span>
                        )}
                        
                        {/* Auto-created badge */}
                        {category.auto_created && (
                          <span className="inline-block px-2 py-1 bg-yellow-500/20 text-white text-xs rounded-full ml-2">
                            Auto
                          </span>
                        )}
                        
                        {/* Featured badge */}
                        {category.is_featured && (
                          <span className="inline-block px-2 py-1 bg-red-500/20 text-white text-xs rounded-full ml-2">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* Product Counts */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total Products:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {category.total_products_count || 0}
                          </span>
                        </div>
                        
                        {/* Show breakdown if multiple sources */}
                        {(category.prime_picks_count || 0) + (category.click_picks_count || 0) + (category.loot_box_count || 0) + (category.apps_count || 0) + (category.services_count || 0) > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {category.prime_picks_count > 0 && <span className="mr-2">Prime: {category.prime_picks_count}</span>}
                            {category.click_picks_count > 0 && <span className="mr-2">Click: {category.click_picks_count}</span>}
                            {category.loot_box_count > 0 && (
                              <span className="mr-2 inline-flex items-center">
                                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                                Wholesale: {category.loot_box_count}
                              </span>
                            )}
                            {category.apps_count > 0 && <span className="mr-2">Apps: {category.apps_count}</span>}
                            {category.services_count > 0 && <span className="mr-2">Services: {category.services_count}</span>}
                            {category.top_picks_count > 0 && <span className="mr-2">Top: {category.top_picks_count}</span>}
                          </div>
                        )}
                      </div>

                      {/* Browse Button */}
                      <button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 border border-white/30 hover:border-white/50 shadow-lg">
                        <i className="fas fa-arrow-right mr-2"></i>
                        Browse Category
                      </button>
                      
                      {/* Created info */}
                      {category.created_by_page && (
                        <div className="mt-3 text-xs text-white/70 text-center">
                          Created by: {category.created_by_page}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4"><i className="fas fa-folder-open"></i></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery ? 
                  `No categories match "${searchQuery}". Try a different search term.` :
                  'No categories available for the selected type.'
                }
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories Videos Section */}
      <PageVideosSection 
        page="browse-categories" 
        title="Category Videos"
      />
      
      <ScrollNavigation />
    </div>
  );
}