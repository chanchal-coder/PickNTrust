import { useState } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2 animate-pulse">
            <i className="fab fa-whatsapp text-xl"></i>
          </div>
          <div className="text-sm md:text-base">
            <span className="font-semibold">🎯 Never Miss Amazing Deals!</span>
            <span className="ml-2 hidden sm:inline">Join our WhatsApp channel for instant deal alerts & exclusive offers</span>
            <span className="ml-2 sm:hidden">Get instant deal alerts!</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleJoinChannel}
            className="bg-white text-green-600 hover:bg-gray-100 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-md"
          >
            <i className="fab fa-whatsapp mr-2"></i>
            Join Channel
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Close"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}