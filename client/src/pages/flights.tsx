import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import PageBanner from '@/components/PageBanner';
import Sidebar from "@/components/sidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import { deleteProduct, invalidateAllProductQueries } from '@/utils/delete-utils';
import { useMutation } from '@tanstack/react-query';
import UniversalPageLayout from '@/components/UniversalPageLayout';

interface FlightDeal {
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
  flightType?: 'brands' | 'search' | 'destinations';
  routeType?: 'domestic' | 'international';
  route?: string;
  duration?: string;
  airline?: string;
  departure?: string;
  arrival?: string;
  rating?: string;
  reviewCount?: string;
  discount?: string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  validTill?: string;
  source?: string;
  networkBadge?: string;
  [key: string]: any;
}

interface FlightSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  type: 'brands' | 'search' | 'destinations';
}

const flightSections: FlightSection[] = [
  {
    id: 'brands',
    title: 'Airlines & Brand Promotions',
    icon: 'fas fa-plane-departure',
    color: 'from-blue-500 to-blue-600',
    description: 'Featured airlines with exclusive offers - AirAsia, Cathay Pacific, IndiGo and more',
    type: 'brands'
  },
  {
    id: 'search',
    title: 'Flight Search Results',
    icon: 'fas fa-search',
    color: 'from-purple-500 to-purple-600',
    description: 'Compare flight prices, timings, and book the best deals',
    type: 'search'
  },
  {
    id: 'destinations',
    title: 'Browse by Destinations',
    icon: 'fas fa-map-marked-alt',
    color: 'from-green-500 to-green-600',
    description: 'Explore popular destinations and cities worldwide',
    type: 'destinations'
  }
];

