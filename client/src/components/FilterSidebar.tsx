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
  
  // Gender filter
  availableGenders?: string[];
  selectedGender?: string | null;
  setSelectedGender?: (gender: string | null) => void;
  
  // Category filters
  selectedCategories?: string[];
  setSelectedCategories?: (categories: string[]) => void;
  availableCategories?: string[];
  
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
  availableGenders = [],
  selectedGender = 'all',
  setSelectedGender,
  selectedCategories = [],
  setSelectedCategories,
  availableCategories = [],
  resultsCount,
  onClearFilters,
  className = ''
}) => {
  const hasActiveFilters = 
    selectedCurrency !== 'all' || 
    convertPrices || 
    priceRange !== 'all' || 
    selectedNetworks.length > 0 || 
    selectedCategories.length > 0;

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
    <div className={`w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto block ${className}`}>
      <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i className="fas fa-filter text-blue-500"></i>
          Filters
        </h2>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
          >
            <i className="fas fa-broom text-xs"></i>
            Clear all
          </button>
        )}
      </div>
      
      {/* Results Count */}
      {resultsCount !== undefined && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <i className="fas fa-search text-xs"></i>
            <span>{resultsCount} {resultsCount === 1 ? 'product' : 'products'} found</span>
          </div>
        </div>
      )}
      
      {/* Gender Filter (with Kids suboptions) */}
      {availableGenders.length > 0 && setSelectedGender && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <i className="fas fa-venus-mars text-pink-500 text-sm"></i>
            Gender
          </h3>
          {/* Top-level: All, Men, Women, Unisex (always visible) */}
          <div className="flex flex-wrap gap-2 mb-2">
            {['all','men','women','unisex'].map((g) => {
              const labelMap: Record<string,string> = { all: 'All', men: 'Men', women: 'Women', unisex: 'Unisex' };
              const isActive = (selectedGender || 'all') === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGender && setSelectedGender(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {labelMap[g]}
                </button>
              );
            })}
          </div>
          {/* Kids group always visible: Girls, Boys, All Kids */}
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Kids</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGender && setSelectedGender('girls')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  (selectedGender || 'all') === 'girls'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Girls
              </button>
              <button
                onClick={() => setSelectedGender && setSelectedGender('boys')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  (selectedGender || 'all') === 'boys'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Boys
              </button>
              <button
                onClick={() => setSelectedGender && setSelectedGender('kids')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  (selectedGender || 'all') === 'kids'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Kids
              </button>
            </div>
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
          <div className="space-y-2 sidebar-scroll category-scroll-10">
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
      {/* Rating filter removed as requested */}
      </div>
    </div>
  );
};

export default FilterSidebar;