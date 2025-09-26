import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import StaticPageBanner from '@/components/StaticPageBanner';
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import { deleteProduct, invalidateAllProductQueries } from '@/utils/delete-utils';
import { useMutation } from '@tanstack/react-query';
import UniversalPageLayout from '@/components/UniversalPageLayout';

interface HotelDeal {
  id: number | string;
  name: string;
  description?: string;
  price: string;
  originalPrice?: string | null;
  currency?: string;
  imageUrl: string;
  image_url?: string;
  affiliateUrl: string;
  affiliate_url?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  city?: string;
  rating?: string;
  reviewCount?: string;
  discount?: string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  validTill?: string;
  source?: string;
  networkBadge?: string;
  amenities?: string[];
  hotelType?: 'featured' | 'standard' | 'destination';
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  cancellation?: string;
  [key: string]: any;
}

interface HotelSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  type: 'featured' | 'standard' | 'destination';
}

const hotelSections: HotelSection[] = [
  {
    id: 'featured',
    title: 'Featured Hotels & Premium Stays',
    icon: 'fas fa-crown',
    color: 'from-purple-500 to-purple-600',
    description: 'Luxury hotels, top-rated properties, and exclusive deals with detailed information',
    type: 'featured'
  },
  {
    id: 'standard',
    title: 'Quick Browse Hotels',
    icon: 'fas fa-th-large',
    color: 'from-blue-500 to-blue-600',
    description: 'Compare hotels quickly with compact cards - perfect for budget and standard stays',
    type: 'standard'
  },
  {
    id: 'destination',
    title: 'Browse by Destination',
    icon: 'fas fa-map-marked-alt',
    color: 'from-green-500 to-green-600',
    description: 'Explore hotels by popular destinations and cities worldwide',
    type: 'destination'
  }
];

