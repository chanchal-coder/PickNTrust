export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Amazing Animated Shopping Cart Logo */}
      <defs>
        <linearGradient id="gradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="25%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="75%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        
        <linearGradient id="trustShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        
        <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        
        <filter id="amazingGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Circle Background with Amazing Gradient */}
      <circle cx="60" cy="60" r="55" fill="url(#gradientMain)" filter="url(#amazingGlow)" opacity="0.95">
        <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="50" fill="white" opacity="0.1" />
      
      {/* Enhanced Shopping Cart - Larger & More Prominent */}
      <g transform="translate(25, 25)">
        <animateTransform attributeName="transform" type="translate" values="25,25; 26,24; 25,25" dur="2s" repeatCount="indefinite" />
        
        {/* Cart Body - Larger & More Visible */}
        <path d="M5 20 L60 20 L56 60 L9 60 Z" fill="white" opacity="1" stroke="url(#gradientMain)" strokeWidth="4" filter="url(#innerGlow)" />
        
        {/* Cart Handle - Enhanced & Larger */}
        <path d="M18 20 L18 12 Q18 6 25 6 L40 6 Q47 6 47 12 L47 20" stroke="url(#gradientMain)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" />
        
        {/* Creative Floating Trust Checkmarks - Adjusted for Larger Cart */}
        <g opacity="0.95">
          {/* Main checkmark in cart with pulse effect */}
          <g transform="translate(25, 35)">
            <circle cx="7" cy="7" r="8" fill="url(#trustShield)" opacity="0.9">
              <animate attributeName="r" values="8;10;8" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
            <path d="M3 7 L6.5 10.5 L11 5.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="stroke-width" values="3;4;3" dur="3s" repeatCount="indefinite" />
            </path>
          </g>
          
          {/* Floating mini checkmarks around larger cart */}
          <g transform="translate(8, 25)">
            <circle cx="3" cy="3" r="2.5" fill="url(#sparkleGrad)" opacity="0.8">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <path d="M1 3 L2.5 4.5 L5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <animateTransform attributeName="transform" type="translate" values="8,25; 6,23; 8,25" dur="4s" repeatCount="indefinite" />
          </g>
          
          <g transform="translate(45, 28)">
            <circle cx="3" cy="3" r="2.5" fill="url(#trustShield)" opacity="0.7">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
            </circle>
            <path d="M1 3 L2.5 4.5 L5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <animateTransform attributeName="transform" type="translate" values="45,28; 47,26; 45,28" dur="4s" repeatCount="indefinite" begin="1s" />
          </g>
          
          <g transform="translate(28, 45)">
            <circle cx="3" cy="3" r="2" fill="url(#gradientMain)" opacity="0.6">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite" begin="1.5s" />
            </circle>
            <path d="M1.5 3 L2.5 4 L4.5 2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <animateTransform attributeName="transform" type="translate" values="28,45; 26,47; 28,45" dur="4s" repeatCount="indefinite" begin="2s" />
          </g>
        </g>
        
        {/* Amazing Shopping Items - Animated */}
        <g opacity="0.9">
          <circle cx="22" cy="25" r="3" fill="url(#trustShield)">
            <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="32" cy="25" r="3" fill="url(#sparkleGrad)">
            <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <rect x="19" y="32" width="6" height="6" rx="1" fill="url(#gradientMain)" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x="29" y="32" width="6" height="6" rx="1" fill="url(#trustShield)" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.7s" />
          </rect>
        </g>
        
        {/* Cart Wheels - Larger & Rotating */}
        <circle cx="18" cy="65" r="6" fill="white" stroke="url(#gradientMain)" strokeWidth="3">
          <animateTransform attributeName="transform" type="rotate" values="0 18 65; 360 18 65" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="65" r="6" fill="white" stroke="url(#gradientMain)" strokeWidth="3">
          <animateTransform attributeName="transform" type="rotate" values="0 48 65; 360 48 65" dur="4s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Enhanced Trust Shield with Creative Checkmark */}
      <g transform="translate(85, 15)">
        <circle cx="12" cy="12" r="15" fill="url(#trustShield)" filter="url(#amazingGlow)">
          <animate attributeName="r" values="15;17;15" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="12" r="12" fill="white" opacity="0.2" />
        
        {/* Animated checkmark with drawing effect */}
        <path d="M6 12 L10 16 L18 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95" strokeDasharray="20" strokeDashoffset="20">
          <animate attributeName="stroke-dashoffset" values="20;0;20" dur="3s" repeatCount="indefinite" />
        </path>
        
        {/* Sparkle effect around checkmark */}
        <g fill="white" opacity="0.8">
          <circle cx="8" cy="10" r="0.8">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="16" cy="10" r="0.8">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
          <circle cx="12" cy="18" r="0.8">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.5s" />
          </circle>
        </g>
      </g>
      
      {/* Amazing Sparkle Effects - Enhanced */}
      <g fill="white" opacity="0.9">
        <circle cx="25" cy="30" r="2">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0s" />
          <animate attributeName="r" values="1.5;2.5;1.5" dur="1.5s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="95" cy="85" r="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="30" cy="95" r="1.8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="1s" />
          <animate attributeName="r" values="1.3;2.3;1.3" dur="1.5s" repeatCount="indefinite" begin="1s" />
        </circle>
        <circle cx="105" cy="35" r="1.2">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="1.2s" />
          <animate attributeName="r" values="0.8;1.8;0.8" dur="1.5s" repeatCount="indefinite" begin="1.2s" />
        </circle>
      </g>
      
      {/* Magical Ring Animation */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#gradientMain)" strokeWidth="2" opacity="0.6">
        <animate attributeName="stroke-dasharray" values="0 327; 163 163; 327 0" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
      
      {/* Overall Floating Animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-3; 0,0"
        dur="6s"
        repeatCount="indefinite"
      />
    </svg>
  );
}