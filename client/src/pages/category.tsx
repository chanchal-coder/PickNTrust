import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import UniversalFilterSidebar from '@/components/UniversalFilterSidebar';
import { useToast } from '@/hooks/use-toast';

// Route params interface
interface CategoryRouteParams {
  category?: string;
}
import ScrollNavigation from "@/components/scroll-navigation";
import CategoryNavigation from "@/components/category-navigation";
import PageBanner from '@/components/PageBanner';
import WidgetRenderer from '@/components/WidgetRenderer';
import AmazonProductCard from "@/components/amazon-product-card";
import { BundleProductCard } from "@/components/BundleProductCard";
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import { 
  CurrencyType, 
  convertPrice, 
  getCurrencySymbol, 
  formatPriceWithConversion 
} from '@/utils/currencyConversion';
import { inferGender } from "@/utils/gender";

// Universal Subcategories Component - Works for any category
function UniversalSubcategoriesSection({ categoryName }: { categoryName: string }) {
  // Fetch subcategories directly for the current category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['/api/categories/subcategories', categoryName],
    queryFn: async () => {
      const url = `/api/categories/subcategories?parent=${encodeURIComponent(categoryName)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(categoryName?.trim()),
  });

  // Don't render if no subcategories
  if (!Array.isArray(subcategories) || subcategories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 bg-clip-text text-transparent mb-4">
                  {categoryName} Categories
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Explore our collection of {categoryName.toLowerCase()} options
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {subcategories.map((subcategory: any) => (
                  <a 
                    key={subcategory.id}
                    href={`/category/${encodeURIComponent(subcategory.name)}`}
                    className="group block"
                  >
                    <div 
                      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 text-center h-32 sm:h-36 flex flex-col justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${subcategory.color || '#6366F1'}CC, ${subcategory.color || '#6366F1'}FF)`
                      }}
                    >
                      <h3 className="text-white font-bold text-sm sm:text-base mb-1">{subcategory.name}</h3>
                      <p className="text-white/80 text-xs">
                        {(() => {
                          const desc = (subcategory.description || '').trim();
                          const isService = Boolean(subcategory.isForServices);
                          const isAIApp = Boolean(subcategory.isForAIApps);
                          if (desc) return desc;
                          if (isService) return `Professional services for ${subcategory.name}`;
                          if (isAIApp) return `AI apps and tools for ${subcategory.name}`;
                          return `Products and tools for ${subcategory.name}`;
                        })()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
        </div>
      </section>
  );
}

interface Product {
  id: number | string;
  name: string;
  description?: string;
  price?: string | number;
  originalPrice?: string | number | null;
  currency?: string;
  imageUrl?: string;
  image_url?: string;
  affiliateUrl?: string;
  affiliate_url?: string;
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  affiliate_network?: string;
  affiliate_tag_applied?: number;
  original_url?: string;
  category?: string;
  subcategory?: string;
  gender?: string | null;
  rating?: string | number;
  reviewCount?: number | string;
  discount?: number | string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | string | null;
  displayPages?: string[];
  createdAt?: Date | string | null;
  hasLimitedOffer?: boolean | number;
  limitedOfferText?: string;
  content_type?: string;
  source?: string;
  networkBadge?: string;
  // Service specific fields
  isService?: boolean;
  isAIApp?: boolean;
  pricingType?: string;
  monthlyPrice?: string | number;
  yearlyPrice?: string | number;
  isFree?: boolean;
  priceDescription?: string;
  // Bundle fields
  messageGroupId?: string;
  productSequence?: string | number;
  totalInGroup?: string | number;
  sourceMetadata?: any;
  // Telegram fields
  telegramMessageId?: number;
  telegramChannelId?: number;
  clickCount?: number;
  conversionCount?: number;
  processing_status?: string;
  expiresAt?: number;
  // Alternative sources
  alternativeSources?: Array<{
    network: string;
    price?: string | number;
    originalPrice?: string | number;
    url: string;
    commission: number;
  }>;
  // Commission info
  commissionRate?: number;
  // Additional fields for compatibility
  [key: string]: any;
}

