// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
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
import { isPriceInRange } from '@/utils/currencyConversion';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inferGender } from "@/utils/gender";
import AmazonProductCard from '@/components/amazon-product-card';

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
  isService?: boolean;
  isAIApp?: boolean;
  pricingType?: string;
  monthlyPrice?: string | number;
  yearlyPrice?: string | number;
  isFree?: boolean;
  priceDescription?: string;
  messageGroupId?: string;
  productSequence?: string | number;
  totalInGroup?: string | number;
  sourceMetadata?: any;
  telegramMessageId?: number;
  telegramChannelId?: number;
  clickCount?: number;
  conversionCount?: number;
  processing_status?: string;
  expiresAt?: number;
  alternativeSources?: Array<{
    network: string;
    price?: string | number;
    originalPrice?: string | number;
    url: string;
    commission: number;
  }>;
  commissionRate?: number;
  [key: string]: any;
}

const formatProductPrice = (price: string | number, productCurrency?: string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/,/g, '')) : price;
  const originalCurrency = (productCurrency as CurrencyCode) || 'INR';
  return formatCurrencyPrice(numPrice, originalCurrency);
};

export default function TrendingPage() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  const handleShareToAll = (product: Product) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
  };

  const handleConfirmShare = () => {
    if (selectedProduct) {
      alert(`✅ Sharing "${selectedProduct.name}" to all configured platforms!`);
      console.log('Share confirmed for:', selectedProduct.id, selectedProduct.name);
    }
    setShareModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedProduct(null);
  };

  const handleBulkDelete = async (deleteAll = false) => {
    const idsToDelete = deleteAll ? filteredProducts.map(p => p.id) : selectedProducts;
    if (idsToDelete.length === 0) {
      toast.toast({ title: 'No Selection', description: 'Please select products to delete', variant: 'destructive' });
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
      import('@/utils/delete-utils').then(({ invalidateAllProductQueries }) => {
        invalidateAllProductQueries(queryClient);
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/trending'] });
      toast.toast({ title: 'Products Deleted', description: `Successfully deleted ${idsToDelete.length} products` });
      setBulkDeleteMode(false);
      setSelectedProducts([]);
    } catch (error) {
      toast.toast({ title: 'Delete Failed', description: 'Failed to delete products', variant: 'destructive' });
    }
  };

  const { data: allTrending, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/page/trending', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products/page/trending?category=${encodeURIComponent(selectedCategory)}`
        : `/api/products/page/trending`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredProducts = (allTrending || []).filter(p => {
    const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0);
    const ratingNum = typeof p.rating === 'string' ? parseFloat(p.rating) : (p.rating || 0);
    const withinCategory = !selectedCategory || p.category === selectedCategory;
    const withinPrice = isPriceInRange(
      p.price || 0,
      (p.currency || 'INR'),
      selectedCurrency,
      priceRangeLabel,
      convertPrices
    );
    const withinRating = ratingNum >= minRating;
    const gender = inferGender(p);
    const withinGender =
      selectedGender === 'all' ||
      (selectedGender === 'kids'
        ? (gender === 'kids' || gender === 'boys' || gender === 'girls')
        : gender === selectedGender);
    return withinCategory && withinPrice && withinRating && withinGender;
  });

  // Fetch available categories for this page from backend to keep list stable
  const { data: availableCategoriesFromApi = [] } = useQuery<string[]>({
    queryKey: ['/api/categories/page/trending'],
    queryFn: async () => {
      const response = await fetch('/api/categories/page/trending');
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 0,
  });

  // Keep categories visible regardless of current selection (union of API + product data)
  const availableCategoriesUnified = useMemo(() => {
    const fromProducts = Array.from(new Set((allTrending || [])
      .map(p => p.category)
      .filter((c): c is string => !!c)));
    const union = new Set<string>([...availableCategoriesFromApi, ...fromProducts]);
    return Array.from(union);
  }, [availableCategoriesFromApi, allTrending]);
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    (allTrending || []).forEach(p => {
      const g = inferGender(p);
      if (g) set.add(g);
    });
    if ((set.has('boys') || set.has('girls')) && !set.has('kids')) {
      set.add('kids');
    }
    const order = ['men','women','kids','boys','girls','unisex'];
    const filtered = order.filter(g => set.has(g));
    return ['all', ...filtered];
  }, [allTrending]);

  return (
    <UniversalPageLayout pageId="trending" title="Trending Products">
      {/* Page banner and announcements */}
      <AnnouncementBanner page="trending" />
      <PageBanner pageSlug="trending" />
      {/* Header Bottom below dynamic banner for consistency with Picks pages */}
      <WidgetRenderer page={'trending'} position="header-bottom" className="w-full" />
      <div className="header-spacing">
        {/* Main Content with Sidebar like Top Picks */}
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar (desktop only) */}
          <div className="hidden md:block">
            <UniversalFilterSidebar
              // visibility controls (use defaults to show core sections)
              showNetworks={false}
              categorySelectionMode="single"
              // currency & price
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              convertPrices={convertPrices}
              setConvertPrices={setConvertPrices}
              priceRange={priceRangeLabel}
              setPriceRange={setPriceRangeLabel}
              // categories (single-select)
              availableCategories={availableCategoriesUnified}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              // gender
              availableGenders={availableGenders}
              selectedGender={selectedGender}
              setSelectedGender={setSelectedGender}
              // rating
              minRating={minRating}
              setMinRating={setMinRating}
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

          {/* Products Grid */}
          <div className="flex-1 p-6">
            {/* Mobile Filters toggle */}
            <div className="md:hidden flex items-center justify-between mt-1 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Explore what's trending</h2>
              <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                <i className="fas fa-filter mr-2" /> Filters
              </Button>
            </div>

            {isLoading && (
              <div className="py-10 text-center text-gray-400">Loading trending products...</div>
            )}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-gray-300">No trending products yet. Check back soon!</div>
              </div>
            )}

            {/* Use AmazonProductCard UI for consistency */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div key={p.id} className="">
                  <AmazonProductCard product={p as any} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters drawer */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[22rem]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
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
              setSelectedGender={setSelectedGender}
              minRating={minRating}
              setMinRating={setMinRating}
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

      <WidgetRenderer page="trending" position="content-bottom" />
      <SafeWidgetRenderer page="trending" position="floating-bottom-right" />
      <PageVideosSection page="trending" title="Trending Videos" />
      <ScrollNavigation />
    </UniversalPageLayout>
  );
}