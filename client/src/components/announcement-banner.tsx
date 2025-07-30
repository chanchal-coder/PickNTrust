import { useState, useEffect } from 'react';

interface Announcement {
  id: number;
  message: string;
  isActive: boolean;
  textColor: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  textDecoration?: string;
  fontStyle?: string;
  animationSpeed: string;
  createdAt: string;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchActiveAnnouncement();
    
    // Set up polling to refresh announcement data every 2 seconds
    const interval = setInterval(() => {
      fetchActiveAnnouncement();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const response = await fetch(`/api/announcement/active?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncement(data);
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
      setIsLoaded(true);
    }
  };

  if (!isLoaded || !announcement || !announcement.isActive || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .announcement-marquee {
          animation: marqueeScroll ${announcement.animationSpeed}s linear infinite;
          white-space: nowrap;
          display: block;
        }
      `}</style>
      
      <div 
        className="relative overflow-hidden border-b border-gray-200 dark:border-gray-600"
        style={{ 
          backgroundColor: announcement.backgroundColor,
          minHeight: '35px'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white text-sm transition-colors"
          title="Close announcement"
        >
          ×
        </button>

        {/* Marquee Text */}
        <div className="py-1 overflow-hidden">
          <div 
            className="announcement-marquee"
            style={{
              color: announcement.textColor,
              fontSize: announcement.fontSize,
              fontWeight: announcement.fontWeight,
              textDecoration: announcement.textDecoration || 'none',
              fontStyle: announcement.fontStyle || 'normal'
            }}
          >
            {announcement.message}
          </div>
        </div>
      </div>
    </>
  );
}