import { ShoppingCart, Shield, Star, Sparkles, Check } from "lucide-react";

// Design 2: Side-by-side with Floating Checkmark
export default function LogoDesign2({ className = "flex flex-col items-center text-center" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Amazing Icon with Floating Checkmark */}
      <div className="relative mb-3">
        {/* Main Shopping Cart Icon with Gradient */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full shadow-xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
          <ShoppingCart className="w-8 h-8 text-white" />
          
          {/* Floating Checkmark to the Right */}
          <div className="absolute -right-3 top-0 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
            <Check className="w-5 h-5 text-white font-bold" />
          </div>
          
          {/* Trust Shield at Bottom */}
          <div className="absolute -bottom-2 -left-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute -top-2 -left-2 text-yellow-400 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="absolute -bottom-1 -right-1 text-pink-400 animate-pulse">
            <Star className="w-3 h-3" />
          </div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin" style={{animationDuration: '3s'}}></div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full blur-xl opacity-50 -z-10 animate-pulse"></div>
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
          <div className="text-green-400 animate-bounce ml-1"><i className="fas fa-shield-alt"></i></div>
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