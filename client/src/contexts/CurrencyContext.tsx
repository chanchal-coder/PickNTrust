import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Currency definitions with symbols and names
export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: number;
}

interface CurrencyContextType {
  currentCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convertPrice: (price: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode) => number;
  formatPrice: (price: number, currency?: CurrencyCode) => string;
  exchangeRates: ExchangeRate[];
  isLoading: boolean;
  updateExchangeRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('INR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') as CurrencyCode;
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  // Load exchange rates from API
  const updateExchangeRates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/currency/rates');
      if (response.ok) {
        const rates = await response.json();
        setExchangeRates(rates);
      } else {
        // Fallback to default rates if API fails
        console.warn('Failed to fetch exchange rates, using defaults');
        setExchangeRates(getDefaultExchangeRates());
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates(getDefaultExchangeRates());
    } finally {
      setIsLoading(false);
    }
  };

  // Load exchange rates on mount
  useEffect(() => {
    updateExchangeRates();
  }, []);

  // Set currency and save to localStorage
  const setCurrency = (currency: CurrencyCode) => {
    setCurrentCurrency(currency);
    localStorage.setItem('selectedCurrency', currency);
  };

  // Convert price from one currency to another
  const convertPrice = (price: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode): number => {
    const targetCurrency = toCurrency || currentCurrency;
    
    if (fromCurrency === targetCurrency) {
      return price;
    }

    // Find exchange rate
    const rate = exchangeRates.find(
      r => r.fromCurrency === fromCurrency && r.toCurrency === targetCurrency
    );

    if (rate) {
      return price * rate.rate;
    }

    // If direct rate not found, try reverse rate
    const reverseRate = exchangeRates.find(
      r => r.fromCurrency === targetCurrency && r.toCurrency === fromCurrency
    );

    if (reverseRate) {
      return price / reverseRate.rate;
    }

    // If no rate found, return original price
    console.warn(`No exchange rate found for ${fromCurrency} to ${targetCurrency}`);
    return price;
  };

  // Format price with currency symbol
  const formatPrice = (price: number, currency?: CurrencyCode): string => {
    const targetCurrency = currency || currentCurrency;
    const currencyInfo = CURRENCIES[targetCurrency];
    
    // Format number with appropriate decimal places - always use whole numbers
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // Always use 0 decimal places for clean display
    }).format(price);

    return `${currencyInfo.symbol}${formattedNumber}`;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    convertPrice,
    formatPrice,
    exchangeRates,
    isLoading,
    updateExchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to use currency context
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Default exchange rates (fallback)
function getDefaultExchangeRates(): ExchangeRate[] {
  return [
    { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'GBP', rate: 0.0095, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'JPY', rate: 1.8, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'CAD', rate: 0.016, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'AUD', rate: 0.018, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'SGD', rate: 0.016, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'CNY', rate: 0.087, lastUpdated: Date.now() },
    { fromCurrency: 'INR', toCurrency: 'KRW', rate: 16.2, lastUpdated: Date.now() },
    // Reverse rates
    { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.0, lastUpdated: Date.now() },
    { fromCurrency: 'EUR', toCurrency: 'INR', rate: 90.0, lastUpdated: Date.now() },
    { fromCurrency: 'GBP', toCurrency: 'INR', rate: 105.0, lastUpdated: Date.now() },
    { fromCurrency: 'JPY', toCurrency: 'INR', rate: 0.56, lastUpdated: Date.now() },
    { fromCurrency: 'CAD', toCurrency: 'INR', rate: 62.0, lastUpdated: Date.now() },
    { fromCurrency: 'AUD', toCurrency: 'INR', rate: 55.0, lastUpdated: Date.now() },
    { fromCurrency: 'SGD', toCurrency: 'INR', rate: 62.0, lastUpdated: Date.now() },
    { fromCurrency: 'CNY', toCurrency: 'INR', rate: 11.5, lastUpdated: Date.now() },
    { fromCurrency: 'KRW', toCurrency: 'INR', rate: 0.062, lastUpdated: Date.now() },
  ];
}

// Utility function to get currency symbol
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.symbol || currency;
}

// Utility function to get currency name
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.name || currency;
}