import { ShoppingCart, Shield, Star, Sparkles, Check } from "lucide-react";

// Design 1: Centered with Large Checkmark Inside Cart
export default function LogoDesign1({ className = "flex flex-col items-center text-center" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Amazing Icon with Large Checkmark */}
      <div className="relative mb-3">
        {/* Main Shopping Cart Icon with Gradient */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl shadow-xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
          <ShoppingCart className="w-8 h-8 text-white" />
          
          {/* Large Glowing Checkmark Inside Cart */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Check className="w-4 h-4 text-white font-bold" />
          </div>
          
          {/* Trust Shield Overlay */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Shield className="w-4 h-4 text-white" />
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute -top-3 -left-3 text-yellow-400 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="absolute -bottom-2 -right-3 text-pink-400 animate-bounce">
            <Star className="w-4 h-4" />
          </div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-xl border-2 border-white/30 animate-pulse"></div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl blur-lg opacity-40 -z-10 animate-pulse"></div>
      </div>
      
      {/* Brand Text */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pick
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            N
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            Trust
          </span>
          <div className="text-yellow-400 animate-bounce ml-1"><i className="fas fa-sparkles"></i></div>
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Shop Smart, Shop Trusted
        </div>
        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
          Pick. Click. Trust. Shop Smart.
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Your trusted shopping companion
        </div>
      </div>
    </div>
  );
}