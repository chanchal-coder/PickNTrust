import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// Define Product type locally to avoid schema conflicts
interface Product {
  id: number;
  name: string;
  description: string;
  price?: string | number;
  originalPrice?: string | number | null;
  imageUrl: string;
  affiliateUrl: string;
  affiliateNetworkId: number | null;
  affiliateNetworkName: string | null;
  category: string;
  gender: string | null;
  rating: string;
  reviewCount: number;
  discount: number | null;
  isNew: boolean;
  isFeatured: boolean;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
  createdAt: Date | null;
}

interface ProductTimerProps {
  product: Product;
  className?: string;
}

export function ProductTimer({ product, className = "" }: ProductTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!product.hasTimer || !product.timerStartTime || !product.timerDuration) {
      return;
    }

    const calculateTimeLeft = () => {
      const startTime = new Date(product.timerStartTime!);
      const endTime = new Date(startTime.getTime() + (product.timerDuration! * 60 * 60 * 1000));
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [product.hasTimer, product.timerStartTime, product.timerDuration]);

  // Don't render if timer is not enabled
  if (!product.hasTimer || !product.timerStartTime || !product.timerDuration) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
      isExpired 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400' 
        : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300'
    } ${className}`}>
      <Clock className={`w-3 h-3 ${
        isExpired ? 'text-red-500' : 'text-orange-600 dark:text-orange-400 animate-pulse'
      }`} />
      <span className="text-xs font-medium">
        {isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}
      </span>
    </div>
  );
}