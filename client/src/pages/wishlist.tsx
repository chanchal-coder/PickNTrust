import { useWishlist } from "@/hooks/use-wishlist";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PriceTag from '@/components/PriceTag';
import PageBanner from '@/components/PageBanner';

import UniversalPageLayout from '@/components/UniversalPageLayout';
export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();

  const handleAffiliateClick = async (product: any) => {
    try {
      await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          affiliateUrl: product.affiliateLink
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
    window.open(product.affiliateLink, '_blank');
  };

  return (
    <UniversalPageLayout pageId="wishlist">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            
            {/* Amazing Page Banner */}
            <PageBanner page="wishlist" />
            
            <div className="pt-20 pb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                    </p>
                  </div>
                  
                  {wishlist.length > 0 && (
                    <Button 
                      onClick={clearWishlist}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
      
                {/* Wishlist Items */}
                {wishlist.length === 0 ? (
                  <div className="text-center py-16">
                    <i className="fas fa-heart text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">Start adding products you love!</p>
                    <Link href="/">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/api/placeholder/300/200';
                            }}
                          />
                          
                          {/* Remove from wishlist button */}
                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Remove from wishlist"
                          >
                            <i className="fas fa-times text-red-500"></i>
                          </button>
      
                          {/* Featured badge */}
                          {(product as any).isFeatured && (
                            <Badge className="absolute top-2 left-2 bg-accent-orange text-white">
                              Featured
                            </Badge>
                          )}
                        </div>
      
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                            {product.description}
                          </p>
      
                          {/* Price and rating */}
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <PriceTag 
                                product={product}
                                colorClass="text-accent-green"
                                originalClass="text-gray-500 line-through text-sm"
                                freeClass="text-green-600"
                                helperClass="text-xs text-gray-500"
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <i className="fas fa-star text-yellow-400 text-sm mr-1"></i>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {product.rating}
                              </span>
                            </div>
                          </div>
      
                          {/* Category and discount */}
                          <div className="flex justify-between items-center mb-4">
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                            
                            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}% OFF
                              </Badge>
                            )}
                          </div>
      
                          {/* Buy button */}
                          <Button 
                            onClick={() => handleAffiliateClick(product)}
                            className="w-full bg-accent-green hover:bg-green-600 text-white"
                          >
                            Buy Now <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
      
            <ScrollNavigation />
      </div>
    </UniversalPageLayout>
  );
}