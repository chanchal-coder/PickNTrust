// No default React import needed with modern JSX transform
import { formatPrice as formatCurrencyPrice, type CurrencyCode } from '@/utils/currency';

interface PriceTagProps {
  product: any;
  colorClass?: string; // main price color
  originalClass?: string; // strike-through original price
  freeClass?: string; // FREE text color
  helperClass?: string; // helper text (e.g., both monthly/yearly)
  showTypeIndicator?: boolean; // show non-standard pricing type label
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

export default function PriceTag({
  product,
  colorClass = 'text-blue-600',
  originalClass = 'text-gray-500 line-through text-sm',
  freeClass = 'text-green-600',
  helperClass = 'text-xs text-gray-500',
  showTypeIndicator = true,
}: PriceTagProps) {
  const {
    price,
    originalPrice,
    currency,
    pricingType,
    priceDescription,
    isFree,
    monthlyPrice,
    yearlyPrice,
  } = product || {};

  const hasMonthly = getNumeric(monthlyPrice) > 0;
  const hasYearly = getNumeric(yearlyPrice) > 0;
  const hasOriginal = getNumeric(originalPrice) > 0;
  const hasSimplePrice = getNumeric(price) > 0;

  // FREE
  if (isFree || pricingType === 'free') {
    return <span className={`text-lg font-bold ${freeClass}`}>FREE</span>;
  }

  // Custom pricing type: show label only
  if (pricingType === 'custom') {
    const label = priceDescription && priceDescription.trim() !== '' ? priceDescription : 'Custom Pricing';
    return <span className={`text-lg font-bold ${freeClass}`}>{label}</span>;
  }

  // Monthly/Yearly explicit prices
  if (hasMonthly) {
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-lg font-bold ${colorClass}`}>{formatProductPrice(monthlyPrice, currency)}/month</span>
        {hasOriginal && (
          <span className={originalClass}>{formatProductPrice(originalPrice, currency)}/month</span>
        )}
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
      <div className="flex items-center space-x-2">
        <span className={`text-lg font-bold ${colorClass}`}>{formatProductPrice(yearlyPrice, currency)}/year</span>
        {hasOriginal && (
          <span className={originalClass}>{formatProductPrice(originalPrice, currency)}/year</span>
        )}
        {priceDescription && (
          <span className={helperClass}>{String(priceDescription)}</span>
        )}
      </div>
    );
  }

  // Base price with pricing type suffixes
  const suffix = pricingType === 'monthly' || pricingType === 'Monthly Subscription'
    ? '/month'
    : pricingType === 'yearly' || pricingType === 'Yearly Subscription'
      ? '/year'
      : '';

  // Hide zero/empty price entirely; show description only if provided
  if (!hasSimplePrice) {
    return priceDescription ? (
      <span className={helperClass}>{String(priceDescription)}</span>
    ) : null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-lg font-bold ${colorClass}`}>{formatProductPrice(price, currency)}{suffix}</span>
      {hasOriginal && (
        <span className={originalClass}>
          {formatProductPrice(originalPrice, currency)}{suffix}
        </span>
      )}
      {showTypeIndicator && pricingType && !['monthly','Monthly Subscription','yearly','Yearly Subscription','one-time','One-time Payment','free','custom'].includes(String(pricingType)) && (
        <span className={`capitalize ${helperClass}`}>({String(pricingType)})</span>
      )}
      {priceDescription && (
        <span className={helperClass}>{String(priceDescription)}</span>
      )}
    </div>
  );
}