import { useState } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 dark:from-green-500 dark:via-green-600 dark:to-green-700 text-white py-4 px-4 shadow-xl border-b-2 border-green-300 dark:border-green-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-full p-3 shadow-lg animate-bounce" style={{animationDuration: '2s'}}>
            <i className="fab fa-whatsapp text-2xl text-green-500"></i>
          </div>
          <div className="text-sm md:text-base">
            <div className="font-bold text-lg mb-1">🎯 Never Miss Amazing Deals!</div>
            <div className="text-green-100 hidden sm:block">Join our WhatsApp channel for instant deal alerts & exclusive offers</div>
            <div className="text-green-100 sm:hidden">Get instant deal alerts!</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleJoinChannel}
            className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-110 shadow-lg border-2 border-green-200 hover:border-green-300"
          >
            <i className="fab fa-whatsapp mr-2 text-lg"></i>
            Join Now
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-all hover:scale-110"
            title="Close"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}