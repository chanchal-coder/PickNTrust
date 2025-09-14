import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingBag, ArrowRight, Sparkles, Gift, Clock } from "lucide-react";

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [showHappyBox, setShowHappyBox] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 300px from top
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Show happy shopping box every 25 seconds when CTA is visible with alternating messages
    if (isVisible) {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % 4); // Cycle through 4 messages
        setShowHappyBox(true);
        setTimeout(() => setShowHappyBox(false), 6000);
      }, 25000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  useEffect(() => {
    // Countdown timer for limited time offer
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const difference = endOfDay.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  // Alternating messages for happy shopping box
  const messages = [
    { title: 'Flash Sale! <i className="fas fa-fire"></i>', subtitle: 'Hurry, limited time deals!' },
    { title: 'Happy Shopping! <i className="fas fa-party-horn"></i>', subtitle: 'Great deals await you!' },
    { title: 'Best Prices! <i className="fas fa-dollar-sign"></i>', subtitle: 'Save big on top brands!' },
    { title: 'Trusted Deals! <i className="fas fa-sparkles"></i>', subtitle: 'Quality products guaranteed!' }
  ];

  const currentMessage = messages[messageIndex];

  return (
    <>
      {/* Main Sticky CTA Button */}
      <div className="fixed bottom-24 right-4 sm:right-8 z-40 transition-all duration-500 ease-in-out transform hover:scale-105">
        <Link
          href="#featured-products"
          onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById('featured-products');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="group relative inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 -z-10"></div>
          
          {/* Clock Icon for Limited Time */}
          <div className="relative">
            <Clock className="w-5 h-5 group-hover:animate-pulse text-yellow-300" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-bounce">
              <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
            </div>
          </div>
          
          {/* Text - Mobile Responsive */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap leading-tight">
              <span className="hidden sm:inline">Today's Top Picks</span>
              <span className="sm:hidden">Top Picks</span>
            </span>
            <span className="text-xs opacity-90 whitespace-nowrap leading-tight">
              <span className="hidden sm:inline">Ends in </span>
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          
          {/* Arrow Icon */}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-colors duration-300"></div>
        </Link>
      </div>

      {/* Small Happy Shopping Box */}
      <div className={`fixed bottom-6 left-4 sm:left-8 z-30 transition-all duration-500 ease-out transform ${
        showHappyBox ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm relative overflow-hidden max-w-xs sm:max-w-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/10 rounded-2xl">
            <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/15 rounded-full"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-full">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm">{currentMessage.title}</p>
              <p className="text-xs opacity-90 hidden sm:block">{currentMessage.subtitle}</p>
            </div>
          </div>
          
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse"></div>
          
          {/* Close Button */}
          <button
            onClick={() => setShowHappyBox(false)}
            className="absolute top-1 right-1 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}