import { useState, useEffect } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Reset visibility on page load to ensure banner shows
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-rotate center slides (desktop only)
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % 4);
    }, 7000); // 7s per slide
    return () => clearInterval(id);
  }, [isPaused]);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  const instagramUrl = 'https://instagram.com/pickntrust';
  const qrUrl = (url: string, size = 120) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;

  return (
    <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700 text-white py-1 sm:py-2 px-2 sm:px-4 shadow-lg -mt-1">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <div className="bg-white rounded-full p-1.5 sm:p-2 shadow-lg animate-pulse flex-shrink-0" style={{animationDuration: '1.5s'}}>
            <i className="fab fa-whatsapp text-lg sm:text-xl text-green-500"></i>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm sm:text-base font-bold text-white drop-shadow-md truncate">Get Daily Hot Deals on WhatsApp!</span>
            <span className="text-xs sm:text-sm text-yellow-100 font-medium hidden xs:block truncate">Get exclusive deals & flash sales instantly</span>
      <span className="text-xs text-yellow-100 font-medium xs:hidden">Exclusive deals on WhatsApp</span>
          </div>
        </div>
        
        {/* Desktop-only rotating center area */}
        <div 
          className="hidden md:flex items-center justify-center flex-shrink-0 mx-2 w-[22rem] md:w-[28rem]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          tabIndex={0}
          aria-label="Deals highlights carousel; hover or focus to pause"
        >
          {currentSlide === 0 && (
            <div className="flex items-center gap-3 text-white/90 transition-opacity duration-300">
              <img src={qrUrl('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C')} alt="WhatsApp QR" className="w-16 h-16 rounded bg-white p-1 shadow" />
              <div className="text-xs">
                <div className="font-semibold">Scan to join on WhatsApp</div>
                <div className="text-green-100">Opens on your phone</div>
              </div>
            </div>
          )}
          {currentSlide === 1 && (
            <div className="flex items-center gap-2 md:gap-3 transition-opacity duration-300">
              {/* colorful, professional benefit chips */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 border border-emerald-300/40 ring-1 ring-emerald-400/30 text-[11px] md:text-xs text-white backdrop-blur-sm shadow-sm hover:from-emerald-500/40 hover:to-emerald-600/40">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-emerald-600"><i className="fas fa-bolt text-[10px]"></i></span>
                Instant alerts
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-indigo-600/30 border border-indigo-300/40 ring-1 ring-indigo-400/30 text-[11px] md:text-xs text-white backdrop-blur-sm shadow-sm hover:from-indigo-500/40 hover:to-indigo-600/40">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-indigo-600"><i className="fas fa-ticket-alt text-[10px]"></i></span>
                Exclusive coupons
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500/30 to-teal-600/30 border border-teal-300/40 ring-1 ring-teal-400/30 text-[11px] md:text-xs text-white backdrop-blur-sm shadow-sm hover:from-teal-500/40 hover:to-teal-600/40">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-teal-600"><i className="fas fa-ban text-[10px]"></i></span>
                No spam
              </span>
            </div>
          )}
          {currentSlide === 2 && (
            <div className="flex items-center gap-3 text-white/90 transition-opacity duration-300">
              <img src={qrUrl(instagramUrl)} alt="Instagram QR" className="w-16 h-16 rounded bg-white p-1 shadow" />
              <div className="text-xs">
                <div className="font-semibold">Follow on Instagram</div>
                <div className="text-green-100">Scan to open profile</div>
              </div>
            </div>
          )}
          {currentSlide === 3 && (
            <div className="flex items-center gap-2 md:gap-3 transition-opacity duration-300">
              <span className="text-[11px] md:text-xs uppercase tracking-wide font-semibold text-white/90">From top stores</span>
              <span className="text-white/60">•</span>
              <span className="text-[11px] md:text-xs text-amber-300 font-semibold">Amazon</span>
              <span className="text-white/60">•</span>
              <span className="text-[11px] md:text-xs text-blue-300 font-semibold">Flipkart</span>
              <span className="text-white/60">•</span>
              <span className="text-[11px] md:text-xs text-pink-300 font-semibold">Myntra</span>
              <span className="text-white/60">•</span>
              <span className="text-[11px] md:text-xs text-slate-100 font-semibold">AJIO</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-self-end gap-1 sm:gap-1.5">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* CTA stacked with plain text below */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleJoinChannel}
                className="bg-white text-green-600 hover:bg-green-50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all hover:scale-105 shadow-md border border-green-200 hover:shadow-lg touch-manipulation"
              >
                <i className="fab fa-whatsapp mr-1 sm:mr-2"></i>
                <span className="hidden xs:inline">Join FREE</span>
                <span className="xs:hidden">Join</span>
              </button>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-white/90 mt-1">
                <i className="fas fa-fire text-orange-300"></i>
                New deals daily
              </span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110 touch-manipulation"
              title="Close"
            >
              <i className="fas fa-times text-xs sm:text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
