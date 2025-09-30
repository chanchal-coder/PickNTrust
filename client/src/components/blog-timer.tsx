import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface BlogTimerProps {
  hasTimer: boolean;
  timerStartTime: string | Date | null;
  timerDuration: number | null;
}

export function BlogTimer({ hasTimer, timerStartTime, timerDuration }: BlogTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!hasTimer || !timerStartTime || !timerDuration) {
      return;
    }

    const startTime = new Date(timerStartTime);
    const expiryTime = new Date(startTime.getTime() + (timerDuration * 60 * 60 * 1000));

    const updateTimer = () => {
      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [hasTimer, timerStartTime, timerDuration]);

  if (!hasTimer || !timerStartTime || !timerDuration) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
      isExpired 
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600' 
        : 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-600'
    }`}>
      <Clock className="w-3 h-3" />
      <span>
        {isExpired ? 'Expired' : `Post expires in ${timeLeft}`}
      </span>
    </div>
  );
}