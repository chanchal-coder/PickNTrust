// Currency types
export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'SEK' | 'NZD' | 'MXN' | 'SGD' | 'HKD' | 'NOK' | 'TRY' | 'ZAR' | 'BRL' | 'RUB' | 'KRW' | 'THB' | 'PLN' | 'CZK' | 'HUF' | 'ILS' | 'CLP' | 'PHP' | 'AED' | 'COP' | 'SAR' | 'MYR' | 'RON';

// Exchange rates for currency conversion (fallback rates)
export const exchangeRates: { [key: string]: number } = {
  'USD_INR': 83.12,
  'EUR_INR': 89.45,
  'GBP_INR': 104.23,
  'INR_USD': 0.012,
  'INR_EUR': 0.011,
  'INR_GBP': 0.0096,
  'USD_EUR': 0.92,
  'USD_GBP': 0.79,
  'EUR_USD': 1.09,
  'EUR_GBP': 0.86,
  'GBP_USD': 1.27,
  'GBP_EUR': 1.16,
  // Additional rates for extended currency support
  'JPY_INR': 0.56,
  'CAD_INR': 61.45,
  'AUD_INR': 54.23,
  'CHF_INR': 91.78,
  'CNY_INR': 11.45,
  'SEK_INR': 7.89,
  'NZD_INR': 50.12,
  'MXN_INR': 4.78,
  'SGD_INR': 61.23,
  'HKD_INR': 10.67,
  'NOK_INR': 7.56,
  'TRY_INR': 2.78,
  'ZAR_INR': 4.45,
  'BRL_INR': 16.78,
  'RUB_INR': 0.89,
  'KRW_INR': 0.063,
  'THB_INR': 2.34,
  'PLN_INR': 20.45,
  'CZK_INR': 3.67,
  'HUF_INR': 0.23,
  'ILS_INR': 22.78,
  'CLP_INR': 0.089,
  'PHP_INR': 1.48,
  'AED_INR': 22.61,
  'COP_INR': 0.021,
  'SAR_INR': 22.15,
  'MYR_INR': 17.89,
  'RON_INR': 18.23
};

// Convert price from one currency to another
export const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return price;
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[rateKey];
  
  if (rate) {
    return price * rate;
  }
  
  // If direct conversion not available, try reverse conversion
  const reverseRateKey = `${toCurrency}_${fromCurrency}`;
  const reverseRate = exchangeRates[reverseRateKey];
  
  if (reverseRate) {
    return price / reverseRate;
  }
  
  // If no conversion available, return original price
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
  return price;
};

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$',
    'MXN': '$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NOK': 'kr',
    'TRY': '₺',
    'ZAR': 'R',
    'BRL': 'R$',
    'RUB': '₽',
    'KRW': '₩',
    'THB': '฿',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'ILS': '₪',
    'CLP': '$',
    'PHP': '₱',
    'AED': 'د.إ',
    'COP': '$',
    'SAR': '﷼',
    'MYR': 'RM',
    'RON': 'lei'
  };
  return symbols[currency] || '₹';
};

// Get currency name
export const getCurrencyName = (currency: string): string => {
  const names: { [key: string]: string } = {
    'INR': 'Indian Rupee',
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'CAD': 'Canadian Dollar',
    'AUD': 'Australian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'SEK': 'Swedish Krona',
    'NZD': 'New Zealand Dollar',
    'MXN': 'Mexican Peso',
    'SGD': 'Singapore Dollar',
    'HKD': 'Hong Kong Dollar',
    'NOK': 'Norwegian Krone',
    'TRY': 'Turkish Lira',
    'ZAR': 'South African Rand',
    'BRL': 'Brazilian Real',
    'RUB': 'Russian Ruble',
    'KRW': 'South Korean Won',
    'THB': 'Thai Baht',
    'PLN': 'Polish Złoty',
    'CZK': 'Czech Koruna',
    'HUF': 'Hungarian Forint',
    'ILS': 'Israeli Shekel',
    'CLP': 'Chilean Peso',
    'PHP': 'Philippine Peso',
    'AED': 'UAE Dirham',
    'COP': 'Colombian Peso',
    'SAR': 'Saudi Riyal',
    'MYR': 'Malaysian Ringgit',
    'RON': 'Romanian Leu'
  };
  return names[currency] || 'Indian Rupee';
};

// Format price with conversion
export const formatPriceWithConversion = (
  price: string | number, 
  productCurrency: CurrencyType | string, 
  targetCurrency: CurrencyType | string, 
  shouldConvert: boolean,
  formatPrice: (price: number, currency: string) => string
): { displayPrice: string; originalPrice?: string } => {
  const numPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
  const fromCurrency = productCurrency || 'INR';
  
  if (!shouldConvert || targetCurrency === 'all' || fromCurrency === targetCurrency) {
    return { displayPrice: formatPrice(numPrice, fromCurrency) };
  }
  
  const convertedPrice = convertPrice(numPrice, fromCurrency, targetCurrency);
  const symbol = getCurrencySymbol(targetCurrency);
  
  return {
    displayPrice: `${symbol}${Math.round(convertedPrice)}`, // Use whole numbers only
    originalPrice: formatPrice(numPrice, fromCurrency)
  };
};

// Check if price is in range (handles currency conversion)
export const isPriceInRange = (
  price: string | number,
  productCurrency: string,
  targetCurrency: string,
  priceRange: string,
  shouldConvert: boolean
): boolean => {
  if (priceRange === 'all') return true;
  
  const numPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
  let checkPrice = numPrice;
  
  // Convert price if needed
  if (shouldConvert && targetCurrency !== 'all' && productCurrency !== targetCurrency) {
    checkPrice = convertPrice(numPrice, productCurrency, targetCurrency);
  }
  
  const [min, max] = priceRange.split('-').map(Number);
  
  if (max) {
    return checkPrice >= min && checkPrice <= max;
  } else {
    return checkPrice >= min;
  }
};

// Get supported currencies list
export const getSupportedCurrencies = (): Array<{ code: string; name: string; symbol: string }> => {
  const mainCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
  
  return mainCurrencies.map(code => ({
    code,
    name: getCurrencyName(code),
    symbol: getCurrencySymbol(code)
  }));
};