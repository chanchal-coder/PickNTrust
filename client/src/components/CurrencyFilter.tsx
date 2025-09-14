import React from 'react';

interface CurrencyFilterProps {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  convertPrices: boolean;
  setConvertPrices: (convert: boolean) => void;
  className?: string;
}

const CurrencyFilter: React.FC<CurrencyFilterProps> = ({
  selectedCurrency,
  setSelectedCurrency,
  convertPrices,
  setConvertPrices,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <i className="fas fa-coins text-purple-500 text-sm"></i>
        Currency
      </h3>
      
      <div className="space-y-3">
        {/* Currency Selector */}
        <select 
          value={selectedCurrency} 
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
        >
          <option value="all">All Currencies</option>
          <option value="INR">₹ Indian Rupee</option>
          <option value="USD">$ US Dollar</option>
          <option value="EUR">€ Euro</option>
          <option value="GBP">£ British Pound</option>
        </select>
        
        {/* Conversion Toggle */}
        {selectedCurrency !== 'all' && (
          <button
            onClick={() => setConvertPrices(!convertPrices)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              convertPrices 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500'
            } hover:scale-105 hover:shadow-md`}
          >
            <i className="fas fa-exchange-alt text-xs"></i>
            <span>{convertPrices ? 'Converting All Prices' : 'Convert All Prices'}</span>
          </button>
        )}
        
        {/* Conversion Status */}
        {selectedCurrency !== 'all' && convertPrices && (
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            <i className="fas fa-check-circle mr-1"></i>
            Showing all products converted to {selectedCurrency}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyFilter;