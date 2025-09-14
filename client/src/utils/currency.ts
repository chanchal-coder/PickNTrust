import { CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';

// Re-export CurrencyCode for use in other components
export type { CurrencyCode };

// Exchange rate interface
interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: number;
}

// Currency conversion utilities
export class CurrencyConverter {
  private static exchangeRates: ExchangeRate[] = [];
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch exchange rates from API
  static async fetchExchangeRates(): Promise<ExchangeRate[]> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (this.exchangeRates.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.exchangeRates;
    }

    try {
      const response = await fetch('/api/currency/rates');
      if (response.ok) {
        const rates = await response.json();
        this.exchangeRates = rates;
        this.lastFetch = now;
        return rates;
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    }

    // Return default rates if API fails
    return this.getDefaultRates();
  }

  // Get default exchange rates (fallback)
  private static getDefaultRates(): ExchangeRate[] {
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

  // Convert amount from one currency to another
  static async convertAmount(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.fetchExchangeRates();
    
    // Find direct rate
    const directRate = rates.find(
      r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (directRate) {
      return amount * directRate.rate;
    }

    // Try reverse rate
    const reverseRate = rates.find(
      r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
    );

    if (reverseRate) {
      return amount / reverseRate.rate;
    }

    // If no direct conversion available, try via USD
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const toUsd = await this.convertAmount(amount, fromCurrency, 'USD');
      return await this.convertAmount(toUsd, 'USD', toCurrency);
    }

    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    return amount;
  }

  // Get exchange rate between two currencies
  static async getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await this.fetchExchangeRates();
    
    const directRate = rates.find(
      r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (directRate) {
      return directRate.rate;
    }

    const reverseRate = rates.find(
      r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
    );

    if (reverseRate) {
      return 1 / reverseRate.rate;
    }

    return 1; // Fallback
  }
}

// Format price with currency symbol and proper formatting
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals,
    locale = 'en-IN'
  } = options;

  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) {
    return amount.toString();
  }

  // Determine decimal places - default to 0 for whole numbers
  const decimalPlaces = decimals !== undefined 
    ? decimals 
    : 0; // Always use 0 decimal places for clean whole number display

  // Format the number
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  // Build the formatted string
  let result = '';
  
  if (showSymbol) {
    result += currencyInfo.symbol;
  }
  
  result += formattedNumber;
  
  if (showCode) {
    result += ` ${currency}`;
  }

  return result;
}

// Parse price string and extract numeric value
export function parsePrice(priceString: string): number {
  // Remove currency symbols and non-numeric characters except decimal point
  const cleanedPrice = priceString.replace(/[^\d.,]/g, '');
  
  // Handle different decimal separators
  const normalizedPrice = cleanedPrice.replace(/,/g, '');
  
  return parseFloat(normalizedPrice) || 0;
}

// Get currency symbol
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.symbol || currency;
}

// Get currency name
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.name || currency;
}

// Validate currency code
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return currency in CURRENCIES;
}

// Get all available currencies
export function getAvailableCurrencies(): Array<{ code: CurrencyCode; name: string; symbol: string }> {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code: code as CurrencyCode,
    name: info.name,
    symbol: info.symbol
  }));
}

// Convert product price with currency
export async function convertProductPrice(
  product: { price: number; currency?: string },
  targetCurrency: CurrencyCode
): Promise<{ price: number; originalPrice: number; currency: CurrencyCode; rate: number }> {
  const fromCurrency = (product.currency as CurrencyCode) || 'INR';
  
  if (fromCurrency === targetCurrency) {
    return {
      price: product.price,
      originalPrice: product.price,
      currency: targetCurrency,
      rate: 1
    };
  }

  const convertedPrice = await CurrencyConverter.convertAmount(
    product.price,
    fromCurrency,
    targetCurrency
  );
  
  const rate = await CurrencyConverter.getExchangeRate(fromCurrency, targetCurrency);

  return {
    price: convertedPrice,
    originalPrice: product.price,
    currency: targetCurrency,
    rate
  };
}

// Batch convert multiple products
export async function convertProductPrices(
  products: Array<{ price: number; currency?: string }>,
  targetCurrency: CurrencyCode
): Promise<Array<{ price: number; originalPrice: number; currency: CurrencyCode; rate: number }>> {
  const promises = products.map(product => convertProductPrice(product, targetCurrency));
  return Promise.all(promises);
}

// Currency comparison utilities
export function comparePrices(
  price1: { amount: number; currency: CurrencyCode },
  price2: { amount: number; currency: CurrencyCode },
  baseCurrency: CurrencyCode = 'USD'
): Promise<{ cheaper: 'first' | 'second' | 'equal'; difference: number; percentageDiff: number }> {
  return new Promise(async (resolve) => {
    try {
      const converted1 = await CurrencyConverter.convertAmount(price1.amount, price1.currency, baseCurrency);
      const converted2 = await CurrencyConverter.convertAmount(price2.amount, price2.currency, baseCurrency);
      
      const difference = Math.abs(converted1 - converted2);
      const percentageDiff = ((difference / Math.min(converted1, converted2)) * 100);
      
      let cheaper: 'first' | 'second' | 'equal';
      if (converted1 < converted2) {
        cheaper = 'first';
      } else if (converted2 < converted1) {
        cheaper = 'second';
      } else {
        cheaper = 'equal';
      }
      
      resolve({ cheaper, difference, percentageDiff });
    } catch (error) {
      console.error('Error comparing prices:', error);
      resolve({ cheaper: 'equal', difference: 0, percentageDiff: 0 });
    }
  });
}

// Format price range
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency: CurrencyCode,
  options?: { showSymbol?: boolean; showCode?: boolean; decimals?: number }
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, currency, options);
  }
  
  const formattedMin = formatPrice(minPrice, currency, options);
  const formattedMax = formatPrice(maxPrice, currency, options);
  
  return `${formattedMin} - ${formattedMax}`;
}

export default CurrencyConverter;