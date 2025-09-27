import { useState, useEffect } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Reset visibility on page load to ensure banner shows
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700 text-white py-1 sm:py-2 px-2 sm:px-4 shadow-lg -mt-1">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
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
        
        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <div className="hidden md:flex items-center text-xs text-green-100 mr-2">
            <i className="fas fa-fire text-orange-300 mr-1 animate-bounce"></i>
            <span>3 deals today!</span>
          </div>
          <button
            onClick={handleJoinChannel}
            className="bg-white text-green-600 hover:bg-green-50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all hover:scale-105 shadow-md border border-green-200 hover:shadow-lg touch-manipulation"
          >
            <i className="fab fa-whatsapp mr-1 sm:mr-2"></i>
            <span className="hidden xs:inline">Join FREE</span>
            <span className="xs:hidden">Join</span>
          </button>
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
  );
}
