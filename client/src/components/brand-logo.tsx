export default function BrandLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main Circle Background */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#logoGradient)"
          filter="url(#glow)"
          className="drop-shadow-lg"
        />

        {/* Inner Circle */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        {/* Shopping Cart Icon */}
        <g transform="translate(30, 25)">
          {/* Cart Body */}
          <path
            d="M5 5 L35 5 L32 25 L8 25 Z"
            fill="rgba(255,255,255,0.9)"
            stroke="rgba(255,255,255,1)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Cart Handle */}
          <path
            d="M5 5 L2 0 L0 0"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Cart Wheels */}
          <circle cx="12" cy="30" r="2" fill="rgba(255,255,255,0.9)" />
          <circle cx="28" cy="30" r="2" fill="rgba(255,255,255,0.9)" />
        </g>

        {/* Checkmark/Trust Symbol */}
        <g transform="translate(55, 35)">
          <circle cx="8" cy="8" r="8" fill="url(#accentGradient)" />
          <path
            d="M4 8 L7 11 L12 6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Sparkle Effects */}
        <g opacity="0.8">
          <circle cx="20" cy="20" r="1.5" fill="url(#accentGradient)" className="animate-pulse" />
          <circle cx="80" cy="25" r="1" fill="white" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="75" cy="75" r="1.5" fill="url(#accentGradient)" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="25" cy="80" r="1" fill="white" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </g>
      </svg>
    </div>
  );
}