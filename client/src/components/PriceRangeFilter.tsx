import React from 'react';

interface PriceRange {
  value: string;
  label: string;
}

interface PriceRangeFilterProps {
  selectedCurrency: string;
  priceRange: string;
  setPriceRange: (range: string) => void;
  className?: string;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  selectedCurrency,
  priceRange,
  setPriceRange,
  className = ''
}) => {
  const getPriceRanges = (currency: string): PriceRange[] => {
    switch(currency) {
      case 'USD':
        return [
          { value: 'all', label: 'All Prices' },
          { value: '0-25', label: 'Under $25' },
          { value: '25-100', label: '$25 - $100' },
          { value: '100-500', label: '$100 - $500' },
          { value: '500', label: 'Above $500' }
        ];
      case 'EUR':
        return [
          { value: 'all', label: 'All Prices' },
          { value: '0-20', label: 'Under €20' },
          { value: '20-100', label: '€20 - €100' },
          { value: '100-400', label: '€100 - €400' },
          { value: '400', label: 'Above €400' }
        ];
      case 'GBP':
        return [
          { value: 'all', label: 'All Prices' },
          { value: '0-20', label: 'Under £20' },
          { value: '20-100', label: '£20 - £100' },
          { value: '100-400', label: '£100 - £400' },
          { value: '400', label: 'Above £400' }
        ];
      default: // INR or 'all'
        return [
          { value: 'all', label: 'All Prices' },
          { value: '0-500', label: 'Under ₹500' },
          { value: '500-1000', label: '₹500 - ₹1,000' },
          { value: '1000-2500', label: '₹1,000 - ₹2,500' },
          { value: '2500-5000', label: '₹2,500 - ₹5,000' },
          { value: '5000', label: 'Over ₹5,000' }
        ];
    }
  };
  
  const ranges = getPriceRanges(selectedCurrency);
  
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <i className="fas fa-tag text-orange-500 text-sm"></i>
        Price Range
      </h3>
      
      <div className="space-y-2">
        {ranges.map((range) => (
          <label 
            key={range.value} 
            className="flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
          >
            <input 
              type="radio" 
              name="priceRange" 
              value={range.value}
              checked={priceRange === range.value}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
              {range.label}
            </span>
          </label>
        ))}
      </div>
      
      {/* Currency Info */}
      {selectedCurrency !== 'all' && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
          <i className="fas fa-info-circle mr-1"></i>
          Prices shown in {selectedCurrency === 'INR' ? 'Indian Rupee' : selectedCurrency === 'USD' ? 'US Dollar' : selectedCurrency === 'EUR' ? 'Euro' : 'British Pound'}
        </div>
      )}
    </div>
  );
};

export default PriceRangeFilter;