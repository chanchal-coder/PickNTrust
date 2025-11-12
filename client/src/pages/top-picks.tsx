// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
// Using canonical header widgets via WidgetRenderer and banners
import ScrollNavigation from "@/components/scroll-navigation";
import PageBanner from "@/components/PageBanner";
import PageVideosSection from '@/components/PageVideosSection';
import WidgetRenderer from '@/components/WidgetRenderer';
import SafeWidgetRenderer from '@/components/SafeWidgetRenderer';
import { AnnouncementBanner } from "@/components/announcement-banner";
import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import { CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import PriceTag from '@/components/PriceTag';
import { inferGender } from "@/utils/gender";

// Define Product type locally to avoid schema conflicts
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

// Helper function to format product price without conversion (displays original currency)
const formatProductPrice = (price: string | number, productCurrency?: string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/,/g, '')) : price;
  const originalCurrency = (productCurrency as CurrencyCode) || 'INR';
  
  // Always display in the product's original currency (no conversion)
  return formatCurrencyPrice(numPrice, originalCurrency);
};

export default function TopPicks() {
  const [location] = useLocation();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Sync gender from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const genderParam = params.get('gender');
    if (genderParam) {
      const normalized = genderParam === 'common' ? 'unisex' : genderParam.toLowerCase();
      setSelectedGender(normalized);
    }
  }, [location]);
  
  // Handle share modal
  const handleShareToAll = (product: Product) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = async () => {
    try {
      if (selectedProduct) {
        const { sendProductToTelegram } = await import('@/utils/telegram');
        // Attempt Telegram post without affecting other shares
        await sendProductToTelegram({
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          originalPrice: (selectedProduct as any).originalPrice,
          imageUrl: selectedProduct.imageUrl || (selectedProduct as any).image_url,
          affiliateUrl: selectedProduct.affiliateUrl || (selectedProduct as any).affiliate_url,
        }, { pageSlug: 'top-picks' });
      }
      alert('✅ Shared to Telegram');
    } catch (err) {
      console.error('Telegram share failed:', err);
      alert('❌ Telegram share failed');
    } finally {
      setShareModalOpen(false);
      setSelectedProduct(null);
    }
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedProduct(null);
  };

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
        // Use the full product ID (including 'featured_' prefix) for the admin products endpoint
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
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-products'] });
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
  
  // Fetch featured products from dedicated featured_products table only
  const { data: allTopPicks, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/page/top-picks', selectedCategory],
    queryFn: async () => {
      try {
        const url = selectedCategory 
          ? `/api/products/page/top-picks?category=${encodeURIComponent(selectedCategory)}`
          : `/api/products/page/top-picks`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Featured products data:', data);
        
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data, data);
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
  
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Use aggregated data
  const displayProducts: Product[] = allTopPicks || [];

  // Get unique categories for sidebar
  const availableCategories = Array.from(new Set(displayProducts.map(product => product.category).filter(Boolean)));

  // Derive available genders from products
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    for (const p of displayProducts) {
      const g = inferGender(p);
      if (g) set.add(g);
    }
    const hasBoys = set.has('boys');
    const hasGirls = set.has('girls');
    if (hasBoys || hasGirls) set.add('kids');
    const ordered = ['men', 'women', 'kids', 'boys', 'girls', 'unisex'].filter(g => set.has(g));
    return ['all', ...ordered];
  }, [displayProducts]);

  // Helper: convert string price range label to numeric bounds
  const getPriceBounds = (rangeValue: string): { min: number; max: number } => {
    if (!rangeValue || rangeValue === 'all') return { min: 0, max: Infinity };
    if (rangeValue.includes('-')) {
      const [minStr, maxStr] = rangeValue.split('-');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? Infinity : max };
    }
    const min = parseFloat(rangeValue);
    return { min: isNaN(min) ? 0 : min, max: Infinity };
  };
  const priceBounds = getPriceBounds(priceRangeLabel);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCurrency('all');
    setConvertPrices(false);
    setPriceRangeLabel('all');
    setMinRating(0);
    setSelectedGender('all');
  };

  // Apply client-side filtering for category, price, and rating
  const filteredProducts = displayProducts.filter(product => {
    // Normalize helper
    const norm = (v: any) => String(v ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

    // Filter by category (case/space insensitive)
    if (selectedCategory) {
      const prodCat = norm(product.category);
      const selCat = norm(selectedCategory);
      if (prodCat !== selCat) {
        return false;
      }
    }

    // Filter by gender
    if (selectedGender && selectedGender !== 'all') {
      const inferred = inferGender(product);
      const g = (inferred || '').toLowerCase();
      if (selectedGender === 'kids') {
        if (!['boys', 'girls', 'kids'].includes(g)) return false;
      } else if (g !== selectedGender) {
        return false;
      }
    }

    // Filter by price range (strip non-numeric characters)
    const priceNum = parseFloat(String(product.price ?? '').toString().replace(/[^0-9.]/g, '')) || 0;
    if (priceNum < priceBounds.min || priceNum > priceBounds.max) {
      return false;
    }

    // Filter by rating
    const ratingNum = parseFloat(String(product.rating || 0)) || 0;
    if (ratingNum < minRating) {
      return false;
    }

    // Filter by currency (case-insensitive)
    if (selectedCurrency !== 'all') {
      const prodCurrency = String(product.currency ?? '').trim().toUpperCase();
      if (prodCurrency && prodCurrency !== String(selectedCurrency).trim().toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  // Handle gender selection and sync URL
  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/top-picks';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  const handleAffiliateClick = (product: Product) => {
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWishlistToggle = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} removed from your wishlist`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} added to your wishlist`,
      });
    }
  };

  const handleShare = (platform: string, product: Product) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    // Compute discount only when both original and current prices are valid
    const originalVal = Number((product as any).originalPrice || (product as any).original_price || 0);
    const currentVal = Number(product.price || 0);
    const hasValidPrices = originalVal > 0 && currentVal > 0 && originalVal > currentVal;
    const pct = hasValidPrices ? Math.round(((originalVal - currentVal) / originalVal) * 100) : 0;
    const discountText = hasValidPrices && pct > 0 ? ` ${pct}% OFF!` : '';
    const shareText = `Check out this amazing deal: ${product.name} - Only ₹${product.price}!${discountText} - PickNTrust`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'instagram':
        // Copy to clipboard for Instagram
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast({
          title: "Copied to clipboard!",
          description: "Share text copied. You can now paste it on Instagram.",
        });
        return;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(product.name)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}&media=${encodeURIComponent(product.imageUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    
    // Close share menu
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted",
      });

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prime-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/click-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cue-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/value-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loot-box'] });
      queryClient.invalidateQueries({ queryKey: ['/api/amazon'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cuelinks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/apps'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
    return (
      <div className="flex items-center text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <i 
            key={i}
            className={`${
              i < fullStars 
                ? 'fas fa-star' 
                : i === fullStars && hasHalfStar 
                  ? 'fas fa-star-half-alt' 
                  : 'far fa-star'
            }`}
          ></i>
        ))}
      </div>
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Canonical Header Widgets */}
        <WidgetRenderer page={'top-picks'} position="header-top" className="w-full" />
        <AnnouncementBanner />
        <PageBanner page="top-picks" />
        <WidgetRenderer page={'top-picks'} position="header-bottom" className="w-full" />
        <div className="header-spacing">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Today's Top Picks <i className="fas fa-fire"></i>
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Loading amazing deals...
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Determine if the base dataset is empty (actual no featured products)
  const hasAnyProducts = (displayProducts || []).length > 0;
  const hasFilteredResults = (filteredProducts || []).length > 0;

  return (
    <UniversalPageLayout pageId="top-picks" enableContentOverlays={false} enableFloatingOverlays={false}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Canonical Header Widgets render below via WidgetRenderer and banners */}
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'top-picks'} position="header-top" className="w-full" />
        
        <AnnouncementBanner />
        
      {/* Amazing Page Banner */}
      <PageBanner page="top-picks" />
      {/* Header Bottom below dynamic banner */}
      <WidgetRenderer page={'top-picks'} position="header-bottom" className="w-full" />

      {/* Top Picks Content Section with Sidebar */}
      <div className="header-spacing">
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <UniversalFilterSidebar
          showCurrency={true}
          showPriceRange={true}
          showGender={true}
          showNetworks={false}
          showCategories={true}
          showRating={true}
          showResultsCount={true}
          showClearButton={true}

          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          convertPrices={convertPrices}
          setConvertPrices={setConvertPrices}
          priceRange={priceRangeLabel}
          setPriceRange={setPriceRangeLabel}

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
          onClearFilters={clearFilters}
        />

        {/* Top Picks Grid with overlay anchor */}
        <div className="flex-1 p-6">
          <div className="relative">
          {/* Product Grid Top Widgets */}
          <SafeWidgetRenderer page={'top-picks'} position={'product-grid-top'} />
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                <i className="fas fa-fire"></i> Today's Top Picks ({filteredProducts.length})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredProducts.length} of {displayProducts.length} trending products
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Viral, trending, limited deals & new offers from dedicated Top Picks channel + all other channels
            </p>
          </div>

          {/* Products Grid */}
          {/* Conditional grid content based on data and filters */}
          {(!error && !hasAnyProducts) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center">
              <div className="mb-6">
                <i className="fas fa-box-open text-4xl text-gray-400 dark:text-gray-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Featured Products Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our team is curating the best deals. Please check back soon!</p>
              <Link href="/admin" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
                <i className="fas fa-plus mr-2"></i>
                Add Products (Admin)
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl p-6">
              <div className="font-semibold mb-2">Failed to load Top Picks</div>
              <div className="text-sm">Please try again later.</div>
            </div>
          )}

          {(!error && hasAnyProducts && !hasFilteredResults) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No picks match your filters</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try adjusting gender, category, price, or rating.</p>
              <button onClick={clearFilters} className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800">
                <i className="fas fa-undo mr-2"></i>
                Clear filters
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {hasFilteredResults && filteredProducts.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden max-w-md mx-auto"
              >
                {/* Card Header with Image */}
                  <div className="relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-48 object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/400/300?random=${product.id}`;
                      }}
                    />
                    
                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`absolute top-3 left-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                        isInWishlist(product.id) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'
                      }`}
                      title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className="fas fa-heart text-sm"></i>
                    </button>


                  </div>
                
                {/* Card Content */}
                <div className="p-5">
                  {/* Discount Badge and Action Icons */}
                  <div className="flex items-center justify-between mb-3">
                    {(() => {
                      const originalVal = Number((product as any).originalPrice || (product as any).original_price || 0);
                      const currentVal = Number(product.price || 0);
                      const hasValidPrices = originalVal > 0 && currentVal > 0 && originalVal > currentVal;
                      if (hasValidPrices) {
                        const pct = Math.round(((originalVal - currentVal) / originalVal) * 100);
                        if (pct > 0) {
                          return (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              {pct}% OFF
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                    {!product.discount && product.isNew ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        NEW
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {/* Share and Delete Icons */}
                    <div className="flex gap-2">
                      {/* Admin Buttons: Share to All + Individual Share */}
                      {isAdmin && (
                        <>
                          {/* Share to All Platforms Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleShareToAll(product);
                            }}
                            className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow-lg transition-all duration-200 cursor-pointer z-10 relative"
                            title="Share to All Platforms"
                          >
                            <i className="fas fa-edit text-sm pointer-events-none"></i>
                          </button>
                          
                          {/* Individual Share Button */}
                          <EnhancedShare 
                            product={{
                              id: product.id,
                              name: product.name,
                              description: product.description,
                              price: product.price,
                              imageUrl: product.imageUrl,
                              category: product.category,
                              affiliateUrl: product.affiliateUrl
                            }}
                            contentType="product"
                            className="p-2 bg-green-500 text-white hover:bg-green-600 rounded-full shadow-lg transition-all duration-200"
                            buttonText=""
                            showIcon={true}
                          />
                        </>
                      )}
                      
                      {/* Public User Smart Share Button */}
                      {!isAdmin && (
                        <SmartShareDropdown
                          product={{
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            category: product.category,
                            affiliateUrl: product.affiliateUrl
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200"
                          buttonText=""
                          showIcon={true}
                        />
                      )}

                      {/* Delete Button - Admin Only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-lg transition-all duration-200"
                          title="Delete product"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    {renderStars(product.rating)}
                    <span className="text-gray-600 dark:text-gray-300 ml-2 text-sm">({product.reviewCount})</span>
                  </div>
                  
                  {/* Product Name */}
                   <h4 className="font-bold text-lg text-navy dark:text-blue-400 mb-2 line-clamp-2">{product.name}</h4>
                   
                   {/* Product Description */}
                   <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>
                   
                   {/* Pricing */}
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-2">
                       <PriceTag 
                         product={product}
                         colorClass="text-navy dark:text-blue-400"
                         originalClass="text-gray-400 dark:text-gray-500 line-through text-base"
                         freeClass="text-green-600 dark:text-green-400"
                         helperClass="text-xs text-gray-500"
                       />
                     </div>
                   </div>
                  
                  {/* Product Timer */}
                  <div className="mb-4">
                    <ProductTimer product={product} />
                  </div>
                  
                  {/* Pick Now Button */}
                   <button 
                     onClick={() => handleAffiliateClick(product)}
                     className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                   >
                     <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                   </button>
                  
                  {/* Affiliate Link Notice */}
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                     <i className="fas fa-link"></i> Affiliate Link - We earn from purchases
                   </p>
                </div>
              </div>
            ))}
          </div>

          {/* Product Grid Bottom Widgets */}
          <SafeWidgetRenderer page={'top-picks'} position={'product-grid-bottom'} />
          {/* Overlay widgets mirroring Prime Picks placement */}
          <WidgetRenderer page={'top-picks'} position="content-top" />
          <WidgetRenderer page={'top-picks'} position="content-middle" />
          <WidgetRenderer page={'top-picks'} position="content-bottom" />
          <WidgetRenderer page={'top-picks'} position="floating-top-left" />
          <WidgetRenderer page={'top-picks'} position="floating-top-right" />
          <WidgetRenderer page={'top-picks'} position="floating-bottom-left" />
          <WidgetRenderer page={'top-picks'} position="floating-bottom-right" />
          </div>
        </div>
      </div>
      </div>
      
      {/* Top Picks Videos Section */}
      <PageVideosSection 
        page="top-picks" 
        title="Top Picks Videos"
      />
      
      <ScrollNavigation />
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedProduct?.name || ''}
        platforms={adminPlatformSettings}
      />
      </div>
    </UniversalPageLayout>
  );
}
