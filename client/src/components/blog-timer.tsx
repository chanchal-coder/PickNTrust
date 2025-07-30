import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { type BlogPost } from "@shared/schema";

interface BlogTimerProps {
  blogPost: BlogPost;
  className?: string;
}

export function BlogTimer({ blogPost, className = "" }: BlogTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!blogPost.hasTimer || !blogPost.timerStartTime || !blogPost.timerDuration) {
      return;
    }

    const calculateTimeLeft = () => {
      const startTime = new Date(blogPost.timerStartTime!);
      const endTime = new Date(startTime.getTime() + (blogPost.timerDuration! * 60 * 60 * 1000));
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
  }, [blogPost.hasTimer, blogPost.timerStartTime, blogPost.timerDuration]);

  // Don't render if timer is not enabled
  if (!blogPost.hasTimer || !blogPost.timerStartTime || !blogPost.timerDuration) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${
      isExpired 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400' 
        : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300'
    } ${className}`}>
      <Clock className={`w-3 h-3 ${
        isExpired ? 'text-red-500' : 'text-orange-600 dark:text-orange-400 animate-pulse'
      }`} />
      <span className="text-xs font-semibold tracking-wide">
        {isExpired ? "Article Expired" : `Article expires in ${timeLeft}`}
      </span>
    </div>
  );
}