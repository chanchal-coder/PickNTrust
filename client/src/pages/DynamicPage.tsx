import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import { BundleProductCard } from "@/components/BundleProductCard";
import AmazonProductCard from "@/components/amazon-product-card";
import PageVideosSection from "@/components/PageVideosSection";
import { useToast } from '@/hooks/use-toast';
import useHasActiveWidgets from '@/hooks/useHasActiveWidgets';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import WidgetRenderer from '@/components/WidgetRenderer';
import SafeWidgetRenderer from '@/components/SafeWidgetRenderer';
import { inferGender } from "@/utils/gender";

// Static fallback tabs for newly added pages to ensure they render without backend entries
const FALLBACK_TABS: Record<string, {
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  description: string;
}> = {
  'fresh-picks': {
    name: 'Fresh Picks',
    slug: 'fresh-picks',
    icon: 'fas fa-leaf',
    color_from: '#10B981',
    color_to: '#06B6D4',
    description: 'Latest and freshest curated selections',
  },
  "artists-corner": {
    name: "Artist's Corner",
    slug: 'artists-corner',
    icon: 'fas fa-palette',
    color_from: '#8B5CF6',
    color_to: '#EC4899',
    description: 'Creative picks, art and design highlights',
  },
  'ott-hub': {
    name: 'OTT Hub',
    slug: 'ott-hub',
    icon: 'fas fa-tv',
    color_from: '#EF4444',
    color_to: '#F59E0B',
    description: 'Streaming, OTT platforms and entertainment',
  },
};

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

