import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define Product type locally to avoid schema conflicts
interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: string;
  originalPrice?: string | null;
  imageUrl: string;
  affiliateUrl: string;
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  category?: string;
  gender?: string | null;
  rating?: string;
  reviewCount?: number;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | null;
  createdAt?: Date | null;
  source?: string;
}

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  isInWishlist: (productId: string | number) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pickntrust-wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        localStorage.removeItem('pickntrust-wishlist');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pickntrust-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist(prev => {
      if (prev.some(p => String(p.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string | number) => {
    setWishlist(prev => prev.filter(p => String(p.id) !== String(productId)));
  };

  const isInWishlist = (productId: string | number) => {
    return wishlist.some(p => String(p.id) === String(productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, wishlistCount: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
