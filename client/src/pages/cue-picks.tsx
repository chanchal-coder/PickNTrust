// @ts-nocheck
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Use canonical header widgets instead of direct Header
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';
import WidgetRenderer from '@/components/WidgetRenderer';

import { AnnouncementBanner } from "@/components/announcement-banner";
import Sidebar from "@/components/sidebar";
import AmazonProductCard from "@/components/amazon-product-card";

import { useToast } from '@/hooks/use-toast';
import UniversalPageLayout from '@/components/UniversalPageLayout';

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

// Cue Picks page uses real data from the database via API endpoints
// Products are dynamically loaded based on the display_pages field in the database

export default function CuePicks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  const [minRating, setMinRating] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/cue-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cue-picks'] });
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

  // Fetch products for Cue Picks page with auto-refresh for new Telegram posts
  const { data: allCueProducts = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['/api/products/page/cue-picks', selectedCategory],
    queryFn: async (): Promise<Product[]> => {
      const url = selectedCategory 
        ? `/api/products/page/cue-picks?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products/page/cue-picks';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Cue Picks products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: false, // Disable auto-refresh to prevent request conflicts
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, // Disable focus refetch to prevent ERR_ABORTED
  });

  // Fetch categories for Cue Picks page with auto-refresh
  const { data: availableCategories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories/page/cue-picks'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/categories/page/cue-picks');
      if (!response.ok) {
        throw new Error('Failed to fetch Cue Picks categories');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
    refetchInterval: false, // Disable auto-refresh to prevent conflicts
    refetchOnWindowFocus: false, // Disable focus refetch to prevent ERR_ABORTED
  });

  // Apply client-side filtering for price and rating
  const filteredProducts = allCueProducts.filter(product => {
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

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({min, max});
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error loading products",
        description: "Failed to load Cue Picks products. Please try again.",
        variant: "destructive",
      });
    }
  }, [productsError, toast]);

  return (
    <UniversalPageLayout pageId="cue-picks" enableContentOverlays={false} enableFloatingOverlays={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'cue-picks'} position="header-top" className="w-full" />
        
        <AnnouncementBanner />
        
        {/* Page Banner Slider */}
        <PageBanner page="cue-picks" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'cue-picks'} position="header-bottom" className="w-full" />
        <div className="header-spacing">
      
              {/* Main Content with Sidebar */}
              <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Sidebar */}
                <Sidebar 
                  onCategoryChange={handleCategoryChange}
                  onPriceRangeChange={handlePriceRangeChange}
                  onRatingChange={handleRatingChange}
                  availableCategories={availableCategories}
                />
      
                {/* Products Grid with overlay anchor */}
                <div className="flex-1 p-6">
                  <div className="relative">
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
                  Showing {filteredProducts.length} of {allCueProducts.length} products
                </div>
              </div>
            </div>

            {productsLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Loading Cue Picks...
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Finding the smartest selections for you.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                  <div className="text-6xl mb-4 text-red-500">
                    <i className="fas fa-bullseye"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-4">No Cue Picks Found</h3>
                  <p className="text-gray-500">We're working on adding more CueLinks products to this collection.</p>
                </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            )}
            {/* Overlay widgets mirroring Prime Picks placement */}
            <WidgetRenderer page={'cue-picks'} position="content-top" />
            <WidgetRenderer page={'cue-picks'} position="content-middle" />
            <WidgetRenderer page={'cue-picks'} position="content-bottom" />
            <WidgetRenderer page={'cue-picks'} position="floating-top-left" />
            <WidgetRenderer page={'cue-picks'} position="floating-top-right" />
            <WidgetRenderer page={'cue-picks'} position="floating-bottom-left" />
            <WidgetRenderer page={'cue-picks'} position="floating-bottom-right" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Cue Picks Videos Section */}
      <PageVideosSection 
        page="cue-picks" 
        title="Cue Picks Videos"
      />
      
        <ScrollNavigation />
      </div>
    </UniversalPageLayout>
  );
}