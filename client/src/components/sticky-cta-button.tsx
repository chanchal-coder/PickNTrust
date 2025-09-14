import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function StickyCtaButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentDeal, setCurrentDeal] = useState(0);
  const [location] = useLocation();

  const deals = [
    { text: '<i className="fas fa-fire"></i> Hot Deal: iPhone 15 - 25% Off!', link: '/category/Mobiles%20%26%20Accessories' },
    { text: '<i className="fas fa-bolt"></i> Flash Sale: Laptops up to 40% Off!', link: '/category/Computers%20%26%20Laptops' },
    { text: '<i className="fas fa-bullseye"></i> Limited Time: Fashion 50% Off!', link: '/category/Fashion%20Men' },
    { text: '<i className="fas fa-home"></i> Home Appliances - Big Savings!', link: '/category/Appliances' }
  ];

  // Show button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cycle through deals
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDeal((prev) => (prev + 1) % deals.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [deals.length]);

  // Hide on certain pages
  if (location.includes('/admin') || location.includes('/wishlist')) {
    return null;
  }

  return (
    <>
      {/* Mobile Sticky CTA */}
      <div className={`fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 md:hidden ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}>
        <Link href={deals[currentDeal].link}>
          <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-full shadow-lg font-bold text-center transition-all transform hover:scale-105 animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <span>{deals[currentDeal].text}</span>
              <i className="fas fa-arrow-right"></i>
            </div>
          </button>
        </Link>
      </div>

      {/* Desktop Sticky CTA */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 hidden md:block ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}>
        <div className="relative">
          {/* Notification Badge */}
          <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
            Live Deals!
          </div>
          
          {/* Main CTA Button */}
          <Link href={deals[currentDeal].link}>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-full shadow-xl font-bold text-lg transition-all transform hover:scale-110 hover:rotate-1">
              <div className="flex items-center space-x-3">
                <div className="text-left">
                  <div className="text-sm opacity-90">Today's Best</div>
                  <div className="font-bold">Shop Now</div>
                </div>
                <i className="fas fa-shopping-bag text-xl"></i>
              </div>
            </button>
          </Link>

          {/* Floating Deal Text */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-600">
            {deals[currentDeal].text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
          </div>
        </div>
      </div>

      {/* Countdown Timer for Urgency */}
      <div className={`fixed top-20 right-4 z-40 transition-all duration-300 hidden lg:block ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-xs font-medium">Deal Ends In:</div>
          <div className="text-lg font-bold">
            <CountdownTimer />
          </div>
        </div>
      </div>
    </>
  );
}

// Countdown Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset timer
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span>
      {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}