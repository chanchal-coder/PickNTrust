import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Use canonical header widgets instead of direct Header
import WidgetRenderer from '@/components/WidgetRenderer';
import { AnnouncementBanner } from "@/components/announcement-banner";
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';
import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import { BundleProductCard } from "@/components/BundleProductCard";
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

// Global Picks page uses real data from the database via API endpoints
// Products are dynamically loaded based on the display_pages field in the database

export default function GlobalPicks() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // Maintain numeric bounds for filtering
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  // String key for UniversalFilterSidebar's price range
  const [priceRangeKey, setPriceRangeKey] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  // Determine if there are active widgets for this page (respecting Rules of Hooks)
  const { data: hasWidgets } = useHasActiveWidgets('global-picks');

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
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/global-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/global-picks'] });
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

  // Fetch products from dedicated Global Picks database table
  const { data: allGlobalProducts = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['/api/products/page/global-picks', selectedCategory],
    queryFn: async (): Promise<Product[]> => {
      const url = selectedCategory 
        ? `/api/products/page/global-picks?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products/page/global-picks';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Global Picks products');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Fetch categories for Global Picks page
  const { data: availableCategories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories/page/global-picks'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/categories/page/global-picks');
      if (!response.ok) {
        throw new Error('Failed to fetch Global Picks categories');
      }
      return response.json();
    },
  });

  // Derive available genders from loaded products (aggregate Kids when boys/girls present)
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    (allGlobalProducts as Product[]).forEach((p) => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  }, [allGlobalProducts]);

  // Handle affiliate click tracking
  const handleAffiliateClick = async (productId: string | number, networkId?: number, affiliateUrl?: string) => {
    try {
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          tableName: 'global_picks_products', // Dedicated Global Picks table
          networkId: networkId || 'unknown',
          affiliateUrl: affiliateUrl || ''
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  // Apply client-side filtering for gender, price and rating
  const filteredProducts = allGlobalProducts.filter((product: any) => {
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
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/global-picks';
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

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error loading products",
        description: "Failed to load Global Picks products. Please try again.",
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  return (
    <UniversalPageLayout pageId="global-picks" enableContentOverlays={false} enableFloatingOverlays={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'global-picks'} position="header-top" className="w-full" />
        
        <AnnouncementBanner />
        
        {/* Page Banner Slider */}
        <PageBanner page="global-picks" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'global-picks'} position="header-bottom" className="w-full" />
        <div className="header-spacing">

        {/* Main Content with Sidebar */}
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
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
            {!(hasWidgets && allGlobalProducts.length === 0) && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Global Picks ({filteredProducts.length})
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredProducts.length} of {allGlobalProducts.length} universal products
                </div>
              </div>
            </div>
            )}

            {productsLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Loading Global Picks...
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Loading universal products from any e-commerce site.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              hasWidgets && allGlobalProducts.length === 0 ? null : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4"><i className="fas fa-globe text-gray-400"></i></div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {allGlobalProducts.length === 0 ? 'No Global Picks available' : 'No products found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {allGlobalProducts.length === 0 
                      ? 'Universal products from any e-commerce site will appear here when posted to Global Picks channel.' 
                      : 'Try adjusting your filters to see more results.'}
                  </p>
                </div>
              )
            ) : (
              <div className="relative">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product: any) => (
                    <div key={product.id} className="relative">
                      {/* Checkbox overlay for bulk delete mode */}
                      {bulkDeleteMode && isAdmin && (
                        <div className="absolute top-2 right-2 z-20">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(`global_picks_${product.id}`)}
                            onChange={(e) => {
                              const productId = `global_picks_${product.id}`;
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, productId]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== productId));
                              }
                            }}
                            className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                          />
                        </div>
                      )}
                      <AmazonProductCard 
                         key={`${product.source}-${product.id}`} 
                         product={{
                         id: product.id,
                         name: product.name || '',
                         price: String(product.price || 0),
                         currency: product.currency || 'INR',
                         image_url: product.image_url || (product.imageUrl || product.image_url || ""),
                         affiliate_url: product.affiliate_url || (product.affiliateUrl || product.affiliate_url || ""),
                         original_url: product.original_url || (product.affiliateUrl || product.affiliate_url || ""),
                         affiliate_network: product.affiliate_network || product.affiliateNetworkName || 'unknown',
                         affiliate_tag_applied: product.affiliate_tag_applied || 1,
                         category: product.category || '',
                         rating: String(product.rating || 0),
                         discount: product.discount || 0,
                         description: product.description || '',
                         originalPrice: product.originalPrice || product.original_price || '',
                         reviewCount: product.reviewCount || product.review_count || 0,
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
                    </div>
                  ))}
                </div>
                {/* Overlay widgets mirroring Prime Picks placement */}
                <WidgetRenderer page={'global-picks'} position="content-top" />
                <WidgetRenderer page={'global-picks'} position="content-middle" />
                <WidgetRenderer page={'global-picks'} position="content-bottom" />
                <WidgetRenderer page={'global-picks'} position="floating-top-left" />
                <WidgetRenderer page={'global-picks'} position="floating-top-right" />
                <WidgetRenderer page={'global-picks'} position="floating-bottom-left" />
                <WidgetRenderer page={'global-picks'} position="floating-bottom-right" />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Global Picks Videos Section */}
      <PageVideosSection 
        page="global-picks" 
        title="Global Picks Videos"
      />
    </UniversalPageLayout>
  );
}