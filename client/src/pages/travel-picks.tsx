import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import PageBanner from '@/components/PageBanner';
import { AnnouncementBanner } from "@/components/announcement-banner";
import Sidebar from "@/components/sidebar";
import WidgetRenderer from "@/components/WidgetRenderer";
import TravelNavigation from "@/components/TravelNavigation";
import SmartTravelSidebar from "@/components/SmartTravelSidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import TravelAddForm from '@/components/TravelAddForm';
import HoverActionButtons from '@/components/HoverActionButtons';

import { deleteProduct, invalidateAllProductQueries } from '@/utils/delete-utils';
import { useMutation } from '@tanstack/react-query';
import { CURRENCIES, CurrencyCode, useCurrency } from '@/contexts/CurrencyContext';
import CurrencySelector from '@/components/currency-selector';

interface TravelDeal {
  id: number | string;
  name: string;
  description?: string;
  price: string;
  originalPrice?: string | null;
  original_price?: string | null;
  currency?: string;
  imageUrl: string;
  image_url?: string;
  affiliateUrl: string;
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
  reviewCount?: string | number;
  review_count?: string | number;
  discount?: string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | string | null;
  displayPages?: string[];
  createdAt?: Date | string | null;
  hasLimitedOffer?: boolean | number;
  limitedOfferText?: string;
  limited_offer_text?: string;
  content_type?: string;
  source?: string;
  networkBadge?: string;
  travelType?: string;
  travel_type?: string;
  partner?: string;
  validTill?: string;
  route?: string;
  duration?: string;
  category_icon?: string;
  category_color?: string;
  sectionType?: 'featured' | 'standard' | 'destinations' | 'special' | 'cities' | 'trending';
  routeType?: 'domestic' | 'international';
  airline?: string;
  departure?: string;
  arrival?: string;
  location?: string;
  city?: string;
  amenities?: string[] | string;
  hotelType?: string;
  hotel_type?: string;
  roomType?: string;
  room_type?: string;
  cancellation?: string;
  isBrand?: boolean;
  flightClass?: string;
  flight_class?: string;
  stops?: string;
  // Tax and pricing fields
  taxes_amount?: string | number | null;
  gst_amount?: string | number | null;
  brand_badge?: string | null;
  // Flight add-on fields
  flight_price?: string | number | null;
  flight_route?: string | null;
  flight_details?: string | null;
  // Field styling
  field_colors?: any;
  field_styles?: any;
  card_background_color?: string;
  cardBackgroundColor?: string;
  [key: string]: any;
}

interface TravelSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  type: 'featured' | 'standard' | 'destinations' | 'special' | 'cities';
}

interface CategorySectionConfig {
  [categorySlug: string]: {
    sections: TravelSection[];
    hasFilter?: boolean;
    filterOptions?: string[];
  };
}

