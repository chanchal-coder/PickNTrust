import { useState, useEffect } from "react";

interface Announcement {
  id: number;
  message: string;
  isActive: boolean;
  textColor: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  animationSpeed: string;
  createdAt: string;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncement();
    
    // Set up polling to refresh announcement data every 5 seconds
    const interval = setInterval(() => {
      fetchActiveAnnouncement();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcement/active');
      if (response.ok) {
        const data = await response.json();
        setAnnouncement(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
    }
  };

  if (!announcement || !announcement.isActive || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="relative overflow-hidden border-b border-gray-200 dark:border-gray-600"
      style={{ 
        backgroundColor: announcement.backgroundColor,
        minHeight: '50px'
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

      {/* Marquee Container */}
      <div className="py-3 relative">
        <div 
          className="marquee-content whitespace-nowrap inline-block"
          style={{
            color: announcement.textColor,
            fontSize: announcement.fontSize,
            fontWeight: announcement.fontWeight,
            animation: `marquee ${announcement.animationSpeed}s linear infinite`
          }}
        >
          {announcement.message}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          
          .marquee-content {
            padding-left: 100%;
          }
        `
      }} />
    </div>
  );
}