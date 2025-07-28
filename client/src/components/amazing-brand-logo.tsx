import { ShoppingCart, Shield, Star, Sparkles } from "lucide-react";

export default function AmazingBrandLogo({ className = "flex items-center gap-3" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Amazing Icon with Multiple Elements */}
      <div className="relative">
        {/* Main Shopping Cart Icon with Gradient */}
        <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl shadow-xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
          <ShoppingCart className="w-6 h-6 text-white" />
          
          {/* Trust Shield Overlay */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-3 h-3 text-white" />
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute -top-2 -left-2 text-yellow-400 animate-pulse">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="absolute -bottom-1 -right-2 text-pink-400 animate-bounce">
            <Star className="w-3 h-3" />
          </div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-xl border-2 border-white/30 animate-pulse"></div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl blur-lg opacity-30 -z-10 animate-pulse"></div>
      </div>
      
      {/* Amazing Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pick
          </span>
          <span className="text-xl font-black bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            N
          </span>
          <span className="text-xl font-black bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            Trust
          </span>
          <div className="text-yellow-400 animate-bounce">
            ✨
          </div>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Shop Smart, Shop Trusted
        </span>
      </div>
    </div>
  );
}