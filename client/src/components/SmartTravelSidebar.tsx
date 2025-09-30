import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Filter, MapPin, Calendar, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TravelCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

interface SmartTravelSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  onRatingChange: (rating: number) => void;
  onCurrencyChange: (currency: string) => void;
  priceRange: { min: number; max: number };
  minRating: number;
  selectedCurrency: string;
}

const CURRENCY_OPTIONS = [
  { value: 'ALL', label: 'All Currencies', symbol: '💱' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' }
];

const PRICE_RANGES = {
  flights: { min: 0, max: 50000, step: 1000 },
  hotels: { min: 0, max: 20000, step: 500 },
  packages: { min: 0, max: 100000, step: 2000 },
  tours: { min: 0, max: 15000, step: 500 },
  bus: { min: 0, max: 2000, step: 100 },
  train: { min: 0, max: 5000, step: 200 },
  'car-rental': { min: 0, max: 10000, step: 500 },
  cruises: { min: 0, max: 150000, step: 5000 },
  tickets: { min: 0, max: 10000, step: 500 }
};

export default function SmartTravelSidebar({
  selectedCategory,
  onCategoryChange,
  onPriceRangeChange,
  onRatingChange,
  onCurrencyChange,
  priceRange,
  minRating,
  selectedCurrency
}: SmartTravelSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    currency: true,
    filters: false
  });

  // Fetch travel categories with product counts
  const { data: categories = [] } = useQuery<TravelCategory[]>({
    queryKey: ['/api/travel-categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/travel-categories');
        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch product counts for each category
  const { data: productCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/travel-deals/counts'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/travel-deals/counts');
        if (response.ok) {
          return await response.json();
        }
        return {};
      } catch (error) {
        return {};
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Get current price range based on selected category
  const getCurrentPriceRange = () => {
    if (selectedCategory && PRICE_RANGES[selectedCategory as keyof typeof PRICE_RANGES]) {
      return PRICE_RANGES[selectedCategory as keyof typeof PRICE_RANGES];
    }
    return { min: 0, max: 100000, step: 1000 };
  };

  const currentPriceRange = getCurrentPriceRange();
  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (values: number[]) => {
    onPriceRangeChange(values[0], values[1]);
  };

  const resetFilters = () => {
    onCategoryChange('');
    onPriceRangeChange(0, currentPriceRange.max);
    onRatingChange(0);
    onCurrencyChange('ALL');
  };

  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);

  if (!isExpanded) {
    return (
      <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full p-2"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Travel Filters</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="p-1"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {totalProducts} travel deals available
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Categories Section */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Travel Categories
            </h4>
            {expandedSections.categories ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.categories && (
            <div className="space-y-2">
              {/* All Categories */}
              <button
                onClick={() => onCategoryChange('')}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedCategory === ''
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌍</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">All Categories</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">View all travel deals</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700">
                    {totalProducts}
                  </Badge>
                </div>
              </button>

              {/* Individual Categories */}
              {activeCategories.map((category) => {
                const count = productCounts[category.slug] || 0;
                const isSelected = selectedCategory === category.slug;

                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.slug)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {category.description}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-100 dark:bg-gray-700"
                        style={{ backgroundColor: isSelected ? `${category.color}20` : undefined }}
                      >
                        {count}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Range Section */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </h4>
            {expandedSections.price ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.price && (
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={[priceRange.min, priceRange.max]}
                  onValueChange={handlePriceChange}
                  max={currentPriceRange.max}
                  min={currentPriceRange.min}
                  step={currentPriceRange.step}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>₹{priceRange.min.toLocaleString()}</span>
                <span>₹{priceRange.max.toLocaleString()}</span>
              </div>
              {selectedCategory && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Optimized for {selectedCategory} pricing
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4" />
              Minimum Rating
            </h4>
            {expandedSections.rating ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.rating && (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onRatingChange(rating)}
                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                    minRating === rating
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {rating === 0 ? (
                        <span className="text-gray-500">Any Rating</span>
                      ) : (
                        [...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))
                      )}
                    </div>
                    {rating > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        & above
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Section */}
        <div>
          <button
            onClick={() => toggleSection('currency')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-sm">💱</span>
              Currency
            </h4>
            {expandedSections.currency ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.currency && (
            <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.symbol}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Filters */}
        <div>
          <button
            onClick={() => toggleSection('filters')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Quick Filters
            </h4>
            {expandedSections.filters ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.filters && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCategoryChange('flights')}
                className="w-full justify-start"
              >
                <i className="fas fa-plane"></i> Flights Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCategoryChange('hotels')}
                className="w-full justify-start"
              >
                <i className="fas fa-bed"></i> Hotels Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCategoryChange('packages')}
                className="w-full justify-start"
              >
                <i className="fas fa-suitcase"></i> Packages Only
              </Button>
            </div>
          )}
        </div>

        {/* Reset Filters */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="w-full"
          >
            Reset All Filters
          </Button>
        </div>
      </div>
    </div>
  );
}