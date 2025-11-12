// @ts-nocheck
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WidgetRenderer from '@/components/WidgetRenderer';
import SafeWidgetRenderer from '@/components/SafeWidgetRenderer';
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';


import { AnnouncementBanner } from "@/components/announcement-banner";
import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import AmazonProductCard from "@/components/amazon-product-card";

import { useToast } from '@/hooks/use-toast';
import useHasActiveWidgets from '@/hooks/useHasActiveWidgets';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inferGender } from "@/utils/gender";

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

// Value Picks page uses real data from the database via API endpoints
// Products are dynamically loaded based on the display_pages field in the database

export default function ValuePicks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // Price range label for UniversalFilterSidebar
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');
  // Maintain numeric bounds for filtering
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { data: hasWidgets } = useHasActiveWidgets('value-picks');

  // Optional currency state for universal sidebar (hidden on this page)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active' || window.location.hostname === 'localhost');
  }, []);

  const handleBulkDelete = async (deleteAll = false) => {
    const idsToDelete = deleteAll ? filteredProducts.map(p => p.id) : selectedProducts;
    
    if (idsToDelete.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select products to delete',
        variant: 'destructive',
      });
      return;
    }
    
    const confirmMessage = deleteAll 
      ? `Delete ALL ${filteredProducts.length} products?`
      : `Delete ${idsToDelete.length} selected products?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      for (const productId of idsToDelete) {
        await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'pickntrust2025' }),
        });
      }
      
      // Use proper cache invalidation instead of page reload
      import('@/utils/delete-utils').then(({ invalidateAllProductQueries }) => {
        invalidateAllProductQueries(queryClient);
      });
      
      // Invalidate current page queries
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/value-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/value-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: 'Products Deleted',
        description: `Successfully deleted ${idsToDelete.length} products`,
      });
      
      setBulkDeleteMode(false);
      setSelectedProducts([]);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete products',
        variant: 'destructive',
      });
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch products for Value Picks page
  const { data: allValueProducts = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['/api/products/page/value-picks', selectedCategory],
    queryFn: async (): Promise<Product[]> => {
      const url = selectedCategory 
        ? `/api/products/page/value-picks?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products/page/value-picks';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Value Picks products');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Fetch categories for Value Picks page
  const { data: availableCategories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories/page/value-picks'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/categories/page/value-picks');
      if (!response.ok) {
        throw new Error('Failed to fetch Value Picks categories');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Use shared, strict gender inference

  // Available genders from products (include umbrella kids when needed)
  const availableGenders: string[] = (() => {
    const set = new Set<string>();
    (allValueProducts as Product[]).forEach((p) => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  })();

  // Apply client-side filtering for price and rating
  const filteredProducts = allValueProducts.filter(product => {
    // Filter by price range
    const price = parseFloat(product.price);
    if (price < priceRange.min || price > priceRange.max) {
      return false;
    }

    // Filter by rating
    if (minRating > 0 && parseFloat(product.rating) < minRating) {
      return false;
    }

    // Gender filter
    if (selectedGender && selectedGender !== 'all') {
      const g = inferGender(product);
      if (selectedGender === 'kids') {
        if (!(g === 'boys' || g === 'girls' || g === 'kids')) return false;
      } else {
        if (g !== selectedGender) return false;
      }
    }

    return true;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Map label to numeric bounds and keep both in sync
  const getPriceBounds = (label: string): {min: number, max: number} => {
    if (!label || label === 'all') return { min: 0, max: Infinity };
    if (/^\d+-\d+$/.test(label)) {
      const [min, max] = label.split('-').map(v => parseFloat(v));
      return { min, max };
    }
    const min = parseFloat(label);
    return { min: isNaN(min) ? 0 : min, max: Infinity };
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({min, max});
    if (min === 0 && !isFinite(max)) setPriceRangeLabel('all');
    else if (isFinite(min) && isFinite(max)) setPriceRangeLabel(`${min}-${max}`);
    else if (isFinite(min) && !isFinite(max)) setPriceRangeLabel(`${min}+`);
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Sync numeric bounds whenever label changes
  useEffect(() => {
    const bounds = getPriceBounds(priceRangeLabel);
    setPriceRange(bounds);
  }, [priceRangeLabel]);

  // Read gender from query param and sync to state
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const g = (params.get('gender') || '').toLowerCase();
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized || 'all');
  }, [location]);

  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/value-picks';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error loading products",
        description: "Failed to load Value Picks products. Please try again.",
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  return (
    <UniversalPageLayout pageId="value-picks">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Top above dynamic banner */}
            <WidgetRenderer page={'value-picks'} position="header-top" className="w-full" />
            <AnnouncementBanner />
            {/* Page Banner Slider */}
            <PageBanner page="value-picks" />
            {/* Mobile Filters Drawer (below banner on mobile) */}
            <div className="md:hidden px-4 pt-3">
              <Button onClick={() => setFiltersOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                <i className="fas fa-sliders-h mr-2"/> Filters
              </Button>
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent side="left" className="w-[85vw] sm:w-[22rem]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <UniversalFilterSidebar
                      showNetworks={false}
                      showCurrency={false}
                      categorySelectionMode="single"
                      selectedCurrency={selectedCurrency}
                      setSelectedCurrency={setSelectedCurrency}
                      convertPrices={convertPrices}
                      setConvertPrices={setConvertPrices}
                      priceRange={priceRangeLabel}
                      setPriceRange={setPriceRangeLabel}
                      availableCategories={availableCategories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      availableGenders={availableGenders}
                      selectedGender={selectedGender}
                      setSelectedGender={handleGenderChange}
                      minRating={minRating}
                      setMinRating={handleRatingChange}
                      resultsCount={filteredProducts.length}
                      onClearFilters={() => {
                        setSelectedCategory('');
                        setPriceRangeLabel('all');
                        setSelectedGender('all');
                        setMinRating(0);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* Header Bottom below dynamic banner */}
            <WidgetRenderer page={'value-picks'} position="header-bottom" className="w-full" />
            
            <div className="header-spacing">
      
              {/* Main Content with Sidebar */}
              <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Sidebar (desktop only) */}
                <div className="hidden md:block">
                  <UniversalFilterSidebar
                    showNetworks={false}
                    showCurrency={false}
                    categorySelectionMode="single"
                    selectedCurrency={selectedCurrency}
                    setSelectedCurrency={setSelectedCurrency}
                    convertPrices={convertPrices}
                    setConvertPrices={setConvertPrices}
                    priceRange={priceRangeLabel}
                    setPriceRange={setPriceRangeLabel}
                    availableCategories={availableCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    availableGenders={availableGenders}
                    selectedGender={selectedGender}
                    setSelectedGender={handleGenderChange}
                    minRating={minRating}
                    setMinRating={handleRatingChange}
                    resultsCount={filteredProducts.length}
                    onClearFilters={() => {
                      setSelectedCategory('');
                      setPriceRangeLabel('all');
                      setSelectedGender('all');
                      setMinRating(0);
                    }}
                  />
                </div>
      
                {/* Products Grid */}
                <div className="flex-1 p-6">
                  {/* Product Grid Top Widgets */}
                  <SafeWidgetRenderer page={'value-picks'} position={'product-grid-top'} />
                  {hasWidgets && allValueProducts.length === 0 ? null : (
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Results ({filteredProducts.length})
                          </h2>
                          {/* Bulk Delete Icon - Admin Only */}
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                                className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Bulk delete options"
                              >
                                <i className="fas fa-trash text-sm" />
                              </button>
                              {bulkDeleteMode && (
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 shadow-sm">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedProducts.length} selected
                                  </span>
                                  <button
                                    onClick={() => handleBulkDelete(false)}
                                    disabled={selectedProducts.length === 0}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                  >
                                    Delete Selected
                                  </button>
                                  <button
                                    onClick={() => handleBulkDelete(true)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                  >
                                    Delete All
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBulkDeleteMode(false);
                                      setSelectedProducts([]);
                                    }}
                                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                  >
                                    <i className="fas fa-times" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {filteredProducts.length} of {allValueProducts.length} products
                        </div>
                      </div>
                    </div>
                  )}

                  {productsLoading ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Loading Value Picks...
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500">
                        Finding the best value products for you.
                      </p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    hasWidgets && allValueProducts.length === 0 ? null : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4"><i className="fas fa-search text-gray-400"></i></div>
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          {allValueProducts.length === 0 ? 'No Value Picks available' : 'No products found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-500">
                          {allValueProducts.length === 0 
                            ? 'Products will appear here when added to Value Picks via admin panel.' 
                            : 'Try adjusting your filters to see more results.'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="relative">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="relative">
                          {/* Checkbox overlay for bulk delete mode */}
                          {bulkDeleteMode && isAdmin && (
                            <div className="absolute top-2 right-2 z-20">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(String(product.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts(prev => [...prev, String(product.id)]);
                                  } else {
                                    setSelectedProducts(prev => prev.filter(id => id !== String(product.id)));
                                  }
                                }}
                                className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                              />
                            </div>
                          )}
                          <AmazonProductCard product={product} />
                        </div>
                      ))}
                      </div>
                      {/* Product Grid Bottom Widgets */}
                      <SafeWidgetRenderer page={'value-picks'} position={'product-grid-bottom'} />
                      {/* Overlay widgets mirroring Prime Picks placement */}
                      <WidgetRenderer page={'value-picks'} position="content-top" />
                      <WidgetRenderer page={'value-picks'} position="content-middle" />
                      <WidgetRenderer page={'value-picks'} position="content-bottom" />
                      <WidgetRenderer page={'value-picks'} position="floating-top-left" />
                      <WidgetRenderer page={'value-picks'} position="floating-top-right" />
                      <WidgetRenderer page={'value-picks'} position="floating-bottom-left" />
                      <WidgetRenderer page={'value-picks'} position="floating-bottom-right" />
                    </div>
                  )}
                </div>
          </div>
        </div>
      </div>
      
      {/* Value Picks Videos Section */}
      <PageVideosSection 
        page="value-picks" 
        title="Value Picks Videos"
      />
      
        <ScrollNavigation />
    </UniversalPageLayout>
  );
}