const formatProductPrice = (price: string | number, productCurrency?: string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return formatCurrencyPrice(numPrice, productCurrency as any);
};

// Network display name mapping for consistent UI
const getNetworkDisplayName = (networkSource: string): string => {
  const networkMap: { [key: string]: string } = {
    'amazon': 'Prime Picks',
    'main': 'Global Picks',
    'loot_box': 'Loot Box',
    'cuelinks': 'Cue Picks',
    'value_picks': 'Value Picks',
    'click_picks': 'Click Picks',
    'global_picks': 'Global Picks',
    'dealshub': 'Deals Hub',
    'telegram-prime-picks': 'Prime Picks',
    'prime-picks-test': 'Prime Picks',
    'cue-picks-test': 'Cue Picks',
    'wholesale': 'Wholesale',
    'retail': 'Retail'
  };
  
  // Return mapped name or format the original (capitalize and replace underscores/hyphens)
  return networkMap[networkSource.toLowerCase()] || 
         networkSource.split(/[-_]/).map(word => 
           word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
         ).join(' ');
};

// All currency conversion utilities are now imported from utils/currencyConversion.ts

export default function CategoryPage() {
  const { category } = useParams<CategoryRouteParams>();
  const decodedCategory = category ? decodeURIComponent(category) : '';
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [location] = useLocation();
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Scroll to top when component mounts or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [convertPrices, setConvertPrices] = useState(false);
  const [priceRange, setPriceRange] = useState('all');
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  // Detect gender variants available in products for conditional rendering
  // (Declared after products query to avoid referencing before initialization)

  // Fetch products from all networks for this category using real-time endpoint
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products/category', category, 'all', selectedGender],
    queryFn: async () => {
      const baseUrl = `/api/products/category/${encodeURIComponent(category || '')}?page=all`;
      const url = selectedGender && selectedGender !== 'all'
        ? `${baseUrl}&gender=${encodeURIComponent(selectedGender)}`
        : baseUrl;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    enabled: !!category,
  });

  // Infer and normalize gender variants available in products for conditional rendering
  const availableGenders = useMemo<string[]>(() => {
    const set = new Set<string>();
    (allProducts as any[]).forEach((p: any) => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  }, [allProducts]);
  const hasGenderVariants = useMemo(() => availableGenders.length > 0, [availableGenders]);

  // Read gender from query param and normalize common→unisex
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const g = (params.get('gender') || '').toLowerCase();
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized || 'all');
  }, [category, location]);

  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : `/category/${encodeURIComponent(category || '')}`;
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Fetch subcategories for current category to decide rendering behavior
  const { data: subcategoriesForCurrent = [] } = useQuery({
    queryKey: ['/api/categories/subcategories', decodedCategory],
    queryFn: async () => {
      const url = `/api/categories/subcategories?parent=${encodeURIComponent(decodedCategory)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(decodedCategory?.trim()),
  });

  const hasSubcategories = Array.isArray(subcategoriesForCurrent) && subcategoriesForCurrent.length > 0;

  // Filter and sort products based on user selections
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    
    // Filter by network
    if (selectedNetworks && selectedNetworks.length > 0) {
      filtered = filtered.filter(product => selectedNetworks.includes(product.source));
    } else if (selectedNetwork !== 'all') {
      filtered = filtered.filter(product => product.source === selectedNetwork);
    }
    
    // Filter by currency (only in filter mode, not conversion mode)
    if (selectedCurrency !== 'all' && !convertPrices) {
      filtered = filtered.filter(product => product.currency === selectedCurrency);
    }
    
    // Filter by price range
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price.toString().replace(/[^0-9.]/g, ''));
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }
    
    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.toString().replace(/[^0-9.]/g, ''));
          const priceB = parseFloat(b.price.toString().replace(/[^0-9.]/g, ''));
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.toString().replace(/[^0-9.]/g, ''));
          const priceB = parseFloat(b.price.toString().replace(/[^0-9.]/g, ''));
          return priceB - priceA;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default: // relevance
        // Keep original order or sort by a relevance score
        break;
    }
    
    return filtered;
  }, [allProducts, selectedNetwork, sortBy, selectedCurrency, convertPrices, priceRange]);

  // Get unique networks from products
  const availableNetworks = useMemo<string[]>(() => {
    const networks = new Set<string>(
      (allProducts as any[]).map((product: any) => String(product.source || 'main'))
    );
    return Array.from(networks.values());
  }, [allProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-top" className="w-full" />
        <PageBanner page="categories" overrideLinkUrl={`${typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/category/${encodeURIComponent(category || '')}`}`} />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-bottom" className="w-full" />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-top" className="w-full" />
        <PageBanner page="categories" overrideLinkUrl={`${typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/category/${encodeURIComponent(category || '')}`}`} />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-bottom" className="w-full" />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Category Not Found</h2>
            <p className="text-gray-500">Please select a valid category.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UniversalPageLayout 
      pageId="category"
      enableContentOverlays={false}
      enableFloatingOverlays={false}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-top" className="w-full" />
        <PageBanner page="categories" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'categories'} position="header-bottom" className="w-full" />
      <div className="header-spacing">
      
      <CategoryNavigation currentCategory={category || ''} />

      {/* Show subcategory cards for parent categories */}
      <UniversalSubcategoriesSection categoryName={decodedCategory} />
      
      {/* Only show product filters and grid when there are no subcategories */}
  {!hasSubcategories && (
  <section className="py-16">
    <div className="max-w-7xl mx-auto pl-[1px] pr-4 sm:pr-6 lg:pr-8">
      {/* Compact Filter Toolbar (hidden; filters moved to left sidebar) */}
      <div className="hidden">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Gender Group - shown only when products have gender variants */}
          {hasGenderVariants && (
            <div className="relative flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <i className="fas fa-venus-mars text-pink-500 text-sm"></i>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
              </div>
              <div className="flex items-center gap-2">
                {availableGenders.map((key) => {
                  const labelMap: Record<string,string> = {
                    all: 'All', men: 'Men', women: 'Women', boy: 'Boy', girl: 'Girl', kids: 'Kids', unisex: 'Unisex'
                  };
                  const isActive = (selectedGender || 'all') === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleGenderChange(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {labelMap[key] || key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Filter Section */}
          <div className="flex flex-nowrap gap-3 items-center flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pr-4 pl-1 pb-1 min-w-0">
            {/* Network Filter */}
            <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                <i className="fas fa-network-wired text-blue-500 text-sm"></i>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Network</label>
              </div>
              <div className="relative">
                <select 
                  value={selectedNetwork} 
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[120px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                >
                  <option value="all">All Networks</option>
                  {availableNetworks.map((network: string) => (
                    <option key={String(network)} value={String(network)}>
                      {getNetworkDisplayName(network)}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                <i className="fas fa-sort text-green-500 text-sm"></i>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort</label>
              </div>
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[130px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="discount">Best Discount</option>
                </select>
                <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
              </div>
            </div>
            
            {/* Currency Filter */}
            <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                <i className="fas fa-coins text-purple-500 text-sm"></i>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Currency</label>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select 
                    value={selectedCurrency} 
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[100px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                  >
                    <option value="all">All Currencies</option>
                    <option value="INR">₹ Indian Rupee</option>
                    <option value="USD">$ US Dollar</option>
                    <option value="EUR">€ Euro</option>
                    <option value="GBP">£ British Pound</option>
                  </select>
                  <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
                </div>
                {selectedCurrency !== 'all' && (
                  <button
                    onClick={() => setConvertPrices(!convertPrices)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      convertPrices 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    } hover:scale-105`}
                  >
                    <i className="fas fa-exchange-alt text-xs"></i>
                    <span>{convertPrices ? 'Converting' : 'Convert All'}</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                <i className="fas fa-tag text-orange-500 text-sm"></i>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Price</label>
              </div>
              <div className="relative">
                <select 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[150px] appearance-none pr-8 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                >
                  <option value="all">All Prices</option>
                  {selectedCurrency === 'USD' ? (
                    <>
                      <option value="0-25">Under $25</option>
                      <option value="25-100">$25 - $100</option>
                      <option value="100-500">$100 - $500</option>
                      <option value="500">Above $500</option>
                    </>
                  ) : selectedCurrency === 'EUR' ? (
                    <>
                      <option value="0-20">Under €20</option>
                      <option value="20-100">€20 - €100</option>
                      <option value="100-400">€100 - €400</option>
                      <option value="400">Above €400</option>
                    </>
                  ) : selectedCurrency === 'GBP' ? (
                    <>
                      <option value="0-20">Under £20</option>
                      <option value="20-100">£20 - £100</option>
                      <option value="100-400">£100 - £400</option>
                      <option value="400">Above £400</option>
                    </>
                  ) : (
                    <>
                      <option value="0-1000">Under ₹1,000</option>
                      <option value="1000-5000">₹1,000 - ₹5,000</option>
                      <option value="5000-20000">₹5,000 - ₹20,000</option>
                      <option value="20000">Above ₹20,000</option>
                    </>
                  )}
                </select>
                <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
              </div>
            </div>
            {/* Spacer to prevent right-edge clipping of last filter */}
            <div className="w-6 flex-shrink-0" aria-hidden="true"></div>
          </div>
          
          {/* Clear Filters & Results Count */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Clear Filters Button */}
            {(selectedNetwork !== 'all' || sortBy !== 'relevance' || selectedCurrency !== 'all' || convertPrices || priceRange !== 'all') && (
              <button
                onClick={() => {
                  setSelectedNetwork('all');
                  setSortBy('relevance');
                  setSelectedCurrency('all');
                  setConvertPrices(false);
                  setPriceRange('all');
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <i className="fas fa-times text-sm"></i>
                <span className="text-sm font-bold">Clear Filters</span>
              </button>
            )}
            
            {/* Results Count */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-md">
              <i className="fas fa-search text-sm"></i>
              <span className="text-sm font-bold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Legacy mobile filter bar removed; compact toolbar above covers all viewports */}
          <div className="hidden">
            <div className="flex items-center gap-3">
              {/* Filter Section */}
              <div className="flex flex-nowrap gap-3 items-center flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pr-16 pl-1 pb-3 min-w-0">
                {/* Network Filter */}
                <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-network-wired text-blue-500 text-sm"></i>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Network</label>
                  </div>
                  <div className="relative">
                    <select 
                      value={selectedNetwork} 
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[120px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                    >
                      <option value="all">All Networks</option>
                      {availableNetworks.map((network: string) => (
                        <option key={String(network)} value={String(network)}>
                          {getNetworkDisplayName(network)}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
                  </div>
                </div>
                
                {/* Sort Filter */}
                <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-sort text-green-500 text-sm"></i>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort</label>
                  </div>
                  <div className="relative">
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[130px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest First</option>
                      <option value="discount">Best Discount</option>
                    </select>
                    <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
                  </div>
                </div>
                
                {/* Currency Filter */}
                <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-coins text-purple-500 text-sm"></i>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Currency</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select 
                        value={selectedCurrency} 
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[100px] appearance-none pr-7 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                      >
                        <option value="all">All Currencies</option>
                        <option value="INR">₹ Indian Rupee</option>
                        <option value="USD">$ US Dollar</option>
                        <option value="EUR">€ Euro</option>
                        <option value="GBP">£ British Pound</option>
                      </select>
                      <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
                    </div>
                    {selectedCurrency !== 'all' && (
                      <button
                        onClick={() => setConvertPrices(!convertPrices)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                          convertPrices 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        } hover:scale-105`}
                      >
                        <i className="fas fa-exchange-alt text-xs"></i>
                        <span>{convertPrices ? 'Converting' : 'Convert All'}</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div className="relative flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-tag text-orange-500 text-sm"></i>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Price</label>
                  </div>
                  <div className="relative">
                    <select 
                      value={priceRange} 
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-w-[150px] appearance-none pr-8 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                    >
                      <option value="all">All Prices</option>
                      {selectedCurrency === 'USD' ? (
                        <>
                          <option value="0-25">Under $25</option>
                          <option value="25-100">$25 - $100</option>
                          <option value="100-500">$100 - $500</option>
                          <option value="500">Above $500</option>
                        </>
                      ) : selectedCurrency === 'EUR' ? (
                        <>
                          <option value="0-20">Under €20</option>
                          <option value="20-100">€20 - €100</option>
                          <option value="100-400">€100 - €400</option>
                          <option value="400">Above €400</option>
                        </>
                      ) : selectedCurrency === 'GBP' ? (
                        <>
                          <option value="0-20">Under £20</option>
                          <option value="20-100">£20 - £100</option>
                          <option value="100-400">£100 - £400</option>
                          <option value="400">Above £400</option>
                        </>
                      ) : (
                        <>
                          <option value="0-1000">Under ₹1,000</option>
                          <option value="1000-5000">₹1,000 - ₹5,000</option>
                          <option value="5000-20000">₹5,000 - ₹20,000</option>
                          <option value="20000">Above ₹20,000</option>
                        </>
                      )}
                    </select>
                    <i className="fas fa-chevron-down pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 text-xs"></i>
                  </div>
                </div>
                {/* Spacer to prevent right-edge clipping of last filter */}
                <div className="w-12 flex-shrink-0" aria-hidden="true"></div>
              </div>
              
              {/* Clear Filters & Results Count */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {/* Clear Filters Button */}
                {(selectedNetwork !== 'all' || sortBy !== 'relevance' || selectedCurrency !== 'all' || convertPrices || priceRange !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedNetwork('all');
                      setSortBy('relevance');
                      setSelectedCurrency('all');
                      setConvertPrices(false);
                      setPriceRange('all');
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <i className="fas fa-times text-sm"></i>
                    <span className="text-sm font-bold">Clear Filters</span>
                  </button>
                )}
                
                {/* Results Count */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl shadow-md">
                  <i className="fas fa-search text-sm"></i>
                  <span className="text-sm font-bold">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Grid layout with left-side sidebar on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left-side Filter Sidebar on desktop */}
            <div className="lg:col-span-3 hidden lg:block">
              <UniversalFilterSidebar
                showNetworks={true}
                categorySelectionMode="single"
                // currency & price
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                convertPrices={convertPrices}
                setConvertPrices={setConvertPrices}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                // gender
                availableGenders={availableGenders}
                selectedGender={selectedGender}
                setSelectedGender={handleGenderChange}
                // networks
                availableNetworks={availableNetworks}
                selectedNetworks={selectedNetworks}
                setSelectedNetworks={setSelectedNetworks}
                // results & clear
                resultsCount={filteredProducts.length}
                onClearFilters={() => {
                  setSelectedNetwork('all');
                  setSortBy('relevance');
                  setSelectedCurrency('all');
                  setConvertPrices(false);
                  setPriceRange('all');
                  setSelectedNetworks([]);
                }}
                className="sticky top-24"
              />
            </div>
            {/* Products Grid */}
            <div className="lg:col-span-9">
            {filteredProducts && filteredProducts.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {filteredProducts.map((product: any) => {
                   // Check if product is part of a bundle (multiple products)
                   const isBundle = product.totalInGroup && Number(product.totalInGroup) > 1;
                   
                   if (isBundle) {
                     return (
                       <BundleProductCard 
                         key={product.id} 
                         product={product} 
                         source="category" 
                       />
                     );
                   } else {
                   return (
                       <AmazonProductCard 
                         key={product.id} 
                         product={{
                           id: product.id,
                           name: product.name || product.title,
                           description: product.description || '',
                           price: product.price,
                           originalPrice: product.originalPrice || product.original_price,
                           currency: product.currency || 'INR',
                           imageUrl: product.imageUrl || product.image_url,
                           affiliateUrl: product.affiliateUrl || product.affiliate_url,
                           category: product.category,
                           rating: product.rating,
                           reviewCount: product.reviewCount || product.review_count,
                           discount: product.discount,
                           isNew: product.isNew,
                           isFeatured: product.isFeatured,
                           affiliate_network: product.affiliate_network || product.networkBadge,
                           networkBadge: product.networkBadge,
                           affiliateNetwork: product.affiliateNetwork || product.affiliateNetworkName || 'Category Network',
                           // Pricing fields with snake_case fallbacks
                           pricingType: product.pricingType || product.pricing_type,
                           monthlyPrice: product.monthlyPrice ?? product.monthly_price,
                           yearlyPrice: product.yearlyPrice ?? product.yearly_price,
                           isFree: product.isFree ?? product.is_free,
                           priceDescription: product.priceDescription ?? product.price_description,
                           sourceType: 'category',
                           source: 'category',
                           displayPages: ['category']
                         }}
                       />
                     );
                   }
                 })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-search text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No Products Found</h3>
                <p className="text-gray-500">We're working on adding more products to this category.</p>
              </div>
            )}
            </div>
            
          </div>
        </div>
      </section>
      )}
      
      {/* Related Categories Section - Hybrid Approach */}
      <section className="py-12 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-link"></i> Explore Related Categories
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover more amazing products in these related categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Static related categories - In real implementation, these would come from API */}
            {[
              { name: 'Electronics', icon: 'fas fa-laptop', color: 'from-blue-500 to-cyan-500', count: 45 },
              { name: 'Fashion & Lifestyle', icon: 'fas fa-tshirt', color: 'from-pink-500 to-rose-500', count: 32 },
              { name: 'Home Decor', icon: 'fas fa-home', color: 'from-green-500 to-emerald-500', count: 28 },
              { name: 'Kitchen Appliances', icon: 'fas fa-blender', color: 'from-orange-500 to-amber-500', count: 15 },
              { name: 'Books & Media', icon: 'fas fa-book', color: 'from-purple-500 to-violet-500', count: 22 },
              { name: 'Sports & Fitness', icon: 'fas fa-dumbbell', color: 'from-red-500 to-pink-500', count: 18 }
            ].map((relatedCategory, index) => (
              <Link
                key={index}
                href={`/category/${encodeURIComponent(relatedCategory.name)}`}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300 block"
                onClick={() => {
                  // Scroll to top immediately
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className={`bg-gradient-to-br ${relatedCategory.color} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className="text-center">
                    <div className="mb-3">
                      <i className={`${relatedCategory.icon} text-2xl drop-shadow-lg`}></i>
                    </div>
                    <h3 className="font-bold text-sm mb-1 leading-tight">
                      {relatedCategory.name}
                    </h3>
                    <p className="text-white/90 text-xs">
                      {relatedCategory.count} products
                    </p>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* View All Categories Button */}
          <div className="text-center mt-8">
            <Link 
              href="/"
              onClick={() => {
                  // Scroll to top immediately
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <i className="fas fa-th-large"></i>
              View All Categories
            </Link>
          </div>
        </div>
      </section>
      </div>
      {/* Close outer min-h-screen container */}
      </div>
    </UniversalPageLayout>
  );
}
