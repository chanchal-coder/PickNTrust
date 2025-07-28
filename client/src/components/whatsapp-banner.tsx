import { useState } from 'react';

export default function WhatsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleJoinChannel = () => {
    window.open('https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C', '_blank');
  };

  return (
    <div className="bg-green-500 dark:bg-green-600 text-white py-2 px-4 shadow-md border-b border-green-400 dark:border-green-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fab fa-whatsapp text-lg"></i>
          <span className="text-sm font-medium">Get instant deal alerts on WhatsApp</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleJoinChannel}
            className="bg-white text-green-600 hover:bg-gray-100 px-3 py-1 rounded text-sm font-semibold transition-colors"
          >
            Join Channel
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Close"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}