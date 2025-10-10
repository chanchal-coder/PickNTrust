import type { FC } from 'react';
import { ExternalLink, Tag, TrendingUp, Star } from 'lucide-react';

interface AffiliateProduct {
  id: number;
  name: string;
  price: string | number;
  currency?: string;
  image_url: string;
  affiliate_url: string;
  original_url?: string;
  affiliate_network: string;
  affiliate_tag_applied: number;
  category?: string;
  rating?: string | number;
  discount?: number;
  description?: string;
}

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  onAffiliateClick?: (productId: number, networkId: string, affiliateUrl: string) => void;
}

const AffiliateProductCard: FC<AffiliateProductCardProps> = ({ 
  product, 
  onAffiliateClick 
}) => {
  const handleAffiliateClick = () => {
    // Track the click
    if (onAffiliateClick) {
      onAffiliateClick(product.id, product.affiliate_network, product.affiliate_url);
    }
    
    // Open affiliate URL
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  const getNetworkBadgeColor = (network: string) => {
    switch (network.toLowerCase()) {
      case 'amazon': return 'bg-orange-100 text-orange-800';
      case 'cuelinks': return 'bg-blue-100 text-blue-800';
      case 'flipkart': return 'bg-yellow-100 text-yellow-800';
      case 'cj': return 'bg-purple-100 text-purple-800';
      case 'shareasale': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: string | number, currency?: string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return '';

    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
    return `${currencySymbol}${Math.round(numericPrice).toLocaleString()}`; // Use whole numbers only
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/api/placeholder/300/200';
          }}
        />
        
        {/* Affiliate Network Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNetworkBadgeColor(product.affiliate_network)}`}>
            <Tag className="w-3 h-3 mr-1" />
            {product.affiliate_network.toUpperCase()}
          </span>
        </div>
        
        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{product.discount}%
            </span>
          </div>
        )}
        
        {/* Affiliate Tag Status */}
        <div className="absolute bottom-2 right-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            product.affiliate_tag_applied 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {product.affiliate_tag_applied ? '<i className="fas fa-check"></i> Tagged' : '⚠ Pending'}
          </span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
          </div>
        )}
        
        {/* Category */}
        {product.category && (
          <div className="mb-2">
            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {product.category}
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.discount && product.discount > 0 && (
              <TrendingUp className="w-4 h-4 text-green-500 ml-2" />
            )}
          </div>
        </div>
        
        {/* Affiliate Button */}
        <button
          onClick={handleAffiliateClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Deal
        </button>
        
        {/* Affiliate Disclosure */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Affiliate link - We may earn a commission
        </p>
      </div>
    </div>
  );
};

export default AffiliateProductCard;