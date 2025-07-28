export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnetic Shopping App Logo with Trust Elements */}
      <defs>
        <linearGradient id="magneticGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="25%" stopColor="#4ECDC4" />
          <stop offset="50%" stopColor="#45B7D1" />
          <stop offset="75%" stopColor="#96CEB4" />
          <stop offset="100%" stopColor="#FFEAA7" />
        </linearGradient>
        
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF6347" />
        </linearGradient>
        
        <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4AA" />
          <stop offset="100%" stopColor="#00A085" />
        </linearGradient>
        
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="50%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
        
        <filter id="magneticGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="pulseShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FF6B6B" floodOpacity="0.4"/>
        </filter>
      </defs>
      
      {/* Magnetic Aura Background with Pulse */}
      <circle cx="70" cy="70" r="65" fill="url(#magneticGradient)" opacity="0.1" filter="url(#magneticGlow)">
        <animate attributeName="r" values="60;70;60" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
      </circle>
      
      {/* Outer Ring with Rotation */}
      <circle cx="70" cy="70" r="58" stroke="url(#magneticGradient)" strokeWidth="2" fill="none" opacity="0.3">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 70 70; 360 70 70"
          dur="15s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Modern Web App Interface */}
      <rect x="35" y="45" width="70" height="50" rx="8" fill="url(#magneticGradient)" filter="url(#magneticGlow)" />
      <rect x="38" y="48" width="64" height="44" rx="6" fill="white" opacity="0.95" />
      
      {/* App Header Bar */}
      <rect x="38" y="48" width="64" height="12" rx="6" fill="url(#magneticGradient)" opacity="0.8" />
      <circle cx="44" cy="54" r="2" fill="white" opacity="0.9" />
      <circle cx="50" cy="54" r="2" fill="white" opacity="0.9" />
      <circle cx="56" cy="54" r="2" fill="white" opacity="0.9" />
      
      {/* Dynamic Product Grid */}
      <g opacity="0.8">
        <rect x="42" y="65" width="12" height="10" rx="2" fill="url(#glowGradient)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="0s" />
        </rect>
        <rect x="58" y="65" width="12" height="10" rx="2" fill="url(#trustGradient)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="1s" />
        </rect>
        <rect x="74" y="65" width="12" height="10" rx="2" fill="url(#magneticGradient)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="2s" />
        </rect>
        <rect x="90" y="65" width="12" height="10" rx="2" fill="url(#glowGradient)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </rect>
      </g>
      
      {/* Shopping Cart with Motion */}
      <g transform="translate(45, 78)">
        <path d="M0 0 L8 0 L7 8 L1 8 Z" fill="url(#trustGradient)" filter="url(#magneticGlow)" />
        <path d="M0 0 L-3 -3 L-5 -3" stroke="url(#trustGradient)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="2" cy="10" r="1.5" fill="url(#trustGradient)" />
        <circle cx="6" cy="10" r="1.5" fill="url(#trustGradient)" />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="45,78; 47,78; 45,78"
          dur="2s"
          repeatCount="indefinite"
        />
      </g>
      
      {/* Trust Shield - Prominent */}
      <circle cx="105" cy="35" r="18" fill="url(#trustGradient)" filter="url(#pulseShadow)">
        <animate attributeName="r" values="16;20;16" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="105" cy="35" r="14" fill="white" opacity="0.2" />
      <path d="M97 35 L102 40 L113 29" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#magneticGlow)" />
      
      {/* Magnetic Sparkle Effects */}
      <g fill="url(#sparkleGradient)">
        <g transform="translate(20, 25)">
          <path d="M0 -3 L2 0 L0 3 L-2 0 Z">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0s" />
            <animateTransform attributeName="transform" type="scale" values="0.5;1.5;0.5" dur="2s" repeatCount="indefinite" begin="0s" />
          </path>
        </g>
        <g transform="translate(120, 105)">
          <path d="M0 -2.5 L1.5 0 L0 2.5 L-1.5 0 Z">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.7s" />
            <animateTransform attributeName="transform" type="scale" values="0.5;1.5;0.5" dur="2s" repeatCount="indefinite" begin="0.7s" />
          </path>
        </g>
        <g transform="translate(25, 115)">
          <path d="M0 -2 L1.5 0 L0 2 L-1.5 0 Z">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.4s" />
            <animateTransform attributeName="transform" type="scale" values="0.5;1.5;0.5" dur="2s" repeatCount="indefinite" begin="1.4s" />
          </path>
        </g>
        <g transform="translate(115, 25)">
          <path d="M0 -2 L1.5 0 L0 2 L-1.5 0 Z">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="2.1s" />
            <animateTransform attributeName="transform" type="scale" values="0.5;1.5;0.5" dur="2s" repeatCount="indefinite" begin="2.1s" />
          </path>
        </g>
      </g>
      
      {/* Floating Money Symbols */}
      <g fill="url(#glowGradient)" opacity="0.7">
        <text x="15" y="70" fontSize="12" fontWeight="bold">₹</text>
        <text x="125" y="75" fontSize="10" fontWeight="bold">$</text>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-2; 0,0"
          dur="3s"
          repeatCount="indefinite"
        />
      </g>
      
      {/* Central Hover Animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-1; 0,0"
        dur="5s"
        repeatCount="indefinite"
      />
    </svg>
  );
}