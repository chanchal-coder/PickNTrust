import { ShoppingCart, Check, Shield, Sparkles, Star } from "lucide-react";

export default function CurvedTextLogo({ className = "flex items-center justify-center" }: { className?: string }) {
  return (
    <div className={className}>
      <svg width="200" height="200" viewBox="0 0 200 200" className="w-20 h-20">
        <defs>
          {/* Gradients */}
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          
          <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          
          {/* Text Paths for Curved Text */}
          <path id="topCurve" d="M 40 80 A 60 60 0 0 1 160 80" fill="none" />
          <path id="bottomCurve" d="M 160 120 A 60 60 0 0 1 40 120" fill="none" />
        </defs>
        
        {/* Main Purple Circle */}
        <circle cx="100" cy="100" r="55" fill="url(#mainGradient)" className="drop-shadow-2xl">
          <animate attributeName="r" values="55;58;55" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Shopping Cart */}
        <g transform="translate(100, 100)">
          <rect x="-12" y="-8" width="20" height="12" rx="2" fill="white" opacity="0.9" />
          <path d="M-8 -8 L-8 -12 Q-8 -15 -5 -15 L5 -15 Q8 -15 8 -12 L8 -8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cart wheels */}
          <circle cx="-6" cy="8" r="3" fill="white" />
          <circle cx="6" cy="8" r="3" fill="white" />
        </g>
        
        {/* Green Checkmark Circle (top right) */}
        <circle cx="135" cy="65" r="18" fill="url(#checkGradient)" className="drop-shadow-lg">
          <animate attributeName="cy" values="65;62;65" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M 127 65 L 132 70 L 143 59" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        
        {/* Orange Shield Circle (bottom left) */}
        <circle cx="65" cy="135" r="15" fill="url(#shieldGradient)" className="drop-shadow-lg">
          <animate attributeName="cx" values="65;68;65" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <path d="M 65 128 L 60 133 Q 60 140 65 142 Q 70 140 70 133 Z" fill="white" />
        
        {/* Stars */}
        <g fill="#FCD34D" className="animate-pulse">
          {/* Top left star */}
          <path d="M 50 50 L 52 56 L 58 56 L 53 60 L 55 66 L 50 62 L 45 66 L 47 60 L 42 56 L 48 56 Z" />
          {/* Top right star */}
          <path d="M 150 40 L 151.5 44 L 155.5 44 L 152.25 46.5 L 153.75 50.5 L 150 48 L 146.25 50.5 L 147.75 46.5 L 144.5 44 L 148.5 44 Z" />
          {/* Bottom right star */}
          <path d="M 160 150 L 161.5 154 L 165.5 154 L 162.25 156.5 L 163.75 160.5 L 160 158 L 156.25 160.5 L 157.75 156.5 L 154.5 154 L 158.5 154 Z" />
          {/* Bottom left star */}
          <path d="M 40 160 L 41.5 164 L 45.5 164 L 42.25 166.5 L 43.75 170.5 L 40 168 L 36.25 170.5 L 37.75 166.5 L 34.5 164 L 38.5 164 Z" />
        </g>
        
        {/* Curved Text - "Pick N Trust" at top */}
        <text fontSize="14" fontWeight="bold" fill="#FCD34D" fontFamily="Arial, sans-serif">
          <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
            ⭐ Pick N Trust ⭐
          </textPath>
        </text>
        
        {/* Curved Text - "Shop Smart, Shop Trusted" at bottom */}
        <text fontSize="12" fontWeight="bold" fill="#FCD34D" fontFamily="Arial, sans-serif">
          <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
            ⭐ Shop Smart, Shop Trusted ⭐
          </textPath>
        </text>
      </svg>
    </div>
  );
}