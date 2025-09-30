import React from 'react';
import { formatPrice as formatCurrencyPrice, type CurrencyCode } from '@/utils/currency';

interface EnhancedPriceTagProps {
  product: any;
  colorClass?: string; // main price color
  originalClass?: string; // strike-through original price
  freeClass?: string; // FREE text color
  helperClass?: string; // helper text (e.g., both monthly/yearly)
  discountClass?: string; // discount badge color
  showTypeIndicator?: boolean; // show non-standard pricing type label
  showDiscountBadge?: boolean; // show discount percentage badge
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

const formatProductPrice = (price?: string | number, productCurrency?: string) => {
  // Validate currency code and fallback to INR if invalid
  const validCurrencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY', 'KRW'];
  const currency: CurrencyCode = validCurrencies.includes(productCurrency as CurrencyCode) 
    ? (productCurrency as CurrencyCode) 
    : 'INR';
  const numeric = getNumeric(price);
  return formatCurrencyPrice(numeric, currency);
};

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
}: EnhancedPriceTagProps) {
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

  const hasMonthly = getNumeric(monthlyPrice) > 0;
  const hasYearly = getNumeric(yearlyPrice) > 0;
  const hasOriginal = originalPrice !== undefined && originalPrice !== null && 
    String(originalPrice) !== '' && String(originalPrice) !== '0' && getNumeric(originalPrice) > 0;
  const hasSimplePrice = getNumeric(price) > 0;
  
  // Check if product has complex pricing (tags)
  const hasComplexPricing = isFree || pricingType === 'free' || hasMonthly || hasYearly || 
    (pricingType && pricingType !== 'one-time' && pricingType !== 'One-time Payment');
  
  // Calculate discount percentage
  const calculatedDiscount = calculateDiscount(originalPrice, price);
  const finalDiscount = getNumeric(discount) > 0 ? getNumeric(discount) : calculatedDiscount;

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
            <span className={originalClass}>{formatProductPrice(originalPrice, currency)}/month</span>
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
            <span className={originalClass}>{formatProductPrice(originalPrice, currency)}/year</span>
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
              {formatProductPrice(originalPrice, currency)}{suffix}
            </span>
          )}
          
          {/* Discount Badge */}
          {finalDiscount > 0 && showDiscountBadge && (
            <span className={discountClass}>{finalDiscount}% OFF</span>
          )}
        </div>
        
        {/* Savings Display */}
        {hasOriginal && getNumeric(originalPrice) > getNumeric(price) && (
          <div className="text-xs text-green-600 font-medium">
            You save {formatProductPrice(getNumeric(originalPrice) - getNumeric(price), currency)}
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