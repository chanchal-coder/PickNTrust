import React, { useState } from 'react';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import { ChevronDown, Globe } from 'lucide-react';

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

export default function CurrencySelector({ 
  className = '', 
  showLabel = true, 
  variant = 'default' 
}: CurrencySelectorProps) {
  const { currentCurrency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setCurrency(currency);
    setIsOpen(false);
  };

  const currentCurrencyInfo = CURRENCIES[currentCurrency];

  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={`Current currency: ${currentCurrencyInfo.name}`}
        >
          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code as CurrencyCode)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    currentCurrency === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="font-medium mr-2">{info.symbol}</span>
                    <span className="text-sm">{code}</span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">{info.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          <span className="font-medium mr-1">{currentCurrencyInfo.symbol}</span>
          <span className="text-xs">{currentCurrency}</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code as CurrencyCode)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center ${
                    currentCurrency === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="font-medium mr-2">{info.symbol}</span>
                  <span className="text-sm">{code}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {showLabel && (
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Currency:</span>
        )}
        <span className="font-medium mr-2">{currentCurrencyInfo.symbol}</span>
        <span className="text-sm mr-2">{currentCurrency}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{currentCurrencyInfo.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Select Currency</div>
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code as CurrencyCode)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md flex items-center justify-between ${
                    currentCurrency === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-medium mr-3 w-8">{info.symbol}</span>
                    <div>
                      <div className="font-medium text-sm">{code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{info.name}</div>
                    </div>
                  </div>
                  {currentCurrency === code && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export additional utility components
export function CurrencyDisplay({ 
  amount, 
  currency, 
  className = '' 
}: { 
  amount: number; 
  currency?: CurrencyCode; 
  className?: string; 
}) {
  const { formatPrice } = useCurrency();
  
  return (
    <span className={className}>
      {currency ? formatPrice(amount, currency) : formatPrice(amount)}
    </span>
  );
}

export function CurrencySymbol({ 
  currency, 
  className = '' 
}: { 
  currency?: CurrencyCode; 
  className?: string; 
}) {
  const { currentCurrency } = useCurrency();
  const targetCurrency = currency || currentCurrency;
  const currencyInfo = CURRENCIES[targetCurrency];
  
  return (
    <span className={className}>
      {currencyInfo.symbol}
    </span>
  );
}