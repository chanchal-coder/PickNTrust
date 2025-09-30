import { ShoppingCart, Shield, Star, Sparkles, Check } from "lucide-react";

export default function FooterLogo({ className = "flex items-center justify-center" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Footer-sized Icon - Design 2 */}
      <div className="relative">
        {/* Main Shopping Cart Icon with Gradient */}
        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full shadow-xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
          <ShoppingCart className="w-5 h-5 text-white" />
          
          {/* Floating Checkmark to the Right */}
          <div className="absolute -right-1.5 top-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
            <Check className="w-3 h-3 text-white font-bold" />
          </div>
          
          {/* Trust Shield at Bottom */}
          <div className="absolute -bottom-1 -left-0.5 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-2.5 h-2.5 text-white" />
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute -top-1 -left-1 text-yellow-400 animate-pulse">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 text-pink-400 animate-pulse">
            <Star className="w-2 h-2" />
          </div>
          
          {/* Animated Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin" style={{animationDuration: '3s'}}></div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full blur-xl opacity-50 -z-10 animate-pulse"></div>
      </div>
    </div>
  );
}