interface NavTab {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  description?: string;
}

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [minRating, setMinRating] = useState<number>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [location] = useLocation();

  // Universal filter sidebar state for currency and price labels
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');

  // Using shared gender inference utility

  // Fetch navigation tab info with direct backend call and real-time updates
  const { data: navTab, isLoading: navTabLoading, error: navTabError } = useQuery<NavTab>({
    queryKey: [`/api/nav-tabs/${slug}`],
    queryFn: async () => {
      // Try direct backend call first, fallback to proxy
      let response;
      try {
        response = await fetch('/api/nav-tabs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
      } catch (error) {
        console.log('Direct call failed, trying proxy...');
        response = await fetch('/api/nav-tabs');
      }
      
      // If API fails, try static fallback
      if (!response.ok) {
        const fb = FALLBACK_TABS[slug || ''];
        if (fb) {
          // Return synthetic NavTab for layout
          return {
            id: -1,
            name: fb.name,
            slug: fb.slug,
            icon: fb.icon,
            color_from: fb.color_from,
            color_to: fb.color_to,
            display_order: 999,
            is_active: true,
            is_system: true,
            description: fb.description,
          } as NavTab;
        }
        throw new Error('Failed to fetch navigation tabs');
      }
      const tabs = await response.json();
      const tab = tabs.find((t: NavTab) => t.slug === slug && t.is_active);
      if (tab) return tab;

      // No matching tab from API — return static fallback if available
      const fb = FALLBACK_TABS[slug || ''];
      if (fb) {
        return {
          id: -1,
          name: fb.name,
          slug: fb.slug,
          icon: fb.icon,
          color_from: fb.color_from,
          color_to: fb.color_to,
          display_order: 999,
          is_active: true,
          is_system: true,
          description: fb.description,
        } as NavTab;
      }
      throw new Error('Navigation tab not found');
    },
    staleTime: 0,
    refetchOnWindowFocus: false, // Disable focus refetch to prevent ERR_ABORTED
    refetchInterval: false, // Disable auto-refresh to prevent request conflicts
  });

  // Fetch products for this page
  const { data: allProducts = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: [`/api/products/page/${slug}`, selectedGender],
    queryFn: async () => {
      try {
        const baseUrl = `/api/products/page/${slug}`;
        const url = selectedGender && selectedGender !== 'all'
          ? `${baseUrl}?gender=${encodeURIComponent(selectedGender)}`
          : baseUrl;
        const response = await fetch(url);
        if (!response.ok) {
          // Gracefully degrade for new or unmapped pages: return empty list
          // Treat 404/5xx alike to avoid disruptive error toasts
          console.warn(`Products fetch for ${slug} failed with status ${response.status}. Returning empty list.`);
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        // Network or parsing error — degrade gracefully without throwing
        console.warn(`Products fetch error for ${slug}:`, err);
        return [];
      }
    },
    enabled: !!slug,
    staleTime: 0,
  });

  // Detect available genders from loaded products (normalized + grouped Kids)
  const availableGenders: string[] = (() => {
    const set = new Set<string>();
    (allProducts as Product[]).forEach((p) => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    // Promote kids umbrella if boys/girls detected
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  })();

  // Detect if this page has any active widgets visible for the current device
  const { data: hasWidgets } = useHasActiveWidgets(navTab?.slug || slug || '');

  // Fetch available categories for this page
  const { data: availableCategories = [] } = useQuery<string[]>({
    queryKey: [`/api/categories/page/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/categories/page/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          return []; // Return empty array for new pages
        }
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    enabled: !!slug,
    staleTime: 0,
  });

  // Ensure categories remain visible even after filtering by unifying with product data
  const availableCategoriesUnified: string[] = useMemo(() => {
    const fromProducts = Array.from(new Set((allProducts || [])
      .map((p: any) => (p?.category ?? '') as string)
      .filter(Boolean)));
    const union = new Set<string>([...availableCategories, ...fromProducts]);
    return Array.from(union);
  }, [availableCategories, allProducts]);

  // Filter products based on sidebar selections
  const getPriceBounds = (currency: string, range: string): {min: number, max: number} => {
    if (!range || range === 'all') return {min: 0, max: Infinity};
    if (/^\d+-\d+$/.test(range)) {
      const [min, max] = range.split('-').map(v => parseFloat(v));
      return { min, max };
    }
    const min = parseFloat(range);
    return { min: isNaN(min) ? 0 : min, max: Infinity };
  };

  const priceBounds = getPriceBounds(selectedCurrency, priceRangeLabel);

  const filteredProducts = allProducts.filter((product) => {
    // Category filter (inclusive, supports hierarchical matching and synonyms)
    if (selectedCategory) {
      const sel = selectedCategory.toLowerCase();
      const cat = (product.category || '').toString().toLowerCase();
      const sub = (product.subcategory || '').toString().toLowerCase();
      const synonyms: Record<string,string[]> = {
        clothing: ['clothing','apparel','fashion','garment','wear'],
      };
      const tokens = synonyms[sel] || [sel];
      const matches = tokens.some(t => cat.includes(t) || sub.includes(t));
      if (!matches) return false;
    }

    // Price filter
    const productPrice = parseFloat(String(product.price));
    if (productPrice < priceBounds.min || productPrice > priceBounds.max) {
      return false;
    }

    // Rating filter
    const productRating = parseFloat(String(product.rating || '0'));
    if (productRating < minRating) {
      return false;
    }

    // Gender filter (normalized; Kids umbrella includes boy/girl/kids)
    if (selectedGender && selectedGender !== 'all') {
      const g = inferGender(product);
      if (selectedGender === 'kids') {
        if (!(g === 'boy' || g === 'girl' || g === 'kids')) return false;
      } else {
        if (g !== selectedGender) return false;
      }
    }

    return true;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Price range now controlled by string label via UniversalFilterSidebar
  // const handlePriceRangeChange = (min: number, max: number) => {}

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Read gender from query param on mount or location change
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const g = (params.get('gender') || '').toLowerCase();
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized || 'all');
  }, [slug, location]);

  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : `/page/${encodeURIComponent(slug || '')}`;
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Show error toast if navigation tab fails to load
  useEffect(() => {
    if (navTabError) {
      toast({
        title: "Page not found",
        description: "This navigation page does not exist or is not active.",
        variant: "destructive",
      });
    }
  }, [navTabError, toast]);

  // Show error toast if products fail to load
  useEffect(() => {
    if (productsError) {
      toast({
        title: "Error loading products",
        description: `Failed to load products for ${navTab?.name || slug}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [productsError, toast, navTab?.name, slug]);

  // Show loading state
  if (navTabLoading) {
    return (
    <UniversalPageLayout pageId="dynamicpage">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-container">
              <Header />
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Loading page...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Please wait while we load the page content.
                  </p>
                </div>
              </div>
              <Footer />
            </div>
    </UniversalPageLayout>
  );
  }

  // Show error state
  if (navTabError || !navTab) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-container">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4"><i className="fas fa-exclamation-triangle text-red-400"></i></div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Page Not Found
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              The page you're looking for doesn't exist or is not active.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get gradient colors for the header
  const gradientStyle = {
    background: `linear-gradient(to right, ${navTab.color_from}, ${navTab.color_to})`
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-container">
      <Header />
      {/* Header Top above dynamic header */}
      <WidgetRenderer page={navTab.slug} position="header-top" className="w-full" />
      <AnnouncementBanner />
      <div className="header-spacing">
        {/* Page Header */}
        <div className="py-8" style={gradientStyle}>
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <i className={`${navTab.icon} mr-3`}></i>{navTab.name}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                {navTab.description || `Discover amazing products in ${navTab.name}`}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm">
                  <i className="fas fa-box mr-2"></i>
                  {filteredProducts.length} Products Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters Drawer (below banner on mobile) */}
        <div className="md:hidden px-4 pt-3">
          <Button onClick={() => setFiltersOpen(true)} className="bg-blue-600 hover:bg-blue-700">
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
                  categorySelectionMode="single"
                  // currency & price
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                  convertPrices={convertPrices}
                  setConvertPrices={setConvertPrices}
                  priceRange={priceRangeLabel}
                  setPriceRange={setPriceRangeLabel}
                  // categories
                  availableCategories={availableCategoriesUnified}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  // gender
                  availableGenders={availableGenders}
                  selectedGender={selectedGender}
                  setSelectedGender={handleGenderChange}
                  // rating
                  minRating={minRating}
                  setMinRating={handleRatingChange}
                  // results & clear
                  resultsCount={filteredProducts.length}
                  onClearFilters={() => {
                    setSelectedCategory('');
                    setSelectedCurrency('all');
                    setConvertPrices(false);
                    setPriceRangeLabel('all');
                    setSelectedGender('all');
                    setMinRating(0);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Header Bottom below dynamic header */}
        <WidgetRenderer page={navTab.slug} position="header-bottom" className="w-full" />

        {/* Banner Top Widgets (inside main content flow) */}
        <WidgetRenderer page={navTab.slug} position="banner-top" className="w-full mb-4" />

        {/* Main Content with Sidebar */}
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar (desktop only) */}
          <div className="hidden md:block">
            <UniversalFilterSidebar
              showNetworks={false}
              categorySelectionMode="single"
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              convertPrices={convertPrices}
              setConvertPrices={setConvertPrices}
              priceRange={priceRangeLabel}
              setPriceRange={setPriceRangeLabel}
              availableCategories={availableCategoriesUnified}
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
                setSelectedCurrency('all');
                setConvertPrices(false);
                setPriceRangeLabel('all');
                setSelectedGender('all');
                setMinRating(0);
              }}
            />
          </div>
          {/* Left Sidebar Widgets removed to match DealsHub layout width */}

          {/* Products Grid */}
          <div className="flex-1 p-6">
            {/* Mobile fallback: show right-sidebar widgets at top of content on small screens */}
            <div className="block md:hidden mb-4">
              <WidgetRenderer page={navTab.slug} position="sidebar-right" />
            </div>

            {/* Body Widgets in main content flow */}
            <SafeWidgetRenderer page={navTab.slug} position="body" />

            {!(hasWidgets && allProducts.length === 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Results ({filteredProducts.length})
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {allProducts.length} products
                  </div>
                </div>
              </div>
            )}
            {/* Overlay anchor: widgets overlay inside product grid area */}
            <div className="relative">
              {/* Product Grid Top Widgets */}
              <SafeWidgetRenderer page={navTab.slug} position="product-grid-top" />

              {productsLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Loading {navTab.name}...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Finding the best products for you.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                hasWidgets && allProducts.length === 0 ? null : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4"><i className="fas fa-search text-gray-400"></i></div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {allProducts.length === 0 ? `No ${navTab.name} available` : 'No products found'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      {allProducts.length === 0 
                        ? `Products will appear here when added to ${navTab.name} via admin panel.` 
                        : 'Try adjusting your filters to see more results.'}
                    </p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => {
                    // Check if product is part of a bundle (multiple products)
                    const isBundle = product.totalInGroup && Number(product.totalInGroup) > 1;
                    
                    if (isBundle) {
                      return (
                        <div key={product.id} className="relative min-w-0">
                          <BundleProductCard 
                            product={product} 
                            source={slug || 'dynamic'} 
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div key={product.id} className="relative min-w-0">
                          <AmazonProductCard 
                            product={{
                              id: product.id,
                              name: product.name,
                              description: product.description || '',
                              price: product.price,
                              originalPrice: product.originalPrice || product.original_price,
                              currency: product.currency || 'INR',
                              imageUrl: product.imageUrl || product.image_url,
                              affiliateUrl: product.affiliateUrl || product.affiliate_url,
                              category: product.category,
                              rating: product.rating,
                              reviewCount: product.reviewCount,
                              discount: product.discount,
                              isNew: product.isNew,
                              isFeatured: product.isFeatured,
                              affiliate_network: product.affiliate_network || product.networkBadge,
                              networkBadge: product.networkBadge,
                              affiliateNetwork: product.affiliateNetworkName || 'Dynamic Network',
                              sourceType: slug || 'dynamic',
                              source: slug || 'dynamic',
                              displayPages: [slug || 'dynamic'],
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
                      );
                    }
                  })}
                </div>
              )}

              {/* Product Grid Bottom Widgets */}
              <SafeWidgetRenderer page={navTab.slug} position="product-grid-bottom" />

              {/* Content and Floating Widgets overlay inside product grid area */}
              <WidgetRenderer page={navTab.slug} position="content-top" />
              <WidgetRenderer page={navTab.slug} position="content-middle" />
              <WidgetRenderer page={navTab.slug} position="content-bottom" />
              <WidgetRenderer page={navTab.slug} position="floating-top-left" />
              <WidgetRenderer page={navTab.slug} position="floating-top-right" />
              <WidgetRenderer page={navTab.slug} position="floating-bottom-left" />
              <WidgetRenderer page={navTab.slug} position="floating-bottom-right" />
            </div>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="hidden xl:block w-80 p-4">
            <WidgetRenderer page={navTab.slug} position="sidebar-right" />
          </div>
        </div>

        {/* Banner Bottom Widgets (inside main content flow) */}
        <WidgetRenderer page={navTab.slug} position="banner-bottom" className="w-full mt-6" />

        {/* Page-specific Videos Section - Only shows if videos exist for this page */}
        {navTab && (
          <PageVideosSection 
            page={navTab.slug} 
            title={`${navTab.name} Videos`}
          />
        )}
      </div>
      {/* Footer Top Widgets */}
      <WidgetRenderer page={navTab.slug} position="footer-top" className="w-full" />
      <Footer />
      {/* Footer Bottom Widgets */}
      <WidgetRenderer page={navTab.slug} position="footer-bottom" className="w-full" />
      <ScrollNavigation />
    </div>
  );
}
