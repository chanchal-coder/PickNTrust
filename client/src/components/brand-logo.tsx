export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Enhanced Shopping Cart with Trust Shield and Premium Effects */}
      <defs>
        <linearGradient id="premiumCartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667EEA" />
          <stop offset="33%" stopColor="#764BA2" />
          <stop offset="66%" stopColor="#F093FB" />
          <stop offset="100%" stopColor="#F5576C" />
        </linearGradient>
        
        <linearGradient id="goldShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        
        <linearGradient id="diamondSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="50%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
        
        <filter id="premiumGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="2"/>
          <feGaussianBlur stdDeviation="2" result="offset-blur"/>
          <feFlood floodColor="#000000" floodOpacity="0.3"/>
          <feComposite in2="offset-blur" operator="in"/>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      {/* Premium Background with Rotating Aura */}
      <circle cx="60" cy="60" r="55" fill="url(#premiumCartGradient)" opacity="0.08">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 60 60; 360 60 60"
          dur="20s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Main Shopping Cart Body - Premium Design */}
      <rect x="30" y="42" width="35" height="25" rx="4" fill="url(#premiumCartGradient)" filter="url(#premiumGlow)" />
      <rect x="32" y="44" width="31" height="21" rx="3" fill="white" opacity="0.2" />
      
      {/* Elegant Cart Handle */}
      <path d="M22 35 Q25 32 28 35 L30 42" stroke="url(#premiumCartGradient)" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#premiumGlow)" />
      
      {/* Premium Cart Wheels with Rotation */}
      <g>
        <circle cx="38" cy="75" r="6" fill="url(#premiumCartGradient)" filter="url(#premiumGlow)" />
        <circle cx="38" cy="75" r="3" fill="white" opacity="0.8" />
        <circle cx="57" cy="75" r="6" fill="url(#premiumCartGradient)" filter="url(#premiumGlow)" />
        <circle cx="57" cy="75" r="3" fill="white" opacity="0.8" />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 47.5 75; 360 47.5 75"
          dur="4s"
          repeatCount="indefinite"
        />
      </g>
      
      {/* Golden Trust Shield - Enhanced */}
      <path d="M80 25 L95 35 L95 50 Q95 60 80 65 Q65 60 65 50 L65 35 Z" fill="url(#goldShieldGradient)" filter="url(#premiumGlow)" />
      <path d="M80 28 L92 36 L92 48 Q92 56 80 60 Q68 56 68 48 L68 36 Z" fill="white" opacity="0.2" />
      
      {/* Premium Checkmark */}
      <path d="M72 45 L77 50 L88 39" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#premiumGlow)" />
      
      {/* Diamond Sparkles with Elegant Animation */}
      <g fill="url(#diamondSparkle)">
        <path d="M15 40 L17 42 L15 44 L13 42 Z">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0s" />
          <animateTransform attributeName="transform" type="scale" values="0.5;1.2;0.5" dur="3s" repeatCount="indefinite" begin="0s" />
        </path>
        <path d="M100 55 L102 57 L100 59 L98 57 Z">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1s" />
          <animateTransform attributeName="transform" type="scale" values="0.5;1.2;0.5" dur="3s" repeatCount="indefinite" begin="1s" />
        </path>
        <path d="M25 80 L27 82 L25 84 L23 82 Z">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="2s" />
          <animateTransform attributeName="transform" type="scale" values="0.5;1.2;0.5" dur="3s" repeatCount="indefinite" begin="2s" />
        </path>
        <path d="M85 20 L87 22 L85 24 L83 22 Z">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0.5s" />
          <animateTransform attributeName="transform" type="scale" values="0.5;1.2;0.5" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </path>
      </g>
      
      {/* Premium Floating Particles */}
      <g opacity="0.6">
        <circle cx="105" cy="75" r="2" fill="url(#goldShieldGradient)">
          <animate attributeName="cy" values="75;70;75" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="25" r="1.5" fill="url(#premiumCartGradient)">
          <animate attributeName="cy" values="25;20;25" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Subtle Hover Animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 0,-1; 0,0"
        dur="6s"
        repeatCount="indefinite"
      />
    </svg>
  );
}