const categorySectionConfig: CategorySectionConfig = {
  flights: {
    sections: [
      {
        id: 'featured',
        title: 'Airlines & Brand Promotions',
        icon: 'fas fa-plane-departure',
        color: 'from-blue-500 to-blue-600',
        description: 'Featured airlines with exclusive offers',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Flight Search Results',
        icon: 'fas fa-search',
        color: 'from-purple-500 to-purple-600',
        description: 'Compare flight prices and timings',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-green-500 to-green-600',
        description: 'Explore popular destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'domestic', 'international']
  },
  hotels: {
    sections: [
      {
        id: 'featured',
        title: 'Featured Hotels & Premium Stays',
        icon: 'fas fa-crown',
        color: 'from-purple-500 to-purple-600',
        description: 'Luxury hotels and exclusive deals',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Quick Browse Hotels',
        icon: 'fas fa-th-large',
        color: 'from-blue-500 to-blue-600',
        description: 'Compare hotels quickly',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destination',
        icon: 'fas fa-map-marked-alt',
        color: 'from-green-500 to-green-600',
        description: 'Explore hotels by destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'luxury', 'budget', '3-star', '4-star', '5-star']
  },
  tours: {
    sections: [
      {
        id: 'trending',
        title: 'Trending Destinations',
        icon: 'fas fa-fire',
        color: 'from-orange-500 to-red-600',
        description: 'Discover the most popular travel destinations worldwide',
        type: 'destinations'
      },
      {
        id: 'featured',
        title: 'Featured Tour Packages & Premium Experiences',
        icon: 'fas fa-crown',
        color: 'from-purple-500 to-purple-600',
        description: 'Luxury tour packages and exclusive experiences',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Quick Browse Packages',
        icon: 'fas fa-th-large',
        color: 'from-blue-500 to-blue-600',
        description: 'Compare tour packages quickly',
        type: 'standard'
      }
     ],
     hasFilter: true,
     filterOptions: ['all', 'adventure', 'cultural', 'wildlife', 'beach', 'mountain']
   },
   cruises: {
    sections: [
      {
        id: 'featured',
        title: 'Our Featured Cruise Lines',
        icon: 'fas fa-crown',
        color: 'from-purple-500 to-purple-600',
        description: 'Luxury cruises and exclusive voyage deals',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Most-booked Cruise Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-blue-500 to-blue-600',
        description: 'Popular cruise destinations worldwide',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destinations',
        icon: 'fas fa-globe',
        color: 'from-purple-500 to-purple-600',
        description: 'Explore cruise destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'luxury', 'family', 'expedition', 'river', 'ocean']
  },
  bus: {
    sections: [
      {
        id: 'featured',
        title: 'Bus Operators & Brand Promotions',
        icon: 'fas fa-bus',
        color: 'from-blue-500 to-blue-600',
        description: 'Featured bus operators with exclusive offers',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Bus Search Results',
        icon: 'fas fa-search',
        color: 'from-purple-500 to-purple-600',
        description: 'Compare bus prices and timings',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-green-500 to-green-600',
        description: 'Explore popular bus destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'ac', 'non-ac', 'sleeper', 'seater']
  },
  packages: {
    sections: [
      {
        id: 'featured',
        title: 'Best Selling Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-orange-500 to-red-600',
        description: 'Mega Price Drop on Packages for Your October Long Weekend Trip. Use code: MOSTWANTED',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'International Destinations',
        icon: 'fas fa-globe-americas',
        color: 'from-blue-500 to-indigo-600',
        description: 'Explore amazing international destinations',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Visa Free Destinations',
        icon: 'fas fa-passport',
        color: 'from-green-500 to-teal-600',
        description: 'Up to 30% off! Limited time offer',
        type: 'destinations'
      },
      {
        id: 'special',
        title: 'Last Minute Deals',
        icon: 'fas fa-clock',
        color: 'from-purple-500 to-pink-600',
        description: 'Grab amazing deals before they expire',
        type: 'special'
      },
      {
        id: 'cities',
        title: 'Destination Packages',
        icon: 'fas fa-map-marker-alt',
        color: 'from-teal-500 to-cyan-600',
        description: 'Explore packages by popular destinations',
        type: 'cities'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'domestic', 'international', 'honeymoon', 'family', 'adventure']
  },
  train: {
    sections: [
      {
        id: 'featured',
        title: 'Train Operators & Brand Promotions',
        icon: 'fas fa-train',
        color: 'from-green-500 to-green-600',
        description: 'Featured train operators with exclusive offers',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Train Search Results',
        icon: 'fas fa-search',
        color: 'from-blue-500 to-blue-600',
        description: 'Compare train prices and timings',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-purple-500 to-purple-600',
        description: 'Explore popular train destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'ac', 'sleeper', '3ac', '2ac', '1ac']
  },
  'car-rental': {
    sections: [
      {
        id: 'featured',
        title: 'Car Rental Operators & Brand Promotions',
        icon: 'fas fa-car',
        color: 'from-green-500 to-green-600',
        description: 'Featured car rental operators with exclusive offers',
        type: 'featured'
      },
      {
        id: 'standard',
        title: 'Car Rental Search Results',
        icon: 'fas fa-search',
        color: 'from-blue-500 to-blue-600',
        description: 'Compare car rental prices and options',
        type: 'standard'
      },
      {
        id: 'destinations',
        title: 'Browse by Destinations',
        icon: 'fas fa-map-marked-alt',
        color: 'from-purple-500 to-purple-600',
        description: 'Explore popular car rental destinations',
        type: 'destinations'
      }
    ],
    hasFilter: true,
    filterOptions: ['all', 'economy', 'compact', 'suv', 'luxury', 'premium']
  }
};

export default function TravelPicks() {
  const { toast } = useToast();
  const { wishlist: wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState('flights');
  const [routeFilter, setRouteFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showAllInSection, setShowAllInSection] = useState<{[key: string]: boolean}>({});
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const [showAllSections, setShowAllSections] = useState<{[key: string]: boolean}>({});
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<TravelDeal | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [dynamicTravelDeals, setDynamicTravelDeals] = useState<TravelDeal[]>([]);
  
  // Admin platform settings
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  // Currency conversion
  const { convertPrice, currentCurrency: selectedCurrency, setCurrency: setSelectedCurrency } = useCurrency();
  
  const formatPrice = (price: string, currency: string = 'INR'): string => {
    const numPrice = parseFloat(price.replace(/,/g, ''));
    if (isNaN(numPrice)) return price;
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };
  
  // Wishlist helper
  const toggleWishlist = (item: any) => {
    const isWishlisted = wishlistItems.some(w => w.id === item.id);
    if (isWishlisted) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  // Auto-generated category images
  const getCategoryImage = (category: string, deal: TravelDeal) => {
    const categoryImages = {
      flights: deal.imageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=280&fit=crop',
      hotels: deal.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop',
      tours: deal.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=280&fit=crop',
      cruises: deal.imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=280&fit=crop',
      bus: deal.imageUrl || 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=280&fit=crop',
      train: deal.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=280&fit=crop'
    };
    return categoryImages[category as keyof typeof categoryImages] || deal.imageUrl || categoryImages.flights;
  };

  const getCategoryGradient = (category: string) => {
    const gradients = {
      flights: 'from-blue-500 to-blue-600',
      hotels: 'from-purple-500 to-purple-600',
      tours: 'from-green-500 to-green-600',
      cruises: 'from-teal-500 to-teal-600',
      bus: 'from-orange-500 to-orange-600',
      train: 'from-indigo-500 to-indigo-600'
    };
    return gradients[category as keyof typeof gradients] || gradients.flights;
  };

  // Travel card rendering functions will be implemented here

  // Currency symbol helper function
  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  // Flight card rendering function matching the provided image design
  const renderTravelCard = (deal: TravelDeal, cardType: 'featured' | 'standard' | 'destinations' | 'special' | 'cities', section?: TravelSection) => {
    // Safe price parsing with error handling
    const safeParsePrice = (priceStr: string | number | null | undefined): number => {
      if (!priceStr) return 0;
      const cleanPrice = String(priceStr).replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleanPrice);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const safePriceDisplay = (price: number, currency: string = selectedCurrency): string => {
      try {
        const convertedPrice = convertPrice(price, (deal.currency || 'INR') as any, selectedCurrency);
        const roundedPrice = Math.round(convertedPrice);
        return `${getCurrencySymbol(selectedCurrency)}${roundedPrice.toLocaleString()}`;
      } catch (error) {
        return `${getCurrencySymbol(selectedCurrency)}${Math.round(price).toLocaleString()}`;
      }
    };
    
    const basePrice = safeParsePrice(deal.price);
    const originalPrice = safeParsePrice(deal.originalPrice || deal.original_price);
    const displayPrice = safePriceDisplay(basePrice);
    const displayOriginalPrice = originalPrice > 0 ? safePriceDisplay(originalPrice) : null;
    const isWishlisted = wishlistItems.some(item => item.id === deal.id);
    
    // Tours section 1 - Trending Destinations (unique design inspired by trending destinations)
    if (selectedCategory === 'tours' && cardType === 'destinations') {
      // Get destination-specific styling for tours
      const getTourDestinationStyle = (dealName: string) => {
        const name = dealName.toLowerCase();
        if (name.includes('dubai')) {
          return {
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-amber-500/90 via-orange-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Dubai'
          };
        } else if (name.includes('paris')) {
          return {
            image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-blue-600/90 via-indigo-500/70 to-transparent',
            textColor: 'text-white',
            name: 'Paris'
          };
        } else if (name.includes('bali')) {
          return {
            image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-emerald-500/90 via-teal-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Bali'
          };
        } else if (name.includes('phuket')) {
          return {
            image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-cyan-500/90 via-blue-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Phuket'
          };
        } else if (name.includes('singapore')) {
          return {
            image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-purple-500/90 via-pink-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Singapore'
          };
        } else if (name.includes('bangkok')) {
          return {
            image: 'https://images.unsplash.com/photo-1563492065-1a4e2e8b8c3e?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-rose-500/90 via-pink-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Bangkok'
          };
        } else if (name.includes('london')) {
          return {
            image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-slate-600/90 via-gray-500/70 to-transparent',
            textColor: 'text-white',
            name: 'London'
          };
        } else if (name.includes('kuala lumpur')) {
          return {
            image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-green-500/90 via-emerald-400/70 to-transparent',
            textColor: 'text-white',
            name: 'Kuala Lumpur'
          };
        }
        return {
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80',
          gradient: 'from-blue-500/90 via-indigo-400/70 to-transparent',
          textColor: 'text-white',
          name: deal.name || 'Destination'
        };
      };
      
      const tourStyle = getTourDestinationStyle(deal.name);
      
      return (
        <div key={deal.id} className="group relative">
          <a
            href={deal.affiliateUrl || deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full h-[240px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
          >
          {/* Background Image */}
          <img
            src={tourStyle.image}
            alt={tourStyle.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
            }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${tourStyle.gradient}`}></div>
          
          {/* Content */}
           <div className="absolute inset-0 flex items-center justify-center">
             <h3 className={`text-3xl font-bold ${tourStyle.textColor} drop-shadow-lg text-center`}>
               {tourStyle.name}
             </h3>
           </div>
           
           {/* Hover CTA Button */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button className="bg-white text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                Pick Now
              </button>
            </div>
          </a>
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
    }
    
    // Flight section 1 - Featured airline cards (matching the image exactly)
    // Bus section 1 - Featured bus operator cards (matching the image exactly)
    // Train section 1 - Featured train operator cards (matching the image exactly)
    // Cruise section 1 - Featured cruise lines (matching the image exactly)
    // Hotels section 1 - Featured hotels with colorful gradients (matching the image exactly)
    // Packages section 1 - Special image-only layout (unique design)
    if (selectedCategory === 'packages' && cardType === 'featured') {
      // Get destination-specific image and styling
      const getPackageDestinationStyle = (dealName: string) => {
        const name = dealName.toLowerCase();
        if (name.includes('kerala')) {
          return {
            image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-green-600/80 via-emerald-500/60 to-transparent',
            accent: 'bg-emerald-500'
          };
        } else if (name.includes('thailand')) {
          return {
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-blue-600/80 via-cyan-500/60 to-transparent',
            accent: 'bg-cyan-500'
          };
        } else if (name.includes('andaman')) {
          return {
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-teal-600/80 via-turquoise-500/60 to-transparent',
            accent: 'bg-teal-500'
          };
        } else if (name.includes('south india')) {
          return {
            image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-orange-600/80 via-amber-500/60 to-transparent',
            accent: 'bg-orange-500'
          };
        } else if (name.includes('dubai')) {
          return {
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-purple-600/80 via-pink-500/60 to-transparent',
            accent: 'bg-purple-500'
          };
        } else if (name.includes('goa')) {
          return {
            image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-yellow-600/80 via-orange-500/60 to-transparent',
            accent: 'bg-yellow-500'
          };
        } else if (name.includes('vietnam')) {
          return {
            image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-indigo-600/80 via-blue-500/60 to-transparent',
            accent: 'bg-indigo-500'
          };
        } else if (name.includes('europe')) {
          return {
            image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=300&h=200&fit=crop&auto=format&q=80',
            gradient: 'from-red-600/80 via-rose-500/60 to-transparent',
            accent: 'bg-red-500'
          };
        }
        return {
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop&auto=format&q=80',
          gradient: 'from-blue-600/80 via-indigo-500/60 to-transparent',
          accent: 'bg-blue-500'
        };
      };
      
      const packageStyle = getPackageDestinationStyle(deal.name);
      
      return (
        <div key={deal.id} className="group relative">
          <a
            href={deal.affiliateUrl || deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block min-w-[280px] h-[200px] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
          >
          {/* Background Image */}
          <img
            src={packageStyle.image}
            alt={deal.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop&auto=format&q=80';
            }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${packageStyle.gradient} transition-opacity duration-500 group-hover:opacity-90`}></div>
          
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-500"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
            <div className={`w-3 h-3 ${packageStyle.accent} rounded-full animate-pulse`}></div>
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* Destination Name */}
            <h3 className="text-2xl font-bold text-white mb-2 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
              {deal.name}
            </h3>
            
            {/* Animated Underline */}
            <div className="w-0 h-1 bg-white rounded-full transition-all duration-500 group-hover:w-16"></div>
            
            {/* Hover Effect - Price/Offer */}
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-2">
              <span className="text-white/90 text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Starting ₹{deal.price}
              </span>
            </div>
          </div>
          
          {/* Corner Accent */}
          <div className="absolute top-0 left-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-white/10 transition-all duration-500 group-hover:border-t-white/20"></div>
          

        </a>
        <HoverActionButtons 
          deal={deal} 
          isAdmin={isAdmin}
        />
      </div>
      );
    }
    
    // Car Rental section 2 - Car Rental Search Results (Car booking style)
    if (selectedCategory === 'car-rental' && cardType === 'standard') {
      // Get car rental styling for car rental standard section
      const getCarRentalStyle = (dealName: string, index: number) => {
        // Use actual deal data instead of hardcoded sample data
        const fuelTypes = ['CNG/Diesel', 'CNG', 'Diesel', 'Petrol'];
        const fuelColors = ['bg-teal-500', 'bg-teal-600', 'bg-orange-600', 'bg-orange-700'];
        const ratings = ['4.4', '4.5', '4.3', '4.2'];
        
        return {
          name: dealName || 'Car Rental',
          subtitle: 'or similar',
          rating: ratings[index % ratings.length],
          seats: '4 Seats • AC',
          fuelType: fuelTypes[index % fuelTypes.length],
          fuelColor: fuelColors[index % fuelColors.length],
          price: displayPrice, // Use actual deal price
          originalPrice: displayOriginalPrice, // Use actual original price
          discount: displayOriginalPrice ? '16% off' : null,
          taxes: '+ taxes & charges',
          image: deal.imageUrl || deal.image_url || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=100&h=80&fit=crop&auto=format&q=80',
          badge: deal.isNew ? 'NEW' : null
        };
      };
      
      const carStyle = getCarRentalStyle(deal.name, Math.abs(parseInt(deal.id.toString().replace(/[^0-9]/g, '') || '0')) % 4);
      
      return (
        <div key={deal.id} className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
          {/* Background Image */}
          <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-200">
            <img
              src={deal.imageUrl || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop'}
              alt={deal.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* T&C's Apply Badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              T&C'S APPLY
            </div>
            
            {/* Hover CTA Button */}
             <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                 Pick Now
               </button>
             </div>
          </div>
          
          {/* Content */}
          <div className="p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{deal.name}</h3>
            <p className="text-gray-800 text-sm mb-4 leading-relaxed">{deal.description}</p>
            
            {/* Features */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1 text-sm text-gray-800 bg-white/70 px-3 py-1.5 rounded-full shadow-sm">
                <i className="fas fa-map-marker-alt text-purple-600"></i>
                <span className="font-medium">{deal.location}</span>
              </div>
              {deal.rating && (
                <div className="flex items-center space-x-1 text-sm text-gray-800 bg-white/70 px-3 py-1.5 rounded-full shadow-sm">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span className="font-medium">{deal.rating}</span>
                </div>
              )}
            </div>
            
            {/* Pricing and CTA */}
             <div className="flex items-center justify-between">
               <div>
                 <div className="text-2xl font-bold text-purple-700">{displayPrice}</div>
                 {displayOriginalPrice && (
                   <div className="text-sm text-gray-700 line-through">{displayOriginalPrice}</div>
                 )}
                 {(deal.taxes_amount || deal.gst_amount) && (
                   <div className="text-xs text-gray-600 mt-1">
                     + {deal.taxes_amount && `${getCurrencySymbol(deal.currency || 'INR')}${deal.taxes_amount} taxes`}
                     {deal.taxes_amount && deal.gst_amount && ' & '}
                     {deal.gst_amount && `${getCurrencySymbol(deal.currency || 'INR')}${deal.gst_amount} GST`}
                     {(deal.taxes_amount || deal.gst_amount) && ' & fees'}
                   </div>
                 )}
               </div>
               <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                 Pick Now
               </button>
             </div>
          </div>
          
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
    }
    
    // Tours section 3 - Quick Browse Packages (Trending Activities style)
    if (selectedCategory === 'tours' && cardType === 'standard') {
      // Get trending activity styling for tours standard section
      const getTrendingActivityStyle = (dealName: string, index: number) => {
        // Use actual deal data instead of hardcoded sample data
        const gradients = [
          'from-orange-600/90 via-yellow-500/80 to-red-600/90',
          'from-purple-600/90 via-indigo-500/80 to-blue-600/90',
          'from-pink-600/90 via-purple-500/80 to-blue-600/90',
          'from-cyan-600/90 via-teal-500/80 to-blue-600/90'
        ];
        
        const locations = ['Dubai', 'Singapore', 'Paris', 'Phuket'];
        
        return {
          name: dealName || 'Tour Package',
          price: displayPrice, // Use actual deal price
          image: deal.imageUrl || deal.image_url || 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=80',
          gradient: gradients[index % gradients.length],
          location: deal.location || deal.city || locations[index % locations.length]
        };
      };
      
      const activityStyle = getTrendingActivityStyle(deal.name, Math.abs(parseInt(deal.id.toString().replace(/[^0-9]/g, '') || '0')) % 4);
      
      return (
        <div key={deal.id} className="group relative">
          <a
            href={deal.affiliateUrl || deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full h-[280px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
          {/* Background Image */}
          <img
            src={activityStyle.image}
            alt={activityStyle.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
            }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${activityStyle.gradient}`}></div>
          
          {/* Location Badge */}
          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <i className="fas fa-map-marker-alt mr-1"></i>
            {activityStyle.location}
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white mb-2 leading-tight">
              {activityStyle.name}
            </h3>
            <p className="text-white/90 text-sm font-medium">
              {activityStyle.price}
            </p>
          </div>
          
          {/* Hover CTA Button */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button className="bg-white text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Pick Now
            </button>
          </div>
          </a>
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
    }
    
    // Tours section 2 - Featured Tour Packages (Top Things To Do style with numbered cards)
    if (selectedCategory === 'tours' && cardType === 'featured') {
      // Get activity-specific styling for tours
      const getTourActivityStyle = (dealName: string, index: number) => {
        const activities = [
           {
             name: 'The Burj Khalifa Tickets',
             image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-blue-600/90 via-indigo-500/80 to-purple-600/90'
           },
           {
             name: 'Desert Safari Dubai',
             image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-orange-600/90 via-yellow-500/80 to-red-600/90'
           },
           {
             name: 'Universal Studios Singapore',
             image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-purple-600/90 via-pink-500/80 to-blue-600/90'
           },
           {
             name: 'Safari World Bangkok',
             image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-green-600/90 via-teal-500/80 to-emerald-600/90'
           },
           {
             name: 'Eiffel Tower Paris',
             image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-rose-600/90 via-pink-500/80 to-red-600/90'
           }
         ];
        
        const activity = activities[index % activities.length];
         return {
           ...activity,
           number: index + 1
         };
       };
       
       const activityStyle = getTourActivityStyle(deal.name, Math.abs(parseInt(deal.id.toString().replace(/[^0-9]/g, '') || '0')) % 5);
      
      return (
        <div className="group relative">
          <a
            key={deal.id}
            href={deal.affiliateUrl || deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full h-[200px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
          {/* Background Image */}
          <img
            src={activityStyle.image}
            alt={activityStyle.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
            }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${activityStyle.gradient}`}></div>
          
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white mb-2 leading-tight">
              {activityStyle.name}
            </h3>
          </div>
          
          {/* Hover CTA Button */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button className="bg-white text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Pick Now
            </button>
          </div>
          </a>
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
    }
    
    const transportCategories = ['flights', 'bus', 'train', 'cruises', 'hotels', 'car-rental'] as const;
    if (transportCategories.includes(selectedCategory as any) && cardType === 'featured') {
      // Parse field colors and styles if available
      let fieldColors = {};
      let fieldStyles = {};
      try {
        if (deal.field_colors) {
          fieldColors = typeof deal.field_colors === 'string' ? JSON.parse(deal.field_colors) : deal.field_colors;
        }
        if (deal.field_styles) {
          fieldStyles = typeof deal.field_styles === 'string' ? JSON.parse(deal.field_styles) : deal.field_styles;
        }
      } catch (e) {
        console.warn('Failed to parse field colors/styles for deal:', deal.id, e);
      }
      
      // Helper function to get field styling
      const getFieldStyle = (fieldName: string) => {
        const style: any = {};
        if (fieldColors[fieldName]) {
          style.color = fieldColors[fieldName];
        }
        if (fieldStyles[fieldName]) {
          const fieldStyle = fieldStyles[fieldName];
          if (typeof fieldStyle === 'object') {
            if (fieldStyle.bold) style.fontWeight = 'bold';
            if (fieldStyle.italic) style.fontStyle = 'italic';
            if (fieldStyle.underline) style.textDecoration = 'underline';
            if (fieldStyle.strikethrough) style.textDecoration = 'line-through';
          } else {
            // Handle legacy string format
            if (fieldStyle === 'bold') style.fontWeight = 'bold';
            if (fieldStyle === 'italic') style.fontStyle = 'italic';
          }
        }
        return style;
      };
      // Determine gradient and colors based on transport type and operator
        const getTransportStyle = (dealName: string, category: string) => {
          if (category === 'bus') {
            if (dealName.toLowerCase().includes('brs') || dealName.toLowerCase().includes('travels')) {
              return {
                gradient: 'bg-gradient-to-r from-green-600 via-blue-600 to-blue-700',
                icon: 'fas fa-bus',
                tagline: 'Safe. Reliable. Comfortable.',
                operatorName: 'BRS Travels'
              };
            } else if (dealName.toLowerCase().includes('redbus') || dealName.toLowerCase().includes('red bus')) {
              return {
                gradient: 'bg-gradient-to-r from-red-500 via-red-600 to-red-700',
                icon: 'fas fa-bus',
                tagline: 'India\'s Largest Bus Network',
                operatorName: 'RedBus'
              };
            } else {
              return {
                gradient: 'bg-gradient-to-r from-green-600 via-blue-600 to-blue-700',
                icon: 'fas fa-bus',
                tagline: 'Safe. Reliable. Comfortable.',
                operatorName: 'BRS Travels'
              };
            }
          } else if (category === 'train') {
             if (dealName.toLowerCase().includes('irctc') || dealName.toLowerCase().includes('indian railways')) {
               return {
                 gradient: 'bg-gradient-to-r from-orange-600 via-green-600 to-blue-600',
                 icon: 'fas fa-train',
                 tagline: 'Lifeline of the Nation',
                 operatorName: 'Indian Railways'
               };
             } else if (dealName.toLowerCase().includes('rajdhani') || dealName.toLowerCase().includes('express')) {
               return {
                 gradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600',
                 icon: 'fas fa-train',
                 tagline: 'Premium Express Service',
                 operatorName: 'Rajdhani Express'
               };
             } else {
               return {
                 gradient: 'bg-gradient-to-r from-orange-600 via-green-600 to-blue-600',
                 icon: 'fas fa-train',
                 tagline: 'Lifeline of the Nation',
                 operatorName: 'Indian Railways'
               };
             }
           } else if (category === 'car-rental') {
             if (dealName.toLowerCase().includes('ola') || dealName.toLowerCase().includes('ola cabs')) {
               return {
                 gradient: 'bg-gradient-to-r from-green-500 via-lime-500 to-green-600',
                 icon: 'fas fa-car',
                 tagline: deal.description || 'Moving India Forward',
                 operatorName: deal.name || 'Ola'
               };
             } else if (dealName.toLowerCase().includes('uber')) {
               return {
                 gradient: 'bg-gradient-to-r from-black via-gray-800 to-black',
                 icon: 'fas fa-car',
                 tagline: deal.description || 'Move the way you want',
                 operatorName: deal.name || 'Uber'
               };
             } else if (dealName.toLowerCase().includes('zoomcar') || dealName.toLowerCase().includes('zoom car')) {
               return {
                 gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600',
                 icon: 'fas fa-car',
                 tagline: deal.description || 'Self Drive Car Rental',
                 operatorName: deal.name || 'Zoomcar'
               };
             } else if (dealName.toLowerCase().includes('revv')) {
               return {
                 gradient: 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600',
                 icon: 'fas fa-car',
                 tagline: deal.description || 'Self Drive Made Easy',
                 operatorName: deal.name || 'Revv'
               };
             } else {
               return {
                 gradient: deal.card_background_color || deal.cardBackgroundColor || 'bg-gradient-to-r from-green-500 via-lime-500 to-green-600',
                 icon: 'fas fa-car',
                 tagline: deal.description || `Starting from ${displayPrice}`,
                 operatorName: deal.name || deal.car_type || 'Car Rental'
               };
             }
           } else if (category === 'cruises') {
             if (dealName.toLowerCase().includes('stardream') || dealName.toLowerCase().includes('star dream')) {
               return {
                 gradient: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600',
                 icon: 'fas fa-ship',
                 tagline: `Starting from ${displayPrice}`,
                 operatorName: 'StarDream Cruises'
               };
             } else if (dealName.toLowerCase().includes('cordelia')) {
               return {
                 gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
                 icon: 'fas fa-ship',
                 tagline: deal.description || `Starting from ${displayPrice}`,
                 operatorName: deal.name || 'Cordelia'
               };
             } else if (dealName.toLowerCase().includes('royal caribbean') || dealName.toLowerCase().includes('royal')) {
               return {
                 gradient: 'bg-gradient-to-r from-blue-600 via-navy-600 to-blue-700',
                 icon: 'fas fa-ship',
                 tagline: `Starting from ${displayPrice}`,
                 operatorName: 'Royal Caribbean'
               };
             } else {
               return {
                 gradient: deal.card_background_color || deal.cardBackgroundColor || 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600',
                 icon: 'fas fa-ship',
                 tagline: deal.description || `Starting from ${displayPrice}`,
                 operatorName: deal.name || deal.cruise_line || 'Cruise Line'
               };
             }
           } else if (category === 'hotels') {
             if (dealName.toLowerCase().includes('taj') || dealName.toLowerCase().includes('mahal')) {
               return {
                 gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
                 icon: 'fas fa-crown',
                 tagline: 'Luxury Redefined',
                 operatorName: 'Taj Hotels'
               };
             } else if (dealName.toLowerCase().includes('marriott')) {
               return {
                 gradient: 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600',
                 icon: 'fas fa-hotel',
                 tagline: 'Wonderful Hospitality',
                 operatorName: 'Marriott'
               };
             } else if (dealName.toLowerCase().includes('hilton')) {
               return {
                 gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600',
                 icon: 'fas fa-hotel',
                 tagline: 'Be Hospitable',
                 operatorName: 'Hilton'
               };
             } else if (dealName.toLowerCase().includes('itc') || dealName.toLowerCase().includes('grand')) {
               return {
                 gradient: 'bg-gradient-to-r from-green-500 via-teal-500 to-green-600',
                 icon: 'fas fa-crown',
                 tagline: 'Responsible Luxury',
                 operatorName: 'ITC Hotels'
               };
             } else {
               return {
                 gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
                 icon: 'fas fa-hotel',
                 tagline: 'Premium Hospitality',
                 operatorName: deal.name.split(' ')[0] || 'Luxury Hotels'
               };
             }
           } else {
           // Flight operators
           if (dealName.toLowerCase().includes('airasia') || dealName.toLowerCase().includes('air asia')) {
             return {
               gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600',
               icon: 'fas fa-plane',
               tagline: 'Now Everyone Can Fly',
               operatorName: 'AirAsia'
             };
           } else if (dealName.toLowerCase().includes('cathay') || dealName.toLowerCase().includes('pacific')) {
             return {
               gradient: 'bg-gradient-to-r from-teal-500 via-green-500 to-green-600',
               icon: 'fas fa-plane',
               tagline: 'Life Well Travelled',
               operatorName: 'Cathay Pacific'
             };
           } else if (dealName.toLowerCase().includes('emirates')) {
             return {
               gradient: 'bg-gradient-to-r from-red-500 via-red-600 to-orange-600',
               icon: 'fas fa-plane',
               tagline: 'Fly Better',
               operatorName: 'Emirates'
             };
           } else if (dealName.toLowerCase().includes('indigo')) {
             return {
               gradient: 'bg-gradient-to-r from-indigo-500 via-blue-500 to-blue-600',
               icon: 'fas fa-plane',
               tagline: 'On Time Performance',
               operatorName: 'IndiGo'
             };
           } else {
             return {
               gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600',
               icon: 'fas fa-plane',
               tagline: 'Discover Amazing Deals',
               operatorName: deal.airline || deal.name.split(' - ')[0] || deal.name
             };
           }
         }
       };
      
      const transportStyle = getTransportStyle(deal.name, selectedCategory);
      
      return (
        <div key={deal.id} className="group relative">
          <a
            href={deal.affiliateUrl || deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative ${transportStyle.gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden block`}
            style={{ minHeight: '140px', minWidth: '350px' }}
          >

           
           {/* Background decorative elements */}
           <div className="absolute top-0 right-0 opacity-20">
             <i className={`${transportStyle.icon} text-6xl transform rotate-12 translate-x-4 -translate-y-2`}></i>
           </div>
           
           {/* Main content */}
           <div className="relative z-10 flex items-center justify-between h-full">
             <div className="flex-1">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                   <i className={`${transportStyle.icon} text-xl`}></i>
                 </div>
                 <div className="flex-1">
                   <h3 className="text-2xl font-bold text-white mb-1" style={getFieldStyle('name')}>
                     {transportStyle.operatorName}
                   </h3>
                   <p className="text-white text-opacity-90 text-sm font-medium" style={getFieldStyle('tagline')}>{transportStyle.tagline}</p>
                 </div>
               </div>
               
               {/* Features and CTA */}
               <div className="flex items-center justify-between mt-4">
                 <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2 text-white text-opacity-80 text-xs">
                     <i className="fas fa-star text-yellow-300"></i>
                     <span>Premium Service</span>
                   </div>
                   <div className="flex items-center gap-2 text-white text-opacity-80 text-xs">
                     <i className="fas fa-shield-alt text-green-300"></i>
                     <span>Secure Booking</span>
                   </div>
                 </div>
                 <button className="bg-white bg-opacity-20 hover:bg-white hover:text-gray-800 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-0 text-sm">
                   Pick Now
                 </button>
               </div>
             </div>
             
             {/* Right side content */}
             <div className="flex flex-col items-end text-right ml-6">
               {/* Promotional badge */}
               <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold mb-2 animate-pulse">
                 EXCLUSIVE
               </div>
               
               {/* Pricing info */}
               <div className="text-white mb-2">
                 <div className="text-lg font-bold">Starting from</div>
                 <div className="text-2xl font-black text-yellow-200" style={getFieldStyle('price')}>
                   {displayPrice}
                 </div>
                 <div className="text-xs text-white text-opacity-70">per person</div>
                 {displayOriginalPrice && (
                   <div className="text-sm text-white text-opacity-60 line-through">{displayOriginalPrice}</div>
                 )}
                 {(deal.taxes_amount || deal.gst_amount) && (
                   <div className="text-xs text-white text-opacity-80 mt-1">
                     + {deal.taxes_amount && `${getCurrencySymbol(deal.currency || 'INR')}${deal.taxes_amount} taxes`}
                     {deal.taxes_amount && deal.gst_amount && ' & '}
                     {deal.gst_amount && `${getCurrencySymbol(deal.currency || 'INR')}${deal.gst_amount} GST`}
                     {(deal.taxes_amount || deal.gst_amount) && ' & fees'}
                   </div>
                 )}
               </div>
               
               {/* Additional features */}
               <div className="flex flex-col gap-1 text-xs text-white text-opacity-80">
                 <div className="flex items-center gap-1">
                   <i className="fas fa-clock"></i>
                   <span>24/7 Support</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <i className="fas fa-gift"></i>
                   <span>Special Offers</span>
                 </div>
               </div>
             </div>

          </div>
          </a>
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
    }
     
     // Cruise section 2 - Most-booked Cruise Destinations (matching the image exactly)
     if (selectedCategory === 'cruises' && cardType === 'standard') {
       const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
       const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
       
       // Parse field colors and styles if available
       let fieldColors = {};
       let fieldStyles = {};
       try {
         if (deal.field_colors) {
           fieldColors = typeof deal.field_colors === 'string' ? JSON.parse(deal.field_colors) : deal.field_colors;
         }
         if (deal.field_styles) {
           fieldStyles = typeof deal.field_styles === 'string' ? JSON.parse(deal.field_styles) : deal.field_styles;
         }
       } catch (e) {
         console.warn('Failed to parse field colors/styles for deal:', deal.id, e);
       }
       
       // Helper function to get field styling
       const getFieldStyle = (fieldName: string) => {
         const style: any = {};
         if (fieldColors[fieldName]) {
           style.color = fieldColors[fieldName];
         }
         if (fieldStyles[fieldName]) {
           const fieldStyle = fieldStyles[fieldName];
           if (typeof fieldStyle === 'object') {
             if (fieldStyle.bold) style.fontWeight = 'bold';
             if (fieldStyle.italic) style.fontStyle = 'italic';
             if (fieldStyle.underline) style.textDecoration = 'underline';
             if (fieldStyle.strikethrough) style.textDecoration = 'line-through';
           } else {
             // Handle legacy string format
             if (fieldStyle === 'bold') style.fontWeight = 'bold';
             if (fieldStyle === 'italic') style.fontStyle = 'italic';
           }
         }
         return style;
       };
       
       // Get cruise-specific images
        const getCruiseImage = (destination: string) => {
          if (destination.toLowerCase().includes('mumbai')) {
            return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format&q=80'; // Cruise ship at Mumbai port
          } else if (destination.toLowerCase().includes('australia')) {
            return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format&q=80'; // Cruise ship near Australia
          } else if (destination.toLowerCase().includes('singapore')) {
            return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=80'; // Cruise ship at Singapore port
          } else if (destination.toLowerCase().includes('kochi')) {
            return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format&q=80'; // Cruise ship in coastal waters
          }
          return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format&q=80'; // Default cruise ship
        };
       
       const destinationName = deal.name || deal.arrival || 'Mumbai';
        const cruiseImage = getCruiseImage(destinationName);
       
       // Get destination-specific gradient
        const getDestinationGradient = (destination: string) => {
          if (destination.toLowerCase().includes('mumbai')) {
            return 'bg-gradient-to-br from-orange-400 to-pink-500';
          } else if (destination.toLowerCase().includes('australia')) {
            return 'bg-gradient-to-br from-blue-400 to-purple-500';
          } else if (destination.toLowerCase().includes('singapore')) {
            return 'bg-gradient-to-br from-green-400 to-blue-500';
          } else if (destination.toLowerCase().includes('kochi')) {
            return 'bg-gradient-to-br from-teal-400 to-cyan-500';
          }
          return 'bg-gradient-to-br from-blue-400 to-purple-500';
        };
        
        const gradientClass = deal.card_background_color || deal.cardBackgroundColor || getDestinationGradient(destinationName);
        
        // Use custom gradient class format
        const backgroundClass = gradientClass.startsWith('from-') ? `bg-gradient-to-br ${gradientClass}` : gradientClass;
        
        return (
          <div className="group relative">
            <a
              key={deal.id}
              href={deal.affiliateUrl || deal.affiliate_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 w-full max-w-[400px] relative block"
            >
            
            {/* Cruise image */}
             <div className="relative h-48 overflow-hidden">
               <img 
                 src={cruiseImage}
                 alt={`Cruise to ${destinationName}`}
                 className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format&q=80';
                 }}
               />
             </div>
            
            {/* Colorful content area */}
            <div className={`p-4 ${backgroundClass}`}>
              <h3 className="text-lg font-semibold text-white mb-2" style={getFieldStyle('name')}>{destinationName}</h3>
              <p className="text-white/90 text-sm mb-3" style={getFieldStyle('price')}>Starting from {displayPrice} per person</p>
              
              {/* Separator line */}
              <div className="h-px bg-white/30 mb-3"></div>
              
              {/* Pick Now CTA Button */}
              <div className="flex justify-center">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(deal.affiliateUrl || deal.affiliate_url || '#', '_blank');
                  }}
                  className="bg-white bg-opacity-20 hover:bg-white hover:text-gray-800 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-0 text-sm z-30 relative"
                >
                  Pick Now
                </button>
              </div>

           </div>
            </a>
            <HoverActionButtons 
              deal={deal} 
              isAdmin={isAdmin}
            />
         </div>
       );
     }
     
     // Hotel section 2 - Quick Browse Hotels (horizontal card style like MMT with colorful gradients)
     if (selectedCategory === 'hotels' && cardType === 'standard') {
       const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
       const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
       
       // Parse field colors and styles if available
       let fieldColors = {};
       let fieldStyles = {};
       try {
         if (deal.field_colors) {
           fieldColors = typeof deal.field_colors === 'string' ? JSON.parse(deal.field_colors) : deal.field_colors;
         }
         if (deal.field_styles) {
           fieldStyles = typeof deal.field_styles === 'string' ? JSON.parse(deal.field_styles) : deal.field_styles;
         }
       } catch (e) {
         console.warn('Failed to parse field colors/styles for deal:', deal.id, e);
       }
       
       // Helper function to get field styling
       const getFieldStyle = (fieldName: string) => {
         const style: any = {};
         if (fieldColors[fieldName]) {
           style.color = fieldColors[fieldName];
         }
         if (fieldStyles[fieldName]) {
           const fieldStyle = fieldStyles[fieldName];
           if (typeof fieldStyle === 'object') {
             if (fieldStyle.bold) style.fontWeight = 'bold';
             if (fieldStyle.italic) style.fontStyle = 'italic';
             if (fieldStyle.underline) style.textDecoration = 'underline';
             if (fieldStyle.strikethrough) style.textDecoration = 'line-through';
           } else {
             // Handle legacy string format
             if (fieldStyle === 'bold') style.fontWeight = 'bold';
             if (fieldStyle === 'italic') style.fontStyle = 'italic';
           }
         }
         return style;
       };
       
       // Get hotel-specific images
       const getHotelImage = (hotelName: string) => {
         if (hotelName.toLowerCase().includes('resort') || hotelName.toLowerCase().includes('primo')) {
           return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&auto=format&q=80'; // Beach resort
         } else if (hotelName.toLowerCase().includes('seashell') || hotelName.toLowerCase().includes('suites')) {
           return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&auto=format&q=80'; // Luxury hotel
         } else if (hotelName.toLowerCase().includes('treebo') || hotelName.toLowerCase().includes('business')) {
           return 'https://images.unsplash.com/photo-1578774204375-8f9d5e6e4e6e?w=300&h=200&fit=crop&auto=format&q=80'; // Business hotel
         }
         return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&auto=format&q=80'; // Default hotel
       };
       
       // Get hotel-specific gradient
       const getHotelGradient = (hotelName: string) => {
         if (hotelName.toLowerCase().includes('resort') || hotelName.toLowerCase().includes('primo')) {
           return 'bg-gradient-to-r from-teal-400 to-blue-500'; // Beach resort colors
         } else if (hotelName.toLowerCase().includes('seashell') || hotelName.toLowerCase().includes('suites')) {
           return 'bg-gradient-to-r from-purple-400 to-pink-500'; // Luxury colors
         } else if (hotelName.toLowerCase().includes('treebo') || hotelName.toLowerCase().includes('business')) {
           return 'bg-gradient-to-r from-blue-400 to-indigo-500'; // Business colors
         }
         return 'bg-gradient-to-r from-green-400 to-blue-500'; // Default
       };
       
       const hotelName = deal.name || 'Hotel';
       // Prioritize admin-provided image URL, then fallback to generated image
       const hotelImage = deal.imageUrl || deal.image_url || getHotelImage(hotelName);
       const gradientClass = deal.card_background_color || deal.cardBackgroundColor || getHotelGradient(hotelName);
       
       // Use custom gradient class format
       const backgroundClass = gradientClass.startsWith('from-') ? `bg-gradient-to-r ${gradientClass}` : gradientClass;
       
       return (
         <div className="group relative">
           <a
             key={deal.id}
             href={deal.affiliateUrl || deal.affiliate_url || '#'}
             target="_blank"
             rel="noopener noreferrer"
             className={`relative ${backgroundClass} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden w-full block`}
           >
           
           <div className="flex items-center p-4">
             {/* Hotel image - Left side */}
             <div className="relative w-64 h-40 flex-shrink-0 rounded-xl overflow-hidden mr-6">
               <img 
                 src={hotelImage}
                 alt={hotelName}
                 className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&auto=format&q=80';
                 }}
               />
               {/* View All badge */}
               <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                 View All
               </div>
             </div>
             
             {/* Hotel content - Middle section */}
             <div className="flex-1 text-white">
               {/* Brand badge - only show if configured */}
               {deal.brand_badge && (
                 <div className="flex items-center mb-2">
                   <div className="bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">
                     {deal.brand_badge}
                   </div>
                   <div className="flex items-center">
                     <i className="fas fa-check-circle text-green-400 mr-1"></i>
                   </div>
                 </div>
               )}
               
               {/* Hotel name and rating */}
               <h3 className="text-lg font-semibold text-white mb-1" style={getFieldStyle('name')}>{hotelName}</h3>
               <div className="flex items-center text-sm text-white/90 mb-2">
                 <div className="flex items-center mr-4">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <i 
                       key={star}
                       className={`fas fa-star ${
                         star <= (parseInt(String(deal.rating || '3')) || 3) ? 'text-yellow-400' : 'text-white/50'
                       }`}
                     ></i>
                   ))}
                   <span className="ml-2 text-xs text-white/70">({String(deal.rating || '4.1')})</span>
                 </div>
               </div>
               
               {/* Location */}
               <p className="text-white/90 text-sm mb-2" style={getFieldStyle('location')}>
                 <i className="fas fa-map-marker-alt mr-1"></i>
                 {deal.location || deal.city || 'Prime Location'}
                 {deal.distance_to_beach && ` | ${deal.distance_to_beach}`}
                 {deal.walk_time && ` | ${deal.walk_time}`}
               </p>
               
               {/* Amenities */}
               <div className="flex items-center mb-2">
                 {deal.amenities ? (
                   (typeof deal.amenities === 'string' ? deal.amenities.split(',') : deal.amenities).slice(0, 2).map((amenity, index) => (
                     <span key={index} className="bg-white/20 text-white text-xs px-2 py-1 rounded mr-2">
                       {typeof amenity === 'string' ? amenity.trim() : amenity}
                     </span>
                   ))
                 ) : (
                   <span className="bg-white/20 text-white text-xs px-2 py-1 rounded mr-2">
                     {deal.hotel_type || 'Resort'}
                   </span>
                 )}
               </div>
               
               {/* Description */}
               <p className="text-white/80 text-sm">
                 <i className="fas fa-info-circle mr-1"></i>
                 {deal.description || `${deal.hotel_type || 'Beautiful'} location with excellent facilities and service`}
               </p>
             </div>
             
             {/* Pricing and CTA - Right side */}
             <div className="text-right text-white ml-4">
               {/* Rating */}
               <div className="flex items-center justify-end mb-2">
                 <div className="text-right mr-2">
                   <div className="text-sm font-medium">
                     {(() => {
                       const rating = parseFloat(String(deal.rating || '4.1')) || 4.1;
                       if (rating >= 4.5) return 'Excellent';
                       if (rating >= 4.0) return 'Very Good';
                       if (rating >= 3.5) return 'Good';
                       if (rating >= 3.0) return 'Average';
                       return 'Fair';
                     })()} 
                   </div>
                   <div className="text-xs text-white/80">({String(deal.reviewCount || deal.review_count || '1240')} Ratings)</div>
                 </div>
                 <div className={`text-white px-2 py-1 rounded text-sm font-bold ${
                   (parseFloat(String(deal.rating || '4.1')) || 4.1) >= 4.0 ? 'bg-green-600' : 
                   (parseFloat(String(deal.rating || '4.1')) || 4.1) >= 3.5 ? 'bg-yellow-600' : 'bg-orange-600'
                 }`}>
                   {String(deal.rating || '4.1')}
                 </div>
               </div>
               
               {/* Limited Time Offer */}
               {(deal.hasLimitedOffer || deal.has_limited_offer || deal.limitedOfferText || deal.limited_offer_text) && (
                 <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
                   {deal.limitedOfferText || deal.limited_offer_text || 'Limited Time Offer'}
                 </div>
               )}
               
               {/* Pricing */}
               <div className="mb-3">
                 {deal.original_price && parseFloat(deal.original_price.replace(/,/g, '')) > price && (
                   <div className="text-xs text-white/70 line-through">{currencySymbol}{parseFloat(deal.original_price.replace(/,/g, '')).toLocaleString()}</div>
                 )}
                 <div className="text-2xl font-bold text-white">{currencySymbol}{price.toLocaleString()}</div>
                 {(deal.taxes_amount || deal.gst_amount) && (
                   <div className="text-xs text-white/80">
                     + {deal.taxes_amount && `${currencySymbol}${deal.taxes_amount} taxes`}
                     {deal.taxes_amount && deal.gst_amount && ' & '}
                     {deal.gst_amount && `${currencySymbol}${deal.gst_amount} GST`}
                     {(deal.taxes_amount || deal.gst_amount) && ' & fees'}
                   </div>
                 )}
                 <div className="text-xs text-white/80">Per Night</div>
               </div>
               
               {/* Separator line */}
               <div className="h-px bg-white/30 mb-3 mx-4"></div>
               
               {/* Pick Now CTA Button */}
               <div className="flex justify-center mb-2">
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     window.open(deal.affiliateUrl || deal.affiliate_url || '#', '_blank');
                   }}
                   className="bg-white bg-opacity-20 hover:bg-white hover:text-gray-800 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-0 text-sm z-30 relative"
                 >
                   Pick Now
                 </button>
               </div>

             </div>
           </div>
            </a>
            <HoverActionButtons 
              deal={deal} 
              isAdmin={isAdmin}
            />
         </div>
       );
     }
     
     // Flight section 2 - Flight Search Results (matching the image exactly)
     // Bus section 2 - Bus Search Results (same design as flights)
     // Train section 2 - Train Search Results (same design as flights)
     // Packages section 2 - International Destinations with amazing name and price display
     if (selectedCategory === 'packages' && cardType === 'standard') {
       const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
       const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
       
       // Get destination-specific styling and info for international destinations
       const getInternationalDestinationStyle = (dealName: string) => {
         const name = dealName.toLowerCase();
         if (name.includes('thailand')) {
           return {
             image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-blue-500/90 via-cyan-400/80 to-teal-500/90',
             accent: 'bg-cyan-400',
             priceColor: 'text-cyan-100',
             nameColor: 'text-white',
             flag: '🇹🇭'
           };
         } else if (name.includes('maldives')) {
           return {
             image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-turquoise-500/90 via-blue-400/80 to-indigo-500/90',
             accent: 'bg-turquoise-400',
             priceColor: 'text-turquoise-100',
             nameColor: 'text-white',
             flag: '🇲🇻'
           };
         } else if (name.includes('japan')) {
           return {
             image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-pink-500/90 via-rose-400/80 to-red-500/90',
             accent: 'bg-pink-400',
             priceColor: 'text-pink-100',
             nameColor: 'text-white',
             flag: '🇯🇵'
           };
         } else if (name.includes('bali')) {
           return {
             image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-green-500/90 via-emerald-400/80 to-teal-500/90',
             accent: 'bg-emerald-400',
             priceColor: 'text-emerald-100',
             nameColor: 'text-white',
             flag: '🇮🇩'
           };
         } else if (name.includes('dubai')) {
           return {
             image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-amber-500/90 via-orange-400/80 to-red-500/90',
             accent: 'bg-amber-400',
             priceColor: 'text-amber-100',
             nameColor: 'text-white',
             flag: '🇦🇪'
           };
         } else if (name.includes('vietnam')) {
           return {
             image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-indigo-500/90 via-purple-400/80 to-pink-500/90',
             accent: 'bg-indigo-400',
             priceColor: 'text-indigo-100',
             nameColor: 'text-white',
             flag: '🇻🇳'
           };
         } else if (name.includes('europe')) {
           return {
             image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-violet-500/90 via-purple-400/80 to-indigo-500/90',
             accent: 'bg-violet-400',
             priceColor: 'text-violet-100',
             nameColor: 'text-white',
             flag: '🇪🇺'
           };
         }
         return {
           image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80',
           gradient: 'from-blue-500/90 via-indigo-400/80 to-purple-500/90',
           accent: 'bg-blue-400',
           priceColor: 'text-blue-100',
           nameColor: 'text-white',
           flag: '🌍'
         };
       };
       
       const destinationStyle = getInternationalDestinationStyle(deal.name);
       
       return (
         <div className="group relative">
           <a
             key={deal.id}
             href={deal.affiliateUrl || deal.affiliate_url || '#'}
             target="_blank"
             rel="noopener noreferrer"
             className="relative block min-w-[320px] h-[280px] rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-1"
           >
           {/* Background Image */}
           <img
             src={destinationStyle.image}
             alt={deal.name}
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
             onError={(e) => {
               const target = e.target as HTMLImageElement;
               target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
             }}
           />
           
           {/* Dynamic Gradient Overlay */}
           <div className={`absolute inset-0 bg-gradient-to-t ${destinationStyle.gradient} transition-opacity duration-700 group-hover:opacity-95`}></div>
           
           {/* Animated Border Ring */}
           <div className="absolute inset-0 rounded-2xl border-2 border-white/30 group-hover:border-white/60 transition-all duration-700"></div>
           
           {/* International Badge */}
           <div className="absolute top-4 right-4 transform transition-all duration-500 group-hover:scale-110">
             <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border border-white/20">
               <i className="fas fa-globe-americas mr-1"></i>
               INTERNATIONAL
             </div>
           </div>
           
           {/* Country Flag */}
           <div className="absolute top-4 left-4 text-3xl transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
             {destinationStyle.flag}
           </div>
           
           {/* Content Container */}
           <div className="absolute bottom-0 left-0 right-0 p-6">
             {/* Destination Name - Large and Prominent */}
             <h3 className={`text-3xl font-black ${destinationStyle.nameColor} mb-3 transform transition-all duration-500 group-hover:translate-y-[-8px] group-hover:scale-105`}>
               {deal.name}
               <div className="w-0 h-1 bg-white rounded-full transition-all duration-700 group-hover:w-24 mt-2"></div>
             </h3>
             
             {/* Price Display - Animated and Eye-catching */}
             <div className="transform transition-all duration-500 group-hover:translate-y-[-4px]">
               <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-sm text-white/70 font-medium">Starting at</span>
                 <div className="flex items-baseline">
                   <span className={`text-4xl font-black ${destinationStyle.priceColor} drop-shadow-lg`}>
                     {currencySymbol}{price.toLocaleString()}
                   </span>
                   <span className="text-lg text-white/80 ml-1">Per person</span>
                 </div>
               </div>
               
               {/* Flight Add-on Display */}
               {deal.flight_price && (
                 <div className="mb-2">
                   <div className="text-sm text-white/80">
                     + {currencySymbol}{parseFloat(String(deal.flight_price)).toLocaleString()} with {deal.flight_route || 'flights'}
                   </div>
                   <div className="text-xs text-white/60">
                     Total: {currencySymbol}{(price + parseFloat(String(deal.flight_price))).toLocaleString()} with flights
                   </div>
                 </div>
               )}
               
               {/* Animated Price Underline */}
               <div className={`w-0 h-0.5 ${destinationStyle.accent} rounded-full transition-all duration-700 group-hover:w-32`}></div>
             </div>
             
             {/* Hover Effect - Additional Info */}
             <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
               <div className="flex items-center gap-3">
                 <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                   <i className="fas fa-clock mr-1"></i>
                   Limited Time
                 </span>
                 <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                   <i className="fas fa-percentage mr-1"></i>
                   30% OFF
                 </span>
               </div>
             </div>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
             <div className={`w-full h-full ${destinationStyle.accent} rounded-full blur-xl`}></div>
           </div>
           
           {/* Corner Accent */}
           <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-white/10 group-hover:border-b-white/20 transition-all duration-500"></div>
           

         </a>
         <HoverActionButtons 
           deal={deal} 
           isAdmin={isAdmin}
         />
       </div>
     );
     }
     
     const timeBasedCategories = ['flights', 'bus', 'train'] as const;
      if (timeBasedCategories.includes(selectedCategory as any) && cardType === 'standard') {
       const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
       const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
       
       // Generate flight times and route info from real data only
       const departureTime = deal.departureTime || deal.departure_time || '';
       const arrivalTime = deal.arrivalTime || deal.arrival_time || '';
       const route = deal.departure && deal.arrival ? `${deal.departure?.split('(')[0]?.trim()} → ${deal.arrival?.split('(')[0]?.trim()}` : '';
       const flightDuration = deal.duration || '';
       
       // Determine gradient based on airline
       const getFlightCardGradient = (airline: string) => {
         if (airline?.toLowerCase().includes('indigo')) {
           return 'from-blue-400 to-blue-500';
         } else if (airline?.toLowerCase().includes('spicejet')) {
           return 'from-red-400 to-red-500';
         } else if (airline?.toLowerCase().includes('vistara')) {
           return 'from-purple-400 to-purple-500';
         } else if (airline?.toLowerCase().includes('american')) {
           return 'from-red-400 to-red-500';
         } else if (airline?.toLowerCase().includes('delta')) {
           return 'from-blue-400 to-blue-500';
         } else if (airline?.toLowerCase().includes('united')) {
           return 'from-purple-400 to-purple-500';
         } else {
           return 'from-orange-400 to-orange-500';
         }
       };
       
       const gradientClass = deal.card_background_color || deal.cardBackgroundColor || getFlightCardGradient(deal.airline || deal.name);
       
       // Parse field colors and styles if available
       let fieldColors = {};
       let fieldStyles = {};
       try {
         if (deal.field_colors) {
           fieldColors = typeof deal.field_colors === 'string' ? JSON.parse(deal.field_colors) : deal.field_colors;
         }
         if (deal.field_styles) {
           fieldStyles = typeof deal.field_styles === 'string' ? JSON.parse(deal.field_styles) : deal.field_styles;
         }
       } catch (e) {
         console.warn('Failed to parse field colors/styles for deal:', deal.id, e);
       }
       
       // Helper function to get field styling
       const getFieldStyle = (fieldName: string) => {
         const style: any = {};
         if (fieldColors[fieldName]) {
           style.color = fieldColors[fieldName];
         }
         if (fieldStyles[fieldName]) {
           const fieldStyle = fieldStyles[fieldName];
           if (typeof fieldStyle === 'object') {
             if (fieldStyle.bold) style.fontWeight = 'bold';
             if (fieldStyle.italic) style.fontStyle = 'italic';
             if (fieldStyle.underline) style.textDecoration = 'underline';
             if (fieldStyle.strikethrough) style.textDecoration = 'line-through';
           } else {
             // Handle legacy string format
             if (fieldStyle === 'bold') style.fontWeight = 'bold';
             if (fieldStyle === 'italic') style.fontStyle = 'italic';
           }
         }
         return style;
       };
       
       return (
         <div className="group relative">
           <a
             key={deal.id}
             href={deal.affiliateUrl || deal.affiliate_url || '#'}
             target="_blank"
             rel="noopener noreferrer"
             className={`relative bg-gradient-to-r ${gradientClass} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white border-opacity-10 block`}
             style={{ minHeight: '180px', maxWidth: '400px' }}
           >
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="absolute top-4 right-4 text-6xl text-white/10">
              <i className={`fas ${(() => {
                switch (selectedCategory) {
                  case 'bus': return 'fa-bus';
                  case 'train': return 'fa-train';
                  default: return 'fa-plane';
                }
              })()}`}></i>
            </div>
            
            {/* Main content container */}
            <div className="relative z-10 p-3">
              {/* Top section with image and flight times */}
               <div className="flex items-center justify-between mb-1">
                 {/* Left side - Transport image */}
                 <div className="w-20 h-14 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20">
                  <img 
                    src={(() => {
                       if (selectedCategory === 'bus') {
                         const busImages = [
                           'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=64&h=48&fit=crop&auto=format&q=80', // Modern bus
                           'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=64&h=48&fit=crop&auto=format&q=80', // Bus interior
                           'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=64&h=48&fit=crop&auto=format&q=80', // Bus station
                           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=64&h=48&fit=crop&auto=format&q=80', // Travel bus
                           'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=64&h=48&fit=crop&auto=format&q=80'  // Bus on road
                         ];
                         const index = Math.abs(deal.id.toString().charCodeAt(0)) % busImages.length;
                         return busImages[index];
                       } else if (selectedCategory === 'train') {
                          const trainImages = [
                            'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=64&h=48&fit=crop&auto=format&q=80', // Modern train
                            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=64&h=48&fit=crop&auto=format&q=80', // Railway station
                            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=64&h=48&fit=crop&auto=format&q=80', // Train interior
                            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=64&h=48&fit=crop&auto=format&q=80', // Train on railway tracks
                            'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=64&h=48&fit=crop&auto=format&q=80'  // Railway platform
                          ];
                         const index = Math.abs(deal.id.toString().charCodeAt(0)) % trainImages.length;
                         return trainImages[index];
                       } else {
                         const flightImages = [
                           'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=64&h=48&fit=crop&auto=format&q=80', // Commercial airplane
                           'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=64&h=48&fit=crop&auto=format&q=80', // Airplane wing view
                           'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=64&h=48&fit=crop&auto=format&q=80', // Airport runway
                           'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=64&h=48&fit=crop&auto=format&q=80', // Airplane interior
                           'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=64&h=48&fit=crop&auto=format&q=80'  // Airplane cockpit
                         ];
                         const index = Math.abs(deal.id.toString().charCodeAt(0)) % flightImages.length;
                         return flightImages[index];
                       }
                     })()} 
                    alt={(() => {
                       switch (selectedCategory) {
                         case 'bus': return 'Bus';
                         case 'train': return 'Train';
                         default: return 'Flight';
                       }
                     })()}
                     className="w-full h-full object-cover rounded-md"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.style.display = 'none';
                       target.nextElementSibling!.classList.remove('hidden');
                     }}
                   />
                   <i className={`fas ${(() => {
                     switch (selectedCategory) {
                       case 'bus': return 'fa-bus';
                       case 'train': return 'fa-train';
                       default: return 'fa-plane';
                     }
                   })()} text-xl text-white/80 hidden`}></i>
                </div>
                
                {/* Center - Universal time/info display */}
                <div className="flex items-center gap-8">
                  {/* Left info (departure time or primary info) */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-200">
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights':
                           case 'bus':
                           case 'train': return departureTime || '--:--';
                           case 'hotels': return deal.rating || '--';
                           case 'cruises': return deal.duration || '--';
                           case 'tours': return deal.group_size || deal.groupSize || '--';
                           case 'packages': return deal.duration || '--';
                           case 'car-rental': return deal.fuel_type || deal.fuelType || '--';
                           default: return '--';
                         }
                       })()}
                     </div>
                    <div className="text-xs text-white/60 uppercase tracking-wide" style={getFieldStyle('departure')}>
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights':
                           case 'bus':
                           case 'train': {
                             // Try to extract airport code from parentheses, otherwise use first 3 chars of city name
                             const airportCode = deal.departure?.match(/\(([^)]+)\)/)?.[1];
                             if (airportCode) return airportCode;
                             const cityName = deal.departure?.trim();
                             return cityName ? cityName.substring(0, 3).toUpperCase() : 'DEP';
                           }
                           case 'hotels': return 'RATING';
                           case 'cruises': return 'DURATION';
                           case 'tours': return 'GROUP';
                           case 'packages': return 'DURATION';
                           case 'car-rental': return 'FUEL';
                           default: return 'INFO';
                         }
                       })()}
                     </div>
                  </div>
                  
                  {/* Transport/Category path with icon */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-px bg-white/40 flex-1"></div>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <i className={`fas ${(() => {
                         switch (selectedCategory) {
                           case 'bus': return 'fa-bus';
                           case 'train': return 'fa-train';
                           case 'hotels': return 'fa-bed';
                           case 'cruises': return 'fa-ship';
                           case 'tours': return 'fa-map-marked-alt';
                           case 'packages': return 'fa-suitcase';
                           case 'car-rental': return 'fa-car';
                           default: return 'fa-plane';
                         }
                       })()} text-xs text-white`}></i>
                    </div>
                    <div className="h-px bg-white/40 flex-1"></div>
                  </div>
                  
                  {/* Right info (arrival time or secondary info) */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-200">
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights':
                           case 'bus':
                           case 'train': return arrivalTime || '--:--';
                           case 'hotels': return deal.cancellation ? 'FREE' : 'PAID';
                           case 'cruises': return deal.ports ? 'MULTI' : 'SINGLE';
                           case 'tours': return deal.inclusions ? 'FULL' : 'BASIC';
                           case 'packages': return deal.inclusions ? 'FULL' : 'BASIC';
                           case 'car-rental': return deal.transmission || '--';
                           default: return '--';
                         }
                       })()}
                     </div>
                    <div className="text-xs text-white/60 uppercase tracking-wide" style={getFieldStyle('arrival')}>
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights':
                           case 'bus':
                           case 'train': {
                             // Try to extract airport code from parentheses, otherwise use first 3 chars of city name
                             const airportCode = deal.arrival?.match(/\(([^)]+)\)/)?.[1];
                             if (airportCode) return airportCode;
                             const cityName = deal.arrival?.trim();
                             return cityName ? cityName.substring(0, 3).toUpperCase() : 'ARR';
                           }
                           case 'hotels': return 'CANCEL';
                           case 'cruises': return 'PORTS';
                           case 'tours': return 'PACKAGE';
                           case 'packages': return 'PACKAGE';
                           case 'car-rental': return 'TRANS';
                           default: return 'INFO';
                         }
                       })()}
                     </div>
                  </div>
                </div>
                

              </div>
              
              {/* Middle section - Universal category details */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-6 text-white/70">
                  {/* Primary detail (route/location/destination) */}
                  <div className="flex items-center gap-2 text-sm">
                    <i className={`fas ${(() => {
                       switch (selectedCategory) {
                         case 'hotels': return 'fa-map-marker-alt';
                         case 'cruises': return 'fa-ship';
                         case 'tours': return 'fa-map-marked-alt';
                         case 'packages': return 'fa-suitcase';
                         case 'car-rental': return 'fa-car';
                         default: return 'fa-map-marker-alt';
                       }
                     })()} text-xs text-blue-300`}></i>
                    <span className="text-blue-200" style={getFieldStyle('route')}>
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights': return route || deal.name;
                           case 'hotels': return deal.location || deal.name;
                           case 'cruises': return deal.route || deal.name;
                           case 'tours': return deal.destinations || deal.name;
                           case 'bus': return route || deal.name;
                           case 'train': return route || deal.name;
                           case 'packages': return deal.destinations || deal.location || deal.name;
                           case 'car-rental': return deal.location || deal.name;
                           default: return deal.name;
                         }
                       })()}
                     </span>
                  </div>
                  {/* Secondary detail (duration/type/class) */}
                  <div className="flex items-center gap-2 text-sm">
                    <i className={`fas ${(() => {
                       switch (selectedCategory) {
                         case 'hotels': return 'fa-star';
                         case 'cruises': return 'fa-bed';
                         case 'tours': return 'fa-users';
                         case 'packages': return 'fa-calendar';
                         case 'car-rental': return 'fa-cog';
                         default: return 'fa-clock';
                       }
                     })()} text-xs text-green-300`}></i>
                    <span className="text-green-200" style={getFieldStyle('duration')}>
                       {(() => {
                         switch (selectedCategory) {
                           case 'flights': return flightDuration;
                           case 'hotels': return deal.hotel_type || deal.hotelType;
                           case 'cruises': return deal.cabin_type || deal.cabinType;
                           case 'tours': return deal.tour_type || deal.tourType;
                           case 'bus': return deal.bus_type || deal.busType;
                           case 'train': return deal.train_type || deal.trainType;
                           case 'packages': return deal.package_type || deal.packageType;
                           case 'car-rental': return deal.car_type || deal.carType;
                           default: return '';
                         }
                       })()}
                     </span>
                  </div>
                </div>
              </div>
               
              {/* Bottom section - Universal operator/provider info */}
               <div className="flex items-center justify-between mb-1">
                 {/* Left side - Operator/Provider info */}
                 <div className="flex items-center gap-3">
                   <div className="text-sm font-semibold text-white" style={getFieldStyle('name')}>
                      {(() => {
                        switch (selectedCategory) {
                          case 'flights': return deal.airline || deal.name;
                          case 'hotels': return deal.name;
                          case 'cruises': return deal.cruise_line || deal.cruiseLine || deal.name;
                          case 'tours': return deal.name;
                          case 'bus': return deal.operator || deal.name;
                          case 'train': return deal.train_operator || deal.trainOperator || deal.name;
                          case 'packages': return deal.name;
                          case 'car-rental': return deal.name;
                          default: return deal.name;
                        }
                      })()}
                    </div>
                   {/* Universal class/type badge */}
                   {(() => {
                      const badgeText = (() => {
                        switch (selectedCategory) {
                          case 'flights': return deal.flight_class;
                          case 'hotels': return deal.room_type;
                          case 'cruises': return deal.cabin_type;
                          case 'tours': return deal.difficulty;
                          case 'bus': return deal.bus_type;
                          case 'train': return deal.train_type;
                          case 'packages': return deal.package_type;
                          case 'car-rental': return deal.car_type;
                          default: return null;
                        }
                      })();
                      return badgeText ? (
                        <div className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                          {badgeText}
                        </div>
                      ) : null;
                    })()}
                 </div>
                 
                 {/* Right side - Price */}
                 <div className="text-right">
                   <div className="text-lg font-bold text-white" style={getFieldStyle('price')}>
                     Starting from {currencySymbol}{price.toLocaleString()}
                   </div>
                   {deal.flight_price && (
                     <div className="text-xs text-white/80 mt-1">
                       + {currencySymbol}{parseFloat(String(deal.flight_price)).toLocaleString()} with {deal.flight_route || 'flights'}
                     </div>
                   )}
                   {deal.flight_price && (
                     <div className="text-xs text-white/60 mt-1">
                       Total: {currencySymbol}{(price + parseFloat(String(deal.flight_price))).toLocaleString()} with flights
                     </div>
                   )}
                   <div className="text-xs text-white/70">per person</div>
                 </div>
               </div>
               
               {/* Separator line */}
               <div className="h-px bg-white/30 mb-2"></div>
               
               {/* Pick Now CTA Button */}
               <div className="flex justify-center">
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     window.open(deal.affiliateUrl || deal.affiliate_url || '#', '_blank');
                   }}
                   className="bg-white bg-opacity-20 hover:bg-white hover:text-gray-800 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-0 text-sm z-30 relative"
                 >
                   Pick Now
                 </button>
               </div>

            </div>
          </a>
          <HoverActionButtons 
            deal={deal} 
            isAdmin={isAdmin}
          />
        </div>
      );
     }
     
     // Packages section 3 - Visa Free Destinations (reuse the amazing design from section 2)
     if (selectedCategory === 'packages' && cardType === 'destinations') {
       const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
       const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
       
       // Get destination-specific styling and info for visa-free destinations
       const getVisaFreeDestinationStyle = (dealName: string) => {
         const name = dealName.toLowerCase();
         if (name.includes('thailand')) {
           return {
             image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-blue-500/90 via-cyan-400/80 to-teal-500/90',
             accent: 'bg-cyan-400',
             priceColor: 'text-cyan-100',
             nameColor: 'text-white',
             flag: '🇹🇭'
           };
         } else if (name.includes('maldives')) {
           return {
             image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-turquoise-500/90 via-blue-400/80 to-indigo-500/90',
             accent: 'bg-turquoise-400',
             priceColor: 'text-turquoise-100',
             nameColor: 'text-white',
             flag: '🇲🇻'
           };
         } else if (name.includes('japan')) {
           return {
             image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-pink-500/90 via-rose-400/80 to-red-500/90',
             accent: 'bg-pink-400',
             priceColor: 'text-pink-100',
             nameColor: 'text-white',
             flag: '🇯🇵'
           };
         } else if (name.includes('bali')) {
           return {
             image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-green-500/90 via-emerald-400/80 to-teal-500/90',
             accent: 'bg-emerald-400',
             priceColor: 'text-emerald-100',
             nameColor: 'text-white',
             flag: '🇮🇩'
           };
         } else if (name.includes('dubai')) {
           return {
             image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-amber-500/90 via-orange-400/80 to-red-500/90',
             accent: 'bg-amber-400',
             priceColor: 'text-amber-100',
             nameColor: 'text-white',
             flag: '🇦🇪'
           };
         } else if (name.includes('vietnam')) {
           return {
             image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-indigo-500/90 via-purple-400/80 to-pink-500/90',
             accent: 'bg-indigo-400',
             priceColor: 'text-indigo-100',
             nameColor: 'text-white',
             flag: '🇻🇳'
           };
         } else if (name.includes('europe')) {
           return {
             image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop&auto=format&q=80',
             gradient: 'from-violet-500/90 via-purple-400/80 to-indigo-500/90',
             accent: 'bg-violet-400',
             priceColor: 'text-violet-100',
             nameColor: 'text-white',
             flag: '🇪🇺'
           };
         }
         return {
           image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80',
           gradient: 'from-blue-500/90 via-indigo-400/80 to-purple-500/90',
           accent: 'bg-blue-400',
           priceColor: 'text-blue-100',
           nameColor: 'text-white',
           flag: '🌍'
         };
       };
       
       const destinationStyle = getVisaFreeDestinationStyle(deal.name);
       
       return (
         <div className="group relative">
           <a
             key={deal.id}
             href={deal.affiliateUrl || deal.affiliate_url || '#'}
             target="_blank"
             rel="noopener noreferrer"
             className="relative block min-w-[320px] h-[280px] rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-1"
           >
           {/* Background Image */}
           <img
             src={destinationStyle.image}
             alt={deal.name}
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
             onError={(e) => {
               const target = e.target as HTMLImageElement;
               target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
             }}
           />
           
           {/* Dynamic Gradient Overlay */}
           <div className={`absolute inset-0 bg-gradient-to-t ${destinationStyle.gradient} transition-opacity duration-700 group-hover:opacity-95`}></div>
           
           {/* Animated Border Ring */}
           <div className="absolute inset-0 rounded-2xl border-2 border-white/30 group-hover:border-white/60 transition-all duration-700"></div>
           
           {/* Floating Visa-Free Badge */}
           <div className="absolute top-4 right-4 transform transition-all duration-500 group-hover:scale-110">
             <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border border-white/20">
               <i className="fas fa-passport mr-1"></i>
               VISA FREE
             </div>
           </div>
           
           {/* Country Flag */}
           <div className="absolute top-4 left-4 text-3xl transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
             {destinationStyle.flag}
           </div>
           
           {/* Content Container */}
           <div className="absolute bottom-0 left-0 right-0 p-6">
             {/* Destination Name - Large and Prominent */}
             <h3 className={`text-3xl font-black ${destinationStyle.nameColor} mb-3 transform transition-all duration-500 group-hover:translate-y-[-8px] group-hover:scale-105`}>
               {deal.name}
               <div className="w-0 h-1 bg-white rounded-full transition-all duration-700 group-hover:w-24 mt-2"></div>
             </h3>
             
             {/* Price Display - Animated and Eye-catching */}
             <div className="transform transition-all duration-500 group-hover:translate-y-[-4px]">
               <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-sm text-white/70 font-medium">Starting at</span>
                 <div className="flex items-baseline">
                   <span className={`text-4xl font-black ${destinationStyle.priceColor} drop-shadow-lg`}>
                     {currencySymbol}{price.toLocaleString()}
                   </span>
                   <span className="text-lg text-white/80 ml-1">Per person</span>
                 </div>
               </div>
               
               {/* Animated Price Underline */}
               <div className={`w-0 h-0.5 ${destinationStyle.accent} rounded-full transition-all duration-700 group-hover:w-32`}></div>
             </div>
             
             {/* Hover Effect - Additional Info */}
             <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
               <div className="flex items-center gap-3">
                 <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                   <i className="fas fa-clock mr-1"></i>
                   Limited Time
                 </span>
                 <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                   <i className="fas fa-percentage mr-1"></i>
                   30% OFF
                 </span>
               </div>
             </div>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
             <div className={`w-full h-full ${destinationStyle.accent} rounded-full blur-xl`}></div>
           </div>
           
           {/* Corner Accent */}
           <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-white/10 group-hover:border-b-white/20 transition-all duration-500"></div>
           
           </a>
           <HoverActionButtons 
             deal={deal} 
             isAdmin={isAdmin}
           />
         </div>
       );
     }
      
      // Packages section 4 - Last Minute Deals with urgency design
      if (selectedCategory === 'packages' && cardType === 'special') {
        const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
        const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
        
        // Get destination-specific styling for last minute deals
        const getLastMinuteDestinationStyle = (dealName: string) => {
          const name = dealName.toLowerCase();
          if (name.includes('goa')) {
            return {
              image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop&auto=format&q=80',
              gradient: 'from-red-600/90 via-orange-500/80 to-yellow-500/90',
              accent: 'bg-red-500',
              priceColor: 'text-yellow-100',
              nameColor: 'text-white',
              urgencyColor: 'bg-red-500'
            };
          } else if (name.includes('kerala')) {
            return {
              image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop&auto=format&q=80',
              gradient: 'from-orange-600/90 via-red-500/80 to-pink-500/90',
              accent: 'bg-orange-500',
              priceColor: 'text-pink-100',
              nameColor: 'text-white',
              urgencyColor: 'bg-orange-500'
            };
          } else if (name.includes('rajasthan')) {
            return {
              image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=300&fit=crop&auto=format&q=80',
              gradient: 'from-pink-600/90 via-purple-500/80 to-indigo-500/90',
              accent: 'bg-pink-500',
              priceColor: 'text-indigo-100',
              nameColor: 'text-white',
              urgencyColor: 'bg-pink-500'
            };
          } else if (name.includes('himachal')) {
            return {
              image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80',
              gradient: 'from-blue-600/90 via-indigo-500/80 to-purple-500/90',
              accent: 'bg-blue-500',
              priceColor: 'text-purple-100',
              nameColor: 'text-white',
              urgencyColor: 'bg-blue-500'
            };
          } else if (name.includes('kashmir')) {
            return {
              image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=300&fit=crop&auto=format&q=80',
              gradient: 'from-green-600/90 via-teal-500/80 to-cyan-500/90',
              accent: 'bg-green-500',
              priceColor: 'text-cyan-100',
              nameColor: 'text-white',
              urgencyColor: 'bg-green-500'
            };
          }
          return {
            image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80',
            gradient: 'from-red-600/90 via-orange-500/80 to-yellow-500/90',
            accent: 'bg-red-500',
            priceColor: 'text-yellow-100',
            nameColor: 'text-white',
            urgencyColor: 'bg-red-500'
          };
        };
        
        const destinationStyle = getLastMinuteDestinationStyle(deal.name);
        
        return (
          <div className="group relative">
            <a
              key={deal.id}
              href={deal.affiliateUrl || deal.affiliate_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full max-w-[400px] h-[300px] rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-2"
            >
            {/* Background Image */}
            <img
              src={destinationStyle.image}
              alt={deal.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80';
              }}
            />
            
            {/* Dynamic Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${destinationStyle.gradient} transition-opacity duration-500 group-hover:opacity-95`}></div>
            
            {/* Animated Border Ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-red-400/50 group-hover:border-red-300/70 transition-all duration-500"></div>
            
            {/* Floating Urgency Badge */}
            <div className="absolute top-4 right-4 transform transition-all duration-300 group-hover:scale-110 animate-bounce">
              <div className={`${destinationStyle.urgencyColor} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border border-white/20`}>
                <i className="fas fa-clock mr-1"></i>
                ENDING SOON!
              </div>
            </div>
            
            {/* Timer Icon */}
            <div className="absolute top-4 left-4 text-3xl transform transition-all duration-300 group-hover:scale-125 animate-spin">
              ⏰
            </div>
            
            {/* Content Container */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Destination Name - Large and Prominent */}
              <h3 className={`text-3xl font-black ${destinationStyle.nameColor} mb-3 transform transition-all duration-500 group-hover:translate-y-[-8px] group-hover:scale-105`}>
                {deal.name}
                <div className="w-0 h-1 bg-red-400 rounded-full transition-all duration-500 group-hover:w-24 mt-2 animate-pulse"></div>
              </h3>
              
              {/* Price Display - Animated and Eye-catching */}
              <div className="transform transition-all duration-500 group-hover:translate-y-[-4px]">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm text-white/70 font-medium line-through">Was ₹{(price * 1.4).toLocaleString()}</span>
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-black ${destinationStyle.priceColor} drop-shadow-lg animate-pulse`}>
                      {currencySymbol}{price.toLocaleString()}
                    </span>
                    <span className="text-lg text-white/80 ml-1">Per person</span>
                  </div>
                </div>
                
                {/* Animated Price Underline */}
                <div className={`w-0 h-0.5 ${destinationStyle.accent} rounded-full transition-all duration-500 group-hover:w-32 animate-pulse`}></div>
              </div>
              
              {/* Hover Effect - Additional Info */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
                <div className="flex items-center gap-3">
                  <span className="bg-red-500/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-bold animate-pulse">
                    <i className="fas fa-fire mr-1"></i>
                    HOT DEAL
                  </span>
                  <span className="bg-orange-500/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-bold">
                    <i className="fas fa-percentage mr-1"></i>
                    60% OFF
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <div className={`w-full h-full ${destinationStyle.accent} rounded-full blur-xl animate-pulse`}></div>
            </div>
            
            {/* Corner Accent */}
            <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-red-400/20 group-hover:border-b-red-300/30 transition-all duration-500"></div>
            
            {/* Urgency Flash Effect */}
            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            
            </a>
            <HoverActionButtons 
              deal={deal} 
              isAdmin={isAdmin}
            />
          </div>
        );
      }
       
       // Packages section 5 - Destination Packages (circular cards like hotels section 3)
       if (selectedCategory === 'packages' && cardType === 'cities') {
         const currencySymbol = getCurrencySymbol(deal.currency || 'INR');
         const price = parseFloat(deal.price.replace(/,/g, '')) || 0;
         
         // Use specific images for each destination
         const getDestinationPackageImage = (dealName: string) => {
           if (dealName.toLowerCase().includes('kashmir')) {
             return 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=150&h=150&fit=crop&auto=format&q=80'; // Kashmir valleys
           } else if (dealName.toLowerCase().includes('thailand')) {
             return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop&auto=format&q=80'; // Thailand temples
           } else if (dealName.toLowerCase().includes('dubai')) {
             return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&h=150&fit=crop&auto=format&q=80'; // Dubai skyline
           } else if (dealName.toLowerCase().includes('singapore')) {
             return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&h=150&fit=crop&auto=format&q=80'; // Singapore marina
           } else if (dealName.toLowerCase().includes('paris')) {
             return 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=150&h=150&fit=crop&auto=format&q=80'; // Paris Eiffel Tower
           } else if (dealName.toLowerCase().includes('london')) {
             return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=150&h=150&fit=crop&auto=format&q=80'; // London Big Ben
           } else if (dealName.toLowerCase().includes('tokyo')) {
             return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=150&h=150&fit=crop&auto=format&q=80'; // Tokyo cityscape
           } else if (dealName.toLowerCase().includes('new york')) {
             return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=150&h=150&fit=crop&auto=format&q=80'; // New York skyline
           }
           return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&h=150&fit=crop&auto=format&q=80'; // Default destination
         };
         
         const destinationImage = getDestinationPackageImage(deal.name);
         
         // Clean destination name (remove "Packages" suffix for display)
         const destinationName = deal.name.replace(' Packages', '');
         
         return (
           <a
             key={deal.id}
             href={deal.affiliateUrl || deal.affiliate_url || '#'}
             target="_blank"
             rel="noopener noreferrer"
             className="group flex flex-col items-center transition-all duration-300 transform hover:scale-105"
           >
             {/* Circular Image Container */}
              <div className="relative mb-1">
               <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 ring-4 ring-teal-100 group-hover:ring-teal-200">
                 <img
                   src={destinationImage}
                   alt={destinationName}
                   className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&h=150&fit=crop&auto=format&q=80';
                   }}
                 />
               </div>
               
               {/* Destination Badge */}
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                 <i className="fas fa-map-marker-alt text-white text-xs"></i>
               </div>
               
               {/* Wishlist Heart */}
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleWishlistToggle(deal);
                 }}
                 className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors duration-200"
               >
                 <i className={`fas fa-heart text-xs ${
                   wishlistItems.some(item => item.id === deal.id) 
                     ? 'text-red-500' 
                     : 'text-gray-400'
                 }`}></i>
               </button>
               
               {/* Public Smart Share Button */}
               {!isAdmin && (
                 <div className="absolute -top-1 -left-1">
                   <SmartShareDropdown
                     product={{
                       id: deal.id,
                       name: deal.name,
                       description: deal.description,
                       price: deal.price,
                       imageUrl: deal.imageUrl || deal.image_url,
                       category: deal.category,
                       affiliateUrl: deal.affiliateUrl || deal.affiliate_url
                     }}
                     className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-200"
                     buttonText=""
                     showIcon={true}
                   />
                 </div>
               )}
             </div>
             
             {/* Destination Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors duration-200">
                  {destinationName}
                </h3>
              </div>
             

           </a>
         );
       }
       
       // Section 3 - Destinations card matching the reference image
       if (cardType === 'destinations') {
       const currencySymbol = getCurrencySymbol(selectedCurrency);
       const price = Math.round(convertPrice(parseFloat(deal.price?.replace(/,/g, '') || '0') || 0, (deal.currency || 'INR') as any, selectedCurrency));
       // Use specific images for each destination based on category
       const getDestinationImage = (dealName: string) => {
         if (selectedCategory === 'hotels') {
           // Hotel-specific images
           if (dealName.toLowerCase().includes('goa')) {
             return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=200&fit=crop&auto=format&q=80'; // Goa beach resort
           } else if (dealName.toLowerCase().includes('mumbai')) {
             return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop&auto=format&q=80'; // Mumbai luxury hotel
           } else if (dealName.toLowerCase().includes('delhi')) {
             return 'https://images.unsplash.com/photo-1578774204375-8f9d5e6e4e6e?w=200&h=200&fit=crop&auto=format&q=80'; // Delhi heritage hotel
           }
           return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=200&fit=crop&auto=format&q=80'; // Default hotel
         } else {
           // Destination images for other categories
           if (dealName.toLowerCase().includes('goa')) {
             return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&h=200&fit=crop&auto=format&q=80'; // Goa beaches
           } else if (dealName.toLowerCase().includes('kerala')) {
             return 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=200&h=200&fit=crop&auto=format&q=80'; // Kerala backwaters
           } else if (dealName.toLowerCase().includes('rajasthan')) {
             return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=200&h=200&fit=crop&auto=format&q=80'; // Rajasthan palace
           }
           return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&h=200&fit=crop&auto=format&q=80'; // Default
         }
       };
       
       const destinationImage = getDestinationImage(deal.name);
       
       // Handle different display formats based on category
       let displayTitle = '';
       let altText = '';
       
       if (selectedCategory === 'hotels') {
         // For hotels, show destination name directly (e.g., "Goa Hotels")
         displayTitle = deal.name || deal.location || deal.city || 'Hotels';
         altText = displayTitle;
       } else {
         // For other categories, show route format
         const routeParts = deal.route?.split('→') || [deal.departure || 'Pune', deal.arrival || 'Goa'];
         const fromCity = routeParts[0]?.trim() || deal.departure || 'Pune';
         const toCity = routeParts[1]?.trim() || deal.arrival || 'Goa';
         displayTitle = `${fromCity} → ${toCity}`;
         altText = `${fromCity} to ${toCity}`;
       }
       
       return (
         <div className="group relative">
           <div key={deal.id} className="text-center min-w-[280px] relative">
             {/* Clickable circular destination image */}
             <a
               href={deal.affiliateUrl || deal.affiliate_url || '#'}
               target="_blank"
               rel="noopener noreferrer"
               className="block w-32 h-32 mx-auto mb-4 relative hover:scale-105 transition-transform duration-300"
             >
               <div className="w-full h-full rounded-full border-4 border-white overflow-hidden shadow-lg">
                 <img 
                   src={destinationImage}
                   alt={altText}
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=200&fit=crop&auto=format&q=80';
                   }}
                 />
               </div>
             </a>
             
             {/* Destination/Route information */}
             <div className="mb-4">
               {selectedCategory === 'hotels' ? (
                 <h3 className="text-white text-lg font-semibold">
                   {displayTitle}
                 </h3>
               ) : (
                 <h3 className="text-white text-lg font-semibold flex items-center justify-center gap-2">
                   <span>{displayTitle.split(' → ')[0]}</span>
                   <i className="fas fa-arrow-right text-orange-400 text-sm"></i>
                   <span>{displayTitle.split(' → ')[1]}</span>
                 </h3>
               )}
             </div>
             
           </div>
           <HoverActionButtons 
             deal={deal} 
             isAdmin={isAdmin}
           />
         </div>
       );
     }
     
     // Default card for other categories and card types
     return (
       <div key={deal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
         <div className="text-center py-8">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{deal.name}</h3>
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{deal.location || deal.description}</p>
           <div className="text-xl font-bold text-red-600 mb-4">{displayPrice}</div>
           <div className="text-sm text-gray-500">New UI Card Coming Soon</div>
         </div>
       </div>
     );
  };

  const handleAffiliateClick = (deal: TravelDeal) => {
    window.open(deal.affiliateUrl, '_blank');
  };
  
  const handleWishlistToggle = (deal: TravelDeal) => {
    const isWishlisted = wishlistItems.some(item => item.id === deal.id);
    if (isWishlisted) {
      removeFromWishlist(deal.id);
      toast({
        title: "Removed from Wishlist",
        description: `${deal.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        id: deal.id,
        name: deal.name,
        description: deal.description || '',
        price: deal.price,
        imageUrl: deal.imageUrl || deal.image_url || '',
        category: deal.category || 'Travel',
        affiliateUrl: deal.affiliateUrl || deal.affiliate_url || ''
      });
      toast({
        title: "Added to Wishlist",
        description: `${deal.name} has been added to your wishlist.`,
      });
    }
  };

  // Bulk delete functionality
  const handleBulkDelete = async (deleteAll = false) => {
    try {
      // Add confirmation dialog
      const confirmMessage = deleteAll 
        ? `Are you sure you want to delete ALL ${selectedCategory} items? This action cannot be undone.`
        : `Are you sure you want to delete ${selectedProducts.length} selected items? This action cannot be undone.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      if (deleteAll) {
        // For bulk delete all, use the bulk delete endpoint with category
        const response = await fetch('/api/admin/travel-products/bulk-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            password: 'pickntrust2025',
            category: selectedCategory 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to delete all items');
        }
        
        const result = await response.json();
        toast({
          title: "Success",
          description: `All ${selectedCategory} deleted successfully. Removed ${result.deletedCount} items.`,
        });
      } else {
        // For individual deletes, use the individual delete endpoint
        if (selectedProducts.length === 0) {
          toast({
            title: "Error",
            description: "No items selected for deletion.",
            variant: "destructive"
          });
          return;
        }
        
        for (const productId of selectedProducts) {
          await deleteProduct('travel', productId);
        }
        toast({
          title: "Success",
          description: `${selectedProducts.length} items deleted successfully.`,
        });
      }
      
      setSelectedProducts([]);
      setBulkDeleteMode(false);
      await invalidateAllProductQueries(queryClient);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items. Please try again.",
        variant: "destructive",
      });
      
      // Don't reset state on error so user can retry
    }
  };

  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedDeal(null);
  };

  const handleConfirmShare = async () => {
    if (selectedDeal) {
      try {
        // Share logic here
        toast({
          title: "Success",
          description: `${selectedDeal.name} shared successfully!`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to share. Please try again.",
          variant: "destructive",
        });
      }
    }
    handleCloseModal();
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // Prepare comprehensive data for API submission including all category-specific fields
      const travelDealData = {
        // Basic fields
        name: formData.name,
        description: formData.description || '',
        price: formData.price || '0',
        original_price: formData.originalPrice || null,
        currency: formData.currency || 'INR',
        image_url: formData.imageUrl || '',
        affiliate_url: formData.affiliateUrl || '',
        category: formData.category,
        section_type: formData.sectionType || 'standard',
        
        // Flight-specific fields
        airline: formData.airline || null,
        departure: formData.departure || null,
        arrival: formData.arrival || null,
        departure_time: formData.departureTime || formData.departure_time || null,
        arrival_time: formData.arrivalTime || formData.arrival_time || null,
        duration: formData.duration || null,
        flight_class: formData.flightClass || formData.flight_class || null,
        stops: formData.stops || null,
        route_type: formData.routeType || formData.route_type || 'domestic',
        
        // Hotel-specific fields
        location: formData.location || null,
        hotel_type: formData.hotelType || null,
        room_type: formData.roomType || null,
        amenities: formData.amenities || null,
        rating: formData.rating || null,
        cancellation: formData.cancellation || null,
        
        // Tour-specific fields
        destinations: formData.destinations || null,
        inclusions: formData.inclusions || null,
        tour_type: formData.tourType || null,
        group_size: formData.groupSize || null,
        difficulty: formData.difficulty || null,
        
        // Cruise-specific fields
        cruise_line: formData.cruiseLine || null,
        route: formData.route || null,
        cabin_type: formData.cabinType || null,
        ports: formData.ports || null,
        
        // Bus-specific fields
        operator: formData.operator || null,
        bus_type: formData.busType || null,
        
        // Train-specific fields
        train_operator: formData.trainOperator || null,
        train_type: formData.trainType || null,
        train_number: formData.trainNumber || null,
        
        // Package-specific fields
        package_type: formData.packageType || null,
        valid_till: formData.validTill || null,
        
        // Car rental-specific fields
        car_type: formData.carType || null,
        features: formData.features || null,
        fuel_type: formData.fuelType || null,
        transmission: formData.transmission || null,
        
        // Custom section fields
        custom_section_title: formData.customSectionTitle || null,
        custom_section_description: formData.customSectionDescription || null,
        
        // Tax and GST fields
        taxes_amount: formData.taxesAmount || null,
        gst_amount: formData.gstAmount || null,
        brand_badge: formData.brandBadge || null,
        
        // Flight add-on fields for packages
        flight_price: formData.flightPrice || null,
        flight_route: formData.flightRoute || null,
        flight_details: formData.flightDetails || null,
        
        // Styling and display fields
        card_background_color: formData.cardBackgroundColor || 'from-orange-400 to-orange-500',
        field_colors: JSON.stringify(formData.fieldColors || {}),
        field_styles: JSON.stringify(formData.fieldStyles || {}),
        
        // System fields
        is_featured: formData.sectionType === 'featured' ? 1 : 0,
        is_active: 1,
        display_order: 0,
        source: 'admin_form'
      };
      
      // Save to travel_products table (used by travel-picks bot)
      const response = await fetch('/api/admin/travel-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(travelDealData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save travel deal');
      }
      
      const result = await response.json();
      
      // Refresh the travel deals data
      refetch();
      
      toast({
        title: "Success",
        description: `${formData.name} added successfully to database!`,
      });
      setAddFormOpen(false);
    } catch (error) {
      console.error('Error saving travel deal:', error);
      toast({
        title: "Error",
        description: "Failed to save travel deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active' || window.location.hostname === 'localhost');
  }, []);

  // Demo data removed - using only real data from database
  const demoTravelDeals: TravelDeal[] = [];

  // Fetch real travel products from API (used by travel-picks bot)
  const { data: realTravelDeals, isLoading, error, refetch } = useQuery({
    queryKey: ['travel-products', selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/travel-products/${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch travel products');
      }
      return response.json();
    },
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Process and categorize real travel deals
  const categoryDeals = useMemo(() => {
    if (!realTravelDeals || realTravelDeals.length === 0) {
      return [];
    }
    
    let deals = realTravelDeals;
    
    // Apply price range filter
    deals = deals.filter(deal => {
      const price = parseFloat(deal.price) || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Apply currency conversion and parse travel_type data
    return deals.map(deal => {
      // Parse travel_type JSON data FIRST to get section_type
      let travelTypeData: any = {};
      if (deal.travel_type || deal.travelType) {
        try {
          travelTypeData = JSON.parse(deal.travel_type || deal.travelType || '{}');
        } catch (e) {
          console.warn('Failed to parse travel_type data for deal:', deal.id);
        }
      }
      
      // Map backend field names to frontend field names - COMPREHENSIVE MAPPING
      // Now we can access section_type from travelTypeData
      const mappedDeal = {
        ...deal,
        ...travelTypeData, // Merge travel_type data first so we have access to section_type
        
        // Core section and display fields - section_type now available from travelTypeData
        sectionType: travelTypeData.section_type || deal.section_type || deal.sectionType || 'standard',
        originalPrice: deal.original_price || deal.originalPrice,
        imageUrl: deal.image_url || deal.imageUrl,
        affiliateUrl: deal.affiliate_url || deal.affiliateUrl,
        reviewCount: deal.review_count || deal.reviewCount,
        isFeatured: deal.is_featured || deal.isFeatured,
        isNew: deal.is_new || deal.isNew,
        limitedOfferText: deal.limited_offer_text || deal.limitedOfferText,
        hasLimitedOffer: deal.has_limited_offer || deal.hasLimitedOffer,
        
        // Travel type and route fields
        routeType: travelTypeData.route_type || deal.route_type || deal.routeType,
        travelType: deal.travel_type || deal.travelType,
        
        // Flight-specific fields
        flightClass: travelTypeData.flight_class || deal.flight_class || deal.flightClass,
        departureTime: travelTypeData.departure_time || deal.departure_time || deal.departureTime,
        arrivalTime: travelTypeData.arrival_time || deal.arrival_time || deal.arrivalTime,
        flightPrice: travelTypeData.flight_price || deal.flight_price || deal.flightPrice,
        flightRoute: travelTypeData.flight_route || deal.flight_route || deal.flightRoute,
        flightDetails: travelTypeData.flight_details || deal.flight_details || deal.flightDetails,
        
        // Hotel-specific fields
        hotelType: travelTypeData.hotel_type || deal.hotel_type || deal.hotelType,
        roomType: travelTypeData.room_type || deal.room_type || deal.roomType,
        
        // Tour-specific fields
        tourType: travelTypeData.tour_type || deal.tour_type || deal.tourType,
        groupSize: travelTypeData.group_size || deal.group_size || deal.groupSize,
        
        // Cruise-specific fields
        cruiseLine: travelTypeData.cruise_line || deal.cruise_line || deal.cruiseLine,
        cabinType: travelTypeData.cabin_type || deal.cabin_type || deal.cabinType,
        
        // Bus-specific fields
        busType: travelTypeData.bus_type || deal.bus_type || deal.busType,
        
        // Train-specific fields
        trainOperator: travelTypeData.train_operator || deal.train_operator || deal.trainOperator,
        trainType: travelTypeData.train_type || deal.train_type || deal.trainType,
        trainNumber: travelTypeData.train_number || deal.train_number || deal.trainNumber,
        
        // Package-specific fields
        packageType: travelTypeData.package_type || deal.package_type || deal.packageType,
        validTill: travelTypeData.valid_till || deal.valid_till || deal.validTill,
        
        // Car rental-specific fields
        carType: travelTypeData.car_type || deal.car_type || deal.carType,
        fuelType: travelTypeData.fuel_type || deal.fuel_type || deal.fuelType,
        
        // Tax and financial fields
        taxesAmount: travelTypeData.taxes_amount || deal.taxes_amount || deal.taxesAmount,
        gstAmount: travelTypeData.gst_amount || deal.gst_amount || deal.gstAmount,
        brandBadge: travelTypeData.brand_badge || deal.brand_badge || deal.brandBadge,
        
        // Custom section fields
        customSectionTitle: travelTypeData.custom_section_title || deal.custom_section_title || deal.customSectionTitle,
        customSectionDescription: travelTypeData.custom_section_description || deal.custom_section_description || deal.customSectionDescription,
        
        // Styling fields
        cardBackgroundColor: travelTypeData.card_background_color || deal.card_background_color || deal.cardBackgroundColor,
        fieldColors: travelTypeData.field_colors || deal.field_colors || deal.fieldColors,
        fieldStyles: travelTypeData.field_styles || deal.field_styles || deal.fieldStyles,
        
        // System fields
        isActive: deal.is_active || deal.isActive,
        displayOrder: deal.display_order || deal.displayOrder,
        createdAt: deal.created_at || deal.createdAt,
        updatedAt: deal.updated_at || deal.updatedAt
      };
      
      // Parse nested JSON fields if they exist as strings
      let parsedFieldColors = {};
      let parsedFieldStyles = {};
      try {
        if (mappedDeal.field_colors && typeof mappedDeal.field_colors === 'string') {
          parsedFieldColors = JSON.parse(mappedDeal.field_colors);
        } else if (mappedDeal.field_colors) {
          parsedFieldColors = mappedDeal.field_colors;
        }
        if (mappedDeal.field_styles && typeof mappedDeal.field_styles === 'string') {
          parsedFieldStyles = JSON.parse(mappedDeal.field_styles);
        } else if (mappedDeal.field_styles) {
          parsedFieldStyles = mappedDeal.field_styles;
        }
      } catch (e) {
        console.warn('Failed to parse nested field colors/styles for deal:', mappedDeal.id, e);
      }

      return {
        ...mappedDeal,
        // Override with properly parsed nested fields
        field_colors: parsedFieldColors,
        field_styles: parsedFieldStyles,
        displayPrice: convertPrice(parseFloat(mappedDeal.price.replace(/,/g, '')) || 0, (mappedDeal.currency || 'INR') as any, selectedCurrency),
        displayOriginalPrice: mappedDeal.originalPrice ? convertPrice(parseFloat(mappedDeal.originalPrice.replace(/,/g, '')) || 0, (mappedDeal.currency || 'INR') as any, selectedCurrency) : null
      };
    });
  }, [realTravelDeals, selectedCategory, selectedCurrency, convertPrice, priceRange]);

  const currentCategoryConfig = categorySectionConfig[selectedCategory as keyof typeof categorySectionConfig] || { sections: [], hasFilter: false };
  const uses3SectionSystem = currentCategoryConfig.sections.length > 0;

  const categorizeDeals = (deals: TravelDeal[]) => {
    const trending = deals.filter(deal => deal.sectionType === 'trending');
    const featured = deals.filter(deal => deal.sectionType === 'featured');
    const destinations = deals.filter(deal => deal.sectionType === 'destinations');
    const special = deals.filter(deal => deal.sectionType === 'special');
    const cities = deals.filter(deal => deal.sectionType === 'cities');
    const standard = deals.filter(deal => deal.sectionType === 'standard' || !deal.sectionType);
    
    return { trending, featured, standard, destinations, special, cities };
  };

  // Categorize real travel deals by section type
  const categorizedDeals = useMemo(() => {
    if (!categoryDeals || categoryDeals.length === 0) {
      return { trending: [], featured: [], standard: [], destinations: [], special: [], cities: [] };
    }

    const categorized: { [key: string]: TravelDeal[] } = {
      trending: [],
      featured: [],
      standard: [],
      destinations: [],
      special: [],
      cities: []
    };

    categoryDeals.forEach((deal: TravelDeal) => {
      const sectionType = deal.sectionType || 'standard';
      if (categorized[sectionType]) {
        categorized[sectionType].push(deal);
      } else {
        categorized.standard.push(deal);
      }
    });

    return categorized;
  }, [categoryDeals]);

  // Generate smart filter options based on available data
   const getSmartFilterOptions = useMemo(() => {
     if (!currentCategoryConfig.hasFilter) return [];
     
     const allDeals = Object.values(categorizedDeals).flat();
     const availableFilters = new Set(['all']); // Always include 'all'
     
     // If there are deals but no specific filter matches found, show basic filters
     const hasDeals = allDeals.length > 0;
     
     allDeals.forEach((deal: TravelDeal) => {
       // Add route type filters for flights, bus, train, packages
       if (['flights', 'bus', 'train', 'packages'].includes(selectedCategory)) {
         if (deal.routeType) {
           availableFilters.add(deal.routeType);
         }
       }
       
       // Add hotel-specific filters
       if (selectedCategory === 'hotels') {
         if (deal.hotelType) {
           const type = deal.hotelType.toLowerCase();
           if (['luxury', 'budget'].includes(type)) {
             availableFilters.add(type);
           }
         }
         // Add star rating filters
         if (deal.rating) {
           const rating = parseFloat(String(deal.rating));
           if (rating >= 3 && rating < 4) availableFilters.add('3-star');
           else if (rating >= 4 && rating < 5) availableFilters.add('4-star');
           else if (rating >= 5) availableFilters.add('5-star');
         }
       }
       
       // Add tour-specific filters
       if (selectedCategory === 'tours') {
         if (deal.tourType) {
           availableFilters.add(deal.tourType.toLowerCase());
         }
       }
       
       // Add cruise-specific filters
       if (selectedCategory === 'cruises') {
         if (deal.cruiseType) {
           availableFilters.add(deal.cruiseType.toLowerCase());
         }
       }
       
       // Add bus-specific filters
       if (selectedCategory === 'bus') {
         if (deal.busType) {
           const type = deal.busType.toLowerCase();
           if (type.includes('ac')) availableFilters.add('ac');
           if (type.includes('non-ac')) availableFilters.add('non-ac');
           if (type.includes('sleeper')) availableFilters.add('sleeper');
           if (type.includes('seater')) availableFilters.add('seater');
         }
       }
       
       // Add train-specific filters
       if (selectedCategory === 'train') {
         if (deal.trainClass) {
           const trainClass = deal.trainClass.toLowerCase();
           if (trainClass.includes('ac')) availableFilters.add('ac');
           if (trainClass.includes('sleeper')) availableFilters.add('sleeper');
           if (trainClass.includes('3ac')) availableFilters.add('3ac');
           if (trainClass.includes('2ac')) availableFilters.add('2ac');
           if (trainClass.includes('1ac')) availableFilters.add('1ac');
         }
       }
       
       // Add car rental filters
       if (selectedCategory === 'car-rental') {
         if (deal.carType) {
           availableFilters.add(deal.carType.toLowerCase());
         }
       }
     });
     
     // If no specific filters found but we have deals, show predefined options
     if (availableFilters.size === 1 && hasDeals) {
       const predefinedOptions = currentCategoryConfig.filterOptions || [];
       predefinedOptions.forEach(option => availableFilters.add(option));
     }
     
     return Array.from(availableFilters);
   }, [categorizedDeals, selectedCategory, currentCategoryConfig]);

   // Apply route filter to categorized deals
   if (currentCategoryConfig.hasFilter && routeFilter !== 'all') {
    Object.keys(categorizedDeals).forEach(key => {
      categorizedDeals[key as keyof typeof categorizedDeals] = categorizedDeals[key as keyof typeof categorizedDeals].filter(
        (deal: TravelDeal) => {
          if (selectedCategory === 'flights') {
            return deal.routeType === routeFilter;
          } else if (selectedCategory === 'bus') {
            // Filter by bus type or route type
            if (routeFilter === 'domestic' || routeFilter === 'international') {
              // Check routeType field first, then fallback to name/description analysis
              if (deal.routeType) return deal.routeType === routeFilter;
              const name = deal.name?.toLowerCase() || '';
              const description = deal.description?.toLowerCase() || '';
              if (routeFilter === 'domestic') {
                return name.includes('domestic') || description.includes('domestic') || 
                       name.includes('delhi') || name.includes('mumbai') || name.includes('bangalore') || 
                       name.includes('chennai') || name.includes('kolkata') || name.includes('pune');
              }
              if (routeFilter === 'international') {
                return name.includes('international') || description.includes('international') || 
                       name.includes('dubai') || name.includes('singapore') || name.includes('london') || 
                       name.includes('paris') || name.includes('tokyo') || name.includes('new york');
              }
            }
            if (routeFilter === 'ac') return deal.busType?.toLowerCase().includes('ac');
            if (routeFilter === 'non-ac') return deal.busType?.toLowerCase().includes('non-ac');
            if (routeFilter === 'sleeper') return deal.busType?.toLowerCase().includes('sleeper');
            if (routeFilter === 'seater') return deal.busType?.toLowerCase().includes('seater');
          } else if (selectedCategory === 'train') {
            // Filter by train class or route type
            if (routeFilter === 'domestic' || routeFilter === 'international') {
              // Check routeType field first, then fallback to name/description analysis
              if (deal.routeType) return deal.routeType === routeFilter;
              const name = deal.name?.toLowerCase() || '';
              const description = deal.description?.toLowerCase() || '';
              if (routeFilter === 'domestic') {
                return name.includes('domestic') || description.includes('domestic') || 
                       name.includes('delhi') || name.includes('mumbai') || name.includes('bangalore') || 
                       name.includes('chennai') || name.includes('kolkata') || name.includes('pune');
              }
              if (routeFilter === 'international') {
                return name.includes('international') || description.includes('international') || 
                       name.includes('dubai') || name.includes('singapore') || name.includes('london') || 
                       name.includes('paris') || name.includes('tokyo') || name.includes('new york');
              }
            }
            if (routeFilter === 'ac') return deal.flightClass?.toLowerCase().includes('ac') || deal.trainClass?.toLowerCase().includes('ac');
            if (routeFilter === 'sleeper') return deal.flightClass?.toLowerCase().includes('sleeper') || deal.trainClass?.toLowerCase().includes('sleeper');
            if (routeFilter === '3ac') return deal.flightClass?.toLowerCase().includes('3ac') || deal.trainClass?.toLowerCase().includes('3ac');
            if (routeFilter === '2ac') return deal.flightClass?.toLowerCase().includes('2ac') || deal.trainClass?.toLowerCase().includes('2ac');
            if (routeFilter === '1ac') return deal.flightClass?.toLowerCase().includes('1ac') || deal.trainClass?.toLowerCase().includes('1ac');
          } else if (selectedCategory === 'hotels') {
            // Filter by hotel type/rating
            const name = deal.name?.toLowerCase() || '';
            const description = deal.description?.toLowerCase() || '';
            const hotelType = deal.hotelType?.toLowerCase() || '';
            
            if (routeFilter === 'luxury') return name.includes('luxury') || description.includes('luxury') || hotelType.includes('luxury');
            if (routeFilter === 'budget') return name.includes('budget') || description.includes('budget') || hotelType.includes('budget');
            if (routeFilter === '3-star') return name.includes('3 star') || description.includes('3 star') || hotelType.includes('3');
            if (routeFilter === '4-star') return name.includes('4 star') || description.includes('4 star') || hotelType.includes('4');
            if (routeFilter === '5-star') return name.includes('5 star') || description.includes('5 star') || hotelType.includes('5');
          } else if (selectedCategory === 'car-rental') {
            // Filter by car type
            const name = deal.name?.toLowerCase() || '';
            const description = deal.description?.toLowerCase() || '';
            const carType = deal.carType?.toLowerCase() || '';
            
            if (routeFilter === 'economy') return name.includes('economy') || description.includes('economy') || carType.includes('economy');
            if (routeFilter === 'compact') return name.includes('compact') || description.includes('compact') || carType.includes('compact');
            if (routeFilter === 'suv') return name.includes('suv') || description.includes('suv') || carType.includes('suv');
             if (routeFilter === 'luxury') return name.includes('luxury') || description.includes('luxury') || carType.includes('luxury');
             if (routeFilter === 'premium') return name.includes('premium') || description.includes('premium') || carType.includes('premium');
           } else if (selectedCategory === 'tours') {
             // Filter by tour type
             const name = deal.name?.toLowerCase() || '';
             const description = deal.description?.toLowerCase() || '';
             const tourType = deal.tourType?.toLowerCase() || '';
             
             if (routeFilter === 'adventure') return name.includes('adventure') || description.includes('adventure') || tourType.includes('adventure');
             if (routeFilter === 'cultural') return name.includes('cultural') || description.includes('cultural') || tourType.includes('cultural');
             if (routeFilter === 'wildlife') return name.includes('wildlife') || description.includes('wildlife') || tourType.includes('wildlife');
             if (routeFilter === 'beach') return name.includes('beach') || description.includes('beach') || tourType.includes('beach');
             if (routeFilter === 'mountain') return name.includes('mountain') || description.includes('mountain') || tourType.includes('mountain');
           } else if (selectedCategory === 'cruises') {
             // Filter by cruise type
             const name = deal.name?.toLowerCase() || '';
             const description = deal.description?.toLowerCase() || '';
             const cruiseType = deal.cruiseType?.toLowerCase() || '';
             
             if (routeFilter === 'luxury') return name.includes('luxury') || description.includes('luxury') || cruiseType.includes('luxury');
             if (routeFilter === 'family') return name.includes('family') || description.includes('family') || cruiseType.includes('family');
             if (routeFilter === 'expedition') return name.includes('expedition') || description.includes('expedition') || cruiseType.includes('expedition');
             if (routeFilter === 'river') return name.includes('river') || description.includes('river') || cruiseType.includes('river');
             if (routeFilter === 'ocean') return name.includes('ocean') || description.includes('ocean') || cruiseType.includes('ocean');
           } else if (selectedCategory === 'packages') {
             // Filter by package type
             const name = deal.name?.toLowerCase() || '';
             const description = deal.description?.toLowerCase() || '';
             const packageType = deal.packageType?.toLowerCase() || '';
             
             if (routeFilter === 'domestic' || routeFilter === 'international') {
               return deal.routeType === routeFilter || name.includes(routeFilter) || description.includes(routeFilter) || packageType.includes(routeFilter);
             }
             if (routeFilter === 'honeymoon') return name.includes('honeymoon') || description.includes('honeymoon') || packageType.includes('honeymoon');
             if (routeFilter === 'family') return name.includes('family') || description.includes('family') || packageType.includes('family');
             if (routeFilter === 'adventure') return name.includes('adventure') || description.includes('adventure') || packageType.includes('adventure');
           }
           return true;
        }
      );
    });
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleShowAll = (sectionId: string) => {
    setShowAllSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderTravelSection = (section: TravelSection) => {
    const sectionDeals = categorizedDeals[section.type as keyof typeof categorizedDeals] || [];
    const isCollapsed = collapsedSections[section.id];
    const showAll = showAllSections[section.id];
    const displayDeals = showAll ? sectionDeals : sectionDeals.slice(0, 8);

    if (sectionDeals.length === 0) return null;

    return (
      <div key={section.id} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${section.color} flex items-center justify-center text-white`}>
              <i className={section.icon}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{section.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sectionDeals.length > 8 && (
              <button
                onClick={() => toggleShowAll(section.id)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {showAll ? 'Show Less' : `Show All (${sectionDeals.length})`}
              </button>
            )}
            
            <button
              onClick={() => toggleSection(section.id)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-gray-500`}></i>
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div 
            className={`grid ${(() => {
              if (section.type === 'featured') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6';
              if (section.type === 'standard') {
                if (selectedCategory === 'cruises') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
                if (selectedCategory === 'hotels') return 'gap-6';
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
              }
              if (section.type === 'destinations') {
                if (selectedCategory === 'packages') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
              }
              if (section.type === 'special') return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6';
              if (section.type === 'cities') return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
              return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6';
            })()}`}
            style={(() => {
              if (section.type === 'standard' && selectedCategory === 'hotels') {
                return {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
                  gap: '1.5rem',
                  width: '100%'
                };
              }
              return undefined;
            })()}
          >
            {displayDeals.map(deal => <div key={deal.id}>{renderTravelCard(deal, section.type, section)}</div>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="header-widgets">
        <WidgetRenderer page="travel-picks" position="header" />
      </div>
      
      <Header />
      <AnnouncementBanner />
      <PageBanner page="travel-picks" />

      <div className="container mx-auto px-4 py-6">
        <TravelNavigation 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isAdmin={isAdmin}
          categoryCount={categoryDeals.length}
        />
      </div>
      
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar 
          onCategoryChange={setSelectedCategory}
          selectedCategory={selectedCategory}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={(currency) => {
            if (currency !== 'ALL') {
              setSelectedCurrency(currency as any);
            }
          }}
          onPriceRangeChange={(min, max) => setPriceRange({ min, max })}
          availableCategories={['flights', 'hotels', 'tours', 'cruises', 'bus', 'train']}
        />

        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} ({categoryDeals.length})
              </h1>
              
              <div className="flex items-center gap-2">
                {/* Public User Smart Share Button */}
                {!isAdmin && (
                  <SmartShareDropdown
                    product={{
                      id: `travel-${selectedCategory}`,
                      name: `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Travel Deals`,
                      description: `Discover amazing ${selectedCategory} deals and offers`,
                      price: '',
                      imageUrl: '',
                      category: selectedCategory,
                      affiliateUrl: window.location.href
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200"
                    buttonText=""
                    showIcon={true}
                  />
                )}
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormCategory(selectedCategory);
                      setAddFormOpen(true);
                    }}
                    className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title={`Add ${selectedCategory} content`}
                  >
                    <i className="fas fa-plus text-sm" />
                  </button>
                  
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
                        Delete All {selectedCategory}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProducts([]);
                          setBulkDeleteMode(false);
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
          </div>
          
          {uses3SectionSystem ? (
            <div className="space-y-8">
              {currentCategoryConfig.hasFilter && getSmartFilterOptions.length > 1 && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
                  <div className="flex gap-2 flex-wrap">
                    {getSmartFilterOptions.map(option => {
                      const getFilterLabel = (option: string, category: string) => {
                        if (option === 'all') {
                          return `All ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                        }
                        
                        // Special formatting for specific options
                        const specialLabels: {[key: string]: string} = {
                          'non-ac': 'Non-AC',
                          '3ac': '3AC',
                          '2ac': '2AC', 
                          '1ac': '1AC',
                          '3-star': '3 Star',
                          '4-star': '4 Star',
                          '5-star': '5 Star'
                        };
                        
                        return specialLabels[option] || option.charAt(0).toUpperCase() + option.slice(1);
                      };
                      
                      return (
                        <button
                          key={option}
                          onClick={() => setRouteFilter(option)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            routeFilter === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {getFilterLabel(option, selectedCategory)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {currentCategoryConfig.sections.map(section => 
                renderTravelSection(section)
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryDeals.length > 0 ? (
                categoryDeals.map(deal => renderTravelCard(deal, 'standard'))
              ) : (
                <div className="col-span-full text-center py-12">
                  <i className="fas fa-plane text-6xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No travel deals found</h3>
                  <p className="text-gray-400">Try selecting a different category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <PageVideosSection page="travel-picks" title="Travel Videos" />
      <Footer />
      <ScrollNavigation />

      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedDeal?.name || ''}
        platforms={adminPlatformSettings}
      />

      <TravelAddForm
        isOpen={addFormOpen}
        onClose={() => setAddFormOpen(false)}
        category={formCategory}
        onSubmit={handleFormSubmit}
      />
      

      
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Loading travel deals...</span>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Failed to load travel deals</span>
            <button 
              onClick={() => refetch()}
              className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}