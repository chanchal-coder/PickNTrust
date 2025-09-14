import { ShoppingCart, Shield, Star, Sparkles, Check, Heart } from "lucide-react";

// Design 4: Playful with Multiple Animated Elements
export default function LogoDesign4({ className = "flex flex-col items-center text-center" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Playful Icon with Multiple Elements */}
      <div className="relative mb-3">
        {/* Main Shopping Cart Icon with Rainbow Gradient */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center transform hover:rotate-3 hover:scale-110 transition-all duration-300">
          <ShoppingCart className="w-8 h-8 text-white" />
          
          {/* Multiple Checkmarks Floating Around */}
          <div className="absolute -top-2 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Check className="w-3 h-3 text-white" />
          </div>
          <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          
          {/* Trust and Love Elements */}
          <div className="absolute top-0 left-0 text-red-400 animate-bounce" style={{animationDelay: '0.5s'}}>
            <Heart className="w-3 h-3" />
          </div>
          <div className="absolute -top-3 right-2 text-yellow-400 animate-pulse">
            <Star className="w-4 h-4" />
          </div>
          <div className="absolute bottom-0 right-0 text-blue-300 animate-bounce" style={{animationDelay: '1s'}}>
            <Shield className="w-3 h-3" />
          </div>
          <div className="absolute -bottom-2 left-1 text-purple-300 animate-pulse">
            <Sparkles className="w-3 h-3" />
          </div>
          
          {/* Multiple Animated Rings */}
          <div className="absolute inset-0 rounded-3xl border-2 border-white/40 animate-ping"></div>
          <div className="absolute inset-1 rounded-3xl border border-yellow-300/50 animate-pulse"></div>
        </div>
        
        {/* Rainbow Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 rounded-3xl blur-xl opacity-60 -z-10 animate-pulse"></div>
      </div>
      
      {/* Playful Brand Text */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            Pick
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            N
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Trust
          </span>
          <div className="text-rainbow animate-bounce ml-1"><i className="fas fa-star"></i></div>
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Shop Smart, Shop Trusted
        </div>
        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
          Pick. Click. Trust. Shop Smart.
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Your trusted shopping companion
        </div>
      </div>
    </div>
  );
}