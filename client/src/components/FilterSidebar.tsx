import React, { useState } from 'react';
import CurrencyFilter from './CurrencyFilter';
import PriceRangeFilter from './PriceRangeFilter';

interface FilterSidebarProps {
  // Currency & Price filters
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  convertPrices: boolean;
  setConvertPrices: (convert: boolean) => void;
  priceRange: string;
  setPriceRange: (range: string) => void;
  
  // Network filters
  selectedNetworks?: string[];
  setSelectedNetworks?: (networks: string[]) => void;
  availableNetworks?: string[];
  
  // Category filters
  selectedCategories?: string[];
  setSelectedCategories?: (categories: string[]) => void;
  availableCategories?: string[];
  
  // Rating filter
  minRating?: number;
  setMinRating?: (rating: number) => void;
  
  // Results count
  resultsCount?: number;
  
  // Clear filters function
  onClearFilters?: () => void;
  
  className?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  convertPrices,
  setConvertPrices,
  priceRange,
  setPriceRange,
  selectedNetworks = [],
  setSelectedNetworks,
  availableNetworks = [],
  selectedCategories = [],
  setSelectedCategories,
  availableCategories = [],
  minRating = 0,
  setMinRating,
  resultsCount,
  onClearFilters,
  className = ''
}) => {
  const hasActiveFilters = 
    selectedCurrency !== 'all' || 
    convertPrices || 
    priceRange !== 'all' || 
    selectedNetworks.length > 0 || 
    selectedCategories.length > 0 || 
    minRating > 0;

  const handleNetworkToggle = (network: string) => {
    if (!setSelectedNetworks) return;
    
    if (selectedNetworks.includes(network)) {
      setSelectedNetworks(selectedNetworks.filter(n => n !== network));
    } else {
      setSelectedNetworks([...selectedNetworks, network]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (!setSelectedCategories) return;
    
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i className="fas fa-filter text-blue-500"></i>
          Filters
        </h2>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
          >
            <i className="fas fa-times text-xs"></i>
            Clear All
          </button>
        )}
      </div>
      
      {/* Results Count */}
      {resultsCount !== undefined && (
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <i className="fas fa-search text-xs"></i>
            <span>{resultsCount} {resultsCount === 1 ? 'product' : 'products'} found</span>
          </div>
        </div>
      )}
      
      {/* Currency Filter */}
      <CurrencyFilter
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        convertPrices={convertPrices}
        setConvertPrices={setConvertPrices}
      />
      
      {/* Price Range Filter */}
      <PriceRangeFilter
        selectedCurrency={selectedCurrency}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
      
      {/* Network Filter */}
      {availableNetworks.length > 0 && setSelectedNetworks && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <i className="fas fa-network-wired text-blue-500 text-sm"></i>
            Network
          </h3>
          <div className="space-y-2">
            {availableNetworks.map((network: string) => (
              <label 
                key={network} 
                className="flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
              >
                <input 
                  type="checkbox" 
                  checked={selectedNetworks.includes(network)}
                  onChange={() => handleNetworkToggle(network)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                  {network === 'amazon' ? 'Prime Picks' : network === 'main' ? 'Global Picks' : network}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Category Filter */}
      {availableCategories.length > 0 && setSelectedCategories && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <i className="fas fa-th-large text-green-500 text-sm"></i>
            Categories
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableCategories.map((category) => (
              <label 
                key={category} 
                className="flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
              >
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                  {category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Rating Filter */}
      {setMinRating && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <i className="fas fa-star text-yellow-500 text-sm"></i>
            Minimum Rating
          </h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label 
                key={rating} 
                className="flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
              >
                <input 
                  type="radio" 
                  name="minRating" 
                  value={rating}
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-3 flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                  {Array.from({ length: rating }, (_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-xs"></i>
                  ))}
                  <span className="ml-1">& up</span>
                </span>
              </label>
            ))}
            <label className="flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200">
              <input 
                type="radio" 
                name="minRating" 
                value={0}
                checked={minRating === 0}
                onChange={() => setMinRating(0)}
                className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                All Ratings
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;