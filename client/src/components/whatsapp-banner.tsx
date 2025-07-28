import { useState } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 dark:from-green-600 dark:via-green-700 dark:to-emerald-700 text-white py-3 px-4 shadow-lg border-b-2 border-green-300 dark:border-green-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-full p-2 shadow-lg animate-pulse" style={{animationDuration: '1.5s'}}>
            <i className="fab fa-whatsapp text-xl text-green-500"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white drop-shadow-md">Join 10,000+ Smart Shoppers!</span>
            <span className="text-sm text-yellow-100 font-medium">Get exclusive deals & flash sales instantly on WhatsApp</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center text-xs text-green-100 mr-2">
            <i className="fas fa-fire text-orange-300 mr-1 animate-bounce"></i>
            <span>3 deals today!</span>
          </div>
          <button
            onClick={handleJoinChannel}
            className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md border border-green-200 hover:shadow-lg"
          >
            <i className="fab fa-whatsapp mr-2"></i>
            Join FREE
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-all hover:scale-110"
            title="Close"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}