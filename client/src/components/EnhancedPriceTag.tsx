// No default React import needed with modern JSX transform
import { type CurrencyCode, formatPrice as formatCurrencyPrice } from '@/utils/currency';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EnhancedPriceTagProps {
  product: any;
  colorClass?: string; // main price color
  originalClass?: string; // strike-through original price
  freeClass?: string; // FREE text color
  helperClass?: string; // helper text (e.g., both monthly/yearly)
  discountClass?: string; // discount badge color
  showTypeIndicator?: boolean; // show non-standard pricing type label
  showDiscountBadge?: boolean; // show discount percentage badge
  forceGlobalCurrency?: boolean; // when true, convert to currentCurrency
}

const getNumeric = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

// Helper will be defined inside the component to access currency context

const calculateDiscount = (originalPrice: any, currentPrice: any): number => {
  const original = getNumeric(originalPrice);
  const current = getNumeric(currentPrice);
  
  if (original > 0 && current > 0 && original > current) {
    return Math.round(((original - current) / original) * 100);
  }
  return 0;
};

export default function EnhancedPriceTag({
  product,
  colorClass = 'text-blue-600',
  originalClass = 'text-gray-500 line-through text-sm',
  freeClass = 'text-green-600',
  helperClass = 'text-xs text-gray-500',
  discountClass = 'bg-red-600 text-white px-2 py-1 rounded text-xs font-bold',
  showTypeIndicator = true,
  showDiscountBadge = true,
  forceGlobalCurrency = false,
}: EnhancedPriceTagProps) {
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();

  const formatProductPrice = (price?: string | number, productCurrency?: string) => {
    const numeric = getNumeric(price);
    const from: CurrencyCode = (String(productCurrency || 'INR').trim().toUpperCase() as CurrencyCode);
    if (forceGlobalCurrency) {
      const converted = convertPrice(numeric, from, currentCurrency);
      return formatPrice(converted, currentCurrency);
    }
    // Default: show in product's original currency
    return formatCurrencyPrice(numeric, from);
  };

  const {
    price,
    originalPrice,
    currency,
    pricingType,
    priceDescription,
    isFree,
    monthlyPrice,
    yearlyPrice,
    discount, // explicit discount from database
  } = product || {};

  // Effective original price: only use provided original price (do not derive from discount)
  const effectiveOriginalPrice = (() => {
    const originalNum = getNumeric(originalPrice);
    if (originalNum > 0) return originalPrice;
    return null;
  })();

  const hasMonthly = getNumeric(monthlyPrice) > 0;
  const hasYearly = getNumeric(yearlyPrice) > 0;
  const hasOriginal = effectiveOriginalPrice !== null && getNumeric(effectiveOriginalPrice) > 0;
  const hasSimplePrice = getNumeric(price) > 0;
  
  // Check if product has complex pricing (tags)
  const hasComplexPricing = isFree || pricingType === 'free' || hasMonthly || hasYearly || 
    (pricingType && pricingType !== 'one-time' && pricingType !== 'One-time Payment');
  
  // Calculate discount percentage ONLY when both original and current prices exist
  const calculatedDiscount = calculateDiscount(effectiveOriginalPrice ?? originalPrice, price);
  const finalDiscount = calculatedDiscount;

  // FREE pricing
  if (isFree || pricingType === 'free') {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${freeClass}`}>FREE</span>
        {hasOriginal && finalDiscount > 0 && showDiscountBadge && (
          <span className={discountClass}>{finalDiscount}% OFF</span>
        )}
      </div>
    );
  }

  // Custom pricing type: show label only
  if (pricingType === 'custom') {
    const label = priceDescription && priceDescription.trim() !== '' ? priceDescription : 'Custom Pricing';
    return <span className={`text-lg font-bold ${freeClass}`}>{label}</span>;
  }

  // Complex pricing (Monthly/Yearly explicit prices) - Show as tags
  if (hasMonthly) {
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${colorClass}`}>{formatProductPrice(monthlyPrice, currency)}/month</span>
          {hasOriginal && (
            <span className={originalClass}>{formatProductPrice(effectiveOriginalPrice, currency)}/month</span>
          )}
          {finalDiscount > 0 && showDiscountBadge && (
            <span className={discountClass}>{finalDiscount}% OFF</span>
          )}
        </div>
        {hasYearly && !priceDescription && (
          <span className={helperClass}>{formatProductPrice(yearlyPrice, currency)}/year available</span>
        )}
        {priceDescription && (
          <span className={helperClass}>{String(priceDescription)}</span>
        )}
      </div>
    );
  }

  if (hasYearly) {
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${colorClass}`}>{formatProductPrice(yearlyPrice, currency)}/year</span>
          {hasOriginal && (
            <span className={originalClass}>{formatProductPrice(effectiveOriginalPrice, currency)}/year</span>
          )}
          {finalDiscount > 0 && showDiscountBadge && (
            <span className={discountClass}>{finalDiscount}% OFF</span>
          )}
        </div>
        {priceDescription && (
          <span className={helperClass}>{String(priceDescription)}</span>
        )}
      </div>
    );
  }

  // Normal pricing display (current price, original price strikethrough, discount)
  if (hasSimplePrice) {
    const suffix = pricingType === 'monthly' || pricingType === 'Monthly Subscription'
      ? '/month'
      : pricingType === 'yearly' || pricingType === 'Yearly Subscription'
        ? '/year'
        : '';

    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          {/* Current Price */}
          <span className={`text-lg font-bold ${colorClass}`}>
            {formatProductPrice(price, currency)}{suffix}
          </span>
          
          {/* Original Price (strikethrough) */}
          {hasOriginal && (
            <span className={originalClass}>
              {formatProductPrice(effectiveOriginalPrice, currency)}{suffix}
            </span>
          )}
          
          {/* Discount Badge */}
          {finalDiscount > 0 && showDiscountBadge && (
            <span className={discountClass}>{finalDiscount}% OFF</span>
          )}
        </div>
        
        {/* Savings Display */}
        {hasOriginal && getNumeric(effectiveOriginalPrice) > getNumeric(price) && (
          <div className="text-xs text-green-600 font-medium">
            You save {formatProductPrice(getNumeric(effectiveOriginalPrice) - getNumeric(price), currency)}
          </div>
        )}
        
        {/* Type Indicator */}
        {showTypeIndicator && pricingType && !['monthly','Monthly Subscription','yearly','Yearly Subscription','one-time','One-time Payment','free','custom'].includes(String(pricingType)) && (
          <span className={`capitalize ${helperClass}`}>({String(pricingType)})</span>
        )}
        
        {/* Price Description */}
        {priceDescription && (
          <span className={helperClass}>{String(priceDescription)}</span>
        )}
      </div>
    );
  }

  // Fallback: no pricing information
  return null;
}
