import { ShoppingCart, Shield, Star, Sparkles, Check } from "lucide-react";

// Design 3: Minimal with Integrated Checkmark in Cart Handle
export default function LogoDesign3({ className = "flex flex-col items-center text-center" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Minimal Icon with Integrated Elements */}
      <div className="relative mb-3">
        {/* Main Shopping Cart Icon with Gradient */}
        <div className="relative w-18 h-18 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300">
          <ShoppingCart className="w-10 h-10 text-white" />
          
          {/* Checkmark Badge on Handle */}
          <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-3 h-3 text-white font-bold" />
          </div>
          
          {/* Trust Elements */}
          <div className="absolute -top-1 -left-1 text-yellow-300 animate-pulse">
            <Star className="w-4 h-4" />
          </div>
          <div className="absolute -bottom-1 -right-1 text-emerald-300">
            <Shield className="w-4 h-4" />
          </div>
          
          {/* Subtle Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/20"></div>
        </div>
        
        {/* Subtle Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl blur-lg opacity-25 -z-10"></div>
      </div>
      
      {/* Clean Brand Text */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-3xl font-black text-blue-600 dark:text-blue-400">Pick</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">N</span>
          <span className="text-3xl font-black text-purple-600 dark:text-purple-400">Trust</span>
          <div className="text-emerald-500 ml-1"><i className="fas fa-check"></i></div>
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