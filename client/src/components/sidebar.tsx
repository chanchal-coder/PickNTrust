import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: number;
  name: string;
  parentId?: number;
  subcategories?: Category[];
}

interface SidebarProps {
  onCategoryChange?: (category: string) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onRatingChange?: (rating: number) => void;
  onCurrencyChange?: (currency: string) => void;
  availableCategories?: string[];
  selectedCategory?: string;
  selectedCurrency?: string;
}

const categories = [
  {
    name: 'Home Décor',
    subcategories: [
      'Wall Art & Mirrors',
      'Candles & Holders',
      'Vases & Planters',
      'Decorative Objects',
      'Picture Frames',
      'Clocks'
    ]
  },
  {
    name: 'Furniture',
    subcategories: [
      'Living Room',
      'Bedroom',
      'Dining Room',
      'Office',
      'Storage'
    ]
  },
  {
    name: 'Lighting',
    subcategories: [
      'Table Lamps',
      'Floor Lamps',
      'Ceiling Lights',
      'Wall Lights',
      'String Lights'
    ]
  },
  {
    name: 'Textiles',
    subcategories: [
      'Cushions & Pillows',
      'Throws & Blankets',
      'Curtains & Blinds',
      'Rugs & Carpets'
    ]
  }
];

const priceRanges = [
  { label: 'All Products', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000, max: Infinity }
];

const brands = [
  'Amazon Basics',
  'IKEA',
  'Urban Ladder',
  'Pepperfry',
  'HomeTown',
  'Godrej Interio',
  'Nilkamal',
  'Durian'
];

const currencies = [
  { code: 'ALL', label: 'All Currencies', symbol: '🌍' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' }
];

export default function Sidebar({ onCategoryChange, onPriceRangeChange, onRatingChange, onCurrencyChange, availableCategories = [], selectedCategory = '', selectedCurrency = 'INR' }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All Products');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isCurrencyExpanded, setIsCurrencyExpanded] = useState<boolean>(true);

  // Helper function to capitalize first letter of each word
  const capitalizeCategory = (category: string) => {
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Use the availableCategories directly as simple category names with proper capitalization
  const displayCategories = (availableCategories || []).map(category => capitalizeCategory(category));

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleCategorySelect = (category: string) => {
    // Convert capitalized category back to lowercase slug for travel categories
    const categorySlug = category.toLowerCase();
    onCategoryChange?.(categorySlug);
  };

  const handlePriceRangeSelect = (range: typeof priceRanges[0], label: string) => {
    setSelectedPriceRange(label);
    onPriceRangeChange?.(range.min, range.max);
  };

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    onRatingChange?.(rating);
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleCurrencySelect = (currencyCode: string) => {
    onCurrencyChange?.(currencyCode);
  };

  const clearFilters = () => {
    setSelectedPriceRange('All Products');
    setIsCurrencyExpanded(true);
    onCategoryChange?.('');
    onPriceRangeChange?.(0, Infinity);
    onCurrencyChange?.('INR');
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto block">
      <div className="p-4 space-y-6">
        {/* Filters Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-base font-semibold"
          >
            Clear all
          </Button>
        </div>

        {/* Categories */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* All Categories Option */}
              <button
                onClick={() => handleCategorySelect('')}
                className={`block text-sm text-left w-full py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium ${
                  selectedCategory === '' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center">
                  <i className="fas fa-th-large mr-2"></i>
                  All Categories
                </span>
              </button>
              
              {displayCategories.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                  No categories available
                </div>
              ) : (
                displayCategories.map((categoryName) => (
                  <button
                    key={categoryName}
                    onClick={() => handleCategorySelect(categoryName)}
                    className={`block text-sm text-left w-full py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium ${
                      selectedCategory === categoryName.toLowerCase() 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {categoryName}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Currency Filter - Collapsible */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <button
              onClick={() => setIsCurrencyExpanded(!isCurrencyExpanded)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
            >
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fas fa-coins text-green-500"></i>
                Currency
              </CardTitle>
              <i className={`fas fa-chevron-${isCurrencyExpanded ? 'up' : 'down'} text-gray-400 text-sm transition-transform`}></i>
            </button>
          </CardHeader>
          {isCurrencyExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency.code)}
                    className={`block text-sm text-left w-full py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium ${
                      selectedCurrency === currency.code
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{currency.symbol}</span>
                      <span>{currency.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Price Range */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Price Range</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePriceRangeSelect(range, range.label)}
                  className={`block text-sm text-left w-full py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium ${
                    selectedPriceRange === range.label
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range.label === 'All Products' ? (
                    <span className="flex items-center">
                      <i className="fas fa-list mr-2"></i>
                      {range.label}
                    </span>
                  ) : (
                    range.label
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}