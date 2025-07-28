export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Enhanced Trusted Shopping Logo */}
      <defs>
        <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="30%" stopColor="#6366F1" />
          <stop offset="70%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        
        <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
        
        <filter id="trustGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="innerShadow">
          <feOffset dx="0" dy="2"/>
          <feGaussianBlur stdDeviation="2" result="offset-blur"/>
          <feFlood floodColor="#000000" floodOpacity="0.2"/>
          <feComposite in2="offset-blur" operator="in"/>
        </filter>
      </defs>
      
      {/* Main Trust Circle with Premium Look */}
      <circle cx="70" cy="70" r="65" fill="url(#trustGradient)" filter="url(#trustGlow)" opacity="0.95" />
      <circle cx="70" cy="70" r="60" fill="white" opacity="0.15" />
      <circle cx="70" cy="70" r="55" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
      
      {/* Central Shopping Bag - Premium Design */}
      <g transform="translate(45, 45)">
        <path d="M8 18 L42 18 L40 55 L10 55 Z" fill="white" opacity="0.98" stroke="rgba(59,130,246,0.5)" strokeWidth="2" filter="url(#innerShadow)" />
        <path d="M15 18 L15 12 Q15 6 20 6 L30 6 Q35 6 35 12 L35 18" stroke="url(#trustGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        
        {/* Premium Shopping Items */}
        <circle cx="20" cy="28" r="3" fill="url(#shieldGradient)" opacity="0.9" />
        <circle cx="30" cy="28" r="3" fill="url(#bagGradient)" opacity="0.9" />
        <rect x="17" y="35" width="6" height="6" rx="1" fill="url(#trustGradient)" opacity="0.8" />
        <rect x="27" y="35" width="6" height="6" rx="1" fill="url(#starGradient)" opacity="0.8" />
        
        {/* Trust Handles */}
        <circle cx="25" cy="12" r="2" fill="url(#shieldGradient)" opacity="0.7" />
      </g>
      
      {/* Enhanced Trust Shield - Larger & More Prominent */}
      <g transform="translate(90, 15)">
        <circle cx="15" cy="15" r="18" fill="url(#shieldGradient)" filter="url(#trustGlow)" />
        <circle cx="15" cy="15" r="15" fill="white" opacity="0.25" />
        <path d="M8 15 L13 20 L22 11" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="15" cy="15" r="12" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </g>
      
      {/* Quality Star Rating Indicator */}
      <g transform="translate(15, 15)">
        <circle cx="12" cy="12" r="14" fill="url(#starGradient)" filter="url(#trustGlow)" opacity="0.9" />
        <path d="M12 6 L14 10 L18 10 L15 13 L16 17 L12 15 L8 17 L9 13 L6 10 L10 10 Z" fill="white" />
        <text x="12" y="20" fontSize="6" fill="white" fontWeight="bold" textAnchor="middle">5★</text>
      </g>
      
      {/* Verified Badge */}
      <g transform="translate(15, 100)">
        <circle cx="12" cy="12" r="12" fill="url(#trustGradient)" opacity="0.9" />
        <path d="M7 12 L10 15 L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="12" y="20" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">VERIFIED</text>
      </g>
      
      {/* Premium Price Tag with Savings */}
      <g transform="translate(100, 100)">
        <path d="M0 8 L12 8 L18 14 L12 20 L0 20 Q-6 14 0 8 Z" fill="url(#bagGradient)" filter="url(#trustGlow)" />
        <circle cx="6" cy="14" r="2.5" fill="white" opacity="0.95" />
        <text x="10" y="16" fontSize="8" fill="white" fontWeight="bold">₹</text>
        <text x="9" y="25" fontSize="4" fill="white" fontWeight="bold" textAnchor="middle">SAVE</text>
      </g>
      
      {/* Enhanced Sparkle Trust Effects */}
      <g fill="white" opacity="0.9">
        <circle cx="35" cy="40" r="2">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="105" cy="75" r="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
        </circle>
        <circle cx="40" cy="105" r="1.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" begin="1.6s" />
        </circle>
        <circle cx="115" cy="40" r="1.2">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
        </circle>
      </g>
      
      {/* Trust Ring Animation */}
      <circle cx="70" cy="70" r="58" fill="none" stroke="white" strokeWidth="1" opacity="0.6">
        <animate attributeName="stroke-dasharray" values="0 364; 182 182; 364 0" dur="6s" repeatCount="indefinite" />
      </circle>
      
      {/* Floating Animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-2; 0,0"
        dur="5s"
        repeatCount="indefinite"
      />
    </svg>
  );
}