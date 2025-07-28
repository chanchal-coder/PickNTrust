import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingBag, ArrowRight, Sparkles, Gift } from "lucide-react";

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [showHappyBox, setShowHappyBox] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 300px from top
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Show happy shopping box every 30 seconds when CTA is visible
    if (isVisible) {
      const interval = setInterval(() => {
        setShowHappyBox(true);
        setTimeout(() => setShowHappyBox(false), 3000);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main Sticky CTA Button */}
      <div className="fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out transform hover:scale-105">
        <Link
          href="#featured-products"
          onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById('featured-products');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 -z-10"></div>
          
          {/* Shopping Bag Icon */}
          <div className="relative">
            <ShoppingBag className="w-5 h-5 group-hover:animate-bounce" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
              <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
            </div>
          </div>
          
          {/* Text */}
          <span className="font-semibold text-sm whitespace-nowrap">
            Shop Now
          </span>
          
          {/* Arrow Icon */}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-colors duration-300"></div>
        </Link>
      </div>

      {/* Small Happy Shopping Box */}
      <div className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ease-out transform ${
        showHappyBox ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm relative overflow-hidden max-w-xs">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/10 rounded-2xl">
            <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/15 rounded-full"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Gift className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm">Happy Shopping! 🎉</p>
              <p className="text-xs opacity-90">Great deals await you!</p>
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