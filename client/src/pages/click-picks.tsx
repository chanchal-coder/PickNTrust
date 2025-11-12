import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Use canonical header widgets instead of direct Header
import WidgetRenderer from '@/components/WidgetRenderer';
import ScrollNavigation from "@/components/scroll-navigation";
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';
import { AnnouncementBanner } from "@/components/announcement-banner";
import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import AmazonProductCard from "@/components/amazon-product-card";

import { useToast } from '@/hooks/use-toast';
import useHasActiveWidgets from '@/hooks/useHasActiveWidgets';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import { useLocation } from "wouter";
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

// Click Picks page uses real data from the database via API endpoints
// Products are dynamically loaded based on the display_pages field in the database

export default function ClickPicks() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  const [priceRangeKey, setPriceRangeKey] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { data: hasWidgets } = useHasActiveWidgets('click-picks');

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active' || window.location.hostname === 'localhost' || window.location.hostname === 'pickntrust.com');
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
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/click-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/click-picks'] });
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

  // Fetch products for Click Picks page
  const { data: allClickProducts = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['/api/products/page/click-picks', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products/page/click-picks?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products/page/click-picks';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Click Picks products');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Fetch categories for Click Picks page
  const { data: availableCategories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories/page/click-picks'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/categories/page/click-picks');
      if (!response.ok) {
        throw new Error('Failed to fetch Click Picks categories');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Derive available genders from loaded products (aggregate Kids when boys/girls present)
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    (allClickProducts as Product[]).forEach((p) => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  }, [allClickProducts]);

  // Apply client-side filtering for gender, price and rating
  const filteredProducts = allClickProducts.filter(product => {
    // Gender filter (Kids umbrella includes boys/girls/kids)
    if (selectedGender && selectedGender !== 'all') {
      const g = inferGender(product);
      if (selectedGender === 'kids') {
        if (!(g === 'boys' || g === 'girls' || g === 'kids')) return false;
      } else {
        if (g !== selectedGender) return false;
      }
    }

    // Filter by price range
    const price = parseFloat(product.price);
    if (price < priceRange.min || price > priceRange.max) {
      return false;
    }

    // Filter by rating
    if (minRating > 0 && parseFloat(product.rating) < minRating) {
      return false;
    }

    return true;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Read gender from query param and sync to state (normalize common→unisex)
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const g = (params.get('gender') || '').toLowerCase();
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized || 'all');
  }, [location]);

  // Handle gender change and sync to URL
  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/click-picks';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  const mapPriceRangeKeyToBounds = (key: string): { min: number; max: number } => {
    switch (key) {
      case '0-500': return { min: 0, max: 500 };
      case '500-1000': return { min: 500, max: 1000 };
      case '1000-2500': return { min: 1000, max: 2500 };
      case '2500-5000': return { min: 2500, max: 5000 };
      case '5000': return { min: 5000, max: Infinity };
      case 'all':
      default: return { min: 0, max: Infinity };
    }
  };

  const handleSetPriceRangeKey = (key: string) => {
    setPriceRangeKey(key);
    setPriceRange(mapPriceRangeKeyToBounds(key));
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinRating(0);
    setSelectedGender('all');
    handleSetPriceRangeKey('all');
  };

  // Handle affiliate click tracking
  const handleAffiliateClick = async (productId: number, networkId: string, affiliateUrl: string) => {
    try {
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          tableName: 'click_picks_products',
          networkId,
          affiliateUrl
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error loading products",
        description: "Failed to load Click Picks products. Please try again.",
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  return (
    <UniversalPageLayout pageId="click-picks" enableContentOverlays={false} enableFloatingOverlays={false}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Top above dynamic banner */}
            <WidgetRenderer page={'click-picks'} position="header-top" className="w-full" />
            
            <AnnouncementBanner />
            
            {/* Page Banner Slider */}
            <PageBanner page="click-picks" />
            {/* Header Bottom below dynamic banner */}
            <WidgetRenderer page={'click-picks'} position="header-bottom" className="w-full" />
            <div className="header-spacing">
      
              {/* Main Content with Sidebar */}
              <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Filters Sidebar */}
                <UniversalFilterSidebar
                  showCurrency={false}
                  showNetworks={false}
                  showGender={true}
                  showPriceRange={true}
                  showCategories={true}
                  showRating={true}
                  showResultsCount={true}
                  showClearButton={true}
                  priceRange={priceRangeKey}
                  setPriceRange={handleSetPriceRangeKey}
                  categorySelectionMode="single"
                  availableCategories={availableCategories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  availableGenders={availableGenders}
                  selectedGender={selectedGender}
                  setSelectedGender={handleGenderChange}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  resultsCount={filteredProducts.length}
                  onClearFilters={handleClearFilters}
                />
      
                {/* Products Grid */}
                <div className="flex-1 p-6">
                  {!(hasWidgets && allClickProducts.length === 0) && (
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
                          Showing {filteredProducts.length} of {allClickProducts.length} products
                        </div>
                      </div>
                    </div>
                  )}

                  {productsLoading ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Loading Click Picks...
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500">
                        Finding the most popular products for you.
                      </p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    hasWidgets && allClickProducts.length === 0 ? null : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4"><i className="fas fa-search text-gray-400"></i></div>
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          {allClickProducts.length === 0 ? 'No Click Picks available' : 'No products found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-500">
                          {allClickProducts.length === 0 
                            ? 'Products will appear here when added to Click Picks via admin panel.' 
                            : 'Try adjusting your filters to see more results.'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="relative mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map((product) => (
                          <AmazonProductCard 
                            key={product.id} 
                            product={{
                              id: product.id,
                              name: product.name || '',
                              price: String(product.price || 0),
                              originalPrice: product.originalPrice || product.original_price || '',
                              currency: product.currency || 'INR',
                              imageUrl: product.imageUrl || product.image_url || '',
                              affiliateUrl: product.affiliateUrl || product.affiliate_url || '',
                              category: product.category || '',
                              rating: String(product.rating || 0),
                              reviewCount: product.reviewCount || product.review_count || 0,
                              discount: product.discount || 0,
                              description: product.description || '',
                              isNew: product.isNew || false,
                              isFeatured: product.isFeatured || false,
                              hasTimer: product.hasTimer || false,
                              timerDuration: product.timerDuration || null,
                              timerStartTime: product.timerStartTime || null,
                              hasLimitedOffer: product.hasLimitedOffer || false,
                              limitedOfferText: product.limitedOfferText || '',
                              // Service-specific pricing fields normalization
                              priceDescription: product.priceDescription || product.price_description || '',
                              monthlyPrice: product.monthlyPrice || product.monthly_price || 0,
                              yearlyPrice: product.yearlyPrice || product.yearly_price || 0,
                              pricingType: product.pricingType || product.pricing_type,
                              isFree: product.isFree || product.is_free || false,
                              isService: product.isService || product.is_service || false,
                              isAIApp: product.isAIApp || product.is_ai_app || false
                            }}
                          />
                        ))}
                      </div>
                      {/* Overlay widgets mirroring Prime Picks placement */}
                      <WidgetRenderer page={'click-picks'} position="content-top" />
                      <WidgetRenderer page={'click-picks'} position="content-middle" />
                      <WidgetRenderer page={'click-picks'} position="content-bottom" />
                      <WidgetRenderer page={'click-picks'} position="floating-top-left" />
                      <WidgetRenderer page={'click-picks'} position="floating-top-right" />
                      <WidgetRenderer page={'click-picks'} position="floating-bottom-left" />
                      <WidgetRenderer page={'click-picks'} position="floating-bottom-right" />
                    </div>
                  )}
                </div>
          </div>
        </div>
      </div>
      
      {/* Click Picks Videos Section */}
      <PageVideosSection 
        page="click-picks" 
        title="Click Picks Videos"
      />
      
      <ScrollNavigation />
    </UniversalPageLayout>
  );
}