// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ScrollNavigation from '@/components/scroll-navigation';
import PageVideosSection from '@/components/PageVideosSection';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import PageBanner from '@/components/PageBanner';
import WidgetRenderer from '@/components/WidgetRenderer';

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
  const [, setLocation] = useLocation();
  const [selectedParent, setSelectedParent] = useState<string>('');
  
  // Fetch subcategories when a parent category is selected
  const { data: subcategories = [], isFetching: fetchingSubcats } = useQuery({
    queryKey: ['/api/categories/subcategories', selectedParent],
    queryFn: async () => {
      const parent = selectedParent?.trim();
      if (!parent) return [];
      try {
        const res = await fetch(`/api/categories/subcategories?parent=${encodeURIComponent(parent)}`);
        if (!res.ok) return [];
        return res.json();
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        return [];
      }
    },
    enabled: Boolean(selectedParent?.trim()),
    staleTime: 5 * 60 * 1000,
  });
  
  // Vibrant color palette without grey colors - now using database colors
  const vibrantColorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#32CD32',
    '#9370DB', '#FFB347', '#1E90FF', '#FF4500', '#228B22',
    '#DC143C', '#00CED1', '#FF8C00', '#FFD700', '#20B2AA',
    '#8A2BE2', '#FF1493', '#00FF7F', '#FF6347', '#4169E1'
  ];

  // Defensive: treat low-saturation hex colors as grey and ignore them
  const looksGrey = (hex?: string) => {
    const s = String(hex || '').trim().toLowerCase();
    if (!s.startsWith('#') || (s.length !== 7 && s.length !== 4)) return false;
    const h = s.slice(1);
    const to255 = (i: number) => {
      if (s.length === 4) {
        const c = h[i];
        return parseInt(c + c, 16);
      }
      return parseInt(h.slice(i * 2, i * 2 + 2), 16);
    };
    const r = to255(0), g = to255(1), b = to255(2);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max; // 0..1
    return sat < 0.15 && max < 235; // low saturation, avoid near-white
  };

  // Sanitize icons: ensure FontAwesome, fallback to fas fa-tag
  const sanitizeIcon = (icon?: string) => {
    const s = String(icon || '').trim();
    if (!s || s.startsWith('mdi-') || !s.includes('fa-')) return 'fas fa-tag';
    return s;
  };

  // Function to get vibrant category color
  const getVibrantCategoryColor = (index: number, categoryColor?: string) => {
    // Use database color only if it's not greyish
    if (categoryColor && categoryColor.startsWith('#') && !looksGrey(categoryColor)) {
      return categoryColor;
    }
    // Fallback to vibrant palette
    return vibrantColorPalette[index % vibrantColorPalette.length];
  };

  // Fetch categories from API with fallback: if browse returns empty, use DB categories
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ['/api/categories/browse-or-db', selectedType],
    queryFn: async (): Promise<Category[]> => {
      try {
        // Primary: browse endpoint (may be empty if unified_content has no rows)
        let browseUrl = '/api/categories/browse';
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
          browseUrl += '?' + params.toString();
        }

        const resBrowse = await fetch(browseUrl);
        const dataBrowse = resBrowse.ok ? await resBrowse.json() : [];

        // If browse has categories, use it
        if (Array.isArray(dataBrowse) && dataBrowse.length > 0) {
          return dataBrowse as Category[];
        }

        // Fallback: always show admin-managed DB categories (parents only)
        const resAll = await fetch('/api/categories');
        if (!resAll.ok) return [];
        const all = await resAll.json();
        const parents = Array.isArray(all) ? all.filter((c: any) => !c.parentId) : [];

        // Optionally filter parents by selected type using flags
        const typedParents = parents.filter((c: any) => {
          if (apiType === 'products') return c.isForProducts || (!c.isForServices && !c.isForAIApps);
          if (apiType === 'services') return c.isForServices;
          if (apiType === 'aiapps') return c.isForAIApps;
          return true; // 'all'
        });

        return typedParents as Category[];
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
    // Backend does not provide featured/auto flags here; keep empty
    featured: [],
    // Infer type from backend booleans: isForProducts, isForServices, isForAIApps
    product: filteredCategories.filter(cat => (cat as any).isForProducts || (!((cat as any).isForServices) && !((cat as any).isForAIApps))),
    service: filteredCategories.filter(cat => (cat as any).isForServices),
    app: filteredCategories.filter(cat => (cat as any).isForAIApps),
    'ai-app': filteredCategories.filter(cat => (cat as any).isForAIApps),
    auto: []
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
    withProducts: categories.filter(cat => (cat.total_products_count || 0) > 0).length,
    autoCreated: 0,
    featured: 0
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
    <UniversalPageLayout pageId="browse-categories">
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 page-container">
              <Header />
              {/* Header Top above dynamic banner */}
              <WidgetRenderer page={'browse-categories'} position="header-top" className="w-full" />
              <PageBanner page="browse-categories" />
              {/* Header Bottom below dynamic banner */}
              <WidgetRenderer page={'browse-categories'} position="header-bottom" className="w-full" />
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
      {/* Header Top above dynamic banner */}
      <WidgetRenderer page={'browse-categories'} position="header-top" className="w-full" />
      
      {/* Page Banner */}
      <PageBanner page="browse-categories" />
      {/* Header Bottom below dynamic banner */}
      <WidgetRenderer page={'browse-categories'} position="header-bottom" className="w-full" />
      
      <div>
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

          {/* Subcategories rail */}

          {/* Subcategories rail: appears when a parent category is selected */}
          {selectedParent && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedParent} Categories
                </h2>
                <button
                  onClick={() => setSelectedParent('')}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
              {fetchingSubcats ? (
                <div className="text-gray-500 dark:text-gray-400">Loading subcategories…</div>
              ) : Array.isArray(subcategories) && subcategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((sub: any) => (
                    <Link
                      key={sub.id || sub.name || String(sub)}
                      href={`/category/${encodeURIComponent(sub.name || String(sub))}`}
                      onClick={() => setSelectedParent('')}
                    >
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-600/10 text-green-700 dark:text-green-300 border border-green-600/30 hover:bg-green-600/20">
                        <i className="fas fa-tag text-xs"></i>
                        {sub.name || String(sub)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 dark:text-gray-400">No subcategories found.</span>
                  <button
                    onClick={() => setLocation(`/category/${encodeURIComponent(selectedParent)}`)}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    View {selectedParent} Products
                  </button>
                </div>
              )}
            </section>
          )}

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
                          <i className={`${sanitizeIcon(category.icon)} text-3xl text-white drop-shadow-lg`}></i>
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

                      {/* Removed product counts and action buttons to show only name and description */}
                      {/* (No counts, no Browse button, no View Subcategories button in card listing) */}
                      
                      {/* Removed Browse Button per requirement: show only name and description */}
                      
                      {/* Removed View Subcategories button in card listing */}
                      {/* Created info removed: field not provided by backend here */}
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
    </div>
  );
}