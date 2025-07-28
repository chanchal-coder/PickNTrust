export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shopping Platform Logo with Trust Badge */}
      <defs>
        <linearGradient id="shopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        
        <linearGradient id="trustBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Circle Background */}
      <circle cx="60" cy="60" r="55" fill="url(#shopGradient)" filter="url(#glow)" opacity="0.9" />
      <circle cx="60" cy="60" r="50" fill="white" opacity="0.1" />
      
      {/* Shopping Bag */}
      <g transform="translate(35, 35)">
        <path d="M10 15 L40 15 L38 45 L12 45 Z" fill="white" opacity="0.95" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
        <path d="M15 15 L15 10 Q15 5 20 5 L30 5 Q35 5 35 10 L35 15" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Shopping Items in Bag */}
        <rect x="18" y="22" width="4" height="4" fill="url(#cartGradient)" opacity="0.8" />
        <rect x="26" y="22" width="4" height="4" fill="url(#trustBadge)" opacity="0.8" />
        <rect x="18" y="30" width="4" height="4" fill="url(#shopGradient)" opacity="0.8" />
        <rect x="26" y="30" width="4" height="4" fill="url(#cartGradient)" opacity="0.8" />
      </g>
      
      {/* Trust Shield Badge */}
      <g transform="translate(75, 20)">
        <circle cx="12" cy="12" r="15" fill="url(#trustBadge)" filter="url(#glow)" />
        <circle cx="12" cy="12" r="12" fill="white" opacity="0.2" />
        <path d="M6 12 L10 16 L18 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      
      {/* Price Tag */}
      <g transform="translate(20, 75)">
        <path d="M0 5 L10 5 L15 10 L10 15 L0 15 Q-5 10 0 5 Z" fill="url(#cartGradient)" filter="url(#glow)" />
        <circle cx="5" cy="10" r="2" fill="white" opacity="0.9" />
        <text x="8" y="12" fontSize="8" fill="white" fontWeight="bold">₹</text>
      </g>
      
      {/* Sparkle Effects */}
      <g fill="white" opacity="0.8">
        <circle cx="25" cy="30" r="1.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="95" cy="85" r="1">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0.7s" />
        </circle>
        <circle cx="30" cy="95" r="1.2">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="1.4s" />
        </circle>
      </g>
      
      {/* Subtle Animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-1; 0,0"
        dur="4s"
        repeatCount="indefinite"
      />
    </svg>
  );
}