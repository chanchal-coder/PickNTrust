import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { type Product } from "@shared/schema";

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
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock className="w-4 h-4 text-red-500 animate-pulse" />
      <span className={`text-sm font-semibold ${
        isExpired ? 'text-red-600 dark:text-red-400' : 'text-red-500 dark:text-red-400'
      }`}>
        {isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}
      </span>
    </div>
  );
}