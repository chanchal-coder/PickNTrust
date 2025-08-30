// Currency formatting utilities

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN'
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU'
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB'
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP'
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA'
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU'
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG'
  },
  {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    locale: 'zh-CN'
  },
  {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    locale: 'ko-KR'
  }
];

/**
 * Format price with currency symbol and proper number formatting
 * @param price - The price amount
 * @param currencyCode - Currency code (e.g., 'INR', 'USD')
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | string,
  currencyCode: string = 'INR',
  showSymbol: boolean = true
): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return showSymbol ? `${getCurrencySymbol(currencyCode)}0` : '0';
  }

  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  
  if (!currency) {
    // Fallback for unsupported currencies
    const formattedNumber = numericPrice.toLocaleString('en-US');
    return showSymbol ? `${currencyCode} ${formattedNumber}` : formattedNumber;
  }

  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(currency.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency.code,
      minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(numericPrice);
  } catch (error) {
    // Fallback formatting
    const formattedNumber = numericPrice.toLocaleString('en-US');
    return showSymbol ? `${currency.symbol}${formattedNumber}` : formattedNumber;
  }
}

/**
 * Get currency symbol by currency code
 * @param currencyCode - Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Get currency name by currency code
 * @param currencyCode - Currency code
 * @returns Currency name
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
}

/**
 * Format price range (e.g., "$10 - $20")
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param currencyCode - Currency code
 * @returns Formatted price range
 */
export function formatPriceRange(
  minPrice: number | string,
  maxPrice: number | string,
  currencyCode: string = 'INR'
): string {
  const formattedMin = formatPrice(minPrice, currencyCode);
  const formattedMax = formatPrice(maxPrice, currencyCode);
  return `${formattedMin} - ${formattedMax}`;
}

/**
 * Format discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage string
 */
export function formatDiscountPercentage(
  originalPrice: number | string,
  discountedPrice: number | string
): string {
  const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
  const discounted = typeof discountedPrice === 'string' ? parseFloat(discountedPrice) : discountedPrice;
  
  if (isNaN(original) || isNaN(discounted) || original <= discounted) {
    return '';
  }
  
  const discountPercent = Math.round(((original - discounted) / original) * 100);
  return `${discountPercent}% OFF`;
}

/**
 * Check if a currency code is supported
 * @param currencyCode - Currency code to check
 * @returns Whether the currency is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === currencyCode);
}

/**
 * Get default currency based on user's locale
 * @returns Default currency code
 */
export function getDefaultCurrency(): string {
  try {
    const locale = navigator.language || 'en-US';
    
    // Map common locales to currencies
    const localeMap: Record<string, string> = {
      'en-IN': 'INR',
      'hi-IN': 'INR',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-EU': 'EUR',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'es-ES': 'EUR',
      'it-IT': 'EUR',
      'ja-JP': 'JPY',
      'en-CA': 'CAD',
      'en-AU': 'AUD',
      'en-SG': 'SGD',
      'zh-CN': 'CNY',
      'ko-KR': 'KRW'
    };
    
    return localeMap[locale] || localeMap[locale.split('-')[0]] || 'USD';
  } catch {
    return 'USD';
  }
}