export default function Hotels() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showAllInSection, setShowAllInSection] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // REMOVED: All hardcoded sample data - now using only API data
  // Fetch hotel deals from API
  const { data: hotelDeals = [] } = useQuery({
    queryKey: ['travel-products'],
    queryFn: async () => {
      const response = await fetch('/api/products/page/travel-picks');
      if (!response.ok) throw new Error('Failed to fetch hotel deals');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string | number) => deleteProduct(productId, undefined, 'pickntrust2025'),
    onSuccess: () => {
      invalidateAllProductQueries(queryClient);
      toast({
        title: 'Hotel Deal Deleted',
        description: 'Hotel deal has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete hotel deal',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (dealId: string | number) => {
    if (confirm('Are you sure you want to delete this hotel deal?')) {
      deleteProductMutation.mutate(`travel_picks_${dealId}`);
    }
  };

  const handleWishlistToggle = (deal: HotelDeal) => {
    if (isInWishlist(deal.id)) {
      removeFromWishlist(deal.id);
      toast({
        title: 'Removed from wishlist',
        description: `${deal.name} removed from your wishlist`,
      });
    } else {
      addToWishlist({
        id: deal.id,
        name: deal.name,
        price: deal.price,
        imageUrl: deal.imageUrl || deal.image_url || '',
        affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
      });
      toast({
        title: 'Added to wishlist',
        description: `${deal.name} added to your wishlist`,
      });
    }
  };

  // Categorize hotels by UI type
  const categorizeHotels = (deals: HotelDeal[]) => {
    const categorized: {[key: string]: HotelDeal[]} = {
      featured: [],
      standard: [],
      destination: []
    };

    deals.forEach(deal => {
      // Categorize based on hotelType or auto-categorize
      if (deal.hotelType) {
        categorized[deal.hotelType].push(deal);
      } else {
        // Auto-categorize based on properties
        const name = deal.name.toLowerCase();
        const description = (deal.description || '').toLowerCase();
        const rating = parseFloat(deal.rating || '0');
        const price = parseFloat(deal.price || '0');
        
        if (deal.isFeatured || rating >= 4.5 || price >= 5000 || 
            name.includes('luxury') || name.includes('premium') || 
            description.includes('5 star') || description.includes('resort')) {
          categorized.featured.push(deal);
        } else if (deal.city || deal.location || name.includes('goa') || 
                   name.includes('delhi') || name.includes('mumbai') || 
                   name.includes('bangalore') || name.includes('dubai')) {
          categorized.destination.push(deal);
        } else {
          // Default to standard
          categorized.standard.push(deal);
        }
      }
    });

    return categorized;
  };

  const categorizedHotels = hotelDeals ? categorizeHotels(hotelDeals) : { featured: [], standard: [], destination: [] };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleShowAll = (sectionId: string) => {
    setShowAllInSection(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderHotelCard = (deal: HotelDeal, cardType: 'featured' | 'standard' | 'destination') => {
    const isWishlisted = isInWishlist(deal.id);

    if (cardType === 'featured') {
      // UI Card 1: Featured/Detailed hotel card (like Booking.com style)
      return (
    <UniversalPageLayout pageId="hotels">
            <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <img
                    src={deal.imageUrl || deal.image_url || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=300&fit=crop`}
                    alt={deal.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleWishlistToggle(deal)}
                      className={`p-2 rounded-full transition-colors ${
                        isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <i className="fas fa-heart text-sm"></i>
                    </button>
                  </div>
                  {deal.discount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {deal.discount}% OFF
                    </div>
                  )}
                  {deal.isFeatured && (
                    <div className="absolute bottom-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      <i className="fas fa-crown mr-1"></i>FEATURED
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{deal.name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {deal.location || deal.city || 'Prime Location'}
                      </p>
                      {deal.rating && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">
                            {deal.rating}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Very Good ({deal.reviewCount || '1365'} Ratings)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      {deal.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">₹{deal.originalPrice}</div>
                      )}
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{deal.price}</div>
                      <div className="text-xs text-gray-500">+ taxes & fees</div>
                      <div className="text-xs text-gray-500">Per Night</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {deal.description || 'Located near prime attractions, vibrant ambiance with clean rooms, friendly staff and great food'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center text-green-600">
                        <i className="fas fa-check mr-1"></i>Free Cancellation
                      </span>
                      <span className="flex items-center text-green-600">
                        <i className="fas fa-check mr-1"></i>Book with ₹0 Payment
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {isAdmin && (
                        <EnhancedShare
                          product={{
                            id: deal.id,
                            name: deal.name,
                            description: deal.description || '',
                            price: deal.price,
                            imageUrl: deal.imageUrl || deal.image_url || '',
                            category: 'Hotels',
                            affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                          }}
                          contentType="product"
                          className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                          buttonText=""
                          showIcon={true}
                        />
                      )}
                      
                      {!isAdmin && (
                        <SmartShareDropdown
                          product={{
                            id: deal.id,
                            name: deal.name,
                            description: deal.description || '',
                            price: deal.price,
                            imageUrl: deal.imageUrl || deal.image_url || '',
                            category: 'Hotels',
                            affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                          }}
                          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                          buttonText=""
                          showIcon={true}
                        />
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => window.open(deal.affiliateUrl || deal.affiliate_url, '_blank')}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Login to Book Now & Pay Later!
                    </button>
                  </div>
                </div>
              </div>
    </UniversalPageLayout>
  );
    } else if (cardType === 'standard') {
      // UI Card 2: Compact grid hotel cards
      return (
        <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={deal.imageUrl || deal.image_url || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop`}
              alt={deal.name}
              className="w-full h-32 object-cover"
            />
            <button
              onClick={() => handleWishlistToggle(deal)}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <i className="fas fa-heart text-xs"></i>
            </button>
            {deal.discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                {deal.discount}% OFF
              </div>
            )}
          </div>
          
          <div className="p-3">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm line-clamp-1">{deal.name}</h4>
            <p className="text-xs text-gray-500 mb-2">{deal.location || deal.city || 'Prime Location'}</p>
            
            {deal.rating && (
              <div className="flex items-center gap-1 mb-2">
                <div className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                  {deal.rating}
                </div>
                <span className="text-xs text-gray-500">({deal.reviewCount || '100'})</span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">₹{deal.price}</div>
                <div className="text-xs text-gray-500">Per Night</div>
              </div>
              {deal.originalPrice && (
                <div className="text-xs text-gray-500 line-through">₹{deal.originalPrice}</div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {isAdmin && (
                  <EnhancedShare
                    product={{
                      id: deal.id,
                      name: deal.name,
                      description: deal.description || '',
                      price: deal.price,
                      imageUrl: deal.imageUrl || deal.image_url || '',
                      category: 'Hotels',
                      affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                    }}
                    contentType="product"
                    className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                    buttonText=""
                    showIcon={true}
                  />
                )}
                
                {!isAdmin && (
                  <SmartShareDropdown
                    product={{
                      id: deal.id,
                      name: deal.name,
                      description: deal.description || '',
                      price: deal.price,
                      imageUrl: deal.imageUrl || deal.image_url || '',
                      category: 'Hotels',
                      affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                    }}
                    className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    buttonText=""
                    showIcon={true}
                  />
                )}
                
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
              
              <button
                onClick={() => window.open(deal.affiliateUrl || deal.affiliate_url, '_blank')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // UI Card 3: Destination-based browsing cards
      return (
        <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={deal.imageUrl || deal.image_url || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&h=80&fit=crop`}
                alt={deal.city || deal.location || deal.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {deal.city || deal.location || deal.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {deal.description || `Hotels, Budget Hotels, Resorts, Best Hotels, ${deal.location || 'Prime Location'}`}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">₹{deal.price}</div>
              <div className="text-xs text-gray-500">Per Night</div>
            </div>
            
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleWishlistToggle(deal)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <i className="fas fa-heart text-sm"></i>
              </button>
              
              {isAdmin && (
                <EnhancedShare
                  product={{
                    id: deal.id,
                    name: deal.name,
                    description: deal.description || '',
                    price: deal.price,
                    imageUrl: deal.imageUrl || deal.image_url || '',
                    category: 'Hotels',
                    affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                  }}
                  contentType="product"
                  className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                  buttonText=""
                  showIcon={true}
                />
              )}
              
              {!isAdmin && (
                <SmartShareDropdown
                  product={{
                    id: deal.id,
                    name: deal.name,
                    description: deal.description || '',
                    price: deal.price,
                    imageUrl: deal.imageUrl || deal.image_url || '',
                    category: 'Hotels',
                    affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                  }}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  buttonText=""
                  showIcon={true}
                />
              )}
              
              {isAdmin && (
                <button
                  onClick={() => handleDelete(deal.id)}
                  className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderHotelSection = (section: HotelSection) => {
    const sectionHotels = categorizedHotels[section.type] || [];
    
    // Don't render section if no hotels
    if (sectionHotels.length === 0) {
      return null;
    }

    const isExpanded = expandedSections[section.id] !== false; // Default to expanded
    const showAll = showAllInSection[section.id] || false;
    const displayLimit = section.type === 'featured' ? 3 : section.type === 'standard' ? 6 : 4;
    const displayHotels = showAll ? sectionHotels : sectionHotels.slice(0, displayLimit);
    const hasMore = sectionHotels.length > displayLimit;

    return (
      <div key={section.id} className="mb-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${section.color} text-white shadow-lg`}>
              <i className={`${section.icon} text-2xl`}></i>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {section.title} ({sectionHotels.length})
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => toggleSection(section.id)}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-lg`}></i>
          </button>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div>
            {/* Hotel Cards Grid */}
            <div className={`grid gap-6 mb-6 ${
              section.type === 'featured' ? 'grid-cols-1' :
              section.type === 'standard' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1'
            }`}>
              {displayHotels.map(hotel => 
                renderHotelCard(hotel, section.type)
              )}
            </div>

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => toggleShowAll(section.id)}
                  className={`px-8 py-4 bg-gradient-to-r ${section.color} text-white rounded-xl hover:shadow-lg transition-all font-semibold`}
                >
                  {showAll ? (
                    <><i className="fas fa-chevron-up mr-2"></i>Show Less</>
                  ) : (
                    <><i className="fas fa-chevron-down mr-2"></i>Show {sectionHotels.length - displayLimit} More Hotels</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Page Banner */}
      <StaticPageBanner 
        page="hotels"
      />
      
      <main className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              <i className="fas fa-bed mr-4 text-purple-600"></i>
              Hotel Deals & Bookings
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
              Discover amazing hotel deals from luxury resorts to budget stays. 
              Compare prices, read reviews, and book your perfect accommodation with confidence.
            </p>
          </div>

          {/* Hotel Sections */}
          <div className="space-y-12">
            {hotelSections.map(section => renderHotelSection(section))}
          </div>

          {/* No Hotels Message */}
          {(!hotelDeals || hotelDeals.length === 0) && (
            <div className="text-center py-20">
              <div className="text-8xl text-gray-300 dark:text-gray-600 mb-6">
                <i className="fas fa-bed"></i>
              </div>
              <h3 className="text-3xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                No Hotel Deals Available
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-8 text-lg">
                Hotel deals will appear here when added. Check back soon for amazing accommodation offers!
              </p>
              {isAdmin && (
                <Link href="/admin" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-lg font-semibold">
                  <i className="fas fa-plus mr-3"></i>
                  Add Hotel Deals
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Hotel Videos Section */}
      <PageVideosSection 
        page="hotels" 
        title="Hotel Travel Videos"
      />

      <ScrollNavigation />
    </div>
  );
}