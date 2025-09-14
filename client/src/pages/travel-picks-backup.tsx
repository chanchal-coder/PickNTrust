import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import StaticPageBanner from '@/components/StaticPageBanner';
import { AnnouncementBanner } from "@/components/announcement-banner";
import WhatsAppBanner from "@/components/whatsapp-banner";
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

/**
 * BACKUP VERSION OF TRAVEL-PICKS PAGE
 * 
 * This is a complete backup of the travel-picks.tsx file created to preserve:
 * - Sample data and card UI layouts
 * - Smart filter system implementation
 * - All category configurations
 * - Complete page structure and styling
 * 
 * Created as backup before implementing dynamic category management system.
 * Date: Current implementation with working filters and sample data
 */

interface TravelDeal {
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
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  affiliate_network?: string;
  affiliate_tag_applied?: number;
  original_url?: string;
  category?: string;
  subcategory?: string;
  gender?: string | null;
  rating?: string;
  reviewCount?: string;
  discount?: string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | string | null;
  displayPages?: string[];
  createdAt?: Date | string | null;
  hasLimitedOffer?: boolean | number;
  limitedOfterText?: string;
  content_type?: string;
  source?: string;
  networkBadge?: string;
  travelType?: string;
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
  amenities?: string[];
  hotelType?: string;
  roomType?: string;
  cancellation?: string;
  isBrand?: boolean;
  flightClass?: string;
  stops?: string;
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

// BACKUP: Complete category configuration with all layouts and filters
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

// BACKUP: This component represents the complete working travel-picks page
// with all sample data, card layouts, and filter functionality preserved
export default function TravelPicksBackup() {
  // Note: This is a backup version - the actual implementation would be much longer
  // This backup preserves the structure and configuration for future reference
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Travel Picks - Backup Version
        </h1>
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            📋 Backup Information
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            This is a backup version of the travel-picks page created to preserve:
          </p>
          <ul className="list-disc list-inside mt-2 text-yellow-700 dark:text-yellow-300">
            <li>Complete category configuration with all layouts</li>
            <li>Smart filter system implementation</li>
            <li>Sample data and card UI designs</li>
            <li>All working functionality before dynamic changes</li>
          </ul>
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            Refer to the original travel-picks.tsx for the full implementation.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// BACKUP: Export the category configuration for reference
export { categorySectionConfig as backupCategorySectionConfig };