export default function Flights() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showAllInSection, setShowAllInSection] = useState<{[key: string]: boolean}>({});
  const [routeFilter, setRouteFilter] = useState<'all' | 'domestic' | 'international'>('all');
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
  // Fetch flight deals from API
  const { data: flightDeals = [] } = useQuery({
    queryKey: ['travel-products'],
    queryFn: async () => {
      const response = await fetch('/api/products/page/travel-picks');
      if (!response.ok) throw new Error('Failed to fetch flight deals');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Legacy sample data structure (now empty)
  const sampleFlightDeals: FlightDeal[] = [
    // Brands Section
    {
      id: 1,
      name: 'AirAsia Special Offer',
      description: 'Exclusive deals from AirAsia with up to 50% off on selected routes',
      price: '3999',
      originalPrice: '7999',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/airasia',
      airline: 'AirAsia',
      route: 'Delhi - Bangkok',
      departure: '06:30',
      arrival: '12:45',
      duration: '4h 15m',
      discount: '50',
      flightType: 'brands',
      routeType: 'international'
    },
    {
      id: 2,
      name: 'IndiGo Flash Sale',
      description: 'Limited time offer from IndiGo - Book now and save big!',
      price: '2499',
      originalPrice: '4999',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/indigo',
      airline: 'IndiGo',
      route: 'Mumbai - Delhi',
      departure: '08:00',
      arrival: '10:30',
      duration: '2h 30m',
      discount: '50',
      flightType: 'brands',
      routeType: 'domestic'
    },
    // Search Results Section
    {
      id: 3,
      name: 'Delhi to Goa Flight',
      description: 'Multiple airlines available with flexible timings',
      price: '5429',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/flight1',
      airline: 'Multiple Airlines',
      route: 'Delhi (DEL) → Goa (GOI)',
      departure: '15:40',
      arrival: '18:20',
      duration: '2h 40m',
      rating: '4.2',
      reviewCount: '1247',
      flightType: 'search',
      routeType: 'domestic'
    },
    {
      id: 4,
      name: 'Mumbai to Dubai Flight',
      description: 'Direct flights with premium airlines',
      price: '18999',
      originalPrice: '25999',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/flight2',
      airline: 'Emirates',
      route: 'Mumbai (BOM) → Dubai (DXB)',
      departure: '02:30',
      arrival: '05:15',
      duration: '3h 45m',
      rating: '4.8',
      reviewCount: '2156',
      discount: '27',
      flightType: 'search',
      routeType: 'international'
    },
    // Destinations Section
    {
      id: 5,
      name: 'Goa Flights',
      description: 'Explore beautiful beaches and vibrant nightlife in Goa',
      price: '4500',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/goa-flights',
      city: 'Goa',
      location: 'Goa, India',
      flightType: 'destinations',
      routeType: 'domestic'
    },
    {
      id: 6,
      name: 'Dubai Flights',
      description: 'Experience luxury shopping and modern architecture in Dubai',
      price: '22000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/dubai-flights',
      city: 'Dubai',
      location: 'Dubai, UAE',
      flightType: 'destinations',
      routeType: 'international'
    },
    {
      id: 7,
      name: 'Singapore Flights',
      description: 'Discover the garden city with amazing food and attractions',
      price: '28000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=200&fit=crop',
      affiliateUrl: 'https://example.com/singapore-flights',
      city: 'Singapore',
      location: 'Singapore',
      flightType: 'destinations',
      routeType: 'international'
    }
  ];

  // REMOVED: Now using API data from the useQuery above

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string | number) => deleteProduct(productId, undefined, 'pickntrust2025'),
    onSuccess: () => {
      invalidateAllProductQueries(queryClient);
      toast({
        title: 'Flight Deal Deleted',
        description: 'Flight deal has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete flight deal',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (dealId: string | number) => {
    if (confirm('Are you sure you want to delete this flight deal?')) {
      deleteProductMutation.mutate(`travel_picks_${dealId}`);
    }
  };

  const handleWishlistToggle = (deal: FlightDeal) => {
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

  // Categorize flights by UI section type
  const categorizeFlights = (deals: FlightDeal[]) => {
    const categorized: {[key: string]: FlightDeal[]} = {
      brands: [],
      search: [],
      destinations: []
    };

    deals.forEach(deal => {
      // Apply route filter first
      if (routeFilter !== 'all') {
        const routeType = deal.routeType || 
          (deal.route?.toLowerCase().includes('delhi') || deal.route?.toLowerCase().includes('mumbai') || 
           deal.route?.toLowerCase().includes('bangalore') || deal.route?.toLowerCase().includes('chennai') ? 'domestic' : 'international');
        
        if (routeType !== routeFilter) {
          return; // Skip this deal if it doesn't match the route filter
        }
      }

      // Categorize based on flightType or auto-categorize
      if (deal.flightType) {
        categorized[deal.flightType].push(deal);
      } else {
        // Auto-categorize based on properties
        const name = deal.name.toLowerCase();
        const description = (deal.description || '').toLowerCase();
        const airline = (deal.airline || '').toLowerCase();
        
        if (airline.includes('airasia') || airline.includes('cathay') || airline.includes('indigo') || 
            airline.includes('emirates') || airline.includes('qatar') || name.includes('airline') || 
            description.includes('brand') || description.includes('exclusive')) {
          categorized.brands.push(deal);
        } else if (deal.route && deal.departure && deal.arrival) {
          // Has detailed flight info - goes to search results
          categorized.search.push(deal);
        } else if (deal.city || deal.location || name.includes('goa') || name.includes('delhi') || 
                   name.includes('mumbai') || name.includes('dubai') || name.includes('singapore')) {
          categorized.destinations.push(deal);
        } else {
          // Default to search results
          categorized.search.push(deal);
        }
      }
    });

    return categorized;
  };

  const categorizedFlights = flightDeals ? categorizeFlights(flightDeals) : { brands: [], search: [], destinations: [] };

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

  const renderFlightCard = (deal: FlightDeal, cardType: 'brands' | 'search' | 'destinations') => {
    const isWishlisted = isInWishlist(deal.id);

    if (cardType === 'brands') {
      // UI Card 1: Brand/Airline promotion cards
      return (
    <UniversalPageLayout pageId="flights">
            <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={deal.imageUrl || deal.image_url || `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100&h=60&fit=crop`}
                      alt={deal.airline || 'Flight'}
                      className="w-12 h-8 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{deal.route || deal.name}</h4>
                      <p className="text-xs text-gray-500">{deal.airline || 'Multiple Airlines'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">₹{deal.price}</div>
                    {deal.originalPrice && (
                      <div className="text-xs text-gray-500 line-through">₹{deal.originalPrice}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>{deal.departure || '06:00'} - {deal.arrival || '08:30'}</span>
                  <span>{deal.duration || '2h 30m'}</span>
                </div>
      
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWishlistToggle(deal)}
                      className={`p-1.5 rounded-full transition-colors ${
                        isWishlisted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <i className="fas fa-heart text-xs"></i>
                    </button>
                    
                    {isAdmin && (
                      <EnhancedShare
                        product={{
                          id: deal.id,
                          name: deal.name,
                          description: deal.description || '',
                          price: deal.price,
                          imageUrl: deal.imageUrl || deal.image_url || '',
                          category: 'Flights',
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
                          category: 'Flights',
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
    </UniversalPageLayout>
  );
    } else if (cardType === 'search') {
      // UI Card 2: Flight search results cards
      return (
        <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={deal.imageUrl || deal.image_url || `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop`}
              alt={deal.name}
              className="w-full h-32 object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => handleWishlistToggle(deal)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <i className="fas fa-heart text-sm"></i>
              </button>
            </div>
            {deal.discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                {deal.discount}% OFF
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{deal.name}</h4>
              <div className="text-right">
                <div className="text-xl font-bold text-purple-600">₹{deal.price}</div>
                {deal.originalPrice && (
                  <div className="text-sm text-gray-500 line-through">₹{deal.originalPrice}</div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{deal.description}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
              <div><i className="fas fa-plane mr-1"></i>{deal.airline || 'Multiple Airlines'}</div>
              <div><i className="fas fa-clock mr-1"></i>{deal.duration || 'Various'}</div>
              <div><i className="fas fa-route mr-1"></i>{deal.route || 'Multiple Routes'}</div>
              <div><i className="fas fa-calendar mr-1"></i>{deal.validTill || 'Limited Time'}</div>
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
                      category: 'Flights',
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
                      category: 'Flights',
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
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Book Flight
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // UI Card 3: Destination browsing cards
      return (
        <div key={deal.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  <i className="fas fa-fire mr-1"></i>HOT DEAL
                </div>
                {deal.validTill && (
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Valid till {deal.validTill}
                  </div>
                )}
              </div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{deal.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{deal.description}</p>
            </div>
            
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-green-600">₹{deal.price}</div>
              {deal.originalPrice && (
                <div className="text-lg text-gray-500 line-through">₹{deal.originalPrice}</div>
              )}
              {deal.discount && (
                <div className="text-sm font-bold text-green-600">Save {deal.discount}%</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => handleWishlistToggle(deal)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
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
                    category: 'Flights',
                    affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                  }}
                  contentType="product"
                  className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
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
                    category: 'Flights',
                    affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
                  }}
                  className="p-2 rounded-full bg-white text-gray-600 hover:bg-gray-100"
                  buttonText=""
                  showIcon={true}
                />
              )}
              
              {isAdmin && (
                <button
                  onClick={() => handleDelete(deal.id)}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              )}
            </div>
            
            <button
              onClick={() => window.open(deal.affiliateUrl || deal.affiliate_url, '_blank')}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors animate-pulse"
            >
              <i className="fas fa-bolt mr-2"></i>Grab Deal
            </button>
          </div>
        </div>
      );
    }
  };

  const renderFlightSection = (section: FlightSection) => {
    const sectionFlights = categorizedFlights[section.type] || [];
    
    // Don't render section if no flights
    if (sectionFlights.length === 0) {
      return null;
    }

    const isExpanded = expandedSections[section.id] !== false; // Default to expanded
    const showAll = showAllInSection[section.id] || false;
    const displayLimit = 6; // Show 6 cards initially
    const displayFlights = showAll ? sectionFlights : sectionFlights.slice(0, displayLimit);
    const hasMore = sectionFlights.length > displayLimit;

    return (
      <div key={section.id} className="mb-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color} text-white`}>
              <i className={`${section.icon} text-xl`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {section.title} ({sectionFlights.length})
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{section.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => toggleSection(section.id)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div>
            {/* Flight Cards Grid */}
            <div className={`grid gap-4 mb-4 ${
              section.type === 'brands' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              section.type === 'search' ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1'
            }`}>
              {displayFlights.map(flight => 
                renderFlightCard(
                  flight, 
                  section.type
                )
              )}
            </div>

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => toggleShowAll(section.id)}
                  className={`px-6 py-3 bg-gradient-to-r ${section.color} text-white rounded-lg hover:shadow-lg transition-all`}
                >
                  {showAll ? (
                    <><i className="fas fa-chevron-up mr-2"></i>Show Less</>
                  ) : (
                    <><i className="fas fa-chevron-down mr-2"></i>Show {sectionFlights.length - displayLimit} More Flights</>
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
      <PageBanner 
        page="flights"
      />
      
      <main className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-plane mr-3 text-blue-600"></i>
              Flight Deals & Bookings
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
              Discover amazing flight deals for domestic and international travel. 
              Compare prices, find the best routes, and book your next adventure with confidence.
            </p>
            
            {/* Domestic/International Filter */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setRouteFilter('all')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  routeFilter === 'all' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-globe mr-2"></i>All Flights
              </button>
              <button
                onClick={() => setRouteFilter('domestic')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  routeFilter === 'domestic' 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-map-marker-alt mr-2"></i>Domestic
              </button>
              <button
                onClick={() => setRouteFilter('international')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  routeFilter === 'international' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-plane-departure mr-2"></i>International
              </button>
            </div>
          </div>

          {/* Flight Sections */}
          <div className="space-y-8">
            {flightSections.map(section => renderFlightSection(section))}
          </div>

          {/* No Flights Message */}
          {(!flightDeals || flightDeals.length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
                <i className="fas fa-plane"></i>
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Flight Deals Available
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Flight deals will appear here when added. Check back soon for amazing offers!
              </p>
              {isAdmin && (
                <Link href="/admin" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <i className="fas fa-plus mr-2"></i>
                  Add Flight Deals
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Flight Videos Section */}
      <PageVideosSection 
        page="flights" 
        title="Flight Travel Videos"
      />

      <ScrollNavigation />
    </div>
  );
}